"""
config.py — 国博下单工具的全局配置与常量
================================================================================
运行前请按需替换 API_TOKEN / 实名信息。USER_ID 会在 checkToken 成功后自动回填。
"""

import os
import json
import time
import platform

APP_ID = "wx9e2927dd595b0473"  # 小程序 AppId (Referer 中可见)
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
# 极验 GeeTest v4 人机验证 load 接口 (getBlock 之前调用)
GEETEST_LOAD_URL = "https://gcaptcha4.geetest.com/load"
# 极验分配给"国博"的固定站点 captcha_id (常量, 抓包获取, 非客户端生成)
GEETEST_CAPTCHA_ID = "435d94a5f5b138efd5dc9f9ffc7f5621"
PLACEORDER_URL = "https://wxmini.chnmuseum.cn/prod-api/config/orderRule/placeOrder"
CHECK_LEADER_INFO_URL = "https://wxmini.chnmuseum.cn/prod-api/config/orderRule/checkLeaderInfo"
GAIN_REAL_CONFIG_URL = "https://wapticket.chnmuseum.cn/prod-api/basesetting/HallSetting/ingore/gainRealConfig?channel=wxMini&p=wxmini"
FRONTPAGE_URL = "https://wxmini.chnmuseum.cn/prod-api/risk/frontPage"
CONTACTER_LIST_URL = "https://wxmini.chnmuseum.cn/prod-api/basesetting/HallSetting/gainUserContacterList?p=wxmini"
ORDER_INFO_BY_STATUS_URL = "https://wxmini.chnmuseum.cn/prod-api/order/OrderInfo/getOrderInfoByStatus?hallType=91&status=1&p=wxmini"
CHECKTIME_URL = "https://vv.video.qq.com/checktime?otype=json"

# ---- 小程序登录接口 (两段式登录) ----
GET_WXMINI_SESSION_URL = "https://uu.chnmuseum.cn/prod-api/api/getWxminiSessioinInfo"
MINIAPP_LOGIN_URL = "https://uu.chnmuseum.cn/prod-api/api/miniAppLogin"

# ---- 本地应用宝协议服务 (提供 code / encryptedData / iv) ----
LOCAL_BASE_URL = "http://127.0.0.1:8000"
LOCAL_ACCOUNTS_URL = LOCAL_BASE_URL + "/accounts"
LOCAL_HEALTH_URL = LOCAL_BASE_URL + "/health"
LOCAL_REFRESH_URL = LOCAL_BASE_URL + "/accounts/refresh"
LOCAL_GETCODE_URL = LOCAL_BASE_URL + "/wxapp/getCode"
LOCAL_GETPHONE_URL = LOCAL_BASE_URL + "/wxapp/getPhoneNumber"
# 运行时风控凭据: TDID_HOST_SIGN / TDID_PLUGIN_CODE 由这两个本地接口获取
LOCAL_GETHOSTSIGN_URL = LOCAL_BASE_URL + "/wxapp/getHostSign"
LOCAL_OPERATEWXDATA_URL = LOCAL_BASE_URL + "/wxapp/operateWxData"

# ---- 风控固定参数 (getHostSign / operateWxData 的 payload) ----
# 同盾 (TDID) 风控插件 appid, 用于 getHostSign 的 provider / plugin_id
RISK_PLUGIN_PROVIDER = "wx63af045606be281d"
# 极验 (GeeTest) 插件 appid, geetest_load 接口 X-WECHAT-HOSTSIGN 用
GEETEST_PLUGIN_PROVIDER = "wx1629d117cf9be937"
RISK_PLUGIN_INNER_VERSION = 20



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


