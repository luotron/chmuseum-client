"""
tdid.py — 腾讯 TDID / 无痕验证 SDK 纯 Python 实现
================================================================================
把 tools/tdid_xxtea.js + tools/tdid_client.js 的核心算法翻译为纯 Python,
无需本地 node 环境即可获取 deviceToken (placeOrder 用)。


================================================================================
一、请求概览 (browsertdidticket.m.qq.com  POST /jprx/1941)
================================================================================
请求体固定结构:
    {"req": {
        "content":   <设备指纹业务对象密文, base64>,
        "channel":   "109045",
        "token":     <风控 token>,
        "version":   "1",
        "type":      "0" | "1",      # 0=首包 1=换 msgBlock
        "timestamp": "<毫秒时间戳>"
    }}
响应体:
    {"data": {"resp": {
        "ret": 0,                    # 0=成功
        "msgBlock": "v2:...",        # ★ type=1 时即下单用的 deviceToken
        "token": "...",              # 风控 riskToken (下次请求的 req.token)
        "dfp": {"ticketID": "..."}   # 设备指纹票据 (下次 deviceObj["2"])
    }}}


================================================================================
二、加解密算法链 (与反编译 app-service.js 对齐, 模块号见括号)
================================================================================
核心加密函数 s():
    s(明文, 密钥[, 带时间戳]) = base64( XXTEA_encrypt(明文[+"_"+ms], 密钥) )

    - XXTEA   (module 6699): 标准"带长度头"变体, delta = 0x9E3779B9
              本文件 _xxtea_encrypt / _to_uint32(withLen=True) / _from_uint32
    - Base64  (module 6776): 标准表 A-Za-z0-9+/= , 本文件 _base64_encode
    - hash32  (module 737) : MurmurHash2, seed 常用 256, 本文件 hash32
    - sign    (module 8898): statisticsInfo["10"], 本文件 sign
    - 固定密钥 PB89649DE = "01303975070694866490574863106155" (module 19301)


================================================================================
三、content / token 生成流程 (生成函数 p4b2886c6, module 1445 / 20517)
================================================================================
设 uuid = 设备随机 UUID (32 位 hex, 首次生成后永久保存):

    u = s(uuid, PB89649DE)                 # content 的加密密钥 (deriveU)
    content = s( JSON.stringify(业务对象C), u )

    token 分两种:
      type="0" (首包, 本地无 riskToken):
          token = s(u, 当天0点毫秒时间戳)
          当天0点 = c - (c + 288e5) % 864e5   (c=当前毫秒, 北京时区 UTC+8)
          ★ 因 u 用"当天0点"这个已知值加密, 可离线反解出 u
      type="1" (有 riskToken):
          token = 上一次响应的 resp.token (服务端下发的风控密文, 本地无密钥不可解)

业务对象 C 关键字段:
    timestamp        = req.timestamp - 9   (真实抓包内外层差 9ms)
    deviceObj["1"]   = s(uuid, PB89649DE, 带时间戳)   设备指纹主字段
    deviceObj["2"]   = type=0 时 "" ; type=1 时 = 上次响应 dfp.ticketID
    deviceObj[其余]  = 系统/网络/授权等设备特征 (见 _DEV 表)
    statisticsInfo["10"] = sign(timestamp, deviceObj)   离线可复算
    statisticsInfo["11"] = reqId (随机 UUID)


================================================================================
四、两阶段流程 (getDeviceToken)
================================================================================
    [阶段一] 本地无 riskToken -> type=0 首包
             -> 保存 resp.token 为 riskToken, resp.dfp.ticketID 为 ticketID
    [阶段二] 用 riskToken + ticketID -> type=1
             -> 得到最终 resp.msgBlock (= placeOrder 的 deviceToken)
    riskToken / ticketID / uuid 落盘到 cache/tdid_state.json, 下次复用。


================================================================================
五、如何"手动抓取加解密 key 并解密 content/token"进行分析
================================================================================
以本文件底部 __main__ 里两段真实抓包会话 (SESSION_STAGE1 / SESSION_STAGE2) 为例。

【前提】key(=u) 完全由已知量决定: u = s(uuid, PB89649DE)。
        PB89649DE 是源码里的固定常量, 因此只要拿到 uuid 就能算出 u,
        进而解密任意 content。而 uuid 又能从 type=0 的 token 反解出来。

步骤 1) 抓一包 type="0" 的请求 (req.type=="0"), 记下 token 和 timestamp。
        例: SESSION_STAGE1
            timestamp = 1785474711109
            token     = "tsSnodWMjtl2j78PwxDd1Wnw4VD7SQCw+O5FPzwrdBJu2QL6..."

步骤 2) 用 timestamp 算"当天0点毫秒":
            dayStart = c - (c + 288e5) % 864e5
        然后用 dayStart(字符串) 作 XXTEA key, 对 base64Decode(token) 解密,
        得到的就是加解密 key —— 中间密钥 u:
            u = s_decrypt(token, str(int(dayStart)))
        (本文件提供 s_decrypt / recover_u_from_type0_token 完成这一步)

步骤 3) 用 u 反查设备 uuid (因为 u = base64(XXTEA(uuid, PB89649DE)) 且 key 已知):
            uuid = s_decrypt(u, PB89649DE)
        可回代校验: derive_u(uuid) == u 应成立 (闭环验证 key 正确)。

步骤 4) 用 u 解密同一包 (或同设备任意包, 含 type=1) 的 content, 得到业务对象明文:
            plain = s_decrypt(content, u)
        即可看到完整 deviceObj / statisticsInfo, 用于分析设备指纹字段。

步骤 5) type="1" 的 token 无法离线解 (服务端风控密钥); 但其 content 仍可用
        同一设备的 u 解密 (见 SESSION_STAGE2 —— 复用步骤 2 得到的 u 即可)。

运行 `python utils/tdid.py --demo` 即可跑通上述解密演示。


依赖: 仅标准库 (http.client / json / os / uuid / time / random / hashlib)。
"""

