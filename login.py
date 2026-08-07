"""
login.py — 国博小程序两段式登录 (基于本地应用宝协议服务)
================================================================================
运行流程:
  0. 校验本地服务 (http://127.0.0.1:8000/health) 是否启动; 未启动直接退出。
  0.5 POST /accounts/refresh     刷新账号存活状态, 过滤出 status=alive 的账号。
  1. GET  /accounts               取账号列表, 逐个拿 uin(主键)/openid(ref)/nickname。
  2. 若 uin 已在 cache/login/ 登录过 -> 跳过该账号。
  3. POST /wxapp/getCode          用 ref(openid) 换取微信登录 code。
  4. POST /prod-api/api/getWxminiSessioinInfo  用 code 换 openid/session_key/unionid。
  5. POST /wxapp/getPhoneNumber   用 ref(openid) 拿 encryptedData / iv。
  6. POST /prod-api/api/miniAppLogin  组合以上字段登录, 返回 token(=API_TOKEN)。
  7. 登录产物落盘 cache/login/{uin}.json (存在即视为已登录, 下次跳过)。

字段映射:
  - miniAppLogin.encryptedData = getPhoneNumber.encryptedData
  - miniAppLogin.vi            = getPhoneNumber.iv
  - miniAppLogin.openId/sessionKey/unionId = getWxminiSessioinInfo 返回

依赖: cycronet + config + api.log; 不依赖 tdid。
"""

import os
import sys
import json
import time

# 确保能 import 同目录模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import cycronet

import config as cfg
from api import log


# ---- 登录产物落盘目录 (主键 openid: cache/login/{openid}.json) ----
_LOGIN_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "login")


def _login_file(openid):
    """按 accounts openid 命名的登录产物文件路径。"""
    return os.path.join(_LOGIN_DIR, "%s.json" % openid)


def _is_logged_in(openid):
    """openid 是否已登录过 (对应登录产物文件已存在)。"""
    return bool(openid) and os.path.exists(_login_file(openid))


def _read_token(openid):
    """读取已登录账号缓存里的 apiToken; 无则返回 None。"""
    try:
        with open(_login_file(openid), "r", encoding="utf-8") as f:
            rec = json.load(f)
        return (rec.get("login") or {}).get("apiToken")
    except Exception:
        return None


def _save_login(openid, uin, nickname, session_info, login_resp):
    """
    把一次登录成功的产物写入 cache/login/{openid}.json。
    主键 openid; 附带 uin(可能 null)/nickname; login 段与 config.load_login/save_login 对齐。
    userId/userInfo 留空, 后续由 main 运行时 (checkToken/getUserInfo) 回填并 save_login。
    """
    old = {}
    if os.path.exists(_login_file(openid)):
        try:
            with open(_login_file(openid), "r", encoding="utf-8") as f:
                old = json.load(f) or {}
        except Exception:
            old = {}
    old_login = old.get("login") or {}
    record = {
        "openid": str(openid),
        "uin": uin if uin is not None else old.get("uin"),
        "nickname": nickname or old.get("nickname") or "",
        "sessionKey": session_info.get("session_key"),
        "registerFlag": login_resp.get("registerFlag"),
        "login": {
            "apiToken": login_resp.get("token") or "",
            "openid": session_info.get("openid") or "",
            "unionId": session_info.get("unionid") or "",
            "userInfo": old_login.get("userInfo") or {},
        },
    }
    try:
        os.makedirs(_LOGIN_DIR, exist_ok=True)
        with open(_login_file(openid), "w", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)
        log("登录信息已保存: %s" % _login_file(openid))
    except Exception as e:
        log("❌ 保存登录信息失败(%s): %s" % (openid, e))


# ============================================================================
#  本地应用宝协议服务调用
# ============================================================================
def _local_headers():
    """本地服务请求头 (与浏览器抓包一致的最小集合)。"""
    return {
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Origin": cfg.LOCAL_BASE_URL,
        "Referer": cfg.LOCAL_BASE_URL + "/",
        "content-type": "application/json",
    }


