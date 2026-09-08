"""
main.py — 国博抢票 (查票与下单分离 + 代理池)
================================================================================
架构:
  [查票线程组] TicketMonitor(scanner.py)
      - N 个线程各持一个 xkdaili 代理, 高频轮询免登录余票接口
        (.../ingore/gainAllSystemConfig + getPriceByScheduleId, 无需 token);
      - 代理被墙/超时/到期(3分钟) 自动丢弃换下一个, 池子低于水位就批量续拉(每次200);
      - 本地兜底线程在代理断供时自动顶上;
      - 场次状态(出现/消失/换场/放票>0)一变 => epoch+1 唤醒下单线程。
      查票线程永不因下单/验证码弹窗而停摆。

  [下单线程] 主线程(本文件)
      - 预热 Host-Ip / deviceToken (放票瞬间 0 等待);
      - 收到场次变化信号后, 只等关键链: getBlock -> 验证码 -> placeOrder
        (~1.5~2.5 秒); checkLeaderInfo / frontPage / geetest 等风控热身
        全部放后台线程并行, 不占关键链时间; 同一场次状态内连续热抢,
        场次被抢空/换场则立即切换最新场次。

所有参数都是 config.py 里的常量, IDE 直接运行本文件即可, 不需要命令行参数。
"""
import os
import sys
import random
import time
import json
import threading
from datetime import datetime

# ------------------ 屏蔽 Native 层的 GLib 警告 (仅 posix) ------------------
def _suppress_native_stderr():
    if os.name == "nt":
        return
    try:
        null_fd = os.open(os.devnull, os.O_RDWR)
        os.dup2(null_fd, 2)
        os.close(null_fd)
    except Exception:
        pass


_suppress_native_stderr()

# 确保能 import 同目录模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import cycronet

import api as api
import config as cfg
import login as login_mod
import proxy_pool as pp
import scanner as scan_mod
from utils.captcha import CaptchaPicker, build_point_json
from utils import tdid as tdid_client
from api import log


def _order_window_open():
    """放票时段内才真正下单; 时段外只查票不下单(避免放票前乱下)。"""
    try:
        start_s, end_s = cfg.ORDER_WINDOW
        if not start_s or not end_s:
            return True
        now = datetime.now().strftime("%H:%M:%S")
        return start_s <= now <= end_s
    except Exception:
        return True


def manualOrder(session, ctx, host_ip=None):
    """
    手动验证码模式下单 (placeOrder 502 时触发)。
    返回 True 表示下单成功 (riskPolicy==1), False 表示需要重试。
    """
    try:
        resp = api.get_block(session, ctx)
        if not resp:
            return False
        if resp.get("code") != 200 or not resp.get("data"):
            raise RuntimeError(json.dumps(resp, ensure_ascii=False)[:200])
        block = resp["data"]
        log("manualOrder getBlock 成功: docType=%s secretKey=%s captchaToken=%s"
                % (block.get("docType"), block.get("secretKey"), block.get("token")))
    except Exception as e:
        log("manualOrder getBlock 失败: %s" % e)
        return False
    picker = CaptchaPicker(block)
    points = picker.run()
    if not points:
        log("已取消点选, 退出。")
        return False
    point_json_cipher = build_point_json(points, block.get("secretKey"))
    log("pointJson(加密)=%s..." % point_json_cipher[:40])
    captcha_token = block.get("token")

    device_token = api.get_device_token_cached(session)
    if not device_token:
        log("⚠ 未获得 deviceToken, 仍尝试下单 (可能被风控拒绝)。")
        device_token = ""

    resp = api.place_order(session, ctx, point_json_cipher, captcha_token, device_token, host_ip=host_ip)
    if resp.get("code") == 200 and resp.get("data"):
        d = resp["data"]
        risk_policy = d.get("riskPolicy")
        if risk_policy == 1:
            log("=" * 60)
            log("🎉 下单成功!")
            log("  订单号(orderNumber) : %s" % d.get("orderNumber"))
            log("  订单ID(orderId)     : %s" % d.get("orderId"))
            log("  场次(schduleDate)   : %s" % d.get("schduleDate"))
            log("  实付(orderRealPrice): %s" % d.get("orderRealPrice"))
            log("  创建时间(createTime) : %s" % d.get("createTime"))
            log("  风控启用(riskEnable): %s" % d.get("riskEnable"))
            log("  风控策略(riskPolicy) : %s" % d.get("riskPolicy"))
            log("  需充值(needChargeCode): %s" % d.get("needChargeCode"))
            log("=" * 60)
            return True
        else:
            log("⚠ manualOrder 假下单 (riskPolicy=%s, 被风控拦截): orderNumber=%s orderId=%s"
                % (risk_policy, d.get("orderNumber"), d.get("orderId")))
            return False
    else:
        log("manualOrder placeOrder 返回: %s" % json.dumps(resp, ensure_ascii=False)[:300])
        return False