import json
import os
import random
import sys
import time
import uuid as _uuid
import http.client


# ============================================================================
#  Base64 (标准表, 与 JS module 6776 一致)
# ============================================================================
_B64_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
_B64_REV = {c: i for i, c in enumerate(_B64_TABLE)}


def _base64_encode(binstr):
    """输入: 每个字符 charCode 为 0..255 的二进制字符串; 输出: base64 字符串"""
    data = bytes([ord(c) & 0xFF for c in binstr])
    out = []
    i = 0
    n = len(data)
    tbl = _B64_TABLE
    while i < n:
        e = data[i]; i += 1
        if i == n:
            out.append(tbl[e >> 2]); out.append(tbl[(3 & e) << 4]); out.append("==")
            break
        m = data[i]; i += 1
        if i == n:
            out.append(tbl[e >> 2])
            out.append(tbl[(3 & e) << 4 | (240 & m) >> 4])
            out.append(tbl[(15 & m) << 2]); out.append("=")
            break
        r = data[i]; i += 1
        out.append(tbl[e >> 2])
        out.append(tbl[(3 & e) << 4 | (240 & m) >> 4])
        out.append(tbl[(15 & m) << 2 | (192 & r) >> 6])
        out.append(tbl[63 & r])
    return "".join(out)


def _base64_decode(b64):
    """base64 字符串 -> 二进制字符串 (每字符 charCode 为字节值), 用标准库确保正确"""
    import base64 as _b64
    raw = _b64.b64decode(b64)
    return "".join(chr(b) for b in raw)



# ============================================================================
#  XXTEA (module 6699) — 标准带长度头变体
# ============================================================================
_DELTA = 2654435769  # 0x9E3779B9


def _u32(x):
    return x & 0xFFFFFFFF


def _to_utf8_binary(t):
    """与 SDK 的 utf8 预处理一致: 输出每字符 charCode 为字节值的字符串"""
    is_ascii = all(ord(c) < 128 for c in t)
    if is_ascii:
        return t
    e = []
    i = 0
    length = len(t)
    while i < length:
        a = ord(t[i])
        if a < 128:
            e.append(t[i])
        elif a < 2048:
            e.append(chr(192 | a >> 6))
            e.append(chr(128 | 63 & a))
        elif 55296 <= a <= 57343 and i + 1 < length:
            o = ord(t[i + 1])
            s = 65536 + ((1023 & a) << 10 | 1023 & o)
            e.append(chr(240 | s >> 18 & 63))
            e.append(chr(128 | s >> 12 & 63))
            e.append(chr(128 | s >> 6 & 63))
            e.append(chr(128 | 63 & s))
            i += 1
        else:
            e.append(chr(224 | a >> 12))
            e.append(chr(128 | a >> 6 & 63))
            e.append(chr(128 | 63 & a))
        i += 1
    return "".join(e)


def _to_uint32(binstr, with_len):
    """二进制字符串 -> uint32 list; with_len: 末尾附加原始字节长度"""
    length = len(binstr)
    n = length >> 2
    if (3 & length) != 0:
        n += 1
    if with_len:
        out = [0] * (n + 1)
        out[n] = length
    else:
        out = [0] * n
    for a in range(length):
        out[a >> 2] |= (ord(binstr[a]) & 0xFF) << ((3 & a) << 3)
        out[a >> 2] &= 0xFFFFFFFF
    return out


