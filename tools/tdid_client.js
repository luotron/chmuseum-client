/**
 * tools/tdid_client.js
 * ------------------------------------------------------------------
 * 模拟腾讯 TDID/无痕验证 SDK 的完整两阶段流程 (browsertdidticket.m.qq.com /jprx/1941)
 *
 * 复现 app-service.js 中 p4b2886c6 (module 1445) 的请求体生成逻辑:
 *   s(明文,密钥[,加时间戳]) = base64( XXTEA_encrypt(明文[+"_"+ms], 密钥) )
 *   u        = s(设备UUID, pb89649de)           // content 加密密钥
 *   content  = s(JSON.stringify(业务对象), u)
 *   token    :
 *     type=0(首包)   : token = s(u, 当天0点毫秒时间戳)   —— riskToken 为空时
 *     type=1(有token): token = 全局保留的 riskToken(= 上一次响应里的 resp.token 字段!)
 *
 * ★ 经真实抓包修正的关键点 (对照 app-service.js:20807/20828/21013/20995):
 *   1) riskToken = 响应的 resp.token (不是 msgBlock!)。源码 line21013:
 *        setLocal(o.rk, resp.token)  —— o.rk 即全局保留的 risk token
 *      同时 line20807: setLocal(c.tk, resp.token) 供下次 p4b2886c6 第5参数读取。
 *   2) type=1 时 deviceObj["2"] = 上一次响应的 resp.dfp.ticketID (不是 uuid!)。
 *   3) 阶段二的 X-WECHAT-HOSTSIGN 复用阶段一同一个 (noncestr/timestamp/signature 不变)。
 *   4) 最终 deviceToken = 阶段二响应的 resp.msgBlock (源码 line20995)。
 *   5) statisticsInfo[10] = sign(timestamp, featureObj) 由 native 生成, 离线无法复算。
 *
 * 流程:
 *   [阶段一] riskToken 为空 -> type=0 {content,token=s(u,当天0点)} -> POST /jprx/1941
 *            -> 保存 resp.token 为全局 riskToken, 保存 resp.dfp.ticketID
 *   [阶段二] riskToken 有值 -> type=1 {content(带ticketID), token=riskToken} -> POST
 *            -> 得到最终 resp.msgBlock (即下单请求体里的 deviceToken)

 *
 * 依赖: 仅 Node.js 内置 https, 无第三方包。
 * 运行: node tools/tdid_client.js
 * ------------------------------------------------------------------
 */

'use strict';

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  sEncrypt, sDecrypt, deriveU, PB89649DE, p2baeeec4, sign, hash32,
} = require('./tdid_xxtea');


/* ===================== 全局配置 ===================== */
const CHANNEL = '109045';
const API_HOST = 'browsertdidticket.m.qq.com';
const API_PATH = '/jprx/1941';

/* ---------------------------------------------------------------
 * 本地持久化状态 (对应 SDK 里 setLocal/getLocal 的 wx.storage):
 *   uuid       设备唯一标识 (SDK: 首次随机生成后写入 storage, 永久保留)
 *   riskToken  风控 token   (SDK 全局字段 o.rk = 上一次响应 resp.token)
 *   ticketID   设备指纹票据 (SDK: 上一次响应 resp.dfp.ticketID, 填 deviceObj["2"])
 * 三者均落盘到 tools/tdid_state.json, 下次运行自动读取。
 * ------------------------------------------------------------- */
const STATE_FILE = path.join(__dirname, 'tdid_state.json');

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      return { uuid: s.uuid || '', riskToken: s.riskToken || '', ticketID: s.ticketID || '' };
    }
  } catch (e) { console.warn('[state] 读取失败:', e.message); }
  return { uuid: '', riskToken: '', ticketID: '' };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) { console.warn('[state] 写入失败:', e.message); }
}

// 内存中的全局状态 (启动时从本地文件恢复)
const STATE = loadState();


/* ===================== 工具函数 ===================== */