def _select_account(accounts):
    """
    从账号列表里选择一个 (返回 acc dict)。
      - 只有一个: 直接用;
      - 多个: 终端交互式输入编号选择 (非法输入回退第 1 个)。
    """
    valid = [a for a in accounts if a.get("openid")]
    if not valid:
        return None
    if len(valid) == 1:
        return valid[0]
    log("检测到多个账号, 请选择:")
    for i, a in enumerate(valid, 1):
        print("  %d. %s (%s)" % (i, a.get("nickname") or a.get("alias") or "", a.get("openid")))
    try:
        raw = input("请输入账号编号 (默认 1): ").strip()
    except (EOFError, KeyboardInterrupt):
        raw = ""
    idx = 1
    if raw:
        try:
            idx = int(raw)
        except ValueError:
            idx = 1
    if idx < 1 or idx > len(valid):
        log("编号非法, 使用第 1 个账号。")
        idx = 1
    return valid[idx - 1]


def bootstrap_account(session):
    """
    运行前引导:
      1. 校验本地应用宝协议服务是否启动;
      2. POST /accounts/refresh 刷新存活状态, 取 accounts, 过滤出存活账号;
      3. 选择一个账号;
      4. 该账号 (按 openid) 在 cache/login 无登录信息 -> 执行登录流程;
      5. 把该账号登录态加载到 config (回填 API_TOKEN/OPENID/UNIONID/... )。
    返回选中账号的 openid (str); 任一步失败返回 None。
    """
    # 1) 本地服务
    if not login_mod.check_local_service(session):
        log("❌ 本地服务 (%s) 未启动, 退出。" % cfg.LOCAL_BASE_URL)
        return None
    log("本地服务已就绪。")

    # 2) 刷新存活状态 + 取账号 (需含 openid 才可用; uin 可能为 null)
    alive_openids, _, _ = login_mod.refresh_accounts(session)
    if not alive_openids:
        log("❌ 没有存活的账号, 退出。")
        return None
    accounts = login_mod.get_accounts(session)
    if not accounts:
        log("❌ 未获取到任何账号, 退出。")
        return None
    valid = [a for a in accounts if a.get("openid") and a.get("openid") in alive_openids]
    if not valid:
        log("❌ 账号列表里没有可用账号 (需含 openid 且存活), 退出。")
        return None
    log("获取到 %d 个账号 (可用 %d 个)。" % (len(accounts), len(valid)))

    # 3) 选账号
    acc = _select_account(valid)
    if not acc:
        log("❌ 未选择到有效账号, 退出。")
        return None
    openid = acc.get("openid")
    uin = acc.get("uin")           # 可能为 null, 仅附带
    nickname = acc.get("nickname") or acc.get("alias") or ""
    log("已选择账号: %s (openid=%s)" % (nickname, openid))

    # 4) 无登录信息则登录 (按 openid 判断)
    if cfg.login_exists(openid):
        log("该账号已有登录信息, 直接加载。")
    else:
        log("该账号无登录信息, 开始登录流程 ...")
        token = login_mod.login_account(session, openid, uin, nickname)
        if not token:
            log("❌ 账号 %s (openid=%s) 登录失败, 退出。" % (nickname, openid))
            return None
        log("✅ 账号 %s (openid=%s) 登录成功。" % (nickname, openid))

    # 5) 加载登录态到 config
    if not cfg.load_login(openid):
        log("❌ 加载账号 openid=%s 登录信息失败 (缺少 apiToken), 退出。" % openid)
        return None

    # 5.1) 账号 openid 已加载 -> 刷新设备指纹 101 字段 (tdid import 时 101 尚为空)
    try:
        tdid_client.refresh_device_profile()
    except Exception as e:
        log("⚠ 刷新设备指纹 101 字段失败: %s" % e)
    return openid


