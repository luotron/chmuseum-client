"""
bmuseum.py — 国博余票监控 + 自动验证码点选下单 (主入口)
================================================================================
运行流程:
  0. checkToken 校验 API_TOKEN 有效性 -> 返回 userInfo 才继续 (保存 userId/登录信息)
  1. 轮询 gainAllSystemConfig 扫描余票, 发现 hallId/scheduleId/priceId 齐备立即锁定
  2. getBlock 拿验证码图 (nonce = AES(userId:ts:date:hall:sch:platform))
  3. tkinter 可视化点选 -> pointJson = AES(secretKey, {x,y})
  4. deviceToken (node tdid_client.js)
  5. placeOrder 下单

模块划分:
  bm_config.py   配置常量 / 请求头 / 登录信息落盘路径
  bm_aes.py      纯 Python AES-128-ECB (nonce / pointJson)
  bm_api.py      接口调用 (checkToken / 校时 / nonce / 扫描 / getBlock / deviceToken / placeOrder)
  bm_captcha.py  点选窗口 + build_point_json

依赖: cycronet + Pillow + tkinter(内置) + node(deviceToken)
"""

import os
import sys
import random
import time
import json
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
from utils.captcha import CaptchaPicker, build_point_json
from utils.captcha_auto import auto_recognize_captcha
from utils import tdid as tdid_client
from api import log

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

    device_token = api.get_device_token(session)
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


def main():
    # 打印所有 cycronet 请求响应的 Set-Cookie (全局 patch, 只需一次)
    # cfg.install_cookie_logger()
    
    # 是否开启抓包
    PROXY_ENABLE = False  # True/False
    # 替换为你小黄鸟监听的真实 IP 和端口
    PROXY = "http://192.168.124.14:9000"
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
        # 删除过期缓存, 重新走登录流程
        login_file = os.path.join(cfg.LOGIN_DIR, "%s.json" % openid)
        if os.path.exists(login_file):
            os.remove(login_file)
            log("已删除过期登录缓存: %s" % login_file)
        # 重新登录前先刷新账号存活状态 (确保 login_buffer 有效)
        login_mod.refresh_accounts(session)
        # 重新登录 (需要 uin/nickname, 从 accounts 重新获取)
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
        # 重试 getUserInfo
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
    # 把运行时回填的 userId 等持久化到 cache/login/{openid}.json
    cfg.save_login(openid)
    # 运行时通过本地应用宝服务获取风控参数 (TDID_HOST_SIGN / TDID_PLUGIN_CODE)
    # openid 即账号主键, 直接用于调本地风控接口
    if not login_mod.fetch_risk_params(session, openid):
        log("❌ 获取风控参数失败, 退出。")
        return

    # 2) 下单重试循环：从 scan_for_ticket 开始, 直到成功或用户 Ctrl+C
    retry = 0
    while True:
        if retry > 0:
            log("=" * 60)
            log("🔄 第 %d 次重试下单 (从 scan_for_ticket 重新开始)..." % (retry))
            log("=" * 60)
            time.sleep(random.uniform(2.0, 4.0))  # 重试前稍作等待
        retry += 1
        
        # 1) 获取预约须知等真实配置 (模拟小程序正常加载流程)
        api.gain_real_config(session)
        time.sleep(random.uniform(0.5, 1.0))
        
        # 扫描 + 锁定 (三者齐备立即停止扫描)
        ctx = api.scan_for_ticket(session)
        if not ctx:
            return
        # 提交订单前稍作等待, 避免过快触发风控
        time.sleep(random.uniform(1.5, 1.6))

        # ★ 在 getBlock 之前预先取好 Host-Ip (腾讯校时IP加密), 下单时直接复用
        host_ip = api.build_host_ip(session)

        # getBlock 验证码
        try:
            resp = api.get_block(session, ctx)
            if not resp or resp.get("code") != 200 or not resp.get("data"):
                log("getBlock 失败: %s" % (json.dumps(resp, ensure_ascii=False)[:200] if resp else "响应为空"))
                continue  # 重试: 回到 scan_for_ticket
            block = resp["data"]
            api._save_captcha_images(block)  # 保存验证码图 + 提示图
            log("getBlock 成功: docType=%s secretKey=%s captchaToken=%s"
                    % (block.get("docType"), block.get("secretKey"), block.get("token")))
        except Exception as e:
            log("getBlock 异常: %s" % e)
            continue  # 重试: 回到 scan_for_ticket

        # 验证码识别
        points = None
        # 检查API是否可用
        if recognizer.check_api_available():
            log("本地模型API可用，开始识别...")
            original_image_base64 = block.get("originalImageBase64")
            jigsaw_image_base64 = block.get("jigsawImageBase64")
            secret_key = block.get("secretKey")
            
            if original_image_base64 and jigsaw_image_base64:
                result = recognizer.recognize_center_point(
                    original_image_base64=original_image_base64,
                    jigsaw_image_base64=jigsaw_image_base64,
                    secret_key=secret_key
                )
                if result:
                    x, y = result
                    log(f"识别成功: 中心点坐标 ({x}, {y})")
                    points = [(x, y)]
                    time.sleep(random.uniform(0.5, 1.0)) # 模拟人工操作延迟
                else:
                    log("自动识别失败")
            else:
                log("缺少验证码图像数据，无法自动识别")
        else:
            log("本地模型API不可用")
        
        # 如果自动识别失败或模式为manual，使用手动识别
        if not points:
            log("弹出验证码窗口，请点选目标图案后点『确认提交』...")
            picker = CaptchaPicker(block)
            points = picker.run()
            if not points:
                log("已取消点选, 退出。")
                return
        if not points:
            log("❌ 验证码识别失败，重试...")
            continue  # 重试: 回到 scan_for_ticket

        # pointJson 加密
        point_json_cipher = build_point_json(points, block.get("secretKey"))
        log("pointJson(加密)=%s..." % point_json_cipher[:40])
        captcha_token = block.get("token")

        device_token = api.get_device_token(session)
        if not device_token:
            log("⚠ 未获得 deviceToken, 仍尝试下单 (可能被风控拒绝)。")
            device_token = ""

        resp = api.place_order(session, ctx, point_json_cipher, captcha_token, device_token, host_ip=host_ip)
        if resp.get("code") == 200 and resp.get("data"):
            d = resp["data"]
            risk_policy = d.get("riskPolicy")
            if risk_policy == 1 or risk_policy is None:
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
                return  # 成功, 终止程序
            else:
                log("⚠ riskPolicy=%s, 被风控拦截: orderNumber=%s orderId=%s prompt=%s"
                    % (risk_policy, d.get("orderNumber"), d.get("orderId"), d.get("prompt")))
                continue  # 重试: 回到 scan_for_ticket
        elif resp.get("code") == 502:
            log("placeOrder 返回: %s" % json.dumps(resp, ensure_ascii=False)[:300])
            log("502 错误, 尝试手动点选验证码下单...")
            time.sleep(random.uniform(0.5, 1.0))
            if manualOrder(session, ctx, host_ip=host_ip):
                return  # manualOrder 成功
            # manualOrder 失败, 继续循环重试
            continue
        else:
            log("placeOrder 返回: %s" % json.dumps(resp, ensure_ascii=False)[:300])
            continue  # 重试: 回到 scan_for_ticket



if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已退出。")