# ============================================================================
#  查票代理池 (星空代理 xkdaili) —— 查票(只读余票)与下单(placeOrder)完全分离:
# ----------------------------------------------------------------------------
#  查票: N 个后台线程, 各持一个动态代理, 高频轮询免登录的余票接口
#        (.../ingore/gainAllSystemConfig, .../getPriceByScheduleId 无需token)。
#        代理被墙/超时/返回异常/到期(3分钟) -> 立即丢弃, 换下一个;
#        池子低于 XKD_POOL_LOW 就批量再提取(每次最多 200), 用完继续拉。
#  实际每秒查票次数 ≈ 并发线程数 ÷ 单次往返耗时(约0.3~1.5s):
#        XKD_SCAN_WORKERS=40 时通常 30~100+ 次/秒 (远超 7~8 次/秒)。
#        心跳日志会实时打印「查票频率 x.x 次/秒」, 不够快就把 XKD_SCAN_WORKERS 调大。
#  下单: 走本机 IP (账号/TDID/极验 hostSign 都绑定本机微信环境), 与查票线程互不影响。
#  ★ 以下全部是常量配置, IDE 里直接运行 main.py 即可, 不需要任何命令行参数。
# ============================================================================
XKD_APIKEY = "XKDCEA4C13A09482DE84"
XKD_SIGN = "dfc3ec85c57f60a621b1cded07033fa2"
XKD_API_URLS = [
    "http://api2.xkdaili.com/tools/XApi.ashx",
    "http://api1.xkdaili.com/tools/XApi.ashx",
]
# 每次调用提取 API 一次性拉 200 个 (接口单次上限 200)
XKD_FETCH_QTY = 200
# 池中闲置代理低于该数 -> 补货线程再拉一批; 单批最多补到 HIGH。
# 注意: 并发线程会从池里拿走代理, LOW 要留足余量, 否则查票会等代理。
XKD_POOL_LOW = 120
XKD_POOL_HIGH = 200
# 启动时先拉满 200 让查票立刻全速 (之后按水位自动续拉)
XKD_INITIAL_FILL = 200
# 查票并发线程数 = 同时在用的代理数 (每个线程持 1 个代理轮询)。
# 票是秒空的, 尽量大; 觉得快不够就把这个数往上加 (50/80/100 都行)。
XKD_SCAN_WORKERS = 40
# 每个代理两次轮询之间的随机间隔(秒): (0,0.15)=背靠背狂刷, 基本不额外等待
XKD_POLL_INTERVAL = (0.0, 0.15)
XKD_POLL_TIMEOUT = 5            # 单次余票请求超时(秒), 代理不通快速换下一个
# 心跳里提醒的「每秒查票次数」下限 (低于会提示调大 XKD_SCAN_WORKERS)
XKD_MIN_RPS = 8
XKD_EXTRACT_GAP = 1.5           # 两次调用提取 API 的最小间隔(秒), 避免 406
XKD_REFILL_EVERY = 8            # 补货线程轮询周期(秒)
XKD_PROXY_LIFETIME = 150        # 单个代理最长持有秒数(实际 3 分钟到期)
XKD_EXTRACT_LIMIT = 200         # 提取 API 单次 qty 上限

# ---- 查票目标 (直接改这里; 留空 = 自动, 与旧版一致: 日期最大+时间最大) ----
TARGET_DATE = "2026-09-10"                # 例如 "2026-09-15"
TARGET_HALL_IDS = (1,)          # 只查基本陈列
TARGET_SCHEDULE_IDS = ()        # 空 = 该展厅全部场次


