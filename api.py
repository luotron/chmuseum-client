"""
bm_api.py — 国博接口调用层
================================================================================
封装: checkToken / 腾讯校时 / nonce / 余票扫描 / getBlock / deviceToken / placeOrder
所有请求头由 bm_config.build_headers() 生成 (自动带最新 API_TOKEN)。
"""

import base64
import json
import os
import random
import time
from datetime import datetime

import config as cfg
from utils.aes import aes_ecb_b64
from utils import tdid as tdid_client


# ============================ 工具 ============================
def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print("[%s] %s" % (ts, msg))


# ============================================================================
#  0. checkToken — 校验 apiToken 有效性, 返回 userInfo
# ============================================================================
def check_token(session):
    """
    调 checkToken 校验 API_TOKEN。成功 (code==200 且含 userInfo) 返回 userInfo dict,
    否则返回 None。成功时把 userId 回填到 cfg.USER_ID, 并把登录信息落盘。
    """
    body = json.dumps({"apiToken": cfg.API_TOKEN, "p": "wxmini"},
                      ensure_ascii=False).encode("utf-8")
    try:
        resp = session.post(cfg.CHECKTOKEN_URL, headers=cfg.build_headers(),
                            data=body, timeout=8)
    except Exception as e:
        log("checkToken 请求异常: %s" % e)
        return None

    if resp.status_code != 200:
        log("checkToken HTTP %s" % resp.status_code)
        return None
    try:
        j = resp.json()
    except Exception:
        log("checkToken 响应非 JSON: %s" % resp.text[:200])
        return None

    if j.get("code") != 200 or not j.get("userInfo"):
        log("checkToken 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return None

    user_info = j["userInfo"]
    cfg.USER_ID = str(user_info.get("userId") or "")
    _save_login_info(user_info)
    log("checkToken 成功: userId=%s userName=%s nickName=%s"
        % (user_info.get("userId"), user_info.get("userName"),
           user_info.get("nickName")))
    return user_info


def _save_login_info(user_info):
    """把登录信息 (userInfo + apiToken + 时间) 保存到本地 json"""
    record = {
        "savedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "apiToken": cfg.API_TOKEN,
        "userInfo": user_info,
    }
    try:
        with open(cfg.LOGIN_INFO_FILE, "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)
        log("登录信息已保存: %s" % cfg.LOGIN_INFO_FILE)
    except Exception as e:
        log("保存登录信息失败: %s" % e)


# ============================================================================
#  1. 腾讯校时 + nonce
# ============================================================================
def _parse_checktime(text):
    """
    解析腾讯校时响应:
        QZOutputJson={"s":"o","t":1785402089,"ip":"14.26.171.215","pos":"---","rand":"..."};
    返回 (t_秒:int|None, ip:str|None)。
    """
    t_val = None
    ip_val = None
    key = '"t":'
    idx = text.find(key)
    if idx >= 0:
        num = ""
        for ch in text[idx + len(key):]:
            if ch.isdigit():
                num += ch
            elif num:
                break
        if num:
            t_val = int(num)
    key_ip = '"ip":"'
    idx_ip = text.find(key_ip)
    if idx_ip >= 0:
        start = idx_ip + len(key_ip)
        end = text.find('"', start)
        if end > start:
            ip_val = text[start:end]
    return t_val, ip_val


def fetch_server_time_ip(session):
    """
    腾讯校时: GET checktime。返回 (t_秒, ip)。
      t 失败退回本地时间; ip 失败返回 None。
    """
    try:
        resp = session.get(cfg.CHECKTIME_URL, headers=cfg.build_headers(), timeout=5)
        if resp.status_code == 200:
            t_val, ip_val = _parse_checktime(resp.text)
            if t_val is None:
                t_val = int(time.time())
            return t_val, ip_val
    except Exception as e:
        log("校时失败, 使用本地时间: %s" % e)
    return int(time.time()), None


def fetch_server_ts(session):
    """腾讯校时: GET checktime -> 取 t (秒)。失败退回本地。(兼容旧调用)"""
    t_val, _ = fetch_server_time_ip(session)
    return t_val


# ---------------------------------------------------------------------------
#  Host-Ip: 对腾讯校时返回的公网出口 IP 做 AES-128-ECB/Base64 加密
#  与小程序 subPages/ticket/app-service.js placeOrder 逻辑一致:
#      key = secretkey ? "mjnkHYmu0jpURBTQ" : "AyrKJRXPO3nR5Abc"
#      Host-Ip = aesEncrypt(ip, key)
# ---------------------------------------------------------------------------
def build_host_ip(session, scan=False):
    """
    调 checktime 拿公网 IP, 按小程序方式加密, 返回 Host-Ip 请求头值。
    拿不到 IP 时返回 "" (小程序在无 ip 时也不加密, Host-Ip 留空)。
    scan=True 表示扫码渠道(有 secretkey), 使用 mjnkHYmu0jpURBTQ。
    """
    _, ip = fetch_server_time_ip(session)
    if not ip:
        log("checktime 未取到 ip, Host-Ip 置空")
        return ""
    key = cfg.HOST_IP_KEY_SCAN if scan else cfg.HOST_IP_KEY
    host_ip = aes_ecb_b64(ip, key)
    log("checktime ip=%s -> Host-Ip=%s" % (ip, host_ip))
    return host_ip



def build_nonce(session, hall_id, schedule_id, date_str):
    """
    nonce = AES(`userId:ts:date:hallId:scheduleId:platform`, NONCE_KEY)
      ts   = 腾讯校时秒 * 1000  (末尾补 "000")
      date = yyyy/MM/dd, platform = 2
    """
    t = fetch_server_ts(session)
    ts = str(t) + "000"
    date_slash = date_str.replace("-", "/")
    plain = "%s:%s:%s:%s:%s:%d" % (
        cfg.USER_ID, ts, date_slash, hall_id, schedule_id, cfg.PLATFORM
    )
    log("nonce 明文: %s" % plain)
    return aes_ecb_b64(plain, cfg.NONCE_KEY)


# ============================================================================
#  2. 余票扫描 + 锁定 hallId / scheduleId / priceId
# ============================================================================
def fetch_price_details(session, hall_id, schedule_id, query_date):
    """查询指定场次的详细票价, 返回 price 列表 (含 priceId / ticketPool)"""
    params = {
        "hallId": hall_id,
        "openPerson": "1",
        "queryDate": query_date.replace("-", "/"),
        "saleMode": "1",
        "scheduleId": schedule_id,
        "p": "wxmini",
    }
    try:
        resp = session.get(cfg.PRICE_URL, headers=cfg.build_headers(),
                           params=params, timeout=5)
        if resp.status_code == 200:
            res_json = resp.json()
            if res_json.get("code") == 200:
                return res_json.get("data", []) or []
    except Exception as e:
        log("查询价格接口异常: %s" % e)
    return []

def is_in_time_range():
    now = datetime.now()
    current_time = now.time()
    
    # 设置起始和结束时间
    start_time = datetime.strptime("17:00:00", "%H:%M:%S").time()
    end_time = datetime.strptime("17:08:00", "%H:%M:%S").time()
    
    return start_time <= current_time <= end_time

def scan_for_ticket(session):
    """
    轮询扫描余票。一旦发现某场次 ticketPool>0 且存在 priceId(余票>0),
    立即返回锁定的上下文 dict:
        { hallId, scheduleId, priceId, date, hallName, schedName, priceName }
    否则持续轮询 (随机 1~2 秒间隔)。
    """
    log("开始监听余票 (随机 1~2 秒间隔)... 按 Ctrl+C 退出")
    while True:
        now_str = datetime.now().strftime("%H:%M:%S")
        try:
            resp = session.get(cfg.ALL_CONFIG_URL, headers=cfg.build_headers(), timeout=5)
            if resp.status_code != 200:
                log("HTTP %s, 稍后重试" % resp.status_code)
                time.sleep(random.uniform(2.0, 5.0))
                continue

            res_json = resp.json()
            if res_json.get("code") != 200:
                log("接口 code=%s, 稍后重试" % res_json.get("code"))
                time.sleep(random.uniform(2.0, 5.0))
                continue

            data = res_json.get("data", {}) or {}
            calendar_pools = data.get("calendarTicketPoolsByDate", []) or []

            found_any_hall = False
            for item in calendar_pools:
                target_date = item.get("currentDate")
                hall_vos = item.get("hallTicketPoolVOS")
                if not hall_vos:
                    continue
                found_any_hall = True

                # 优先「基本陈列」(hallId==1): 把它排到最前, 有余票时优先锁定
                hall_vos = sorted(
                    hall_vos, key=lambda h: 0 if h.get("hallId") == 1 else 1
                )

                for hall in hall_vos:
                    hall_id = hall.get("hallId")
                    hall_name = hall.get("name", "未知展厅")

                    schedules = hall.get("scheduleTicketPoolVOS") or []

                    if is_in_time_range() and hall_id != 1:
                        continue

                    for sch in schedules:
                        schedule_id = sch.get("hallScheduleId")
                        sch_name = sch.get("scheduleName") or sch.get("timeRange", "全天")
                        sch_pool = sch.get("ticketPool", 0) or 0
                        if sch_pool <= 0:
                            continue

                        # 场次有余票 -> 查 priceId
                        price_list = fetch_price_details(
                            session, hall_id, schedule_id, target_date
                        )
                        for p in price_list:
                            p_id = p.get("priceId")
                            p_pool = p.get("ticketPool", 0) or 0
                            p_name = p.get("priceName", "未知类型")
                            if p_id is not None and p_pool > 0:
                                # ★ 三者齐备, 立即锁定并停止扫描
                                # ticketPool 取「场次余票」与「票价余票」的较小值,
                                # 作为本次可下单的余票数量 (ticketNum)。
                                avail = min(sch_pool, p_pool)
                                ctx = {
                                    "hallId": hall_id,
                                    "scheduleId": schedule_id,
                                    "priceId": p_id,
                                    "date": target_date,
                                    "hallName": hall_name,
                                    "schedName": sch_name,
                                    "priceName": p_name,
                                    "ticketPool": avail,
                                }

                                log("=" * 60)
                                log("🎉 发现余票并锁定! 停止扫描")
                                log("   展厅: %s (hallId=%s)" % (hall_name, hall_id))
                                log("   场次: %s (scheduleId=%s) 余票=%d"
                                    % (sch_name, schedule_id, sch_pool))
                                log("   票价: %s (priceId=%s) 余票=%d"
                                    % (p_name, p_id, p_pool))
                                log("   日期: %s" % target_date)
                                log("=" * 60)
                                return ctx

            if found_any_hall:
                print("[%s] 有展厅配置但暂无可下单余票..." % now_str, end="\r")
            else:
                print("[%s] 扫描正常: hallTicketPoolVOS 均为 null" % now_str, end="\r")

            time.sleep(random.uniform(1.0, 2.0))

        except Exception as e:
            log("扫描异常 (%s), 重建 Session 并等待" % e)
            try:
                import cycronet
                session = cycronet.CronetClient(chrometls="chrome_144")
            except Exception:
                pass
            time.sleep(random.uniform(2.0, 5.0))


# ============================================================================
#  3. getBlock 获取验证码
# ============================================================================
def _save_base64_image(b64_str, path):
    """把 base64 图片字符串 (可含 data:image/...;base64, 前缀) 解码保存到 path"""
    if not b64_str:
        return False
    try:
        if "," in b64_str and b64_str.strip().lower().startswith("data:"):
            b64_str = b64_str.split(",", 1)[1]
        raw = base64.b64decode(b64_str)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(raw)
        return True
    except Exception as e:
        log("保存验证码图片失败 (%s): %s" % (path, e))
        return False


def _save_captcha_images(d):
    """
    把 getBlock 返回里的验证码图 (originalImageBase64) 和提示图
    (jigsawImageBase64 / secondImageBase64 / tipsImageBase64 等) 保存到本地。
    以时间戳命名, 便于对照点选。
    """
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    saved = []

    # 主验证码图 (点选大图)
    main_b64 = d.get("originalImageBase64")
    if main_b64:
        p = os.path.join(cfg.CAPTCHA_DIR, "%s_captcha.png" % ts)
        if _save_base64_image(main_b64, p):
            saved.append(p)

    # 提示图 (不同接口字段名可能不同, 逐一尝试)
    tip_fields = [
        ("jigsawImageBase64", "tip"),
        ("secondImageBase64", "tip2"),
        ("tipsImageBase64", "tips"),
        ("tipImageBase64", "tip"),
        ("smallImageBase64", "small"),
    ]
    for field, suffix in tip_fields:
        val = d.get(field)
        if val:
            p = os.path.join(cfg.CAPTCHA_DIR, "%s_%s.png" % (ts, suffix))
            if _save_base64_image(val, p):
                saved.append(p)

    if saved:
        log("验证码图片已保存:")
        for p in saved:
            log("   %s" % p)
    else:
        log("未在 getBlock 返回中找到可保存的图片字段")
    return saved


def get_block(session, ctx):
    """请求 getBlock, 返回 data dict (含 originalImageBase64 / secretKey / token / tips)

    同时把验证码图与提示图保存到 cfg.CAPTCHA_DIR 本地目录, 便于对照点选。
    """
    nonce = build_nonce(session, ctx["hallId"], ctx["scheduleId"], ctx["date"])
    params = {
        "nonce": nonce,
        "platform": str(cfg.PLATFORM),
        "docType": "1",
        "p": "wxmini",
    }
    log("请求 getBlock ...")
    resp = session.get(cfg.GETBLOCK_URL, headers=cfg.build_headers(), params=params, timeout=8)
    if resp.status_code != 200:
        raise RuntimeError("getBlock HTTP %s" % resp.status_code)
    j = resp.json()
    if j.get("code") != 200 or not j.get("data"):
        raise RuntimeError("getBlock 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
    d = j["data"]
    log("getBlock 成功: docType=%s secretKey=%s captchaToken=%s"
        % (d.get("docType"), d.get("secretKey"), d.get("token")))
    # 把验证码图片与提示图保存到本地
    _save_captcha_images(d)
    return d


# ============================================================================
#  4. deviceToken (纯 Python TDID 两阶段, 无需本地 node 环境)
# ============================================================================
def get_device_token():
    """
    纯 Python 复刻腾讯 TDID 两阶段流程 (utils/tdid.py) 获取 deviceToken,
    返回 msgBlock 字符串 (placeOrder 的 deviceToken)。失败返回 None。
    不再依赖本地 node 环境。
    """
    log("请求 deviceToken (Python TDID 两阶段)...")
    try:
        r = tdid_client.get_device_token()
    except Exception as e:
        log("deviceToken 调用异常: %s" % e)
        return None
    if r.get("ok") and r.get("deviceToken"):
        log("deviceToken=%s..." % r["deviceToken"][:32])
        return r["deviceToken"]
    log("deviceToken 获取失败: ret=%s error=%s" % (r.get("ret"), r.get("error")))
    return None


# ============================================================================
#  5. placeOrder 下单
# ============================================================================
def place_order(session, ctx, point_json_cipher, captcha_token, device_token):
    date = ctx["date"]                 # yyyy-MM-dd
    use_date = date + " 00:00:00"
    body = {
        "useTicketType": 1,
        "poolFlag": 1,
        "realNameFlag": 1,
        "platform": cfg.PLATFORM,
        "ticketNum": 1,
        "date": date,
        "childTicketNum": 0,
        "saleMode": 1,
        "pointJson": point_json_cipher,
        "captchaToken": captcha_token,
        "scanToken": None,
        "ticketInfoList": [
            {
                "status": 0,
                "saleMode": 1,
                "platform": cfg.PLATFORM,
                "hallId": int(ctx["hallId"]),
                "hallScheduleId": int(ctx["scheduleId"]),
                "cinemaFlag": 0,
                "ticketPriceId": int(ctx["priceId"]),
                "certificate": 1,
                "certificateInfo": cfg.ORDER_CERT_INFO,
                "userName": cfg.ORDER_USER_NAME,
                "useDate": use_date,
                "isChildFreeTicket": 0,
                "realNameFlag": 1,
            }
        ],
        "deviceToken": device_token,
        "p": "wxmini",
    }
    # 下单前实时调 checktime 取公网 IP 并按小程序方式加密, 写入 Host-Ip 请求头
    host_ip = build_host_ip(session)
    log("提交 placeOrder ...")
    resp = session.post(
        cfg.PLACEORDER_URL, headers=cfg.build_headers(host_ip=host_ip),
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        timeout=10,
    )

    try:
        j = resp.json()
    except Exception:
        log("placeOrder 响应非 JSON: %s" % resp.text[:200])
        return None
    return j

if __name__ == '__main__':
    deviceToken = get_device_token()
    print("deviceToken=%s" % deviceToken)
