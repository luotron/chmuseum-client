/**
 * 国博余票监控 - 本地代理服务器
 * 作用：绕过浏览器 CORS + 维护 WAF(wzws_sid) cookie，转发国博接口。
 * 运行：node tools/server.js   然后浏览器打开 http://127.0.0.1:8787/
 * 无第三方依赖，仅用 Node 内置模块。
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { URL } = require('url');
const tdid = require('./tdid_client'); // TDID deviceToken 生成


const PORT = 8787;
const UA = 'Mozilla/5.0 (Linux; Android 16; PLR110 Build/BP2A.250605.015; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460249 MMWEBSDK/20260202 MMWEBID/8213 MicroMessenger/8.0.71.3080(0x28004750) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 MiniProgramEnv/android';
const REFERER = 'https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html';

// 各域名的 wzws_sid（WAF cookie），按 host 缓存
const cookieJar = {}; // { host: 'wzws_sid=...' }

// ---------------- 协议记录：把下单链路完整请求/响应写入 tools/protocol.log ----------------
const PROTO_LOG = path.join(__dirname, 'protocol.log');
function fmtHeaders(h) {
  if (!h) return '';
  return Object.keys(h).map(function (k) {
    var v = h[k];
    if (Array.isArray(v)) v = v.join('; ');
    return '  ' + k + ': ' + v;
  }).join('\n');
}
/**
 * 追加一条完整协议记录（HTTP 报文风格）到 protocol.log
 * e = { method, url, reqHeaders, reqBody, status, respHeaders, respBody }
 */
function protoLog(stage, e) {
  try {
    var uu = new URL(e.url);
    var lines = [];
    lines.push('==================================================================');
    lines.push('[' + new Date().toISOString() + '] STAGE: ' + stage);
    lines.push('------------------------------------------------------------------');
    lines.push('>>> REQUEST');
    lines.push((e.method || 'GET') + ' ' + uu.pathname + uu.search + ' HTTP/1.1');
    lines.push('Host: ' + uu.host);
    if (e.reqHeaders) lines.push(fmtHeaders(e.reqHeaders));
    if (e.reqBody) { lines.push(''); lines.push(e.reqBody); }
    lines.push('');
    lines.push('<<< RESPONSE  (HTTP ' + (e.status || '') + ')');
    if (e.respHeaders) lines.push(fmtHeaders(e.respHeaders));
    if (e.respBody != null) { lines.push(''); lines.push(String(e.respBody)); }
    lines.push('');
    fs.appendFileSync(PROTO_LOG, lines.join('\n') + '\n', 'utf8');
  } catch (err) { console.warn('[protoLog]', err.message); }
}


function setCookieFromHeaders(host, headers) {
  const sc = headers['set-cookie'];
  if (!sc) return;
  sc.forEach(function (c) {
    const m = /(wzws_sid=[^;]+)/.exec(c);
    if (m) cookieJar[host] = m[1];
  });
}

/**
 * 向国博发起一次请求（自动带上已缓存的 wzws_sid）
 */