def _from_uint32(v, with_len):
    """uint32 list -> 二进制字符串; with_len: 用末尾长度截断"""
    n = len(v)
    r = n << 2
    if with_len:
        m = v[n - 1]
        r -= 4
        if m < r - 3 or m > r:
            return None
        r = m
    bytes_out = []
    for i in range(n):
        val = v[i]
        bytes_out.append(chr(255 & val))
        bytes_out.append(chr(val >> 8 & 255))
        bytes_out.append(chr(val >> 16 & 255))
        bytes_out.append(chr(val >> 24 & 255))
    o = "".join(bytes_out)
    return o[:r] if with_len else o


def _fix_key(k):
    while len(k) < 4:
        k.append(0)
    return k


def _mx(sum_, y, z, p, e, k):
    return _u32(
        ((z >> 5 & 0x7FFFFFF) ^ _u32(y << 2)) + ((y >> 3 & 0x1FFFFFFF) ^ _u32(z << 4))
        ^ (_u32(sum_ ^ y) + (k[3 & p ^ e] ^ z))
    )


def _xxtea_encrypt_uint32(v, k):
    n = len(v)
    last = n - 1
    z = v[last]
    sum_ = 0
    q = int(6 + 52 / n)
    while q > 0:
        q -= 1
        sum_ = _u32(sum_ + _DELTA)
        e = sum_ >> 2 & 3
        for p in range(last):
            y = v[p + 1]
            z = v[p] = _u32(v[p] + _mx(sum_, y, z, p, e, k))
        y = v[0]
        z = v[last] = _u32(v[last] + _mx(sum_, y, z, last, e, k))
    return v


def _xxtea_decrypt_uint32(v, k):
    n = len(v)
    last = n - 1
    y = v[0]
    q = int(6 + 52 / n)
    sum_ = _u32(q * _DELTA)
    while sum_ != 0:
        e = sum_ >> 2 & 3
        for p in range(last, 0, -1):
            z = v[p - 1]
            y = v[p] = _u32(v[p] - _mx(sum_, y, z, p, e, k))
        z = v[last]
        y = v[0] = _u32(v[0] - _mx(sum_, y, z, 0, e, k))
        sum_ = _u32(sum_ - _DELTA)
    return v


def _xxtea_encrypt(data, key):
    """encrypt(明文字符串, 密钥字符串) -> 二进制字符串"""
    if data is None or len(data) == 0:
        return data
    data = _to_utf8_binary(data)
    key = _to_utf8_binary(key)
    return _from_uint32(
        _xxtea_encrypt_uint32(_to_uint32(data, True), _fix_key(_to_uint32(key, False))),
        False,
    )


def _xxtea_decrypt(data, key):
    """decrypt(二进制密文字符串, 密钥字符串) -> UTF-8 明文字符串"""
    if data is None or len(data) == 0:
        return data
    key = _to_utf8_binary(key)
    bin_ = _from_uint32(
        _xxtea_decrypt_uint32(_to_uint32(data, False), _fix_key(_to_uint32(key, False))),
        True,
    )
    if bin_ is None:
        return None
    raw = bytes([ord(c) & 0xFF for c in bin_])
    return raw.decode("utf-8", "replace")


# ============================================================================
#  MurmurHash2 (module 737) — hash32
# ============================================================================
def _mul32(t, e):
    t = t & 0xFFFFFFFF
    e = e & 0xFFFFFFFF
    r = (65535 & t) * e + (((t >> 16) * e & 65535) << 16)
    r = r & 0xFFFFFFFF
    if r >= 0x80000000:
        r -= 0x100000000
    return r


def _rd32(t, e):
    return ord(t[e]) + (ord(t[e + 1]) << 8) + (ord(t[e + 2]) << 16) + (ord(t[e + 3]) << 24)


def _rd16(t, e):
    return ord(t[e]) + (ord(t[e + 1]) << 8)


def hash32(t, seed, unsigned=True):
    o = 1540483477
    s = (seed ^ len(t))
    if s >= 0x80000000:
        s -= 0x100000000
    c = len(t)
    u = 0
    while c >= 4:
        d = _rd32(t, u)
        d = _mul32(d, o)
        d ^= (d & 0xFFFFFFFF) >> 24
        d = _mul32(d, o)
        s = _mul32(s, o)
        s ^= d
        s = s & 0xFFFFFFFF
        if s >= 0x80000000:
            s -= 0x100000000
        u += 4
        c -= 4
    if c == 3:
        s ^= _rd16(t, u)
        s ^= ord(t[u + 2]) << 16
        s = _mul32(s, o)
    elif c == 2:
        s ^= _rd16(t, u)
        s = _mul32(s, o)
    elif c == 1:
        s ^= ord(t[u])
        s = _mul32(s, o)
    s ^= (s & 0xFFFFFFFF) >> 13
    s = _mul32(s, o)
    s ^= (s & 0xFFFFFFFF) >> 15
    s = s & 0xFFFFFFFF
    if unsigned:
        return s
    if s >= 0x80000000:
        s -= 0x100000000
    return s


