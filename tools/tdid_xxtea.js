/**
 * tools/tdid_xxtea.js
 * ------------------------------------------------------------------
 * 腾讯 TDID / 无痕验证 SDK (browsertdidticket.m.qq.com  /jprx/1941)
 * 请求体 {req:{content, channel, token, version, type, timestamp}} 的
 * content / token 手动解密工具。
 *
 * 算法链（从反编译 app-service.js 抽取，模块号见注释）：
 *   加密:  s(明文, 密钥) = base64Encode( XXTEA_encrypt(明文, 密钥) )
 *   - XXTEA:  module 6699  (标准带长度头变体, delta = 0x9E3779B9)
 *   - Base64: module 6776  (标准表 A-Za-z0-9+/=)
 *   - 固定密钥 pb89649de = "01303975070694866490574863106155"  (module 19301)
 *
 * 请求体各字段的来历 (生成函数 p4b2886c6, module 1445 / 20517):
 *   O = p4b2886c6(pb89649de, C业务对象, channel, T=设备UUID, rk本地token存储key)
 *   u       = s(T_uuid, pb89649de)                 // content 的加密密钥
 *   content = s(JSON.stringify(C), u)
 *   token   :
 *     - type="1": 本地已存在的、服务端上次下发的 risk token 密文 (本地无法解, 只有腾讯后端能解)
 *     - type="0": s(u, 当天0点毫秒时间戳)           // 首包, 可离线反解出 u
 *
 * 由此得到的解密能力：
 *   - 已知设备 UUID          -> 直接解 content
 *   - type="0" 的首包 token  -> 反解出 u -> 无需 UUID 也能解 content
 *   - type="1" 的 token      -> 无法离线解密 (服务端密钥)
 * ------------------------------------------------------------------
 */

'use strict';

/* ===================== module 6776  Base64 ===================== */
const B64 = {
  base64Encode(t) {
    const i = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let a = 0, o = t.length, s = '', e, n, r;
    while (a < o) {
      e = 255 & t.charCodeAt(a++);
      if (a === o) { s += i.charAt(e >> 2); s += i.charAt((3 & e) << 4); s += '=='; break; }
      n = t.charCodeAt(a++);
      if (a === o) { s += i.charAt(e >> 2); s += i.charAt((3 & e) << 4 | (240 & n) >> 4); s += i.charAt((15 & n) << 2); s += '='; break; }
      r = t.charCodeAt(a++);
      s += i.charAt(e >> 2);
      s += i.charAt((3 & e) << 4 | (240 & n) >> 4);
      s += i.charAt((15 & n) << 2 | (192 & r) >> 6);
      s += i.charAt(63 & r);
    }
    return s;
  },
  base64Decode(t) {
    const f = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,-1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1];
    let s = t.length;
    if (s % 4 !== 0) return '';
    if (/[^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\+\/\=]/.test(t)) return '';
    let u = s, c = ('=' === t.charAt(s - 2) ? 1 : '=' === t.charAt(s - 1) ? 2 : 0);
    if (c > 0) u -= 4;
    u = 3 * (u >> 2) + c;
    const d = new Array(u);
    let a = 0, o = 0, e, n, r, i;
    while (a < s
      && -1 !== (e = f[t.charCodeAt(a++)])
      && -1 !== (n = f[t.charCodeAt(a++)])
      && (d[o++] = String.fromCharCode(e << 2 | (48 & n) >> 4), -1 !== (r = f[t.charCodeAt(a++)]))
      && (d[o++] = String.fromCharCode((15 & n) << 4 | (60 & r) >> 2), -1 !== (i = f[t.charCodeAt(a++)]))) {
      d[o++] = String.fromCharCode((3 & r) << 6 | i);
    }
    return d.join('');
  },
};