// 标准 UUID v4, 去掉连字符 (对应 SDK generateUUID: UUIDjs.create().split('-').join(''))
function generateUUID() {
  return crypto.randomUUID().split('-').join('');
}
// reqId: 带连字符的标准 UUID (对应 SDK generateReqId)
function generateReqId() {
  return crypto.randomUUID();
}

// 当天 0 点毫秒时间戳 (北京时区 UTC+8): c - (c + 288e5) % 864e5
function dayStartMs(c) {
  return c - (c + 288e5) % 864e5;
}

/* ---------------------------------------------------------------
 * 设备指纹字段 DEV 表 (deviceObj 的静态/半静态字段).
 *
 * 每个字段的来源均对照 app-service.js 的 feature builder (≈行 995400-1001700):
 *   deviceObj 由 SDK 启动时并行调用一批微信 API 异步采集, 存入
 *   O = { ftSystemInfo, ftNetworkType, ftBeacons, ftWifi, ftOffscreenCanvas,
 *         ftBssid, ftLnglat, ftLocalip, ftLogincode, ... }, 再逐字段填充。
 *
 * 【动态字段】每次请求都可能变, 应实时采集 (下方标 ★动态):
 *   1(带时间戳)、43(网络)、118(权限)、121(经纬度)、123(bssid)、
 *   128(本机IP)、130(wx.login code, 一次性!)、1006(canvas)。
 * 【用户相关】换用户/appid 才变: 101/119(openid)。
 * 【静态】设备/小程序固定不变: 104/105/106/107/108/111/116/117/124/126/127/129 等。
 * ------------------------------------------------------------- */
const DEV = {
  // ── 平台 / 网络 ──
  '4':   'windows',        // 平台标识, PC 端微信固定 "windows"(app-service.js:219589)
  '43':  'wifi',           // ★动态 wx.getNetworkType().networkType (wifi/4g/5g/none) —— ftNetworkType

  // ── 用户 / 环境 ──
  '101': 'osPfN4seDJhyEgrFmC_DME8Bq3bc',   // 微信 openid (args.openid, type=0 写此键; type≠0 写 119)
  '103': '3.17.0',         // 微信小程序基础库版本 getSystemInfoSync().SDKVersion —— ftSystemInfo

  // ── 设备硬件 (getSystemInfoSync, 一台设备固定) —— ftSystemInfo ──
  '104': 'microsoft',      // brand   厂商
  '105': 'microsoft',      // model   机型
  '106': '780*414',        // screenHeight + "*" + screenWidth 屏幕分辨率
  '107': 'Windows Unknown x64', // system 操作系统
  '108': 'zh_CN',          // language 系统语言

  // ── 蓝牙/WiFi 列表 (加密, native 采集) ──
  '109': '',               // ftBeacons: p2baeeec4(JSON(beacons), hash32(uuid+"109"), true) 蓝牙 beacon
  '110': '',               // ftWifi   : p2baeeec4(JSON(wifiList), hash32(uuid+"110"), true) wifi 列表

  // ── 微信版本 / 屏幕参数 —— ftSystemInfo ──
  '111': '4.1.11.55',      // version        微信客户端版本
  '112': '', '113': '', '114': '', '115': '',   // (真实明文常为空, 保留占位对齐字段集)
  '116': '20',             // statusBarHeight 状态栏高度
  '117': '-1',             // benchmarkLevel  设备性能等级

  // ── 授权/开关位串 (8 段 0/1 拼接) —— ftSystemInfo ──
  // 顺序: album:camera:location:microphone:notification:bluetooth:locationEnabled:wifiEnabled
  '118': '1:1:1:1:1:0:1:1',// ★动态 授权状态随用户设置变化

  // ── 位置 / wifi (需授权, 动态) ──
  '119': '',               // openid (仅 type≠0 时写入; type=0 时写 101, 见 buildBusinessObj)
  '121': '',               // ★动态 ftLnglat  经纬度 wx.getLocation() -> "lng,lat"
  '122': '',               // (需额外授权, 真实常空)
  '123': '',               // ★动态 ftBssid   连接 wifi 的 BSSID wx.getConnectedWifi().BSSID

  // ── 调试/字体/小程序信息 ──
  '124': 'false',          // enableDebug 是否调试模式 —— ftSystemInfo
  '126': '15',             // fontSizeSetting 字体大小设置 —— ftSystemInfo
  '127': '20260715',       // getAccountInfoSync().miniProgram.version 小程序版本号
  '128': '198.18.0.1',     // ★动态 ftLocalip  本机内网 IP wx.getLocalIPAddress()
  '129': 'release',        // getAccountInfoSync().miniProgram.envVersion (release/trial/develop)

  // ── 一次性登录凭证 (★每次都变, 5min 过期) ──
  '130': '4ecfb0c75f2767522744b9ddd683989f765a189ee9391b8338ba0f3dcec7b89e',
  // ↑ ftLogincode = wx.login() 返回的 res.code。SDK: t[130] = ftLogincode || ""。
  //   这是微信临时登录凭证, 一次性、约 5 分钟过期, 每次调用都不同 -> 必须实时 wx.login 获取。
};