# ============================================================================
#  sign (module 8898) — statisticsInfo[10]
# ============================================================================
def _lcg(t):
    return 32767 & (214013 * (t >> 16) + (214013 * (65535 & t) + 2531011 >> 16))


def _sign_utf8(t):
    b = t.encode("utf-8")
    return "".join(chr(x) for x in b)


def _to_hex(n):
    """等价 JS Number.prototype.toString(16): 负数带 '-' 前缀"""
    if n < 0:
        return "-" + format(-n, "x")
    return format(n, "x")


def sign(timestamp, device_obj):
    """
    sign(timestamp, deviceObj) == statisticsInfo[10]
      n = [deviceObj 所有 value]
      d = timestamp; f = int(len/4)+1; 循环 f 次: d = lcg(d); n.push(hex(d))
      _ = n.join(""); h = utf8(_); return "01" + hash32(h, 256).toString(16)
    """
    n = list(device_obj.values())
    u = len(device_obj)
    d = timestamp
    f = int(u / 4) + 1
    for _ in range(f):
        d = _lcg(d)
        n.append(_to_hex(d))
    joined = "".join(str(x) for x in n)
    h = _sign_utf8(joined)
    return "01" + format(hash32(h, 256), "x")


# ============================================================================
#  高层封装 s() / deriveU()   (加密 + 解密, 供抓包分析用)
# ============================================================================
PB89649DE = "01303975070694866490574863106155"


def s_encrypt(plain, key, with_ts=False, ts_override=None):
    """
    s(明文, 密钥[, withTs]) == p2baeeec4
      withTs=True 时先把明文改为 明文+"_"+ms 再加密。
    """
    if plain is None or len(str(plain)) == 0:
        return plain
    t = str(plain)
    if with_ts:
        ts = ts_override if ts_override is not None else int(time.time() * 1000)
        t = t + "_" + str(ts)
    return _base64_encode(_xxtea_encrypt(t, str(key)))


def s_decrypt(b64, key):
    """
    s() 的逆运算: base64Decode -> XXTEA_decrypt。
    若原文带 "_时间戳" 尾巴, 返回值即含 "明文_时间戳"。
    """
    if not b64:
        return b64
    return _xxtea_decrypt(_base64_decode(b64), str(key))


p2baeeec4 = s_encrypt


def derive_u(uuid_str):
    """u = s(uuid, PB89649DE)  —— content 的加密密钥"""
    return s_encrypt(uuid_str, PB89649DE)


def recover_uuid_from_u(u):
    """已知 u, 反解设备 uuid (因 PB89649DE 已知): uuid = XXTEA_decrypt(base64Decode(u), PB89649DE)"""
    return s_decrypt(u, PB89649DE)


def recover_u_from_type0_token(token_b64, timestamp_ms):
    """
    type="0" 首包: token = s(u, 当天0点毫秒)。已知 token + 请求 timestamp,
    反解出加解密 key —— 中间密钥 u。返回 (u, dayStartKey)。
    """
    c = int(timestamp_ms)
    day_start = int(c - (c + 288e5) % 864e5)  # 当天0点 (UTC+8)
    u = s_decrypt(token_b64, str(day_start))
    return u, str(day_start)


def decrypt_content_by_u(content_b64, u):
    """已知中间密钥 u, 直接解密 content -> 设备指纹业务对象明文"""
    return s_decrypt(content_b64, u)


def decrypt_content_by_uuid(content_b64, uuid_str):
    """已知设备 uuid, 解密 content (先 deriveU 再解)"""
    return s_decrypt(content_b64, derive_u(uuid_str))


# ============================================================================
#  TDID 客户端 (两阶段) — 与 tdid_client.js 对齐
# ============================================================================
_CHANNEL = "109045"
_API_HOST = "browsertdidticket.m.qq.com"
_API_PATH = "/jprx/1941"

# 状态文件统一落盘到 tools/cache/tdid_state.json (与 login_info.json 同目录)
_CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "cache"))
_STATE_FILE = os.path.join(_CACHE_DIR, "tdid_state.json")
# 旧版本状态文件位置 (tools/tdid_state.json); 首次加载时自动迁移到 cache 目录
_LEGACY_STATE_FILE = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tdid_state.json")
)

_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
       "Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI "
       "MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) "
       "UnifiedPCWindowsWechat(0xf2541721) XWEB/19027")