/* ===================== module 6699  XXTEA ===================== */
const XXTEA = (function () {
  const DELTA = 2654435769; // 0x9E3779B9

  // 二进制字符串 -> uint32[] , withLen: 末尾附加原始字节长度
  function toUint32(str, withLen) {
    const len = str.length;
    let n = len >> 2;
    if ((3 & len) !== 0) ++n;
    let out;
    if (withLen) { out = new Array(n + 1); out[n] = len; } else { out = new Array(n); }
    for (let i = 0; i < n; i++) out[i] = 0;
    for (let a = 0; a < len; ++a) out[a >> 2] |= str.charCodeAt(a) << ((3 & a) << 3);
    return out;
  }

  // uint32[] -> 二进制字符串 , withLen: 使用末尾长度截断
  function toStr(v, withLen) {
    const n = v.length;
    let r = n << 2;
    if (withLen) {
      const m = v[n - 1];
      if (m < (r -= 4) - 3 || m > r) return null;
      r = m;
    }
    const bytes = [];
    for (let i = 0; i < n; i++) {
      bytes.push(String.fromCharCode(
        255 & v[i], v[i] >>> 8 & 255, v[i] >>> 16 & 255, v[i] >>> 24 & 255));
    }
    const o = bytes.join('');
    return withLen ? o.substring(0, r) : o;
  }

  const u32 = (x) => 4294967295 & x;
  const mx = (sum, y, z, p, e, k) =>
    (z >>> 5 ^ y << 2) + (y >>> 3 ^ z << 4) ^ (sum ^ y) + (k[3 & p ^ e] ^ z);

  function fixKey(k) { if (k.length < 4) k.length = 4; for (let i = 0; i < 4; i++) if (k[i] === undefined) k[i] = 0; return k; }

  function encryptUint32(v, k) {
    const n = v.length, last = n - 1;
    let y, z = v[last], sum = 0, e, p, q = Math.floor(6 + 52 / n) | 0;
    while (q-- > 0) {
      sum = u32(sum + DELTA);
      e = sum >>> 2 & 3;
      for (p = 0; p < last; ++p) { y = v[p + 1]; z = v[p] = u32(v[p] + mx(sum, y, z, p, e, k)); }
      y = v[0]; z = v[last] = u32(v[last] + mx(sum, y, z, last, e, k));
    }
    return v;
  }

  function decryptUint32(v, k) {
    const n = v.length, last = n - 1;
    let y = v[0], z, sum, e, p, q = Math.floor(6 + 52 / n) | 0;
    sum = u32(q * DELTA);
    while (sum !== 0) {
      e = sum >>> 2 & 3;
      for (p = last; p > 0; --p) { z = v[p - 1]; y = v[p] = u32(v[p] - mx(sum, y, z, p, e, k)); }
      z = v[last]; y = v[0] = u32(v[0] - mx(sum, y, z, 0, e, k));
      sum = u32(sum - DELTA);
    }
    return v;
  }

  // 与 SDK 一致的 utf8 预处理 (module 6699 内部函数 u)
  function toUtf8Binary(t) {
    if (/^[\x00-\x7f]*$/.test(t)) return t;
    const e = [];
    for (let r = 0; r < t.length; ++r) {
      const a = t.charCodeAt(r);
      if (a < 128) e.push(t.charAt(r));
      else if (a < 2048) e.push(String.fromCharCode(192 | a >> 6, 128 | 63 & a));
      else if (a >= 55296 && a <= 57343 && r + 1 < t.length) {
        const o = t.charCodeAt(r + 1);
        const s = 65536 + ((1023 & a) << 10 | 1023 & o);
        e.push(String.fromCharCode(240 | s >> 18 & 63, 128 | s >> 12 & 63, 128 | s >> 6 & 63, 128 | 63 & s));
        ++r;
      } else e.push(String.fromCharCode(224 | a >> 12, 128 | a >> 6 & 63, 128 | 63 & a));
    }
    return e.join('');
  }

  return {
    /** encrypt(明文字符串, 密钥字符串) -> 二进制字符串 */
    encrypt(data, key) {
      if (data == null || data.length === 0) return data;
      data = toUtf8Binary(data);
      key = toUtf8Binary(key);
      return toStr(encryptUint32(toUint32(data, true), fixKey(toUint32(key, false))), false);
    },
    /** decrypt(二进制密文字符串, 密钥字符串) -> UTF-8 明文字符串 */
    decrypt(data, key) {
      if (data == null || data.length === 0) return data;
      key = toUtf8Binary(key);
      const bin = toStr(decryptUint32(toUint32(data, false), fixKey(toUint32(key, false))), true);
      if (bin == null) return null;
      // bin 是 UTF-8 字节流(以 charCode 存放), 转回 JS 字符串
      return Buffer.from(bin.split('').map(c => c.charCodeAt(0) & 0xff)).toString('utf8');
    },
  };
})();

