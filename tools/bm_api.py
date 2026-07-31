"""
bm_api.py — 国博接口调用层
================================================================================
封装: checkToken / 腾讯校时 / nonce / 余票扫描 / getBlock / deviceToken / placeOrder
所有请求头由 bm_config.build_headers() 生成 (自动带最新 API_TOKEN)。
"""

import json
import os
import random
import subprocess
import time
from datetime import datetime

import bm_config as cfg
from bm_aes import aes_ecb_b64


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
def fetch_server_ts(session):
    """腾讯校时: GET checktime -> QZOutputJson={..."t":1785402089...}; 取 t (秒)。失败退回本地。"""
    try:
        resp = session.get(cfg.CHECKTIME_URL, headers=cfg.build_headers(), timeout=5)
        if resp.status_code == 200:
            text = resp.text
            key = '"t":'
            idx = text.find(key)
            if idx >= 0:
                start = idx + len(key)
                num = ""
                for ch in text[start:]:
                    if ch.isdigit():
                        num += ch
                    elif num:
                        break
                if num:
                    return int(num)
    except Exception as e:
        log("校时失败, 使用本地时间: %s" % e)
    return int(time.time())


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


def scan_for_ticket(session):
    """
    轮询扫描余票。一旦发现某场次 ticketPool>0 且存在 priceId(余票>0),
    立即返回锁定的上下文 dict:
        { hallId, scheduleId, priceId, date, hallName, schedName, priceName }
    否则持续轮询 (随机 2~3 秒间隔)。
    """
    log("开始监听余票 (随机 2~3 秒间隔)... 按 Ctrl+C 退出")
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

                for hall in hall_vos:
                    hall_id = hall.get("hallId")
                    hall_name = hall.get("name", "未知展厅")
                    schedules = hall.get("scheduleTicketPoolVOS") or []

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
                                ctx = {
                                    "hallId": hall_id,
                                    "scheduleId": schedule_id,
                                    "priceId": p_id,
                                    "date": target_date,
                                    "hallName": hall_name,
                                    "schedName": sch_name,
                                    "priceName": p_name,
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

            time.sleep(random.uniform(2.0, 3.0))

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
def get_block(session, ctx):
    """请求 getBlock, 返回 data dict (含 originalImageBase64 / secretKey / token / tips)"""
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
    return d


# ============================================================================
#  4. deviceToken (调用 node tdid_client.js getDeviceToken)
# ============================================================================
def get_device_token():
    """
    通过 node 子进程调用 tools/tdid_client.js 导出的 getDeviceToken(),
    返回 msgBlock 字符串 (placeOrder 的 deviceToken)。失败返回 None。
    """
    node_script = (
        "const t=require(%s);"
        "t.getDeviceToken().then(r=>{"
        "process.stdout.write(JSON.stringify(r));"
        "}).catch(e=>{process.stdout.write(JSON.stringify({ok:false,error:String(e&&e.message||e)}));});"
    ) % json.dumps(cfg.TDID_CLIENT)
    log("请求 deviceToken (node TDID 两阶段)...")
    try:
        proc = subprocess.run(
            [cfg.NODE_BIN, "-e", node_script],
            capture_output=True, text=True, timeout=30,
            cwd=os.path.dirname(cfg.TDID_CLIENT),
        )
        out = (proc.stdout or "").strip()
        if not out:
            log("deviceToken node 无输出; stderr=%s" % (proc.stderr or "")[:200])
            return None
        r = json.loads(out)
        if r.get("ok") and r.get("deviceToken"):
            log("deviceToken=%s..." % r["deviceToken"][:32])
            return r["deviceToken"]
        log("deviceToken 获取失败: ret=%s error=%s" % (r.get("ret"), r.get("error")))
        return None
    except Exception as e:
        log("deviceToken 调用异常: %s" % e)
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
    log("提交 placeOrder ...")
    resp = session.post(
        cfg.PLACEORDER_URL, headers=cfg.build_headers(),
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        timeout=10,
    )
    try:
        j = resp.json()
    except Exception:
        log("placeOrder 响应非 JSON: %s" % resp.text[:200])
        return None
    if j.get("code") == 200 and j.get("data"):
        d = j["data"]
        log("=" * 60)
        log("🎉 下单成功! 订单号=%s 场次=%s"
            % (d.get("orderNumber"), d.get("schduleDate")))
        log("=" * 60)
        return d
    log("placeOrder 返回: %s" % json.dumps(j, ensure_ascii=False)[:300])
    return None