# 设备指纹字段 (与 JS DEV 表一致)
_DEV = {
    "4": "windows", "43": "wifi",
    "101": "osPfN4seDJhyEgrFmC_DME8Bq3bc",
    "103": "3.17.0",
    "104": "microsoft", "105": "microsoft",
    "106": "780*414", "107": "Windows Unknown x64", "108": "zh_CN",
    "109": "", "110": "", "111": "4.1.11.55",
    "112": "", "113": "", "114": "", "115": "",
    "116": "20", "117": "-1", "118": "1:1:1:1:1:0:1:1",
    "119": "", "121": "", "122": "", "123": "", "124": "false",
    "126": "15", "127": "20260715", "128": "198.18.0.1", "129": "release",
    "130": "4ecfb0c75f2767522744b9ddd683989f765a189ee9391b8338ba0f3dcec7b89e",
}
_FT_OFFSCREEN_CANVAS = ""


def _load_state():
    """读取状态文件; 若 cache 里没有但旧位置有, 自动迁移过来。"""
    # 优先读 cache 目录
    for path in (_STATE_FILE, _LEGACY_STATE_FILE):
        try:
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    s = json.load(f)
                state = {
                    "uuid": s.get("uuid") or "",
                    "riskToken": s.get("riskToken") or "",
                    "ticketID": s.get("ticketID") or "",
                }
                # 命中旧位置 -> 迁移到 cache 目录
                if path == _LEGACY_STATE_FILE:
                    _save_state(state)
                    try:
                        os.remove(_LEGACY_STATE_FILE)
                    except Exception:
                        pass
                return state
        except Exception:
            continue
    return {"uuid": "", "riskToken": "", "ticketID": ""}


def _save_state(state):
    try:
        os.makedirs(_CACHE_DIR, exist_ok=True)
        with open(_STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def _generate_uuid():
    return _uuid.uuid4().hex


def _generate_req_id():
    return str(_uuid.uuid4())


def _day_start_ms(c):
    return c - (c + 288e5) % 864e5


def _make_device1(uuid_str, inner_ts):
    return p2baeeec4(uuid_str, PB89649DE, True, inner_ts)


def _make_device1006(canvas_plain, salt, inner_ts):
    if not canvas_plain:
        return ""
    r = hash32(canvas_plain, 256)
    key = hash32((salt or "") + "1006", 256)
    return p2baeeec4(str(r), str(key), True, inner_ts)


def _build_business_obj(uuid_str, timestamp, ticket_id, typ):
    inner_ts = timestamp - 9
    device1 = _make_device1(uuid_str, inner_ts + 4)
    flags = 2 if typ == 0 else 0

    if typ == 0:
        device_obj = {
            "1": device1, "2": ticket_id or "",
            "4": _DEV["4"], "43": _DEV["43"], "101": _DEV["101"],
            "103": _DEV["103"], "104": _DEV["104"], "105": _DEV["105"],
            "106": _DEV["106"], "107": _DEV["107"], "108": _DEV["108"],
            "109": _DEV["109"], "110": _DEV["110"], "111": _DEV["111"],
            "112": _DEV["112"], "113": _DEV["113"], "114": _DEV["114"], "115": _DEV["115"],
            "116": _DEV["116"], "117": _DEV["117"], "118": _DEV["118"],
            "119": _DEV["119"],
            "121": _DEV["121"], "122": _DEV["122"], "123": _DEV["123"], "124": _DEV["124"],
            "126": _DEV["126"], "127": _DEV["127"], "128": _DEV["128"],
            "129": _DEV["129"], "130": _DEV["130"],
            "1000": "", "1001": "", "1002": "", "1003": "",
            "1006": _make_device1006(_FT_OFFSCREEN_CANVAS, "", inner_ts + 5),
            "1007": "",
            "4001": "", "4002": "", "4003": "", "4004": "",
        }
    else:
        device_obj = {
            "1": device1, "2": ticket_id or "",
            "4": _DEV["4"], "43": _DEV["43"], "101": _DEV["101"],
            "104": _DEV["104"], "105": _DEV["105"], "107": _DEV["107"],
            "119": _DEV["119"],
            "121": _DEV["121"], "122": _DEV["122"], "123": _DEV["123"], "124": _DEV["124"],
            "127": _DEV["127"], "128": _DEV["128"], "129": _DEV["129"], "130": _DEV["130"],
            "4004": "",
        }

    obj = {
        "timestamp": inner_ts,
        "sdkInfo": {
            "buildno": 200200, "sdkver": "2.2.0", "lc": "2292EB32FCD43530",
            "channel": _CHANNEL, "platform": 5,
        },
        "deviceObj": device_obj,
        "productInfo": {"clientVer": "", "requestPackageName": ""},
        "clientInfo": {
            "requestSeq": "", "metaData": "", "channel": "", "buildNo": 0,
            "version": "", "lc": "", "extraInfo": "",
            "wx_appid": "wx9e2927dd595b0473", "appid": "", "type": 0,
        },
        "statisticsInfo": {"10": "", "11": _generate_req_id()},
        "extraIds": {"1": ""},
        "flags": flags,
        "requireType": 0,
    }
    obj["statisticsInfo"]["10"] = sign(obj["timestamp"], obj["deviceObj"])
    return obj


def _build_request_body(uuid_str, current_risk_token, ticket_id):
    c = int(time.time() * 1000)
    u = derive_u(uuid_str)
    token = current_risk_token
    typ = 1
    if not token:
        token = s_encrypt(u, str(int(_day_start_ms(c))))
        typ = 0
    biz_obj = _build_business_obj(uuid_str, c, ticket_id, typ)
    content = s_encrypt(json.dumps(biz_obj, separators=(",", ":"), ensure_ascii=False), u)
    body = {
        "req": {
            "content": content, "channel": _CHANNEL, "token": token,
            "version": "1", "type": str(typ), "timestamp": str(c),
        }
    }
    return body


def _build_host_sign():
    import hashlib
    noncestr = os.urandom(16).hex()
    timestamp = int(time.time())
    signature = hashlib.sha1((noncestr + str(timestamp)).encode("utf-8")).hexdigest()
    return json.dumps({"noncestr": noncestr, "timestamp": timestamp, "signature": signature})


def _post_jprx(body, host_sign):
    payload = json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "X-WECHAT-HOSTSIGN": host_sign or _build_host_sign(),
        "xweb_xhr": "1",
        "Accept": "*/*",
        "User-Agent": _UA,
        "Referer": "https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html",
        "Accept-Language": "zh-CN,zh;q=0.9",
    }
    conn = http.client.HTTPSConnection(_API_HOST, timeout=30)
    try:
        conn.request("POST", _API_PATH, body=payload, headers=headers)
        resp = conn.getresponse()
        raw = resp.read().decode("utf-8", "replace")
        status = resp.status
    finally:
        conn.close()
    try:
        j = json.loads(raw)
    except Exception:
        j = None
    return {"status": status, "json": j, "raw": raw}