function upstream(method, urlStr, headersExtra, bodyBuf) {
  return new Promise(function (resolve, reject) {
    const u = new URL(urlStr);
    const headers = Object.assign(
      {
        'User-Agent': UA,
        Accept: 'application/json',
        'Referer': REFERER,
        'Host-Ip': '',
        charset: 'utf-8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      headersExtra || {}
    );
    if (cookieJar[u.host]) headers['cookie'] = cookieJar[u.host];
    if (bodyBuf) {
      headers['content-type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyBuf);
    }
    const req = https.request(
      {
        method: method,
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: headers,
        timeout: 10000,
      },
      function (res) {
        setCookieFromHeaders(u.host, res.headers);
        const chunks = [];
        res.on('data', function (d) { chunks.push(d); });
        res.on('end', function () {
          let buf = Buffer.concat(chunks);
          const enc = (res.headers['content-encoding'] || '').toLowerCase();
          try {
            if (enc === 'gzip') buf = zlib.gunzipSync(buf);
            else if (enc === 'deflate') buf = zlib.inflateSync(buf);
            else if (enc === 'br') buf = zlib.brotliDecompressSync(buf);
          } catch (e) { /* 解压失败则原样返回 */ }
          resolve({ status: res.statusCode, headers: res.headers, body: buf.toString('utf8') });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', function () { req.destroy(new Error('upstream timeout')); });
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

/**
 * 带 WAF 预热重试：若返回疑似 WAF 拦截（非 JSON / 含 wzws），先无参访问一次拿 cookie 再重试。
 */
async function upstreamWithWaf(method, urlStr, headersExtra, bodyBuf) {
  let r = await upstream(method, urlStr, headersExtra, bodyBuf);
  const looksBlocked = r.status !== 200 || /wzws|WZWS|window\.location|verify.*human/i.test(r.body.slice(0, 200));
  if (looksBlocked && !/^\s*[{[]/.test(r.body)) {
    // 再试一次（此时可能已拿到 set-cookie）
    r = await upstream(method, urlStr, headersExtra, bodyBuf);
  }
  return r;
}

function sendJson(res, status, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(s);
}

function readBody(req) {
  return new Promise(function (resolve) {
    const chunks = [];
    req.on('data', function (d) { chunks.push(d); });
    req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
  });
}

const server = http.createServer(async function (req, res) {
  const u = new URL(req.url, 'http://127.0.0.1:' + PORT);
  const pathName = u.pathname;

  // 静态：首页
  if (req.method === 'GET' && (pathName === '/' || pathName === '/index.html')) {
    const file = path.join(__dirname, 'monitor.html');
    fs.readFile(file, function (err, data) {
      if (err) { res.writeHead(500); res.end('monitor.html not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    res.end();
    return;
  }
  // 441826200011111758

  try {
    // ---- 1. checkToken：验证 apiToken，返回用户信息 ----
    if (pathName === '/api/checkToken' && req.method === 'POST') {
      const body = await readBody(req);
      const j = JSON.parse(body || '{}');
      const r = await upstreamWithWaf(
        'POST',
        'https://uu.chnmuseum.cn/prod-api/api/checkToken',
        {},
        Buffer.from(JSON.stringify({ apiToken: j.apiToken, p: 'wxmini' }))
      );
      res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(r.body);
      return;
    }

    // ---- 2. 余票总配置 ----
    if (pathName === '/api/allConfig' && req.method === 'GET') {
      const token = req.headers['authorization'] || '';
      const url = 'https://wapticket.chnmuseum.cn/prod-api/basesetting/HallSetting/ingore/gainAllSystemConfig?channel=wxMini&requestTaskKey=gainAllSystemConfigLogin&ticketUseType=1&p=wxmini';
      const r = await upstreamWithWaf('GET', url, token ? { Authorization: token } : {});
      res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(r.body);
      return;
    }

    // ---- 3. 场次价格明细 ----
    if (pathName === '/api/price' && req.method === 'GET') {
      const token = req.headers['authorization'] || '';
      const hallId = u.searchParams.get('hallId');
      const scheduleId = u.searchParams.get('scheduleId');
      const queryDate = (u.searchParams.get('queryDate') || '').replace(/-/g, '/');
      const url = 'https://wxmini.chnmuseum.cn/prod-api/pool/ingore/getPriceByScheduleId'
        + '?hallId=' + encodeURIComponent(hallId)
        + '&openPerson=1&queryDate=' + encodeURIComponent(queryDate)
        + '&saleMode=1&scheduleId=' + encodeURIComponent(scheduleId) + '&p=wxmini';
      const r = await upstreamWithWaf('GET', url, token ? { Authorization: token } : {});
      res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(r.body);
      return;
    }

    // ---- 3.5 腾讯校时：getBlock 的 nonce 时间戳来源 ----
    // GET https://vv.video.qq.com/checktime?otype=json
    //   返回: QZOutputJson={"s":"o","t":1785402089,"ip":"...","pos":"---","rand":"..."};
    //   其中 t 为秒级时间戳；nonce 用 t*1000（即 t + "000"）
    if (pathName === '/api/checktime' && req.method === 'GET') {
      try {
        const r = await upstream('GET', 'https://vv.video.qq.com/checktime?otype=json', {});
        const m = /"t"\s*:\s*(\d+)/.exec(r.body);
        if (m) { sendJson(res, 200, { t: Number(m[1]) }); }
        else { sendJson(res, 200, { t: Math.floor(Date.now() / 1000), fallback: true, raw: r.body.slice(0, 120) }); }
      } catch (e) {
        sendJson(res, 200, { t: Math.floor(Date.now() / 1000), fallback: true, error: String(e && e.message || e) });
      }
      return;
    }
    // ---- 4. getBlock：获取验证码（需 Authorization + nonce） ----
    if (pathName === '/api/getBlock' && req.method === 'GET') {
      const token = req.headers['authorization'] || '';
      const nonce = u.searchParams.get('nonce') || '';
      const platform = u.searchParams.get('platform') || '2';
      const docType = u.searchParams.get('docType') || '1';
      const url = 'https://wxmini.chnmuseum.cn/prod-api/pool/getBlock'
        + '?nonce=' + encodeURIComponent(nonce)
        + '&platform=' + encodeURIComponent(platform)
        + '&docType=' + encodeURIComponent(docType)
        + '&p=wxmini';
      const r = await upstreamWithWaf('GET', url, token ? { Authorization: token } : {});
      res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(r.body);
      return;
    }

    // ---- 5. deviceToken：调用 TDID 两阶段流程换取 msgBlock（placeOrder 的 deviceToken） ----
    if (pathName === '/api/deviceToken' && req.method === 'GET') {
      const r = await tdid.getDeviceToken();
      sendJson(res, 200, r);
      return;
    }

    // ---- 6. placeOrder：下单（透传前端拼好的完整 body，自动带 wzws_sid + Authorization） ----
    if (pathName === '/api/placeOrder' && req.method === 'POST') {
      const token = req.headers['authorization'] || '';
      const body = await readBody(req);
      const url = 'https://wxmini.chnmuseum.cn/prod-api/config/orderRule/placeOrder';
      const r = await upstreamWithWaf('POST', url, token ? { Authorization: token } : {}, Buffer.from(body || '{}'));
      res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(r.body);
      return;
    }

    sendJson(res, 404, { error: 'not found', path: pathName });
  } catch (e) {
    sendJson(res, 502, { error: 'proxy error', message: String(e && e.message || e) });
  }
});

server.listen(PORT, '127.0.0.1', function () {
  console.log('===============================================');
  console.log(' 国博余票监控代理已启动');
  console.log(' 打开浏览器访问: http://127.0.0.1:' + PORT + '/');
  console.log('===============================================');
});