/* ===================== module 737  MurmurHash2 (hash32) ===================== */
// 对应 app-service.js module 737: hash32(t, seed, unsigned=true)
function rd32(t, e) { return t.charCodeAt(e++) + (t.charCodeAt(e++) << 8) + (t.charCodeAt(e++) << 16) + (t.charCodeAt(e) << 24); }
function rd16(t, e) { return t.charCodeAt(e++) + (t.charCodeAt(e++) << 8); }
function mul32(t, e) { return (65535 & (t |= 0)) * (e |= 0) + (((t >>> 16) * e & 65535) << 16) | 0; }
function hash32(t, seed, unsigned) {
  const a = unsigned === undefined ? true : unsigned;
  const o = 1540483477;
  let s = seed ^ t.length, c = t.length, u = 0;
  while (c >= 4) {
    let d = rd32(t, u);
    d = mul32(d, o); d = mul32(d ^= d >>> 24, o); s = mul32(s, o); s ^= d; u += 4; c -= 4;
  }
  switch (c) {
    case 3: s ^= rd16(t, u); s = mul32(s ^= t.charCodeAt(u + 2) << 16, o); break;
    case 2: s = mul32(s ^= rd16(t, u), o); break;
    case 1: s = mul32(s ^= t.charCodeAt(u), o); break;
  }
  s = mul32(s ^= s >>> 13, o); s ^= s >>> 15;
  return a ? s >>> 0 : s;
}

/* ===================== module 8898  sign (statisticsInfo[10]) ===================== */
// LCG 迭代函数 a(t) (module 8898)
function lcg(t) { return 32767 & (214013 * (t >> 16) + (214013 * (65535 & t) + 2531011 >> 16)); }
// utf8 预处理 (与 sign 内部 r 分支一致): 用 TextEncoder 等价实现
function signUtf8(t) {
  const bytes = Buffer.from(t, 'utf8');
  let n = '';
  for (let i = 0; i < bytes.length; ++i) n += String.fromCharCode(bytes[i]);
  return n;
}
/**
 * sign(timestamp, deviceObj)  ==  statisticsInfo[10]
 * 步骤(module 8898):
 *   n = [deviceObj 所有 value]
 *   d = timestamp; f = parseInt(len/4)+1; 循环 f 次: d = lcg(d); n.push(d.toString(16))
 *   _ = n.join(""); h = utf8(_); return "01" + hash32(h, 256).toString(16)
 */
function sign(timestamp, deviceObj) {
  const n = [];
  const keys = Object.keys(deviceObj);
  for (let s = 0; s < keys.length; s++) n.push(deviceObj[keys[s]]);
  const u = keys.length;
  let d = timestamp;
  const f = parseInt(u / 4, 10) + 1;
  for (let l = 0; l < f; l++) { d = lcg(d); n.push(d.toString(16)); }
  const _ = n.join('');
  const h = signUtf8(_);
  return '01' + hash32(h, 256).toString(16);
}

/* ===================== 高层封装 ===================== */
const PB89649DE = '01303975070694866490574863106155';

/**
 * s(明文, 密钥[, withTs])  ==  p2baeeec4 (module 1445 内部 function s)
 *   withTs=true 时先把明文改为  明文 + "_" + Date.now()  再加密。
 *   源码: n && (t = t + "_" + (new Date).valueOf()); return base64(XXTEA(t, key))
 * @param tsOverride 可选: 指定拼接的时间戳(用于复现/验证), 不传则用 Date.now()
 */
function sEncrypt(plain, key, withTs, tsOverride) {
  if (plain == null || plain.length === 0) return plain; // 对应 isEmpty 分支
  let t = plain;
  if (withTs) t = t + '_' + (tsOverride !== undefined ? tsOverride : Date.now());
  return B64.base64Encode(XXTEA.encrypt(String(t), String(key)));
}
// 逆运算 (base64 -> XXTEA decrypt); 若原文带 _ts, 返回值即含 "明文_时间戳"
function sDecrypt(b64, key) {
  const bin = B64.base64Decode(b64);
  return XXTEA.decrypt(bin, String(key));
}

// p2baeeec4 别名 (与 SDK 命名对齐)
const p2baeeec4 = sEncrypt;


/** 由设备 UUID 推导出 content 的加密密钥 u */
function deriveU(uuid) {
  return sEncrypt(uuid, PB89649DE);
}