def _extract_resp(res):
    try:
        return res["json"]["data"]["resp"]
    except Exception:
        return None


def get_device_token():
    """
    纯 Python 两阶段获取 deviceToken (placeOrder 的 deviceToken)。
    返回 dict: {ok, deviceToken, ret, ...} 与 JS 版一致。
    """
    state = _load_state()
    if not state["uuid"]:
        state["uuid"] = _generate_uuid()
        _save_state(state)
    uuid_str = state["uuid"]
    host_sign = _build_host_sign()

    # 阶段一: 本地无 riskToken 时首包补全
    if not state["riskToken"]:
        r1 = _build_request_body(uuid_str, "", state["ticketID"])
        try:
            res1 = _post_jprx(r1, host_sign)
        except Exception as e:
            return {"ok": False, "error": "stage1 network: %s" % e}
        resp1 = _extract_resp(res1)
        if not resp1:
            return {"ok": False, "error": "stage1 no resp", "raw": res1.get("raw")}
        if resp1.get("token"):
            state["riskToken"] = resp1["token"]
        if resp1.get("dfp") and resp1["dfp"].get("ticketID"):
            state["ticketID"] = resp1["dfp"]["ticketID"]
        _save_state(state)
        if not state["riskToken"]:
            return {"ok": False, "ret": resp1.get("ret"),
                    "error": "stage1 rejected (no riskToken)"}

    # 阶段二: type=1 换取最终 msgBlock
    r2 = _build_request_body(uuid_str, state["riskToken"], state["ticketID"])
    try:
        res2 = _post_jprx(r2, host_sign)
    except Exception as e:
        return {"ok": False, "error": "stage2 network: %s" % e}
    resp2 = _extract_resp(res2)
    if not resp2:
        return {"ok": False, "error": "stage2 no resp", "raw": res2.get("raw")}

    updated = False
    if resp2.get("token") and resp2["token"] != state["riskToken"]:
        state["riskToken"] = resp2["token"]; updated = True
    if resp2.get("dfp") and resp2["dfp"].get("ticketID") and resp2["dfp"]["ticketID"] != state["ticketID"]:
        state["ticketID"] = resp2["dfp"]["ticketID"]; updated = True
    if updated:
        _save_state(state)

    if resp2.get("ret") == 0 and resp2.get("msgBlock"):
        return {"ok": True, "deviceToken": resp2["msgBlock"], "ret": 0,
                "overtime": resp2.get("overtime")}
    return {"ok": False, "ret": resp2.get("ret"),
            "error": "stage2 no msgBlock", "raw": res2.get("raw")}