// canvas 指纹原始明文 (native 离屏 canvas 渲染后取像素/文本指纹) —— ftOffscreenCanvas。
// deviceObj["1006"] = p2baeeec4(hash32(canvas明文,256), hash32(salt+"1006",256), true)。
// 依赖真实渲染环境, 纯 Node 无法生成; 有真机抓包明文时填入这里即可复算出一致的 1006。
const FT_OFFSCREEN_CANVAS = '';   // ★动态/设备相关: 填入 canvas 指纹字符串后可复算 1006


/**
 * 生成 deviceObj["1"] = p2baeeec4(uuid, pb89649de, true, ts)
 *   明文 = uuid + "_" + ts,  ts 为采集时刻(≈业务 timestamp).
 */
function makeDevice1(uuid, innerTs) {
  return p2baeeec4(uuid, PB89649DE, true, innerTs);
}
/**
 * 生成 deviceObj["1006"] = p2baeeec4( hash32(canvas指纹,256).toString? , hash32("...1006"), true )
 * 源码(module bc4bf3e6e):
 *   r = hash32(canvas明文, 256);
 *   t[1006] = p2baeeec4(r, hash32(salt+"1006",256), true)
 * 其中 r 是 number, p2baeeec4 内部会 String(r). salt = n (由采集上下文决定, 真实为空串附近).
 * 无 canvas 明文时返回 '' (阶段二本就无此字段).
 */
function makeDevice1006(canvasPlain, salt, innerTs) {
  if (!canvasPlain) return '';
  const r = hash32(canvasPlain, 256);
  const key = hash32((salt || '') + '1006', 256);
  return p2baeeec4(String(r), String(key), true, innerTs);
}

/**
 * 构造设备指纹业务对象 C。严格对照真实明文的字段顺序与取值。
 * 两阶段字段集不同:
 *   阶段一 type=0 flags=2: 全量 deviceObj (含 103/106/108/109..118/126/1006 等)
 *   阶段二 type=1 flags=0: 精简 deviceObj (只保留 1/2/4/43/101/104/105/107/119/121~124/127~130/4004)
 *
 * @param uuid       设备 UUID
 * @param timestamp  外层时间戳(ms), 内部 obj.timestamp = timestamp - 9 (真实抓包差值)
 * @param ticketID   deviceObj["2"]: 阶段一="" ; 阶段二=上次响应 dfp.ticketID
 * @param type       0=阶段一首包 ; 1=阶段二
 * @param mapTK      deviceObj["4004"] 平台映射票据, 首包与阶段二均为空
 */