/**
 * 反向: 已知 u, 还原出 u 的明文(即设备 UUID)。
 * 因为 u = base64(XXTEA(UUID, pb89649de)), 而 pb89649de 是已知固定密钥,
 * 所以 UUID = XXTEA_decrypt(base64Decode(u), pb89649de)。
 */
function recoverUuidFromU(u) {
  return sDecrypt(u, PB89649DE);
}


/** 已知 UUID, 解密 content -> 设备指纹业务对象明文 */
function decryptContentByUuid(contentB64, uuid) {
  return sDecrypt(contentB64, deriveU(uuid));
}

/** 已知中间密钥 u, 直接解密 content */
function decryptContentByU(contentB64, u) {
  return sDecrypt(contentB64, u);
}

/**
 * type="0" 首包: token = s(u, 当天0点毫秒时间戳)
 * 已知 token 密文 + 请求 timestamp, 反解出 u。
 * 当天0点毫秒时间戳算法(见 p4b2886c6): c - (c + 288e5) % 864e5   (北京时区 UTC+8)
 */
function recoverUFromType0Token(tokenB64, timestampMs) {
  const c = Number(timestampMs);
  const dayStart = c - (c + 288e5) % 864e5; // 当天 00:00 (UTC+8) 的毫秒时间戳
  const u = sDecrypt(tokenB64, String(dayStart));
  return { u, dayStartKey: String(dayStart) };
}

module.exports = {
  B64, XXTEA, PB89649DE,
  sEncrypt, sDecrypt, deriveU, recoverUuidFromU,
  decryptContentByUuid, decryptContentByU, recoverUFromType0Token,
  hash32, sign, lcg, p2baeeec4,
};