# ============================================================================
#  抓包分析演示 (python utils/tdid.py --demo)
#  用两段真实抓包会话演示: 反解 key(u) -> 反查 uuid -> 解密 content
# ============================================================================
# 阶段一 (type=0): 从 token 反解出 u/uuid, 再解 content
SESSION_STAGE1 = {
    "type": "0",
    "timestamp": "1785474711109",
    "token": "tsSnodWMjtl2j78PwxDd1Wnw4VD7SQCw+O5FPzwrdBJu2QL6BoEnenIeuYvri5J6iC404A==",
    "content": (
        "NGSYZkOFeTa+DqLW1F9DxxHfw1fqBkjT54pYztIANToQiPx0qQyM7eJyjdHmM4k06FYrO0RTsX"
        "NIS9e1n+BWa4Lt7gq4Qu8E3j0fj+WgEOw8h3sycMDN5z6mwUbwx+00i00+DC+IFdIWLa+c7POn"
        "py1zIUYQ818vVaXzGt4w8fA9ybboLA6Sf5/91X3eqHuzMNU5WxTbhFO1dIiX1EegXUmxpGKh2A"
        "3ZDpRL6+EacyITEcL1RMxmHDXs2tIu492EL5zaACkUH8lYoLrj1ZROrTZugXga53zc8Il04MJ3"
        "9xvfg9Ss+nUUPXdyKf4kRu22x6f8uLBrHF/+hX6hP7xB+yvaWcHtodC3uH4gp80Xe5GdLDeuOX"
        "geVCCBnd2HUqTMrlM9dfcPtFr7XOTjGXg8VGfH1eV0esUbA8r/SZt2D0reJhEFUKd6VUVgzAYX"
        "ETbaPIjOqMgBiEjDZgbX5vdd3DEJgBf6jwx1gaoHM9SdLLOwv/hfW1yUiGo7tj2B6aZgbzCv8H"
        "iJxZinsZUcXlRWd5Eftj8SvORFRCBKOgy9kJsbIbPu4/yjtiYvMw/cKdDIsxFi6eMAt3A5cRYD"
        "Mc5HpN3CpIRVwMJtdbOHRG76Q3IvN+LfSMRRpS+RBojtcR6ojLLhq0jA+nNLdvel3dbABDUqVZ"
        "5AWY87oqdrINwQ3lxLUx6qe9B9+/wf8ZuktkW9nVBBh0n5QRRs2dRHsDKa7Est8eGzDhidX6P1"
        "ybPmWfiaGJkWsmVuzAbV9Qhxb4iN8jiaO7atACAx5sKHCGZqzPcLZu/J/1VwmiTId4Jq0AYx2c"
        "xkyilDqJk8804tclWyEL5gcc+MJ3oRfTHmU6MrFSDpCLt1ee/Jl7IgQcl0BvdRnOgWRJa4LnHH"
        "m0SoqvL7tcokuJo8w1rJEpBCiIvdw7vKtlggz67lMwSZMhsq2WDTMwOYhWzmdGaeXYIvrccODC"
        "/hhfPIXGZ2/yP5GeyfDVeCh7n/aqr39vcPKm6dJl2AiT+TEdEfIZI90JOZ5Kx8yOixXPrf44Rd"
        "cgoHKuvKvQGc2jQvCHz4m4b7HfTcnvSU2FIQpA2UIhhfBjITr5gvblmt5sT6M/b8OXIaRoj1Eg"
        "IANSxDNZ/LqRxM+NkPcLtW1F/aznHG+iIyEFuT7nSahvIdCAj6QoFMHEqGUoaHCRbRnT0TGsbV"
        "ZwqKpezE9/I2OhmgI7K+LBo8picZXwemtTcVG1lkLaddjDuUmeFtA83/QeWXR2mqyHOGqRyZia"
        "x/Q0zNNjP5ufvrknPqWRmNtr3LKG6NKQvb1jq3ng4D+ojCTFaCEEhtYy3SReUeC1mFbthwjfrl"
        "3f11E6lCwzSAU7VAXMOsiDOrk5qz6djW8oOoX0EZ4kS3qJqPgBTnW3m1B9abwq+NRYsbFU5FzB"
        "ma2soviZHixXY4WOmYb0nrcfDblap/3XYyV9sGz3MteZ/B8gn+r6PTYHDWWBc3Ik7gnGvzuMW9"
        "k2eWq5HR0wxcEDHF4vDCZpbl6eR4VCcv3VCADNqvF1NjPMkdy2NTMhK/ts5gdjy4McDuYZztYl"
        "Du7TrMcpBDS2g3kHKiRulBLxoGVnitHKHqWQ=="
    ),
}