function buildBusinessObj(uuid, timestamp, ticketID, type) {
  const innerTs = timestamp - 9;
  const device1 = makeDevice1(uuid, innerTs + 4); // 真实抓包内部 ts ≈ obj.timestamp+4
  const flags = type === 0 ? 2 : 0;

  let deviceObj;
  if (type === 0) {
    /* ---- 阶段一: 全字段 (顺序 = 真实明文) ---- */
    deviceObj = {
      '1': device1,
      '2': ticketID || '',
      '4': DEV['4'], '43': DEV['43'],
      '101': DEV['101'],
      '103': DEV['103'], '104': DEV['104'], '105': DEV['105'],
      '106': DEV['106'], '107': DEV['107'], '108': DEV['108'],
      '109': DEV['109'], '110': DEV['110'], '111': DEV['111'],
      '112': DEV['112'], '113': DEV['113'], '114': DEV['114'], '115': DEV['115'],
      '116': DEV['116'], '117': DEV['117'], '118': DEV['118'],
      '119': DEV['119'],
      '121': DEV['121'], '122': DEV['122'], '123': DEV['123'], '124': DEV['124'],
      '126': DEV['126'], '127': DEV['127'], '128': DEV['128'], '129': DEV['129'], '130': DEV['130'],
      '1000': '', '1001': '', '1002': '', '1003': '',
      '1006': makeDevice1006(FT_OFFSCREEN_CANVAS, '', innerTs + 5),
      '1007': '',
      '4001': '', '4002': '', '4003': '', '4004': '',
    };
  } else {
    /* ---- 阶段二: 精简字段 (顺序 = 真实明文) ---- */
    deviceObj = {
      '1': device1,
      '2': ticketID || '',        // ★ = 上一次响应 dfp.ticketID
      '4': DEV['4'], '43': DEV['43'],
      '101': DEV['101'],
      '104': DEV['104'], '105': DEV['105'],
      '107': DEV['107'],
      '119': DEV['119'],
      '121': DEV['121'], '122': DEV['122'], '123': DEV['123'], '124': DEV['124'],
      '127': DEV['127'], '128': DEV['128'], '129': DEV['129'], '130': DEV['130'],
      '4004': '',
    };
  }

  const obj = {
    timestamp: innerTs,
    sdkInfo: {
      buildno: 200200, sdkver: '2.2.0', lc: '2292EB32FCD43530',
      channel: CHANNEL, platform: 5,
    },
    deviceObj,
    productInfo: { clientVer: '', requestPackageName: '' },
    clientInfo: {
      requestSeq: '', metaData: '', channel: '', buildNo: 0,
      version: '', lc: '', extraInfo: '',
      wx_appid: 'wx9e2927dd595b0473', appid: '', type: 0,
    },
    statisticsInfo: {
      '10': '',                 // 下面用 sign() 真实复算
      '11': generateReqId(),    // reqId
    },
    extraIds: { '1': '' },
    flags,
    requireType: 0,
  };

  // ★ statisticsInfo[10] = sign(timestamp, deviceObj) — 真实算法, 离线可复算
  obj.statisticsInfo['10'] = sign(obj.timestamp, obj.deviceObj);
  return obj;
}

/**
 * 生成 /jprx/1941 请求体, 完全复刻 p4b2886c6(pb89649de, w, channel, uuid, c.tk):
 *   u = s(uuid, pb89649de)
 *   riskToken 为空 -> type=0, token=s(u, 当天0点),          deviceObj["2"]="",       flags=2
 *   riskToken 有值 -> type=1, token=riskToken(=上次resp.token), deviceObj["2"]=ticketID, flags=0
 */
function buildRequestBody(uuid, currentRiskToken, ticketID) {
  const c = Date.now();
  const u = deriveU(uuid);            // = sEncrypt(uuid, PB89649DE)
  let token = currentRiskToken;
  let type = 1;
  if (!token) {
    token = sEncrypt(u, String(dayStartMs(c))); // s(u, 当天0点)
    type = 0;
  }
  const bizObj = buildBusinessObj(uuid, c, ticketID, type);
  const content = sEncrypt(JSON.stringify(bizObj), u);
  return {
    body: { req: { content, channel: CHANNEL, token, version: '1', type: String(type), timestamp: String(c) } },
    meta: { u, type, timestamp: c, bizObj },
  };
}



