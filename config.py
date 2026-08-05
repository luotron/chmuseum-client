"""
config.py — 国博下单工具的全局配置与常量
================================================================================
运行前请按需替换 API_TOKEN / 实名信息。USER_ID 会在 checkToken 成功后自动回填。
"""

import os
import platform

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


# ============================ 运行环境切换 ============================
# ENV 取值: "linux" 或 "windows"。用于统一切换 User-Agent 与设备指纹 (tdid._DEV)。
# 通过 platform.system() 自动判断当前操作系统:
#   Windows -> "windows"; 其余 (Linux/macOS 等) -> "linux"。
ENV = "windows" if platform.system().lower().startswith("win") else "linux"


# ============================ User-Agent ============================
# 两套 User-Agent, 按 ENV 选择
_UA_LINUX = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI "
    "MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) "
    "UnifiedPCLinuxWechat(0xf2741104) XWEB/14910"
)
_UA_WINDOWS = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI "
    "MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) "
    "UnifiedPCWindowsWechat(0xf2541721) XWEB/19027"
)
UA = _UA_WINDOWS if ENV == "windows" else _UA_LINUX


# ============================ 设备指纹 (tdid._DEV) ============================
# 两套设备信息, 按 ENV 选择。101(OPENID) 与 130(pluginCode) 在 tdid.py 内动态填充,
# 这里放占位, 由 tdid.py 覆写。
_DEV_LINUX = {
    "4": "linux", "43": "wifi",
    "101": "",
    "103": "3.8.10",
    "104": "linux", "105": "linux",
    "106": "798*412", "107": "Linux 6.8.0-136-generic x86_64", "108": "zh_CN",
    "109": "", "110": "", "111": "4.1.1.4",
    "112": "", "113": "", "114": "", "115": "",
    "116": "20", "117": "-1", "118": "1:1:1:1:1:0:1:1",
    "119": "", "121": "", "122": "", "123": "", "124": "false",
    "126": "15", "127": "20260715", "128": "2.0.0.1", "129": "release",
    "130": "",
}
_DEV_WINDOWS = {
    "4": "windows", "43": "wifi",
    "101": "",
    "103": "3.17.0",
    "104": "microsoft", "105": "microsoft",
    "106": "780*414", "107": "Windows Unknown x64", "108": "zh_CN",
    "109": "", "110": "", "111": "4.1.11.55",
    "112": "", "113": "", "114": "", "115": "",
    "116": "20", "117": "-1", "118": "1:1:1:1:1:0:1:1",
    "119": "", "121": "", "122": "", "123": "", "124": "false",
    "126": "15", "127": "20260715", "128": "198.18.0.1", "129": "release",
    "130": "",
}


def get_device_profile():
    """返回当前 ENV 对应的设备指纹字典副本 (101/130 由 tdid.py 动态覆写)。"""
    src = _DEV_WINDOWS if ENV == "windows" else _DEV_LINUX
    return dict(src)


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
API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbl91c2VyX25hbWUiOiLkuIfkuovpobrlv4MxODAzNTg2MzY4MyIsImxvZ2luX2V4cGlyZWRfdGltZSI6MTc4NDI1MzM4NTg1MiwibG9naW5fdXNlcl9pZCI6MzYwODk2MDYsImxvZ2luX3VzZXJfa2V5IjoiMzYwODk2MDY6OWQyMzE5YzctZjYwZi00YTQzLWJjMGEtNzE1ZWNhZjZjNzIzIiwibG9naW5fdXNlcl9hY2NvdW50IjoiMTgwMzU4NjM2ODMifQ.6cRiByVMyEgisdl9It-DNjWRKovSXtNG9Yq2fVSnOas"
OPENID = "osPfN4d-behloruyBEHLORUY148_"
UNIONID = "oBJkKwOHkTQaG_puA8-WpRRtOpUs"
# ---- 下单实名信息 留空则自动回填 ----
ORDER_USER_NAME = ""
ORDER_CERT_INFO = ""

# ---- 用户 userId (nonce 明文需要); 留空则由 checkToken 成功后自动回填 ----
USER_ID = ""


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