def check_local_service(session):
    """校验本地服务是否启动 (GET /health -> data.ok)。未启动返回 False。"""
    try:
        resp = session.get(cfg.LOCAL_HEALTH_URL, headers=_local_headers(), timeout=5)
    except Exception as e:
        log("本地服务未启动或不可达: %s" % e)
        return False
    if resp.status_code != 200:
        log("本地服务 /health HTTP %s" % resp.status_code)
        return False
    try:
        j = resp.json()
    except Exception:
        log("本地服务 /health 响应非 JSON: %s" % resp.text[:200])
        return False
    ok = bool((j.get("data") or {}).get("ok"))
    if not ok:
        log("本地服务 /health 返回异常: %s" % json.dumps(j, ensure_ascii=False)[:200])
    return ok


def get_accounts(session):
    """GET /accounts -> 返回账号列表 (list of dict, 含 openid)。失败返回 []。"""
    try:
        resp = session.get(cfg.LOCAL_ACCOUNTS_URL, headers=_local_headers(), timeout=8)
        j = resp.json()
    except Exception as e:
        log("获取 accounts 异常: %s" % e)
        return []
    if j.get("code") != 0 or not isinstance(j.get("data"), list):
        log("获取 accounts 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return []
    return j["data"]


def refresh_accounts(session):
    """
    POST /accounts/refresh -> 刷新账号存活状态, 返回 status=alive 的 openid 集合。
    返回 (alive_openids: set, total_count: int, alive_count: int)。
    失败返回 (set(), 0, 0)。
    """
    try:
        resp = session.post(cfg.LOCAL_REFRESH_URL, headers=_local_headers(),
                            timeout=10)
        j = resp.json()
    except Exception as e:
        log("刷新 accounts 异常: %s" % e)
        return set(), 0, 0
    if j.get("code") != 0 or not isinstance(j.get("data"), list):
        log("刷新 accounts 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return set(), 0, 0
    data = j["data"]
    alive = {acc["openid"] for acc in data if acc.get("status") == "alive"}
    log("刷新 accounts 成功: 共 %d 个账号, 存活 %d 个。" % (len(data), len(alive)))
    return alive, len(data), len(alive)


def get_code(session, ref):
    """POST /wxapp/getCode -> 返回微信登录 code 字符串。失败返回 None。"""
    body = json.dumps({"ref": ref, "app_id": cfg.APP_ID},
                      ensure_ascii=False).encode("utf-8")
    try:
        resp = session.post(cfg.LOCAL_GETCODE_URL, headers=_local_headers(),
                            data=body, timeout=15)
        j = resp.json()
    except Exception as e:
        log("getCode 异常: %s" % e)
        return None
    if j.get("code") != 0:
        log("getCode 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return None
    result = (j.get("data") or {}).get("result") or {}
    code = result.get("code")
    if not code:
        log("getCode 未返回 code: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return None
    return code


def get_phone_number(session, ref):
    """
    POST /wxapp/getPhoneNumber -> 返回 (encryptedData, iv)。失败返回 (None, None)。
    该接口响应体可能是 {result:{...}} 或 {code:0,data:{result:{...}}}。
    """
    body = json.dumps({"ref": ref, "app_id": cfg.APP_ID},
                      ensure_ascii=False).encode("utf-8")
    try:
        resp = session.post(cfg.LOCAL_GETPHONE_URL, headers=_local_headers(),
                            data=body, timeout=15)
        j = resp.json()
    except Exception as e:
        log("getPhoneNumber 异常: %s" % e)
        return None, None
    result = j.get("result")
    if result is None:
        result = (j.get("data") or {}).get("result")
    result = result or {}
    encrypted_data = result.get("encryptedData")
    iv = result.get("iv")
    if not encrypted_data or not iv:
        log("getPhoneNumber 未返回 encryptedData/iv: %s"
            % json.dumps(j, ensure_ascii=False)[:200])
        return None, None
    return encrypted_data, iv


# ============================================================================
#  风控凭据 (TDID_HOST_SIGN / TDID_PLUGIN_CODE) 运行时获取
# ============================================================================
def _get_host_sign_result(session, ref):
    """
    POST /wxapp/getHostSign -> 返回 data.result 原始 dict (含 list/plugins 等)。
    失败返回 None。一次请求包含所有插件的 hostSign, 后续按 plugin_id 分别提取。
    """
    body = json.dumps({
        "ref": ref,
        "app_id": cfg.APP_ID,
        "payload": {
            "app_id": cfg.APP_ID,
            "data": json.dumps({
                "plugins": [
                    {"inner_version": 15, "provider": "wx1629d117cf9be937"},
                    {"inner_version": 6, "provider": "wxe51129e09bb46147"},
                    {"inner_version": 32, "provider": "wx63af045606be281d"},
                    {"inner_version": 46, "provider": "wxfa43a4a7041a84de"},
                ],
            }, ensure_ascii=False),
            "task_id": 0,
            "version_type": 0,
        },
    }, ensure_ascii=False).encode("utf-8")
    try:
        resp = session.post(cfg.LOCAL_GETHOSTSIGN_URL, headers=_local_headers(),
                            data=body, timeout=15)
        j = resp.json()
    except Exception as e:
        log("getHostSign 异常: %s" % e)
        return None
    if j.get("code") != 0:
        log("getHostSign 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return None
    result = (j.get("data") or {}).get("result") or {}
    lst = result.get("list") or result.get("plugins") or []
    if not lst:
        log("getHostSign 未返回 list/plugins: %s"
            % json.dumps(j, ensure_ascii=False)[:200])
        return None
    result["_merged_list"] = lst
    return result


def _extract_plugin_host_sign(result, plugin_id):
    """
    从 _get_host_sign_result 返回的 result dict 中, 按 plugin_id 提取
    对应插件的 {"noncestr","timestamp","signature"} 紧凑 JSON 字符串。
    找不到返回 None。
    """
    lst = result.get("_merged_list", [])
    item = None
    for entry in lst:
        if entry.get("plugin_id") == plugin_id:
            item = entry
            break
    if item is None:
        log("getHostSign 未找到 plugin_id=%s 的条目 (共 %d 条)"
            % (plugin_id, len(lst)))
        return None
    host_sign = item.get("host_sign")
    noncestr = item.get("noncestr")
    timestamp = item.get("timestamp")
    if not host_sign or not noncestr or timestamp is None:
        log("getHostSign plugin_id=%s 字段缺失: %s"
            % (plugin_id, json.dumps(item, ensure_ascii=False)[:200]))
        return None
    return json.dumps({
        "noncestr": noncestr,
        "timestamp": timestamp,
        "signature": host_sign,
    }, separators=(",", ":"), ensure_ascii=False)


def get_host_sign(session, ref, plugin_id=None):
    """
    POST /wxapp/getHostSign -> 返回 X-WECHAT-HOSTSIGN 请求头值 (JSON 字符串)。
    本地服务返回 data.result.list, 按 plugin_id 精确匹配目标插件条目,
    取 host_sign/noncestr/timestamp 组装成小程序真实请求头格式
    {"noncestr","timestamp","signature"}。失败返回 None。

    plugin_id 默认使用 cfg.RISK_PLUGIN_PROVIDER (同盾 TDID)。
    传 cfg.GEETEST_PLUGIN_PROVIDER 可获取极验 hostSign。
    """
    if plugin_id is None:
        plugin_id = cfg.RISK_PLUGIN_PROVIDER
    result = _get_host_sign_result(session, ref)
    if not result:
        return None
    return _extract_plugin_host_sign(result, plugin_id)


def get_plugin_code(session, ref):
    """
    POST /wxapp/operateWxData (webapi_getapppluginopenpid) -> 返回 pluginCode 字符串。
    本地服务返回 data.result.data 是 JSON 字符串 {"code": "..."}。失败返回 None。
    """
    body = json.dumps({
        "ref": ref,
        "app_id": cfg.APP_ID,
        "payload": {
            "data": {
                "api_name": "webapi_getapppluginopenpid",
                "data": {"miniprogram_appid": cfg.APP_ID},
                "operate_directly": False,
                "plugin_appid": cfg.RISK_PLUGIN_PROVIDER,
                "env": 1,
            },
            "timeout": 60000,
            "requestInQueue": False,
            "isImportant": False,
            "keepAlive": True,
            "useQuic": False,
        },
    }, ensure_ascii=False).encode("utf-8")
    try:
        resp = session.post(cfg.LOCAL_OPERATEWXDATA_URL, headers=_local_headers(),
                            data=body, timeout=15)
        j = resp.json()
    except Exception as e:
        log("operateWxData 异常: %s" % e)
        return None
    if j.get("code") != 0:
        log("operateWxData 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return None
    result = (j.get("data") or {}).get("result") or {}
    data_str = result.get("data")
    if not data_str:
        log("operateWxData 未返回 data: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return None
    try:
        code = json.loads(data_str).get("code")
    except Exception:
        log("operateWxData data 解析失败: %s" % str(data_str)[:200])
        return None
    if not code:
        log("operateWxData 未返回 pluginCode: %s" % str(data_str)[:200])
        return None
    return code


def fetch_risk_params(session, ref):
    """
    运行时获取风控凭据并写入环境变量:
      TDID_HOST_SIGN    <- getHostSign (plugin_id=cfg.RISK_PLUGIN_PROVIDER 同盾)
      GEETEST_HOST_SIGN <- getHostSign (plugin_id=cfg.GEETEST_PLUGIN_PROVIDER 极验)
      TDID_PLUGIN_CODE  <- operateWxData(webapi_getapppluginopenpid)
    成功返回 True (三者均获取到); 任一失败返回 False。
    """
    # 一次 getHostSign 请求返回所有插件, 分别提取 TDID 和 Geetest 的 hostSign
    result = _get_host_sign_result(session, ref)
    if not result:
        log("❌ 获取 getHostSign 结果失败。")
        return False
    tdid_sign = _extract_plugin_host_sign(result, cfg.RISK_PLUGIN_PROVIDER)
    if not tdid_sign:
        log("❌ 提取 TDID_HOST_SIGN 失败。")
        return False
    geetest_sign = _extract_plugin_host_sign(result, cfg.GEETEST_PLUGIN_PROVIDER)
    if not geetest_sign:
        log("❌ 提取 GEETEST_HOST_SIGN 失败。")
        return False
    plugin_code = get_plugin_code(session, ref)
    if not plugin_code:
        log("❌ 获取 TDID_PLUGIN_CODE 失败。")
        return False
    os.environ["TDID_HOST_SIGN"] = tdid_sign
    os.environ["GEETEST_HOST_SIGN"] = geetest_sign
    os.environ["TDID_PLUGIN_CODE"] = plugin_code
    log("风控凭据已获取:")
    log("  pluginCode=%s..." % plugin_code[:16])
    log("  TDID hostSign=%s..." % tdid_sign[:40])
    log("  Geetest hostSign=%s..." % geetest_sign[:40])
    return True


# ============================================================================
#  国博小程序登录接口
# ============================================================================
def get_wxmini_session(session, code):
    """
    POST /prod-api/api/getWxminiSessioinInfo
    用 code 换取 {openid, session_key, unionid}。失败返回 None。
    """
    body = json.dumps({"code": code, "p": "wxmini"},
                      ensure_ascii=False).encode("utf-8")
    try:
        resp = session.post(cfg.GET_WXMINI_SESSION_URL, headers=cfg.build_headers(),
                            data=body, timeout=10)
        j = resp.json()
    except Exception as e:
        log("getWxminiSessioinInfo 异常: %s" % e)
        return None
    if j.get("code") != 200 or not j.get("data"):
        log("getWxminiSessioinInfo 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return None
    data = j["data"]
    if not data.get("success") or not data.get("openid"):
        log("getWxminiSessioinInfo 返回无效: %s"
            % json.dumps(j, ensure_ascii=False)[:200])
        return None
    log("getWxminiSessioinInfo 成功: openid=%s unionid=%s"
        % (data.get("openid"), data.get("unionid")))
    return data


def mini_app_login(session, session_info, encrypted_data, iv):
    """
    POST /prod-api/api/miniAppLogin
    组合 session_info(openid/session_key/unionid) + encryptedData/iv(=vi) 登录。
    成功返回完整响应 dict (含 token); 失败返回 None。
    """
    body = {
        "appType": "wxmini",
        "avatar": "",
        "encryptedData": encrypted_data,
        "loginClient": 1,
        "loginType": 5,
        "registerClient": 2,
        "openId": session_info.get("openid"),
        "sessionKey": session_info.get("session_key"),
        "unionId": session_info.get("unionid"),
        "userType": 1,
        "vi": iv,
        "code": "",
        "deviceid": "",
        "nickName": "",
        "password": "",
        "redirectUrl": "",
        "sellChannel": "1",
        "username": "",
        "uuid": "",
        "p": "wxmini",
    }
    try:
        resp = session.post(cfg.MINIAPP_LOGIN_URL, headers=cfg.build_headers(),
                            data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
                            timeout=10)
        j = resp.json()
    except Exception as e:
        log("miniAppLogin 异常: %s" % e)
        return None
    if j.get("code") != 200 or not j.get("token"):
        log("miniAppLogin 失败: %s" % json.dumps(j, ensure_ascii=False)[:200])
        return None
    log("miniAppLogin 成功: registerFlag=%s token=%s..."
        % (j.get("registerFlag"), (j.get("token") or "")[:32]))
    return j


# ============================================================================
#  单账号完整登录
# ============================================================================
def login_account(session, openid, uin=None, nickname=""):
    """
    对单个账号执行完整两段式登录。
      openid   : 账号主键 (accounts.openid), 决定缓存文件名, 也用于调本地 getCode/getPhoneNumber。
      uin      : accounts.uin (可能为 null), 仅作附带信息写入登录记录。
      nickname : accounts.nickname, 写入登录记录。
    返回 apiToken 字符串; 失败返回 None。已登录 (缓存命中) 直接返回缓存 token。
    """
    if _is_logged_in(openid):
        log("账号 %s (openid=%s) 已登录 (命中 cache/login), 跳过。" % (nickname or "", openid))
        return _read_token(openid)

    log("开始登录账号 %s (openid=%s) ..." % (nickname or "", openid))
    # 1) 本地取 code
    code = get_code(session, openid)
    if not code:
        return None
    log("getCode 成功: code=%s" % code)

    # 2) code 换 session
    session_info = get_wxmini_session(session, code)
    if not session_info:
        return None

    # 3) 本地取 encryptedData / iv
    encrypted_data, iv = get_phone_number(session, openid)
    if not encrypted_data or not iv:
        return None
    log("getPhoneNumber 成功: iv=%s encryptedData=%s..." % (iv, encrypted_data[:32]))

    # 4) miniAppLogin
    login_resp = mini_app_login(session, session_info, encrypted_data, iv)
    if not login_resp:
        return None

    # 5) 落盘 (下次跳过)
    _save_login(openid, uin, nickname, session_info, login_resp)
    return login_resp.get("token")


def main():
    session = cycronet.CronetClient(chrometls="chrome_133")

    # 0) 校验本地服务
    if not check_local_service(session):
        log("❌ 本地服务 (%s) 未启动, 退出。" % cfg.LOCAL_BASE_URL)
        return
    log("本地服务已就绪。")

    # 0.5) 刷新账号存活状态 (只有 status=alive 的账号可用)
    alive_openids, _, _ = refresh_accounts(session)
    if not alive_openids:
        log("❌ 没有存活的账号, 退出。")
        return

    # 1) 取账号
    accounts = get_accounts(session)
    if not accounts:
        log("❌ 未获取到任何账号, 退出。")
        return

    # 过滤: 只保留存活账号
    accounts = [acc for acc in accounts if acc.get("openid") in alive_openids]
    log("获取到 %d 个存活账号 (已过滤过期账号)。" % len(accounts))
    if not accounts:
        log("❌ 过滤后无可用账号, 退出。")
        return

    ok, skip, fail = 0, 0, 0
    for acc in accounts:
        openid = acc.get("openid")
        uin = acc.get("uin")           # 可能为 null, 仅附带
        nickname = acc.get("nickname") or ""
        if not openid:
            log("账号缺少 openid, 跳过: %s" % json.dumps(acc, ensure_ascii=False)[:120])
            continue
        if _is_logged_in(openid):
            log("账号 %s (openid=%s) 已登录, 跳过。" % (nickname, openid))
            skip += 1
            continue
        token = login_account(session, openid, uin, nickname)
        if token:
            log("✅ 账号 %s (openid=%s) 登录成功。" % (nickname, openid))
            ok += 1
        else:
            log("❌ 账号 %s (openid=%s) 登录失败。" % (nickname, openid))
            fail += 1

    log("=" * 50)
    log("登录完成: 成功=%d 跳过=%d 失败=%d" % (ok, skip, fail))
    log("=" * 50)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已退出。")