/* ===================== 微信 hostsign 头 ===================== */
/**
 * X-WECHAT-HOSTSIGN 头 (小程序跨域请求由微信客户端注入):
 *   { noncestr, timestamp, signature }
 * signature = sha1( [appid?, noncestr, timestamp, ...].sort().join('') ) 之类的微信内部算法,
 * 真实值只有微信运行时能算出。这里生成结构占位, 便于观察 (真实请求需抓包里的头)。
 */
function buildHostSign() {
  const noncestr = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000);
  // 占位签名: 无法离线复算微信真实签名, 用随机 sha1 演示结构
  const signature = crypto.createHash('sha1')
    .update(noncestr + timestamp).digest('hex');
  return JSON.stringify({ noncestr, timestamp, signature });
}

/* ===================== HTTP: POST /jprx/1941 ===================== */
// hostSign 可传入以便阶段一/阶段二复用同一签名 (真实抓包两包 hostsign 完全一致)
// protoLog: 可选协议记录回调 (stage, {reqHeaders, reqBody, status, respHeaders, respBody})
function postJprx(body, hostSign, protoLog, stageName) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const reqHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'X-WECHAT-HOSTSIGN': hostSign || buildHostSign(),
      'xweb_xhr': '1',
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) XWEB/20089',
      'Referer': 'https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    };
    const req = https.request({
      host: API_HOST, path: API_PATH, method: 'POST', headers: reqHeaders,
    }, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        if (typeof protoLog === 'function') {
          protoLog(stageName || 'jprx', {
            method: 'POST', url: 'https://' + API_HOST + API_PATH,
            reqHeaders: reqHeaders, reqBody: payload,
            status: res.statusCode, respHeaders: res.headers, respBody: data,
          });
        }
        try { resolve({ status: res.statusCode, json: JSON.parse(data), raw: data }); }
        catch (e) { resolve({ status: res.statusCode, json: null, raw: data }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// 从响应中提取 resp 对象
function extractResp(res) {
  return res && res.json && res.json.data && res.json.data.resp ? res.json.data.resp : null;
}

// ret 码含义 (经验值)
function retDesc(ret) {
  const map = {
    0: '(成功)',
    4: '(风控校验未通过/设备特征无效)',
  };
  return map[ret] || '';
}


/* ===================== 主流程 ===================== */
async function main() {
  console.log('=== TDID /jprx/1941 两阶段模拟客户端 ===\n');

  /* ---------- 设备 UUID: 本地无则自动生成并落盘 ---------- */
  if (!STATE.uuid) {
    STATE.uuid = generateUUID();
    saveState(STATE);
    console.log('[设备] 本地无 UUID, 已自动生成并持久化:', STATE.uuid);
  } else {
    console.log('[设备] 从本地读取 UUID:', STATE.uuid);
  }
  const uuid = STATE.uuid;
  console.log('       u = deriveU(uuid) =', deriveU(uuid));
  console.log('       本地 riskToken =', STATE.riskToken ? STATE.riskToken.slice(0, 32) + '...' : '(空)');
  console.log('       本地 ticketID  =', STATE.ticketID || '(空)');
  console.log();

  // 阶段一/阶段二复用同一 X-WECHAT-HOSTSIGN (真实抓包中两包 hostsign 完全一致)
  const hostSign = buildHostSign();

  /* ================================================================
   * 首次运行 (本地无 riskToken): 走 type=0 首包, 补全全局变量
   *   -> 保存 resp.token 为 STATE.riskToken, resp.dfp.ticketID 为 STATE.ticketID
   * ================================================================ */
  if (!STATE.riskToken) {
    console.log('────── 阶段一: type=0 (本地无 riskToken, 首包补全) ──────');
    const r1 = buildRequestBody(uuid, '', STATE.ticketID); // riskToken='' -> type=0
    console.log('[请求体] type =', r1.meta.type, ', timestamp =', r1.meta.timestamp);
    console.log('         token(自造 = s(u,当天0点)) =', r1.body.req.token);
    console.log('         content =', r1.body.req.content.slice(0, 60) + '...');
    console.log('POST https://' + API_HOST + API_PATH);

    let res1;
    try { res1 = await postJprx(r1.body, hostSign); }
    catch (e) { console.log('[网络错误]', e.message); return; }

    console.log('[响应] status =', res1.status);
    const resp1 = extractResp(res1);
    if (!resp1) { console.log('       原始:', res1.raw.slice(0, 300)); return; }
    console.log('       ret =', resp1.ret, retDesc(resp1.ret));
    console.log('       resp.token =', (resp1.token || '').slice(0, 50) + '...');
    console.log('       msgBlock   =', (resp1.msgBlock || '').slice(0, 50) + '...');
    console.log('       overtime =', resp1.overtime, ', signKeySeq =', resp1.signKeySeq);
    if (resp1.dfp) console.log('       dfp.ticketID =', resp1.dfp.ticketID);

    // ★ 补全全局变量并持久化到本地文件
    if (resp1.token) { STATE.riskToken = resp1.token; console.log('       ★ 保存 riskToken = resp.token (o.rk)'); }
    if (resp1.dfp && resp1.dfp.ticketID) { STATE.ticketID = resp1.dfp.ticketID; console.log('       ★ 保存 ticketID (下次 deviceObj["2"])'); }
    saveState(STATE);
    console.log('       ★ 已写入本地状态文件:', STATE_FILE);
    console.log();

    if (!STATE.riskToken) {
      console.log('⚠ 阶段一未获得 riskToken(resp.token 为空): 被风控拒绝。');
      console.log('  真实过风控需要微信真实 X-WECHAT-HOSTSIGN 及 native 采集/签名的 deviceObj。');
      return;
    }
  } else {
    console.log('────── 本地已有 riskToken, 跳过阶段一(首包) ──────\n');
  }

  /* ================================================================
   * 阶段二: type=1, 使用本地 riskToken + ticketID -> 换取最终 msgBlock
   * ================================================================ */
  console.log('────── 阶段二: type=1 (riskToken 有值, deviceObj["2"]=ticketID) ──────');
  const r2 = buildRequestBody(uuid, STATE.riskToken, STATE.ticketID); // 有值 -> type=1
  console.log('[请求体] type =', r2.meta.type, ', timestamp =', r2.meta.timestamp);
  console.log('         token(=riskToken=上次resp.token) =', r2.body.req.token.slice(0, 50) + '...');
  console.log('         deviceObj["2"](=ticketID) =', (r2.meta.bizObj.deviceObj['2'] || '').slice(0, 40) + '...');
  console.log('         content =', r2.body.req.content.slice(0, 60) + '...');
  console.log('POST https://' + API_HOST + API_PATH + '  (复用同一 hostSign)');

  let res2;
  try { res2 = await postJprx(r2.body, hostSign); } // ★ 复用阶段一 hostSign
  catch (e) { console.log('[网络错误]', e.message); return; }

  console.log('[响应] status =', res2.status);
  const resp2 = extractResp(res2);
  if (!resp2) { console.log('       原始:', res2.raw.slice(0, 300)); return; }
  console.log('       ret =', resp2.ret, retDesc(resp2.ret));

  // 阶段二响应若刷新了 token/ticketID, 一并持久化 (供下次继续复用)
  let updated = false;
  if (resp2.token && resp2.token !== STATE.riskToken) { STATE.riskToken = resp2.token; updated = true; }
  if (resp2.dfp && resp2.dfp.ticketID && resp2.dfp.ticketID !== STATE.ticketID) { STATE.ticketID = resp2.dfp.ticketID; updated = true; }
  if (updated) { saveState(STATE); console.log('       ★ 已更新并持久化 riskToken/ticketID'); }

  if (resp2.ret === 0 && resp2.msgBlock) {
    console.log('       ★ 最终 msgBlock (下单用的 deviceToken) =');
    console.log('         ' + resp2.msgBlock);
    console.log('       overtime =', resp2.overtime);
    console.log();
    console.log('✅ 完成! 该 msgBlock 即下单接口 /prod-api/config/orderRule/placeOrder');
    console.log('   请求体中的 deviceToken 字段。');
  } else {
    console.log('       ⚠ 未拿到最终 msgBlock。');
    console.log('       原因: content.deviceObj 的 1/10/1006 (native采集+签名) 及');
    console.log('             X-WECHAT-HOSTSIGN 为模拟占位值, 无法通过设备一致性/签名校验。');
    console.log('       真实场景需设备真实特征 + 微信运行时注入的真实 hostsign。');
    console.log('       (若因 riskToken 过期返回失败, 可删除 tools/tdid_state.json 重新首包)');
  }
}



/* ================================================================
 * 对外可编程接口: getDeviceToken()
 *   供 server.js / monitor 下单闭环调用, 无控制台交互。
 *   返回 { ok, deviceToken, captchaTokenHint, ret, raw }。
 *   逻辑与 main() 一致: 本地无 riskToken 先走 type=0 首包补全,
 *   再走 type=1 换取最终 msgBlock; 过程中的 riskToken/ticketID 落盘复用。
 * ================================================================ */
async function getDeviceToken(protoLog) {
  // UUID
  if (!STATE.uuid) { STATE.uuid = generateUUID(); saveState(STATE); }
  const uuid = STATE.uuid;
  const hostSign = buildHostSign();

  // 阶段一: 本地无 riskToken 时首包补全
  if (!STATE.riskToken) {
    const r1 = buildRequestBody(uuid, '', STATE.ticketID);
    let res1;
    try { res1 = await postJprx(r1.body, hostSign, protoLog, 'jprx-stage1(type=0)'); }
    catch (e) { return { ok: false, error: 'stage1 network: ' + e.message }; }
    const resp1 = extractResp(res1);
    if (!resp1) return { ok: false, error: 'stage1 no resp', raw: res1.raw };
    if (resp1.token) STATE.riskToken = resp1.token;
    if (resp1.dfp && resp1.dfp.ticketID) STATE.ticketID = resp1.dfp.ticketID;
    saveState(STATE);
    if (!STATE.riskToken) return { ok: false, ret: resp1.ret, error: 'stage1 rejected (no riskToken)' };
  }

  // 阶段二: type=1 换取最终 msgBlock
  const r2 = buildRequestBody(uuid, STATE.riskToken, STATE.ticketID);
  let res2;
  try { res2 = await postJprx(r2.body, hostSign, protoLog, 'jprx-stage2(type=1)'); }
  catch (e) { return { ok: false, error: 'stage2 network: ' + e.message }; }
  const resp2 = extractResp(res2);
  if (!resp2) return { ok: false, error: 'stage2 no resp', raw: res2.raw };

  let updated = false;
  if (resp2.token && resp2.token !== STATE.riskToken) { STATE.riskToken = resp2.token; updated = true; }
  if (resp2.dfp && resp2.dfp.ticketID && resp2.dfp.ticketID !== STATE.ticketID) { STATE.ticketID = resp2.dfp.ticketID; updated = true; }
  if (updated) saveState(STATE);

  if (resp2.ret === 0 && resp2.msgBlock) {
    return { ok: true, deviceToken: resp2.msgBlock, ret: 0, overtime: resp2.overtime };
  }
  return { ok: false, ret: resp2.ret, error: 'stage2 no msgBlock', raw: res2.raw };
}

if (require.main === module) {
  main().catch((e) => console.error(e));
}

module.exports = { generateUUID, generateReqId, buildRequestBody, buildBusinessObj, postJprx, dayStartMs, getDeviceToken };