# ============================================================================
#  下单热路径参数 (放票瞬间争抢用)
# ----------------------------------------------------------------------------
#  查票线程一旦发现「场次状态变化(上架/放票/第二波)」就推送一个新 ctx,
#  下单线程用预热的 Host-Ip / deviceToken 立即 getBlock+placeOrder, 命中即停。
# ============================================================================
CHECKTIME_TTL = 3                # checktime 校时结果缓存秒数 (nonce 时间戳用)
HOST_IP_TTL = 120                # Host-Ip (AES(本机出口IP)) 缓存秒数, 放票前预热
DEVICE_TOKEN_TTL = 20            # deviceToken 后台刷新周期(秒), 保持热路径零等待
HOT_MAX_ATTEMPTS = 20            # 拿到验证码后的下单尝试次数上限(防死循环)
HOT_BACKOFF = (0.3, 0.8)         # 下单被风控/满员后, 到下一次的额外间隔
# ★ 实测结论 (test_getblock_rate.py): getBlock 安全节奏约每 3~4 秒一次;
#   2 秒内连发会返回 HTTP200+code550「访问太频繁,请稍后再试」,
#   同秒连发会升级成 HTTP 491 (WAF 封锁, 冷却更久)。相关参数:
HOT_MIN_GETBLOCK_GAP = 3.5       # 两次 getBlock 的最小间隔(秒), 硬下限
HOT_EMPTY_GAP = (3.2, 3.8)       # 「550余票不足(真没票)」时的重刷间隔
HOT_FREQ_BACKOFF = (5.0, 7.0)    # 命中「访问太频繁」后退避秒数
HOT_BLOCK_BACKOFF = (12.0, 18.0) # 命中 WAF/HTTP 封锁(491/非JSON)后的退避秒数
HOT_EMPTY_CAP = 60               # 连续没票(真550)达到该次数就停手等下一波
# 下单时间窗: 默认不限制 —— 只要查票线程发现可下单场次, 就自动 getBlock->验证码->提交订单。
# 若想只在放票时段开抢可改: ORDER_WINDOW = ("16:50:00", "18:00:00")
ORDER_WINDOW = ("", "")          # 留空 = 任何时间查到有票就自动下单
LOCAL_SCAN_BACKUP = True         # 代理彻底不可用(如配额耗尽)时退回本地轮询
LOCAL_POLL_INTERVAL = (0.4, 0.9) # 本地轮询间隔


# ============================================================================
#  登录态字段 (统一由 cache/login 管理, 不再硬编码)
# ----------------------------------------------------------------------------
#  以下均为「运行时内存变量」, 默认全空:
#    - 由 config.load_login(uin) 从 cache/login/{uin}.json 加载回填;
#    - 运行中被 api/tdid 回填 (USER_ID/实名) 后可由 config.save_login() 回写。
# ============================================================================
API_TOKEN = ""          # 登录 token (miniAppLogin 返回), build_headers 使用
OPENID = ""             # 小程序 openid (getWxminiSessioinInfo 返回)
UNIONID = ""            # 小程序 unionid
USER_ID = ""            # 用户 userId (checkToken 回填, nonce 明文需要)
# 下单实名信息: 仅内存变量 (isBind 回填 / placeOrder 使用), 不落盘到 cache/login
ORDER_USER_NAME = ""
ORDER_CERT_INFO = ""


# ---- 验证码图片落盘目录 (getBlock 时保存验证码图 + 提示图) ----
CAPTCHA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "captcha")

# ---- 登录信息落盘目录 (按账号主键 openid: cache/login/{openid}.json) ----
LOGIN_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "login")

# ---- 日志落盘目录 (write_log/log 输出会同时写入 console 与当日文件) ----
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "logs")