def run_hot_order(session, ctx, recognizer, host_ip, monitor):
    """
    热路径下单: 对当前场次状态(epoch)连续争抢, 验证码/风控/满员都快速重试;
    查票线程一旦发现场次变化(epoch 变), 立即中止本轮, 交给最新场次。
    返回:
      "OK"         下单成功
      "CANCEL"     用户取消点选 -> 整体退出
      "GONE"       本场次连抢失败 -> 等待查票线程推送下一状态
      "SUPERSEDED" 场次已变化 -> 直接切最新场次

    ★ 取验证码链路与小程序/原版完全一致, 顺序不改:
        checkLeaderInfo -> geetest load -> getBlock -> 识别 -> placeOrder
      提速只体现在: Host-Ip/deviceToken 预热(0等待)、去掉旧版 1~2s 人工 sleep、
      按实测限频每 ~3.5s 稳定轮询 getBlock、命中「太频繁/WAF」自动退避。
    """
    start_epoch = monitor.epoch_value()

    # 下单前校验带队信息 (与旧版一致: 在取验证码之前, 每场次做一次)
    try:
        api.check_leader_info(session, ctx)
    except Exception as e:
        log("checkLeaderInfo 异常: %s" % e)

    risk0_streak = 0        # 连续「预约人数过多」
    empty_streak = 0        # 连续 550(真没票: 余票不足)
    freq_streak = 0         # 连续「访问太频繁」(应用层限流)
    block_streak = 0        # 连续 WAF/HTTP 异常(491/非JSON等)
    captcha_rounds = 0      # 已拿到验证码并下过单的轮数
    last_get_ts = 0.0       # 上次 getBlock 完成时刻 —— 限频用

    def _classify_550(msg):
        """550 有两种含义: 余票不足=真没票; 访问太频繁=被限流, 必须区分开。"""
        m = str(msg or "")
        if any(k in m for k in ("频繁", "稍后", "过快", "频率", "太")):
            return "freq"
        return "empty"

    while True:
        if monitor.epoch_value() != start_epoch:
            log("查票线程发现场次状态变化, 中止当前下单轮, 切换最新场次。")
            return "SUPERSEDED"

        # ★ 硬限频 (实测: getBlock 每 2 秒内连发就会「访问太频繁」, 安全节奏≈3~4s/次)
        now = time.time()
        if last_get_ts and now - last_get_ts < cfg.HOT_MIN_GETBLOCK_GAP:
            time.sleep(cfg.HOT_MIN_GETBLOCK_GAP - (now - last_get_ts)
                       + random.uniform(0.0, 0.2))

        # 每次取验证码之前, 先做极验 load —— 与小程序/原版顺序一致, 原样保留
        try:
            api.geetest_load(session)
        except Exception as e:
            log("geetest load 异常: %s" % e)

        try:
            resp = api.get_block(session, ctx)
            last_get_ts = time.time()
        except Exception as e:
            log("getBlock 异常: %s" % e)
            block_streak += 1
            time.sleep(random.uniform(*cfg.HOT_BLOCK_BACKOFF))
            if block_streak >= 4:
                log("连续 %d 次 getBlock 异常(疑似 WAF 封锁), 停手等查票线程推送下一波。"
                    % block_streak)
                return "GONE"
            continue

        if not (resp and isinstance(resp, dict)
                and resp.get("code") == 200 and resp.get("data")):
            code = resp.get("code") if isinstance(resp, dict) else None
            msg = (resp or {}).get("msg") or "响应为空/非JSON"
            if code == 550:
                kind = _classify_550(msg)
                if kind == "freq":
                    # 「访问太频繁,请稍后再试」—— 退避数秒, 别硬刷(否则升级 WAF 封锁)
                    freq_streak += 1
                    empty_streak = 0
                    log("getBlock「访问太频繁」(连续第%d次): %s —— 退避"
                        % (freq_streak, msg))
                    time.sleep(random.uniform(*cfg.HOT_FREQ_BACKOFF))
                    if freq_streak >= 5:
                        log("连续 5 次被「访问太频繁」限流, 停手, 等查票线程推送下一波。")
                        return "GONE"
                    continue
                # 真没票(余票不足) -> 按安全节奏继续秒刷等 200
                empty_streak += 1
                freq_streak = 0
                block_streak = 0
                if empty_streak >= cfg.HOT_EMPTY_CAP:
                    log("连续 %d 次拿不到验证码(真无票), 本轮停手, 等查票线程推送下一波。"
                        % empty_streak)
                    return "GONE"
                if empty_streak == 1 or empty_streak % 15 == 0:
                    log("当前无票(550 余票不足), 已秒刷 %d 次, 按 %.1fs 节奏继续..."
                        % (empty_streak, cfg.HOT_MIN_GETBLOCK_GAP))
                time.sleep(random.uniform(*cfg.HOT_EMPTY_GAP))
                continue
            # 其它 code 或无法解析(HTTP491/非JSON...) -> 视为 WAF 封锁
            block_streak += 1
            empty_streak = 0
            log("getBlock 异常响应(code=%s): %s —— WAF退避"
                % (code, msg))
            time.sleep(random.uniform(*cfg.HOT_BLOCK_BACKOFF))
            if block_streak >= 4:
                log("连续 %d 次 getBlock 异常(疑似 WAF 封锁), 停手等查票线程推送下一波。"
                    % block_streak)
                return "GONE"
            continue

        # ---- 拿到验证码了 = 此刻有票! 立即进入下单流程 ----
        empty_streak = 0
        freq_streak = 0
        block_streak = 0
        captcha_rounds += 1
        if captcha_rounds > cfg.HOT_MAX_ATTEMPTS:
            log("已连续 %d 次拿到验证码却未下单成功, 稍候让查票线程推送新场次。"
                % cfg.HOT_MAX_ATTEMPTS)
            return "GONE"
        block = resp["data"]
        api._save_captcha_images(block)
        secret_key = block.get("secretKey")

        # 下单前的风控前置(后台线程 fire-and-forget, 不改变取验证码顺序)
        try:
            dt = api.get_device_token_cached(session)
            api.front_page(session, device_token=dt, async_mode=True)
        except Exception:
            pass

        # 验证码识别
        points = None
        if recognizer.check_api_available():
            result = recognizer.recognize_center_point(
                original_image_base64=block.get("originalImageBase64"),
                jigsaw_image_base64=block.get("jigsawImageBase64"),
                secret_key=secret_key)
            if result:
                points = [(result[0], result[1])]
        if not points:
            log("弹出验证码窗口，请点选目标图案后点『确认提交』...")
            picker = CaptchaPicker(block)
            points = picker.run()
            if not points:
                log("已取消点选, 退出。")
                return "CANCEL"
        point_json_cipher = build_point_json(points, secret_key)
        log("pointJson(加密)=%s..." % point_json_cipher[:40])

        device_token = api.get_device_token_cached(session) or ""
        resp2 = api.place_order(session, ctx, point_json_cipher,
                                block.get("token"), device_token, host_ip=host_ip)
        code = resp2.get("code") if isinstance(resp2, dict) else None
        d = resp2.get("data") if isinstance(resp2, dict) else None
        if code == 200 and d:
            risk = d.get("riskPolicy")
            if risk == 1 or risk is None:
                log("=" * 60)
                log("🎉 下单成功!")
                log("  订单号(orderNumber) : %s" % d.get("orderNumber"))
                log("  订单ID(orderId)     : %s" % d.get("orderId"))
                log("  场次(schduleDate)   : %s" % d.get("schduleDate"))
                log("  实付(orderRealPrice): %s" % d.get("orderRealPrice"))
                log("  创建时间(createTime) : %s" % d.get("createTime"))
                log("  风控启用(riskEnable): %s" % d.get("riskEnable"))
                log("  风控策略(riskPolicy) : %s" % d.get("riskPolicy"))
                log("  需充值(needChargeCode): %s" % d.get("needChargeCode"))
                log("=" * 60)
                return "OK"
            log("⚠ riskPolicy=%s 被风控拦截: %s (本场次第%d次拿票)"
                % (risk, d.get("prompt"), captcha_rounds))
            risk0_streak += 1
        elif code == 502:
            log("placeOrder 502 (第%d次拿票), 尝试手动点选验证码下单..." % captcha_rounds)
            time.sleep(random.uniform(0.3, 0.8))
            if manualOrder(session, ctx, host_ip=host_ip):
                return "OK"
        elif code == 550:
            log("placeOrder 550 预约已满 (第%d次拿票): %s —— 回到秒刷等下一张票"
                % (captcha_rounds,
                   resp2.get("msg") if isinstance(resp2, dict) else ""))
        else:
            log("placeOrder 返回: %s"
                % (json.dumps(resp2, ensure_ascii=False)[:220]))
            risk0_streak = 0

        # 连续「预约人数过多」-> 放慢节奏给名额释放留窗口; 其余快速回到秒刷
        if risk0_streak >= 4:
            log("连续 %d 次被风控拦截(预约人数过多), 放慢重试节奏..." % risk0_streak)
            time.sleep(random.uniform(1.2, 2.2))
            risk0_streak = 0
        else:
            time.sleep(random.uniform(*cfg.HOT_BACKOFF))


