"""
tdid.py — 腾讯 TDID / 无痕验证 SDK 纯 Python 实现
================================================================================

算法链、content/token 生成流程, 以及"如何手动抓取密钥并解密 content/token"
的完整文档见同目录下的 tdid.md。

速查 (详见 tdid.md):
    - 核心加密 s_encrypt(明文, 密钥) = base64_encode(xxtea_encrypt(明文, 密钥))
      逆运算   s_decrypt(密文b64, 密钥) = xxtea_decrypt(base64_decode(密文), 密钥)
    - content_key = derive_u(uuid) = s_encrypt(uuid, PB89649DE)
    - content     = s_encrypt(业务对象JSON, content_key)
    - token(type=0) = s_encrypt(content_key, str(当天0点毫秒))   ← 可离线反解
    - token(type=1) = 上次响应的 resp.token (服务端风控密文, 不可离线解)

依赖: 仅标准库 (http.client / json / os / uuid / time / hashlib)。
"""

import json
import os
import sys
import time
import threading
import uuid as _uuid
import http.client
import cycronet
import secrets


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config as cfg


def _log(msg):
    """惰性获取 main.log, 避免顶层 import main 造成循环导入; 取不到则退回 print。"""
    try:
        import main as _main
        if hasattr(_main, "log"):
            _main.log(msg)
            return
    except Exception:
        pass
    print(msg)


def _print_set_cookie(resp, tag=""):
    """若响应头含 set-cookie 则打印出来 (cycronet resp.headers 为小写键 dict)。"""
    try:
        headers = getattr(resp, "headers", None) or {}
        sc = None
        for k, v in headers.items():
            if str(k).lower() == "set-cookie":
                sc = v
                break
        if sc:
            _log("%sSet-Cookie: %s" % (("[%s] " % tag) if tag else "", sc))
    except Exception as e:
        _log("打印 Set-Cookie 异常: %s" % e)

# ============================================================================
#  Base64 (标准表 A-Za-z0-9+/=)
# ============================================================================
_B64_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"


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
#  XXTEA — 标准带长度头变体 (delta = 0x9E3779B9)
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


def xxtea_encrypt(data, key):
    """XXTEA 加密: (明文字符串, 密钥字符串) -> 二进制密文字符串"""
    if data is None or len(data) == 0:
        return data
    data = _to_utf8_binary(data)
    key = _to_utf8_binary(key)
    return _from_uint32(
        _xxtea_encrypt_uint32(_to_uint32(data, True), _fix_key(_to_uint32(key, False))),
        False,
    )


def xxtea_decrypt(data, key):
    """XXTEA 解密: (二进制密文字符串, 密钥字符串) -> UTF-8 明文字符串"""
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


# 兼容旧内部名
_xxtea_encrypt = xxtea_encrypt
_xxtea_decrypt = xxtea_decrypt