# 阶段二 (type=1): token 无法离线解, 但 content 可用同设备 u 解密
SESSION_STAGE2 = {
    "type": "1",
    "timestamp": "1785474729883",
    "token": "hnV5ey3Dl0D1JlJYZ/P2hpekpoNxvk4cGr6GqMz3dpRrPMOC+JgJGqgkGJWXxlOHm41D6w==",
    "content": (
        "9YMZN3EkiakuGc3ibt+gyFvNB3/NODoL39LT1ggFMnPLSEVIwHZEA4v+DIrt72T6IvT1k2eWkD"
        "p38UO8QrdOsmq03UUVx+/EB6H5WBcUBpmCESid7h5oxxpf19FVq6t9GANwm9XsICF5sTnZE6Qw"
        "BEoOQU5uunvxZK1egIar2pw8Gb0eWHogjY/+zcOsbbnsJ3/xVaTTUiTZoYwZSwCGL2XrNvRfDB"
        "NiUSpjpkjy82UvWW0V1t5GUvJPLeL1sW02rbSZq708vYItx1ioNZ1b9tqEEXl5g4f6hi/QZZPO"
        "fuRtXwUCE7Bhy4m/adXh3C8L4TJDNJ/OIACWjM8FtSY93Xn4yTUhrdb7dAHkCgdCnoYhQDFHFf"
        "rs3CNy5v4iSXxKlCIwufsq7t6kc60cqi920LMXqb7w/N0JKXPyAgG8tnSWSJ7dc9puq33M4Mbb"
        "EmYqZg1yUj8/zZzuF7gy86/vJUUCXwsP4F1JGjQM0IsOF5cX9027tgUch4a6qqvrWYd4KOB+2Q"
        "CEbgUHV1aEztKRu9vu/DPtAyX/cB8vOe4y55yMnrtk4S3I5r6ljWPUT5gUJb7ybc4sjbkhy+54"
        "qbiDfDq67wZKhqxteq/jSH9S7imUeCxejkzmugVifCM35dFePYZ2TVQooM8Ket8I2o0hlJtNZW"
        "oiiFfRvnxwmhMNeyN7/q1yXZMIVSsLn06H1kwt7kJ0i6BH6Q1vuMmK8oEwUhXZRTxk8n2gYAh/"
        "pp0oFUmlXUZSK8hB1+7Ez/aVZRTMWvqeMbIReK0Y+43nO5ZNgKMC9Yohkub8zom5uhpTLUyh/T"
        "A+VhHoZ2EgFB872J+rO+g6oIgxU7d37i9ciocj/bpW+uuSyKBFix/APrmsAPUofqPtgB/w3VgX"
        "INgRlaSOv5iRuCXerVRj68+L2l7jnQrosUgCLhRReCXBIEJNt17qd45a4fakK9LO9SPN/wgiIj"
        "mcrlL4YHN4b/oke0uMVRX5dkpRvTR9TYqo+sn8URw8UAnxowwBSt7/XzKpP6YuzLgI33cXHM2R"
        "wnwpigJVsm+SpGMQdCpwTq+x7tCIJRIJNnzE8A8RKTBZWk3iaXglWkPRrKnGWO19F2K/v2UajM"
        "HdV6Gb9dW9vuQaJeNJBu1pR9dlQPUFtiylVMRPAr/87xgw6rS6WIz0vwvyCzdSmxmB52YXzKiX"
        "xibKs/2/MsQbGprkDbl8juFFkVYRDOX5MHDREhnHLXBbDEh5jrJDL4WXjfXcE1iXhMP6lkTQDQ"
        "Gker2Y6JRNOwUOgf8iZA/2VDjlmI8Fn7phkT82Ty8zAw=="
    ),
}


def _demo():
    print("=== TDID content/token 抓包解密分析演示 ===\n")

    s1 = SESSION_STAGE1
    print("[阶段一 type=0] timestamp =", s1["timestamp"])
    # 步骤2: 从 token 反解 key(u)
    u, day_start = recover_u_from_type0_token(s1["token"], s1["timestamp"])
    print("  当天0点毫秒(XXTEA key) =", day_start)
    print("  ★ 反解出加解密 key u =", u)
    # 步骤3: 从 u 反查设备 uuid, 并闭环校验
    uuid = recover_uuid_from_u(u)
    print("  ★ u 的明文(设备 UUID) =", repr(uuid))
    print("  校验 derive_u(uuid)==u ?", "OK" if derive_u(uuid) == u else "FAIL")
    # 步骤4: 用 u 解密 content
    plain1 = decrypt_content_by_u(s1["content"], u)
    print("  content 明文(前 300 字) =\n   ", (plain1 or "")[:300], "...\n")

    s2 = SESSION_STAGE2
    print("[阶段二 type=1] timestamp =", s2["timestamp"])
    print("  token 为服务端风控密文, 无法离线解密 (需服务端密钥)")
    # 步骤5: type=1 的 content 仍可用同一设备的 u 解密
    plain2 = decrypt_content_by_u(s2["content"], u)
    print("  用同设备 u 解密 content 明文(前 300 字) =\n   ", (plain2 or "")[:300], "...")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        _demo()
    else:
        r = get_device_token()
        print(json.dumps(r, ensure_ascii=False))
