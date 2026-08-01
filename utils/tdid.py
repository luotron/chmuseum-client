"""
tdid.py — 腾讯 TDID / 无痕验证 SDK 纯 Python 实现
================================================================================
把 tools/tdid_xxtea.js + tools/tdid_client.js 的核心算法翻译为纯 Python,
无需本地 node 环境即可获取 deviceToken (placeOrder 用)。

算法链 (与 JS 版逐字对齐):
    加密:  s(明文, 密钥) = base64( XXTEA_encrypt(明文, 密钥) )
    - XXTEA:  标准带长度头变体, delta = 0x9E3779B9
    - Base64: 标准表 A-Za-z0-9+/=
    - 固定密钥 PB89649DE = "01303975070694866490574863106155"
    - hash32:  MurmurHash2
    - sign:    statisticsInfo[10]

两阶段流程 (getDeviceToken):
    [阶段一] 本地无 riskToken -> type=0 首包 -> 保存 resp.token / dfp.ticketID
    [阶段二] type=1 -> 得到最终 resp.msgBlock (= deviceToken)

依赖: 仅标准库 (http.client / json / os / uuid / time / random)。
"""

import json
import os
import random
import time
import uuid as _uuid
import http.client


# ============================================================================
#  Base64 (标准表, 与 JS module 6776 一致 — 直接用 python 标准库等价)
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
#  高层封装 s() / deriveU()
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


p2baeeec4 = s_encrypt


def derive_u(uuid_str):
    return s_encrypt(uuid_str, PB89649DE)


# ============================================================================
#  TDID 客户端 (两阶段) — 与 tdid_client.js 对齐
# ============================================================================
_CHANNEL = "109045"
_API_HOST = "browsertdidticket.m.qq.com"
_API_PATH = "/jprx/1941"

_STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tdid_state.json")
_STATE_FILE = os.path.abspath(_STATE_FILE)

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
    try:
        if os.path.exists(_STATE_FILE):
            with open(_STATE_FILE, "r", encoding="utf-8") as f:
                s = json.load(f)
            return {
                "uuid": s.get("uuid") or "",
                "riskToken": s.get("riskToken") or "",
                "ticketID": s.get("ticketID") or "",
            }
    except Exception:
        pass
    return {"uuid": "", "riskToken": "", "ticketID": ""}


def _save_state(state):
    try:
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


if __name__ == "__main__":
    r = get_device_token()
    print(json.dumps(r, ensure_ascii=False))