def main():
    # 是否开启抓包 (调试用; 抓包工具代理)
    PROXY_ENABLE = False  # True/False
    PROXY = "http://192.168.31.100:9000"
    proxies = {
        "http": PROXY,
        "https": PROXY,
    }

    session = cycronet.CronetClient(verify=False, proxies=proxies) if PROXY_ENABLE and PROXY else cycronet.CronetClient(chrometls="chrome_133", verify=False)

    # ★ 引导: 本地服务/账号/登录 -> 加载登录态到 config
    openid = bootstrap_account(session)
    if not openid:
        return

    from utils.captcha_auto import CaptchaAutoRecognizer
    recognizer = CaptchaAutoRecognizer()
    # 0) 先校验登录态 —— getUserInfoToIndividual2Mini 返回 userInfo 才继续
    user_info = api.get_user_info(session)
    if not user_info:
        log("⚠ 登录态可能已过期, 尝试重新登录 ...")
        login_file = os.path.join(cfg.LOGIN_DIR, "%s.json" % openid)
        if os.path.exists(login_file):
            os.remove(login_file)
            log("已删除过期登录缓存: %s" % login_file)
        login_mod.refresh_accounts(session)
        accounts = login_mod.get_accounts(session)
        acc = next((a for a in accounts if a.get("openid") == openid), None)
        uin = acc.get("uin") if acc else None
        nickname = (acc.get("nickname") or acc.get("alias") or "") if acc else ""
        token = login_mod.login_account(session, openid, uin, nickname)
        if not token:
            log("❌ 重新登录失败, 退出。")
            return
        if not cfg.load_login(openid):
            log("❌ 重新加载登录态失败, 退出。")
            return
        user_info = api.get_user_info(session)
        if not user_info:
            log("❌ 重新登录后仍无法获取用户信息, 退出。")
            return
        log("✅ 重新登录成功, 用户信息已恢复。")
    # 把 userId 回填到内存 (供后续 nonce 等使用)
    cfg.USER_ID = str(user_info.get("userId") or "")
    bind_info = api.get_real_name_bind(session)
    if not bind_info:
        log("❌ 获取实名绑定信息失败, 请检查网络或 API_TOKEN。退出。")
        return
    cfg.save_login(openid)
    # 运行时通过本地应用宝服务获取风控参数 (TDID_HOST_SIGN / TDID_PLUGIN_CODE)
    if not login_mod.fetch_risk_params(session, openid):
        log("❌ 获取风控参数失败, 退出。")
        return

    # 1) ★ 预热 (让放票瞬间下单 0 等待):
    #    deviceToken 后台每 DEVICE_TOKEN_TTL 秒刷新; Host-Ip = AES(本机出口IP) 缓存。
    api.start_device_token_refresher(session)
    try:
        api.ensure_host_ip(session)
    except Exception as e:
        log("预热 Host-Ip 失败: %s" % e)

    # 2) ★ 代理池 + 查票监视器 (查票与下单完全分离, 常驻后台)
    pool = None
    if cfg.XKD_APIKEY and cfg.XKD_SIGN:
        pool = pp.ProxyPool()
        try:
            n = pool.start()
            if n <= 0:
                log("代理池首拉为空 (检查白名单/套餐/配额), 用本地查票兜底。")
                pool = None
        except Exception as e:
            log("代理池启动异常, 用本地查票兜底: %s" % e)
            pool = None
    monitor = scan_mod.TicketMonitor(pool)
    monitor.start()
    # 放票时段外只查票不下单的提示
    if not _order_window_open():
        log("当前不在放票下单时段(%s~%s), 只查票不下单, 到点自动开抢。"
            % (cfg.ORDER_WINDOW[0], cfg.ORDER_WINDOW[1]))

    # 3) ★ 主循环: 等查票线程推送场次状态 -> 热路径连抢 -> 场次变了就切
    epoch = 0
    while True:
        epoch, ctx = monitor.wait_change(epoch)
        if ctx is None:
            continue
        if not _order_window_open():
            time.sleep(0.5)   # 查票线程仍在跑, 到点自动开抢
            continue
        scan_mod.log_lock(ctx)
        # Host-Ip 在预热时已缓存 (TTL 内直接命中)
        host_ip = api.ensure_host_ip(session)
        result = run_hot_order(session, ctx, recognizer, host_ip, monitor)
        if result == "OK":
            return
        if result == "CANCEL":
            return
        # GONE / SUPERSEDED: 回到 wait_change, 等最新场次


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已退出。")