# ============================================================================
#  MurmurHash2 (32 位) — hash32
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
#  sign — 生成 statisticsInfo["10"] (LCG + MurmurHash2)
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
    生成 statisticsInfo["10"]:
      values = [deviceObj 所有 value]
      seed = timestamp; 循环 (len//4 + 1) 次: seed = lcg(seed); values.append(hex(seed))
      joined = "".join(values); return "01" + hash32(utf8(joined), 256).toString(16)
    """
    values = list(device_obj.values())
    field_count = len(device_obj)
    seed = timestamp
    rounds = int(field_count / 4) + 1
    for _ in range(rounds):
        seed = _lcg(seed)
        values.append(_to_hex(seed))
    joined = "".join(str(x) for x in values)
    return "01" + format(hash32(_sign_utf8(joined), 256), "x")


# ============================================================================
#  核心加密 s_encrypt / 解密 s_decrypt / 密钥派生 derive_u
#  (对应反编译里的 s() / deriveU(), 详见 tdid.md)
# ============================================================================
PB89649DE = "01303975070694866490574863106155"   # 源码固定密钥常量


def s_encrypt(plaintext, key, with_ts=False, ts_override=None):
    """
    核心加密: s_encrypt(明文, 密钥) = base64_encode( xxtea_encrypt(明文, 密钥) )
      with_ts=True 时先把明文改成 "明文_毫秒时间戳" 再加密 (防重放)。
    """
    if plaintext is None or len(str(plaintext)) == 0:
        return plaintext
    text = str(plaintext)
    if with_ts:
        ts = ts_override if ts_override is not None else int(time.time() * 1000)
        text = text + "_" + str(ts)
    return _base64_encode(xxtea_encrypt(text, str(key)))


def s_decrypt(ciphertext_b64, key):
    """
    核心解密 (s_encrypt 的逆): xxtea_decrypt( base64_decode(密文), 密钥 )。
    若原文带 "_时间戳" 尾巴, 返回值即含 "明文_时间戳"。
    """
    if not ciphertext_b64:
        return ciphertext_b64
    return xxtea_decrypt(_base64_decode(ciphertext_b64), str(key))


def derive_u(uuid_str):
    """派生 content 的加密密钥 content_key = s_encrypt(uuid, PB89649DE)"""
    return s_encrypt(uuid_str, PB89649DE)


def recover_uuid_from_u(content_key):
    """已知 content_key, 反解设备 uuid = s_decrypt(content_key, PB89649DE)"""
    return s_decrypt(content_key, PB89649DE)


def recover_u_from_type0_token(token_b64, timestamp_ms):
    """
    type="0" 首包: token = s_encrypt(content_key, str(当天0点毫秒))。
    已知 token + 请求 timestamp, 反解出 content_key。返回 (content_key, 当天0点毫秒字符串)。
    """
    c = int(timestamp_ms)
    day_start = int(c - (c + 288e5) % 864e5)  # 当天0点 (UTC+8)
    content_key = s_decrypt(token_b64, str(day_start))
    return content_key, str(day_start)


def decrypt_content_by_u(content_b64, content_key):
    """已知 content_key, 直接解密 content -> 设备指纹业务对象明文"""
    return s_decrypt(content_b64, content_key)


def decrypt_content_by_uuid(content_b64, uuid_str):
    """已知设备 uuid, 解密 content (先 derive_u 再解)"""
    return s_decrypt(content_b64, derive_u(uuid_str))

def generate_mock_plugin_code() -> str:
    """
    生成一个长度为 64 的小写十六进制字符串，
    格式与 wx.pluginLogin 返回的 code 完全一致。
    """
    # secrets.token_hex(nbytes) 会生成 nbytes 个字节的十六进制文本。
    # 32 字节 * 2 个字符/字节 = 64 个字符长度的字符串。
    return secrets.token_hex(32)

# 兼容旧调用名
p2baeeec4 = s_encrypt


# ============================================================================
#  TDID 客户端 (两阶段)
# ============================================================================
_CHANNEL = "109045"
_API_PATH = "https://browsertdidticket.m.qq.com/jprx/1941"
_EVENT_REPORT_PATH = "https://gatherer.m.qq.com/event/report"

# 状态文件统一落盘到 cache/tdid_state.json (与 login_info.json 同目录)
_CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "cache"))
_STATE_FILE = os.path.join(_CACHE_DIR, "tdid_state.json")
# 旧版本状态文件位置 (tdid_state.json); 首次加载时自动迁移到 cache 目录
_LEGACY_STATE_FILE = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tdid_state.json")
)

# 设备指纹字段 (与 JS DEV 表一致)
FT_OFFSCREEN_CANVAS = ""
X_WECHAT_HOSTSIGN = '{"noncestr":"4ae5161e64efcbdda224b07ca23663a0","timestamp":1785747847,"signature":"26c824abcb77bf02d72b1400e0e14de745d51e90"}'
PLUGIN_CODE = "67eca4cd50a21b0315316454607e470f6c249c81d073a60ef8d63f2c30c2e6d5"


def _build_dev():
    """
    根据 config.ENV 选择 linux / windows 两套设备指纹,
    并动态填充 101(OPENID) 与 130(pluginCode)。
    """
    dev = cfg.get_device_profile()
    dev["101"] = cfg.OPENID
    # windows 环境保留其内置 130 (真实 pluginCode); linux 环境用抓包值或随机 mock
    if not dev.get("130"):
        dev["130"] = PLUGIN_CODE or generate_mock_plugin_code()
    print(dev)
    return dev


# 当前运行环境 (linux / windows), 由 config.ENV 统一控制
ENV = cfg.ENV
_DEV = _build_dev()


def _load_state():
    """读取状态文件; 若 cache 里没有但旧位置有, 自动迁移过来。"""
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
    return s_encrypt(uuid_str, PB89649DE, True, inner_ts)


def _make_device1006(canvas_plain, salt, inner_ts):
    if not canvas_plain:
        return ""
    r = hash32(canvas_plain, 256)
    key = hash32((salt or "") + "1006", 256)
    return s_encrypt(str(r), str(key), True, inner_ts)


def _build_business_obj(uuid_str, timestamp, ticket_id, typ):
    """
    构造设备指纹业务对象 (SDK 中的 C 对象)。
    typ=0 首包包含完整设备特征; typ=1 只保留关键字段。
    """
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
            "1006": _make_device1006(FT_OFFSCREEN_CANVAS, "", inner_ts + 5),
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
    content_key = derive_u(uuid_str)
    token = current_risk_token
    typ = 1
    if not token:
        token = s_encrypt(content_key, str(int(_day_start_ms(c))))
        typ = 0
    biz_obj = _build_business_obj(uuid_str, c, ticket_id, typ)
    content = s_encrypt(json.dumps(biz_obj, separators=(",", ":"), ensure_ascii=False), content_key)
    body = {
        "req": {
            "content": content, "channel": _CHANNEL, "token": token,
            "version": "1", "type": str(typ), "timestamp": str(c),
        }
    }
    return body, biz_obj


def _build_host_sign(noncestr=None, timestamp=None):
    """
    还原微信小程序 "插件请求签名" X-WECHAT-HOSTSIGN (见官方文档)。

    请求头形如:
        X-WECHAT-HOSTSIGN: {"noncestr":"NONCESTR","timestamp":"TIMESTAMP","signature":"SIGNATURE"}

    其中:
        - NONCESTR : 随机字符串
        - TIMESTAMP: 生成 NONCESTR 与 SIGNATURE 的 UNIX 秒级时间戳
        - APPID    : 所在小程序的 AppId (cfg.PLUGIN_APPID)
        - TOKEN    : 插件 Token, 在小程序插件基本设置中获取 (cfg.PLUGIN_TOKEN)

    签名算法:
        SIGNATURE = sha1([APPID, NONCESTR, TIMESTAMP, TOKEN].sort().join(''))
      即: 对四个字符串按字典序 (JS Array.prototype.sort 默认) 排序后直接拼接, 再取 sha1。
    """
    import hashlib
    noncestr = noncestr or os.urandom(16).hex()
    timestamp = timestamp or int(time.time())
    appid = cfg.PLUGIN_APPID
    token = cfg.PLUGIN_TOKEN
    # JS 数组默认 sort(): 元素转字符串后按 Unicode 码点逐字符比较 (字典序)
    parts = sorted([str(appid), str(noncestr), str(timestamp), str(token)])
    signature = hashlib.sha1("".join(parts).encode("utf-8")).hexdigest()
    return json.dumps(
        {"noncestr": noncestr, "timestamp": timestamp, "signature": signature},
        separators=(",", ":"),
    )



def event_report(session: cycronet.CronetClient, biz_obj: dict, uuid_str: str, host_sign_str: str = None):
    """
    发送埋点日志 (POST https://gatherer.m.qq.com/event/report)
    """
    deviceObj = biz_obj.get("deviceObj", {})
    # EId_TId_GRft_End 的 content 时间戳 t 来自 device_obj["1"] 生成时的 inner_ts + 4
    device1 = deviceObj.get("1", "")
    dev_str = s_decrypt(device1, PB89649DE) if device1 else ""
    device1_ts = int(dev_str.split("_")[1] if device1 else int(time.time() * 1000))
    seq = biz_obj.get("statisticsInfo", {}).get("11", _generate_req_id())

    # 按抓包中的相对时间差设置各埋点事件的时间与耗时
    t_gt_start = device1_ts
    t_grft_start = device1_ts + 1
    t_grft_end = device1_ts + 5
    t_grisk_start = device1_ts + 6
    t_grisk_end = device1_ts + 35
    t_gt_end = device1_ts + 35

    msg_grft_end = (
        '{"ftCode":7,"dur":1},{"ftCode":4,"dur":0},'
        '{"tag":8,"err":{"ret":-1000319,"res":"","err":"n.obtainConnectedWifi is not a function","ftCode":0,"dur":0}},'
        '{"ftCode":12,"dur":0},{"ftCode":13,"dur":0},{"ftCode":10,"dur":3}'
    )

    events = [
        {"id": "EId_TId_GT_Start", "content": json.dumps({"t": t_gt_start, "ret": 0, "msg": ""}, separators=(",", ":"))},
        {"id": "EId_TId_GRft_Start", "content": json.dumps({"t": t_grft_start, "ret": 0, "msg": "", "dur": 1}, separators=(",", ":"))},
        {"id": "EId_TId_GRft_End", "content": json.dumps({"t": t_grft_end, "ret": 0, "msg": msg_grft_end, "dur": 5}, separators=(",", ":"))},
        {"id": "EId_TId_GRisk_Start", "content": json.dumps({"t": t_grisk_start, "ret": 0, "msg": "", "dur": 6}, separators=(",", ":"))},
        {"id": "EId_TId_GRisk_End", "content": json.dumps({"t": t_grisk_end, "ret": 0, "msg": "", "dur": 35}, separators=(",", ":"))},
        {"id": "EId_TId_GT_End", "content": json.dumps({"t": t_gt_end, "ret": 0, "msg": "", "dur": 35}, separators=(",", ":"))}
    ]

    payload_obj = {
        "channel": _CHANNEL,
        "platform": 5,
        "events": events,
        "buildno": 200200,
        "uuid": uuid_str,
        "seq": seq
    }

    payload = json.dumps(payload_obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    headers = {
        "Host": "gatherer.m.qq.com",
        "Connection": "keep-alive",
        "X-WECHAT-HOSTSIGN": host_sign_str or _build_host_sign(),
        "User-Agent": cfg.UA,
        "xweb_xhr": "1",
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Referer": "https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9"
    }

    try:
        resp = session.post(_EVENT_REPORT_PATH, headers=headers, data=payload, timeout=8)
        return resp.json()

    except Exception as e:
        _log("❌ event_report 请求失败: %s" % e)
        return None


def event_report_async(session, biz_obj, uuid_str, host_sign_str=None):
    """异步发送埋点日志 (后台线程, fire-and-forget)。返回启动的 Thread。"""
    t = threading.Thread(
        target=event_report,
        args=(session, biz_obj, uuid_str, host_sign_str),
        daemon=True,
    )
    t.start()
    return t




def _post_jprx(session: cycronet.CronetClient, body, biz_obj, uuid_str, host_sign):
    payload = json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    headers = {
        "Host": "browsertdidticket.m.qq.com",
        "Connection": "keep-alive",
        "X-WECHAT-HOSTSIGN": host_sign or _build_host_sign(),
        "User-Agent": cfg.UA,
        "xweb_xhr": "1",
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Referer": "https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9"
    }
    
    resp = session.post(_API_PATH, headers=headers,
                        data=payload, timeout=8)
    try:

        j = resp.json()
    except Exception:
        _log("❌ _post_jprx 响应解析失败: %s" % resp.text)
        j = None

    # 异步发送埋点日志 (后台线程, 不阻塞主流程)
    event_report_async(session, biz_obj, uuid_str, host_sign)
    return j



def _extract_resp(res):
    try:
        return res["data"]["resp"]
    except Exception:
        return None


def get_device_token(session: cycronet.CronetClient = None) -> dict:
    global X_WECHAT_HOSTSIGN
    """
    纯 Python 两阶段获取 deviceToken (placeOrder 的 deviceToken)。
    返回 dict: {ok, deviceToken, ret, ...} 与 JS 版一致。
    """
    if session is None:
        session = cycronet.CronetClient(chrometls="chrome_133")
    state = _load_state()
    if not state["uuid"]:
        state["uuid"] = _generate_uuid()
        _save_state(state)
    uuid_str = state["uuid"]
    host_sign = X_WECHAT_HOSTSIGN or _build_host_sign()

    # 阶段一: 本地无 riskToken 时首包补全
    if not state["riskToken"]:
        r1, biz1 = _build_request_body(uuid_str, "", state["ticketID"])
        try:
            res1 = _post_jprx(session, r1, biz1, uuid_str, host_sign)
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
        return {"ok": True, "deviceToken": resp1["msgBlock"], "ret": 0,
                "overtime": resp1.get("overtime")}

    # 阶段二: type=1 换取最终 msgBlock
    r2, biz2 = _build_request_body(uuid_str, state["riskToken"], state["ticketID"])
    try:
        res2 = _post_jprx(session, r2, biz2, uuid_str, host_sign)
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
#  用两段真实抓包会话演示: 从 token 反解 content_key -> 反查 uuid -> 解密 content
#  详细步骤说明见同目录 tdid.md 第 5 节。
# ============================================================================
SESSION_STAGE1 = {
    "type": "0",
    "timestamp": "1785660553620",
    "token": "GxkmLJ9ruJolnKoQk0t1sjPjn2GRqzNycX+itil68tui6Y2P3gdnvhjWw0mtR9JXtLnnCw==",
    "content": (
        "JeruHrYY5yo02T3hu5PaScOmoJt5AwOtcFl4ch9w5UBX7AeQhBHMMaE9z+la34Bh0n7NI7Hch/xM9TTWuG7jxXKg7cNEey1E5DTnFNfl0HAiDhCSY/akU2nc8XsC4GFI1XoE9hHS+2ipYWaTcB3Gf4Bed1a/JU5avMgVk4QfREBfa9N51XHpH2RkkREV0ZUZAQ1oIn1Q4CBqP+K8mLIlCo60HUyccwqnzadbfqk0VA/Qol8X2d/ZwAKqKTvk3c8QMdpH20r+0Hc2/t8DlbmRyskufJVo6PesaftIxPOVR1vcgq8NGsKPezXDe73QXCEQyZdx7si5PeuW9EBSej7PX4G/yfaYkFt6uznCx9y/lVQsQqnPcc+hCMCtZiBC2j3yBLoku4kC1e2GjRH4eCg3Hp2UW50NZEfHQsspRcU7gNuoIIvHKcLS0aj2a6RC5QWj3PlDzfgUSsJyWHlyMq/fw0+aK9IzTPct82kDYzc9Nd3jJjx1od6tahcuyzAaWrDKH/PHLVWeu262Hl5fkTjpLUIFGSyzSjZbWIk3R8t3jlfrJ0izoaC3AduAmGjxsKKZeUqtGusv2LIKth3Es0/nudiWNlfibRFh8ZjV7s/nHaxyHYtNCHwIOKMwL86tRwoetCZ/rUHUu6g6Kgbb06vAulsDT4puxk/C6gWx5sdKf7ijxsi6o7GLwVabONx/feN3ldOAjc4r+Pw0Iw5iyXgzqf5T/7DOdlU/vFAshsQUX3bIVTDrL/NiwzaMSXzXorFqZTH6dIKSik4lZP6GKy/3bQL5EVykwVhm7+AVx+Fd/GG+5Ib0gaGH1TRzifkbLAPML/9vYiuSIEpTy6XOOuvvja0zd2A0J2tK+za/fxZBwDIFjbVoSREKGbcPaFqOttT4tAVfjjO3cuShl5JhbNHhrnnLKn3EJyQPJXDMhuKGh9bmAGzQO4IAeyhu0LkgGST7bzYyNfZmkWfDDhNKaQfR+1O0UEwAGaVXWgljtu/ODWg96FDj0LxJnVXoyH3wsNJO+2jTd2zrnIRsPkr58n1V0s0xzdSzq9BtND830x4q+NjpIh8FNE+lQngFfflDXiAumc9FzMB+Vd7lQ+nEU6NFub5TRN4okW0qVKwbOZmhFT6em0fKXDEHrAm49JSdy3LHBotc4sGm/SifpRFYSpIqMQWSb/q7N9InfFJfDMtC6sGSZAVkzNSascZcALghcwqypWsKW6T2qSnI9atacGuvjAen/IcCT98NefN2JAcN6pZkWxxsY0hn1VZJxm9cslELwH1lMcQb0Qtkdx+CKdzjNEecxxvbFY5ZAYySvkOCeboRy9BHa3HiCj1uutv05da7zf235jCapELXPPQsU2RbWuwVIQQR7ovsmKanzPz8TCSc8hBoK34AtwMqGcG7+E2g0icgKHgByo7rUBwEHxp0TFaZSnek/Q1OOSDsHkKiB3/JaXab8U1chQrIcy8BEqzC6o+LEYV0RLRS7+aK0h07lV4Bft2xO9dslLpfKxrn4ReZhtyuliL279Qu1XGeRAcZg2OQhQkY6HRA0HkUHkcftRAoBgR+6PelHuCgby313gdYmBDOLD0Ywg=="
    ),
}

SESSION_STAGE2 = {
    "type": "1",
    "timestamp": "1785660826320",
    "token": "AtseBjiFpcIIqOJG8jwp1PF2+4BQnq+8cgSrXNgXy6YJV+vNbL6dKEHevVm8DhT8Z/YvyQ==",
    "content": (
        "Ca0aZDnem7nDgwJ2qf0mp/U+Zvu/YBlAoLJdBlUOFhQo8ItRuP2IEubYHUSWc0N+BhumA5W5QGw/rDZL1FtJhAcXfQ7mJlbMps3pum+LZqu5tVmLoeJ0SctBk01cMPVNEZL2QfrIrvde0CMAMSdNKlGU9rjTCMB+yhFOy2itvJjkgNoHE4S2Q2MTKua+zMZRTTaaxWv+w9l9n4VaCaDlPOxOHkmx+fbo67U7V9wICdmJWzCUfDCfwmJb+7sWUs6eibd+ygFv8SYssElBrcPxN0rZEefCZMfCVWtwly8QPfwxjRZ8oIZ/gGiQfj5tcmmphOLT0m/8/b+yAOdVs5Su9Wt3ccjzbWMSWn++xLGLjM7Dmilj+oifsGr0vsqvlahl85aQb6IpbJ5jxKigSF7O5GpRBArRLkfz3aPY+fCa5EUuDcKp6q9g+8aQI5FnMZmzi0jXlD09Ordoyedq7HiNrWmwYf2/33L2TCU222d+DR1TGaQOKM6LouBpe5clJ0RopXP0cSz8uuaHkWNLIxth4mH1PAGu7ts2vvsAUh5psg+fdYH80C96uuU05pIdKt9HedIaGIpDrE/L2WdN0UdHQpnjwfx/pR33ORURZv84A93VfvULy/184CsVajkOl+tfgmEsTqa9fVqlV/q6l+BqdS/lYwtpiCGcadsm0V6bbDYQP0lFVQmV/gkLHLaCsPjFPVB/hC6sDCrcdCtBd9lFz/kyqUPiohVMWS4C6C+VWaZv8jOidTA3J1wv6EW0aNMwTQD04uQYx0b3taYAb+CBd5Z9ImDhKGeTuK2QeqlnPICvXbUeTzHsJkVw6oHl1uhbzcSrxBqn9mUu2zeCRt94G1c/RKmWRVZ75R61hvtVwdRKFCruJGoJUebrj2g+FNBmQIeGCs3LOjRhDEAwTJfzHSAUmXJ5yTZEeKJOSjwI/6DqJOjdqKfV9oVXGuMnSRJeeIpdCWVNGeI9nvOzgK9zU5oyBDWSk7gFkJQdmMluWoxo9ABzcdKa1DyJfUC5CbU09kO0JN1CjZPcNvIcwIUsd1lL6f8ug1eLWFW/UbVdfav2uCzDmIB6+VCijhBqMFCxbQkAyWbqN+mLdHj0wB6JV47FSP+W191U37oqNPp6o4fXMayHmC6kihrb3cIeirmznRlj6jjzP1Q6Zz7NuMbmgLkrcS2k6bZfoHdvs5346pilXJ7/GxWJZkdvOJOf9AnzEzpYSH+6ItTwaIB13Rh68RFnbapqvr7J7UfPrN56BtFA7fLXWZ/D4ADv+bKmldZ6SzidjKBAGo3t+uCh4YpPbg=="
    ),
}


def _demo():
    print("=== TDID content/token 抓包解密分析演示 (详见 tdid.md) ===\n")

    s1 = SESSION_STAGE1
    print("[阶段一 type=0] timestamp =", s1["timestamp"])
    content_key, day_start = recover_u_from_type0_token(s1["token"], s1["timestamp"])
    print("  当天0点毫秒(XXTEA 密钥) =", day_start)
    print("  ★ 反解出 content_key =", content_key)
    uuid = recover_uuid_from_u(content_key)
    print("  ★ content_key 的明文(设备 UUID) =", repr(uuid))
    print("  闭环校验 derive_u(uuid)==content_key ?",
          "OK" if derive_u(uuid) == content_key else "FAIL")
    plain1 = decrypt_content_by_u(s1["content"], content_key)
    print("  content 明文(前 300 字) =\n   ", (plain1 or "")[:300], "...\n")

    s2 = SESSION_STAGE2
    print("[阶段二 type=1] timestamp =", s2["timestamp"])
    print("  token 为服务端风控密文, 无法离线解密 (需服务端密钥)")
    plain2 = decrypt_content_by_u(s2["content"], content_key)
    print("  用同设备 content_key 解密 content 明文(前 300 字) =\n   ", (plain2 or "")[:300], "...")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        _demo()
    elif len(sys.argv) > 1 and sys.argv[1] == "--sign":
        noncestr = "6a01a3beb6d4e2f96778f32c858bee46"
        timestamp = 1785898531
        X_WECHAT_HOSTSIGN = _build_host_sign(noncestr, timestamp)
        print("X-WECHAT-HOSTSIGN =", X_WECHAT_HOSTSIGN)
    else:
        r = get_device_token()
        print(json.dumps(r, ensure_ascii=False))