/* ===================== CLI / 自测 ===================== */
if (require.main === module) {
  console.log('=== TDID /jprx/1941 content/token 解密工具 ===\n');

  // 1) 自测: 加密-解密往返一致性
  const key = 'MyTestKey123';
  const plain = JSON.stringify({ hello: '世界', arr: [1, 2, 3], t: Date.now() });
  const enc = sEncrypt(plain, key);
  const dec = sDecrypt(enc, key);
  console.log('[自测] 明文 == 解密结果 ?', dec === plain ? 'OK' : 'FAIL');
  console.log('       密文(base64):', enc.slice(0, 48) + '...');
  console.log();

  // 2) UUID -> u 派生演示 (UUID 需替换为该设备真实值)
  const demoUuid = '00000000-0000-0000-0000-000000000000';
  console.log('[演示] deriveU("' + demoUuid + '") =');
  console.log('       u =', deriveU(demoUuid));
  console.log();

  // 3) 用抓包数据尝试解密 (type=0 首包, 可离线反解 u)
  const CAPTURED = {
    content:
      'NGSYZkOFeTa+DqLW1F9DxxHfw1fqBkjT54pYztIANToQiPx0qQyM7eJyjdHmM4k06FYrO0RTsXNIS9e1n+BWa4Lt7gq4Qu8E3j0fj+WgEOw8h3sycMDN5z6mwUbwx+00i00+DC+IFdIWLa+c7POnpy1zIUYQ818vVaXzGt4w8fA9ybboLA6Sf5/91X3eqHuzMNU5WxTbhFO1dIiX1EegXUmxpGKh2A3ZDpRL6+EacyITEcL1RMxmHDXs2tIu492EL5zaACkUH8lYoLrj1ZROrTZugXga53zc8Il04MJ39xvfg9Ss+nUUPXdyKf4kRu22x6f8uLBrHF/+hX6hP7xB+yvaWcHtodC3uH4gp80Xe5GdLDeuOXgeVCCBnd2HUqTMrlM9dfcPtFr7XOTjGXg8VGfH1eV0esUbA8r/SZt2D0reJhEFUKd6VUVgzAYXETbaPIjOqMgBiEjDZgbX5vdd3DEJgBf6jwx1gaoHM9SdLLOwv/hfW1yUiGo7tj2B6aZgbzCv8HiJxZinsZUcXlRWd5Eftj8SvORFRCBKOgy9kJsbIbPu4/yjtiYvMw/cKdDIsxFi6eMAt3A5cRYDMc5HpN3CpIRVwMJtdbOHRG76Q3IvN+LfSMRRpS+RBojtcR6ojLLhq0jA+nNLdvel3dbABDUqVZ5AWY87oqdrINwQ3lxLUx6qe9B9+/wf8ZuktkW9nVBBh0n5QRRs2dRHsDKa7Est8eGzDhidX6P1ybPmWfiaGJkWsmVuzAbV9Qhxb4iN8jiaO7atACAx5sKHCGZqzPcLZu/J/1VwmiTId4Jq0AYx2cxkyilDqJk8804tclWyEL5gcc+MJ3oRfTHmU6MrFSDpCLt1ee/Jl7IgQcl0BvdRnOgWRJa4LnHHm0SoqvL7tcokuJo8w1rJEpBCiIvdw7vKtlggz67lMwSZMhsq2WDTMwOYhWzmdGaeXYIvrccODC/hhfPIXGZ2/yP5GeyfDVeCh7n/aqr39vcPKm6dJl2AiT+TEdEfIZI90JOZ5Kx8yOixXPrf44RdcgoHKuvKvQGc2jQvCHz4m4b7HfTcnvSU2FIQpA2UIhhfBjITr5gvblmt5sT6M/b8OXIaRoj1EgIANSxDNZ/LqRxM+NkPcLtW1F/aznHG+iIyEFuT7nSahvIdCAj6QoFMHEqGUoaHCRbRnT0TGsbVZwqKpezE9/I2OhmgI7K+LBo8picZXwemtTcVG1lkLaddjDuUmeFtA83/QeWXR2mqyHOGqRyZiax/Q0zNNjP5ufvrknPqWRmNtr3LKG6NKQvb1jq3ng4D+ojCTFaCEEhtYy3SReUeC1mFbthwjfrl3f11E6lCwzSAU7VAXMOsiDOrk5qz6djW8oOoX0EZ4kS3qJqPgBTnW3m1B9abwq+NRYsbFU5FzBma2soviZHixXY4WOmYb0nrcfDblap/3XYyV9sGz3MteZ/B8gn+r6PTYHDWWBc3Ik7gnGvzuMW9k2eWq5HR0wxcEDHF4vDCZpbl6eR4VCcv3VCADNqvF1NjPMkdy2NTMhK/ts5gdjy4McDuYZztYlDu7TrMcpBDS2g3kHKiRulBLxoGVnitHKHqWQ==',
    channel: '109045',
    token: 'tsSnodWMjtl2j78PwxDd1Wnw4VD7SQCw+O5FPzwrdBJu2QL6BoEnenIeuYvri5J6iC404A==',
    version: '1',
    type: '0',
    timestamp: '1785474711109',
  };

  console.log('[抓包] type =', CAPTURED.type, ', timestamp =', CAPTURED.timestamp);
  if (CAPTURED.type === '0') {
    const { u, dayStartKey } = recoverUFromType0Token(CAPTURED.token, CAPTURED.timestamp);
    console.log('       当天0点key =', dayStartKey);
    console.log('       反解 u   =', u);
    // u 的明文 = 设备 UUID (因为 u = base64(XXTEA(UUID, 已知固定密钥)))
    const uuid = recoverUuidFromU(u);
    console.log('       ★ u 的明文(设备UUID) =', JSON.stringify(uuid));
    // 校验闭环: deriveU(uuid) 是否等于 u
    console.log('       校验 deriveU(uuid)==u ?', deriveU(uuid) === u ? 'OK' : 'FAIL');
    try {
      const c = decryptContentByU(CAPTURED.content, u);
      console.log('       content 明文 =\n', c);
    } catch (e) { console.log('       content 解密失败:', e.message); }
  } else {
    console.log('       ⚠ 本包 type=1: token 为服务端下发的 risk token 密文, 本地无密钥, 无法离线解密。');
    console.log('       ⚠ content 需要该设备的随机 UUID 才能解密, 请用:');
    console.log('           node tools/tdid_decrypt.js content <UUID>');
  }
  console.log();

  // 4) 命令行: node tdid_decrypt.js content <b64> <uuid>
  const [, , cmd, arg1, arg2] = process.argv;
  if (cmd === 'content' && arg1) {
    const uuid = arg2 || arg1;
    const b64 = arg2 ? arg1 : CAPTURED.content;
    console.log('[CLI] 用 UUID 解密 content:');
    console.log(decryptContentByU(b64, deriveU(uuid)));
  } else if (cmd === 'u' && arg1) {
    console.log('[CLI] deriveU:', deriveU(arg1));
  }
}
