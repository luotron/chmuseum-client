"""
bm_config.py — 国博下单工具的全局配置与常量
================================================================================
运行前请按需替换 API_TOKEN / 实名信息。USER_ID 会在 checkToken 成功后自动回填。
"""

import os

# ============================ 接口 URL ============================
CHECKTOKEN_URL = "https://uu.chnmuseum.cn/prod-api/api/checkToken"
USER_INFO_URL = "https://uu.chnmuseum.cn/prod-api/getUserInfoToIndividual2Mini?p=wxmini"
ISBIND_URL = "https://wxmini.chnmuseum.cn/prod-api/realName/v1/isBind?p=wxmini"
ALL_CONFIG_URL = (
    "https://wapticket.chnmuseum.cn/prod-api/basesetting/HallSetting/ingore/"
    "gainAllSystemConfig?channel=wxMini&requestTaskKey=gainAllSystemConfigLogin"
    "&ticketUseType=1&p=wxmini"
)
PRICE_URL = "https://wxmini.chnmuseum.cn/prod-api/pool/ingore/getPriceByScheduleId"
GETBLOCK_URL = "https://wxmini.chnmuseum.cn/prod-api/pool/getBlock"
PLACEORDER_URL = "https://wxmini.chnmuseum.cn/prod-api/config/orderRule/placeOrder"
CHECK_LEADER_INFO_URL = "https://wxmini.chnmuseum.cn/prod-api/config/orderRule/checkLeaderInfo"
FRONTPAGE_URL = "https://wxmini.chnmuseum.cn/prod-api/risk/frontPage"
CONTACTER_LIST_URL = "https://wxmini.chnmuseum.cn/prod-api/basesetting/HallSetting/gainUserContacterList?p=wxmini"
ORDER_INFO_BY_STATUS_URL = "https://wxmini.chnmuseum.cn/prod-api/order/OrderInfo/getOrderInfoByStatus?hallType=91&status=1&p=wxmini"
CHECKTIME_URL = "https://vv.video.qq.com/checktime?otype=json"


# ============================ User-Agent ============================
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCLinuxWechat(0xf2741104) XWEB/14910"
# ============================ 常量 ============================
NONCE_KEY = "AyrKJRXPO3nR5Abc"   # getBlock nonce 的 AES key (源码固定)
# Host-Ip 加密 key: 非扫码(secretkey 为空)用 AyrKJRXPO3nR5Abc, 扫码用 mjnkHYmu0jpURBTQ
HOST_IP_KEY = "AyrKJRXPO3nR5Abc"
HOST_IP_KEY_SCAN = "mjnkHYmu0jpURBTQ"
POINT_OFFSET = 10                 # 点选坐标 -10 偏移 (Verify 组件 bindingClick)
PLATFORM = 2                      # 非扫码

# ---- 插件请求签名 (X-WECHAT-HOSTSIGN) 相关 ----
# APPID: 所在小程序的 AppId (可从请求头 referer 中获得)
PLUGIN_APPID = "wx9e2927dd595b0473"
# TOKEN: 插件 Token, 可在小程序插件基本设置中找到
PLUGIN_TOKEN = ""



# ---- 登录信息, 请按需替换为自己的有效 token、miniOpenId、unionId ----
API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbl91c2VyX25hbWUiOiLlpKnnqbrvvIjpobrlir_pmo_nvJjvvIkiLCJsb2dpbl9leHBpcmVkX3RpbWUiOjE3ODQyNTQ3Mjk4MzIsImxvZ2luX3VzZXJfaWQiOjM2MDkwMzU5LCJsb2dpbl91c2VyX2tleSI6IjM2MDkwMzU5OmU0YmI0NjMwLWVmZTktNDYxZC1hNWU2LWYxZjgyOWZiZmRiZCIsImxvZ2luX3VzZXJfYWNjb3VudCI6IjEzOTM1ODMxMjkxIn0.2xwIuOnp2GrilODk_1Dk4MHe06bx7sax3O_dzJ7Aeq4"
OPENID = "osPfN4KloruyBEHLORUY148_cfjm"
UNIONID = "oBJkKwO4Na-1_IrDi0TljIeKGnuY"
# ---- 下单实名信息 留空则自动回填 ----
ORDER_USER_NAME = ""
ORDER_CERT_INFO = ""

# ---- 用户 userId (nonce 明文需要); 留空则由 checkToken 成功后自动回填 ----
USER_ID = ""

# ---- 登录信息落盘文件 (checkToken 成功后保存 userInfo) ----
LOGIN_INFO_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "login_info.json")

# ---- 验证码图片落盘目录 (getBlock 时保存验证码图 + 提示图) ----
CAPTCHA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "captcha")



# ============================================================================
#  全局: 打印所有 cycronet.CronetClient 请求响应的 Set-Cookie
#  (monkey-patch Session.request, 覆盖 get/post/put/... 全部方法)
# ============================================================================
_COOKIE_LOGGER_INSTALLED = False


def _extract_set_cookie(resp):
    """从响应对象里取 set-cookie (headers 值可能是 str 或 list)。取不到返回 None。"""
    try:
        headers = getattr(resp, "headers", None) or {}
        for k, v in headers.items():
            if str(k).lower() == "set-cookie":
                if isinstance(v, (list, tuple)):
                    return "; ".join(str(x) for x in v)
                return str(v)
    except Exception:
        pass
    return None


def install_cookie_logger():
    """
    给 cycronet 的 Session.request 打补丁: 每次请求返回后, 若响应头含 set-cookie
    就打印出来。只需调用一次 (幂等)。覆盖所有 get/post/put/delete/... 请求。
    """
    global _COOKIE_LOGGER_INSTALLED
    if _COOKIE_LOGGER_INSTALLED:
        return
    try:
        from cycronet._session import Session
    except Exception as e:
        print("[cookie-logger] 无法导入 cycronet._session.Session: %s" % e)
        return

    _orig_request = Session.request

    def _patched_request(self, method, url, *args, **kwargs):
        resp = _orig_request(self, method, url, *args, **kwargs)
        try:
            sc = _extract_set_cookie(resp)
            if sc:
                ts = __import__("datetime").datetime.now().strftime("%H:%M:%S")
                print("[%s] [Set-Cookie] %s %s -> %s" % (ts, method, url, sc))
        except Exception:
            pass
        return resp

    Session.request = _patched_request
    _COOKIE_LOGGER_INSTALLED = True


# ============================ 请求头 ============================
def build_headers(host_ip=None):

    """
    构造带当前 API_TOKEN 的请求头 (API_TOKEN 可能在运行时被更新)。
    host_ip: 已加密好的 Host-Ip (AES-128-ECB/Base64)。传 None 时保留占位值,
             下单前应由 api.build_host_ip() 计算后传入。
    """
    return {
        "User-Agent": UA,
        "Connection": "keep-alive",
        "Accept": "application/json",
        "xweb_xhr": "1",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "content-type": "application/json",
        "Host-Ip": host_ip if host_ip else "",
        "Authorization": "Bearer " + API_TOKEN,
        "charset": "utf-8",
        "Referer": "https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html",
    }


