"""
bm_config.py — 国博下单工具的全局配置与常量
================================================================================
运行前请按需替换 API_TOKEN / 实名信息。USER_ID 会在 checkToken 成功后自动回填。
"""

import os

# ============================ 接口 URL ============================
CHECKTOKEN_URL = "https://uu.chnmuseum.cn/prod-api/api/checkToken"
ALL_CONFIG_URL = (
    "https://wapticket.chnmuseum.cn/prod-api/basesetting/HallSetting/ingore/"
    "gainAllSystemConfig?channel=wxMini&requestTaskKey=gainAllSystemConfigLogin"
    "&ticketUseType=1&p=wxmini"
)
PRICE_URL = "https://wxmini.chnmuseum.cn/prod-api/pool/ingore/getPriceByScheduleId"
GETBLOCK_URL = "https://wxmini.chnmuseum.cn/prod-api/pool/getBlock"
PLACEORDER_URL = "https://wxmini.chnmuseum.cn/prod-api/config/orderRule/placeOrder"
CHECKTIME_URL = "https://vv.video.qq.com/checktime?otype=json"

# ============================ 常量 ============================
NONCE_KEY = "AyrKJRXPO3nR5Abc"   # getBlock nonce 的 AES key (源码固定)
# Host-Ip 加密 key: 非扫码(secretkey 为空)用 AyrKJRXPO3nR5Abc, 扫码用 mjnkHYmu0jpURBTQ
HOST_IP_KEY = "AyrKJRXPO3nR5Abc"
HOST_IP_KEY_SCAN = "mjnkHYmu0jpURBTQ"
POINT_OFFSET = 10                 # 点选坐标 -10 偏移 (Verify 组件 bindingClick)
PLATFORM = 2                      # 非扫码


# ---- 登录 apiToken (JWT), 请按需替换为自己的有效 token ----
API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbl91c2VyX25hbWUiOiLmuLjlrqIgMTMwNDQ0OTEyMDYiLCJsb2dpbl9leHBpcmVkX3RpbWUiOjE3ODM0MjYwNjk5NTIsImxvZ2luX3VzZXJfaWQiOjM1NjY3MDIwLCJsb2dpbl91c2VyX2tleSI6IjM1NjY3MDIwOmUwYmJiMjk4LWY5ZjItNDAzMC05ZmUxLWQ2OTkzMzIzYzg4NCIsImxvZ2luX3VzZXJfYWNjb3VudCI6IjEzMDQ0NDkxMjA2In0.fWoKIpOh-QEzxEk3-wP90VQLIHttlHzncS8KUWpEZBs"

# ---- 下单实名信息 (与抓包一致, 可按需替换) ----
ORDER_USER_NAME = "任冬冬"
ORDER_CERT_INFO = "411326198812112424"

# ---- 用户 userId (nonce 明文需要); 留空则由 checkToken 成功后自动回填 ----
USER_ID = ""

# ---- 登录信息落盘文件 (checkToken 成功后保存 userInfo) ----
LOGIN_INFO_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "login_info.json")

# ---- 验证码图片落盘目录 (getBlock 时保存验证码图 + 提示图) ----
CAPTCHA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "captcha")



# ============================ 请求头 ============================
def build_headers(host_ip=None):
    """
    构造带当前 API_TOKEN 的请求头 (API_TOKEN 可能在运行时被更新)。
    host_ip: 已加密好的 Host-Ip (AES-128-ECB/Base64)。传 None 时保留占位值,
             下单前应由 api.build_host_ip() 计算后传入。
    """
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541721) XWEB/19027",
        "Connection": "keep-alive",
        "Accept": "application/json",
        "content-type": "application/json",
        "Host-Ip": host_ip if host_ip else "",
        "Authorization": "Bearer " + API_TOKEN,
        "charset": "utf-8",
        "Referer": "https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html",
    }