def write_log(msg):
    """打印到控制台, 并追加写入 cache/logs/log_YYYYMMDD.txt (自动建目录)。"""
    line = "[%s] %s" % (time.strftime("%H:%M:%S"), msg)
    print(line, flush=True)
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        with open(os.path.join(LOG_DIR, "log_%s.txt" % time.strftime("%Y%m%d")),
                  "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception as e:
        print("[config] 写入日志失败: %s" % e)

# 当前活跃账号主键 openid (来自本地 accounts); 由 load_login() 设置, save_login() 使用
ACTIVE_OPENID = ""


# ============================================================================
#  登录信息 加载 / 回写 (每账号一个文件 cache/login/{openid}.json)
# ----------------------------------------------------------------------------
#  主键: 本地应用宝协议服务 accounts 的 openid (uin 可能为 null, 不能作主键)。
#  文件结构 (与 login.py 落盘一致):
#    {
#      "openid": ...,         # 账号主键 (accounts.openid), 也用于登录流程调本地接口
#      "uin": ...,            # accounts.uin (可能为 null), 仅附带信息
#      "nickname": ...,       # accounts.nickname
#      "savedAt": ..., "sessionKey": ..., "registerFlag": ...,
#      "login": { "apiToken", "openid", "unionId", "userId", "userInfo" }
#    }
# ============================================================================
def _login_file(openid):
    """账号登录信息文件路径 cache/login/{openid}.json。"""
    return os.path.join(LOGIN_DIR, "%s.json" % openid)


def login_exists(openid):
    """指定 openid 是否已有登录信息文件。"""
    return bool(openid) and os.path.exists(_login_file(openid))


def read_login_record(openid):
    """读取 cache/login/{openid}.json 完整 JSON; 不存在/失败返回 None。"""
    if not openid:
        return None
    path = _login_file(openid)
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return None


def _apply_login_to_globals(login):
    """把 login 段回填到本模块运行时内存变量。userId 从 userInfo 中提取。"""
    global API_TOKEN, OPENID, UNIONID, USER_ID
    API_TOKEN = login.get("apiToken") or ""
    OPENID = login.get("openid") or ""
    UNIONID = login.get("unionId") or ""
    USER_ID = str((login.get("userInfo") or {}).get("userId") or "")


def load_login(openid):
    """
    从 cache/login/{openid}.json 读取登录态并回填到本模块内存变量,
    同时记录 ACTIVE_OPENID。返回 True 表示成功加载 (含 apiToken)。
    """
    global ACTIVE_OPENID
    rec = read_login_record(openid)
    if not rec:
        return False
    _apply_login_to_globals(rec.get("login") or {})
    ACTIVE_OPENID = str(openid)
    return bool(API_TOKEN)


def save_login(openid=None):
    """
    把当前内存登录态回写到 cache/login/{openid}.json 的 login 段
    (合并保留文件里已有的 openid/uin/nickname/sessionKey/registerFlag/userInfo)。
    openid 缺省用 ACTIVE_OPENID。无 openid 时跳过。
    """
    key = str(openid or ACTIVE_OPENID)
    if not key:
        return
    rec = read_login_record(key) or {}
    old_login = rec.get("login") or {}
    rec["openid"] = key
    rec["savedAt"] = time.strftime("%Y-%m-%d %H:%M:%S")
    rec["login"] = {
        "apiToken": API_TOKEN or old_login.get("apiToken", ""),
        "openid": OPENID or old_login.get("openid", ""),
        "unionId": UNIONID or old_login.get("unionId", ""),
        "userInfo": old_login.get("userInfo") or {},
    }
    try:
        os.makedirs(LOGIN_DIR, exist_ok=True)
        with open(_login_file(key), "w", encoding="utf-8") as f:
            json.dump(rec, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("[config] 保存登录信息失败(%s): %s" % (key, e))



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
        "content-type": "application/json",
        "Host-Ip": host_ip if host_ip else "",
        "Authorization": "Bearer " + API_TOKEN,
        "charset": "utf-8",
        "Referer": "https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html",
    }


def build_headers_anon(host_ip=None):
    """
    无登录态请求头 (抢票数据轮询用, 接口为 .../ingore/... 免鉴权)。
    与 build_headers 完全一致, 但不带 Authorization, 避免账号 token 出现在代理出口。
    """
    return {
        "User-Agent": UA,
        "Connection": "keep-alive",
        "Accept": "application/json",
        "xweb_xhr": "1",
        "content-type": "application/json",
        "Host-Ip": host_ip if host_ip else "",
        "charset": "utf-8",
        "Referer": "https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html",
    }


