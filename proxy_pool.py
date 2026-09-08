# -*- coding: utf-8 -*-
"""
proxy_pool.py — 星空代理(xkdaili)短效动态代理池 (查票专用, 只读余票)
===============================================================================
设计(按需求):
  * 提取 API 一次性拉 200 个 (XKD_FETCH_QTY), 不逐个预检 —— 快速铺满池子。
  * 查票线程 acquire() 拿一个代理轮询; 代理被墙/超时/异常(读不到数据) 或
    3 分钟到期 -> 直接 discard 换下一个, 绝不重试坏代理。
  * 池子闲置数 < XKD_POOL_LOW 时, 后台补货线程自动再拉一批 (每次最多 200),
    持续补充 —— 一分钟 200 变 100 就继续拉, 用完再拉。
  * 注意: 查票接口无需登录也无需 Host-Ip, 所以这里不做每代理 checktime 校时;
    Host-Ip 只在下单链路(本机 IP)需要, 由 api.ensure_host_ip() 预热。

对外接口:
  pool = ProxyPool()
  pool.start()                      # 启动后台补货 + 首拉 XKD_INITIAL_FILL 个
  addr = pool.acquire()             # 拿一个 "ip:port" (可能为 None=暂时没货)
  pool.discard(addr, reason)        # 该代理报废, 立刻换下一个
  pool.size() / pool.stop()
"""
import os
import sys
import time
import threading
import collections
import urllib.request

# 确保能 import 同目录模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config as cfg


def log(msg):
    cfg.write_log(msg)


# ============================ 提取 API ============================
def _http_get_text(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def fetch_proxy_lines(qty=None, timeout=20):
    """
    调 xkdaili 提取 API (txt 格式), 返回 ["ip:port", ...]。
    成功返回 (lines, None); 失败返回 (None, 错误说明)。多个域名轮换防 403/406。
    """
    qty = int(qty or cfg.XKD_FETCH_QTY)
    qty = max(1, min(qty, cfg.XKD_EXTRACT_LIMIT))
    err = None
    for base in cfg.XKD_API_URLS:
        url = ("%s?apikey=%s&qty=%d&format=txt&split=2&sign=%s"
               % (base, cfg.XKD_APIKEY, qty, cfg.XKD_SIGN))
        try:
            txt = _http_get_text(url, timeout)
        except Exception as e:
            err = "提取异常(%s): %s" % (base, e)
            continue
        s = (txt or "").strip()
        if not s:
            err = "返回空: %s" % base
            continue
        lines = [ln.strip() for ln in s.splitlines() if ln.strip() and ":" in ln]
        if lines:
            return lines, None
        # 返回的是错误提示/状态码文本 (如 202/205/206/208/211/406 ...)
        err = "接口返回: %s" % s[:200]
    return None, err


# ============================ 代理池 ============================
class ProxyPool:
    def __init__(self, enabled=True):
        self.enabled = enabled and bool(cfg.XKD_APIKEY and cfg.XKD_SIGN)
        self._lock = threading.RLock()
        self._fetch_lock = threading.Lock()   # 防多线程同时调提取 API
        self._stock = collections.deque()     # [(addr, until_ts), ...]
        self._stop = threading.Event()
        self._thread = None
        self._last_fetch_ts = 0.0
        self._consecutive_empty = 0
        self._pulled = 0          # 累计提取数
        self._discarded = 0       # 累计报废数
        self._last_err = ""

    # ---------- 内部: 拉一批 ----------
    def _do_fetch(self, qty):
        """调一次提取 API 并入库, 返回本次入库条数。带最小间隔限速。"""
        wait = cfg.XKD_EXTRACT_GAP - (time.time() - self._last_fetch_ts)
        if wait > 0:
            time.sleep(wait)
        lines, err = fetch_proxy_lines(qty=qty)
        self._last_fetch_ts = time.time()
        if not lines:
            self._consecutive_empty += 1
            self._last_err = err or "无可用代理"
            log("代理池: 本次提取失败 (%s) [连续%d次]" % (self._last_err,
                                                     self._consecutive_empty))
            return 0
        now = time.time()
        until = now + cfg.XKD_PROXY_LIFETIME
        with self._lock:
            for addr in lines:
                self._stock.append((addr, until))
            self._pulled += len(lines)
        self._consecutive_empty = 0
        log("代理池: 提取 %d 个 (池内闲置 %d, 累计提取 %d)"
            % (len(lines), self.size(), self._pulled))
        return len(lines)

    def ensure_stock(self, target):
        """确保闲置代理 ≥ target (一次调用最多连续拉 2 批, 每批 ≤200)。"""
        if not self.enabled or self._stop.is_set():
            return 0
        if self.size() >= target:
            return self.size()
        with self._fetch_lock:
            for _ in range(2):
                if self.size() >= target:
                    break
                need = min(cfg.XKD_EXTRACT_LIMIT, target - self.size())
                if self._do_fetch(need) <= 0:
                    if self._consecutive_empty >= 3:
                        # 连续多次拉不到(配额/封禁?) -> 休息 15s 再试
                        log("代理池: 连续提取失败, 暂停 15s 后继续尝试...")
                        self._stop.wait(15)
                    break
        return self.size()

    # ---------- 对外 ----------
    def start(self, initial=None):
        """先同步首拉 initial 个(默认 XKD_INITIAL_FILL), 再启动后台补货线程。"""
        if not self.enabled:
            log("代理池: 未启用 (config 里 XKD_APIKEY/XKD_SIGN 为空)")
            return 0
        n = self.ensure_stock(initial or cfg.XKD_INITIAL_FILL)
        if not (self._thread and self._thread.is_alive()):
            t = threading.Thread(target=self._maintain_loop, daemon=True)
            self._thread = t
            t.start()
        return n

    def _maintain_loop(self):
        while not self._stop.is_set():
            try:
                if self.size() < cfg.XKD_POOL_LOW:
                    self.ensure_stock(cfg.XKD_POOL_HIGH)
            except Exception as e:
                log("代理池补货异常: %s" % e)
            self._stop.wait(cfg.XKD_REFILL_EVERY)

    def acquire(self):
        """
        拿一个未过期代理 "ip:port"。没有货时尝试现场拉一批;
        仍没有返回 None (调用方稍后再试)。
        """
        if not self.enabled:
            return None
        with self._lock:
            while self._stock:
                addr, until = self._stock.popleft()
                if until > time.time():
                    return addr
                self._discarded += 1    # 过期代理直接丢弃
        # 池空了: 同步补一批 (限一次, 由补货线程继续)
        if self.ensure_stock(min(cfg.XKD_POOL_HIGH, cfg.XKD_INITIAL_FILL)) > 0:
            with self._lock:
                while self._stock:
                    addr, until = self._stock.popleft()
                    if until > time.time():
                        return addr
                    self._discarded += 1
        return None

    def discard(self, addr, reason=""):
        """代理报废(被墙/超时/异常), 统计后立即丢弃(acquire 已出队, 无需再删)。"""
        with self._lock:
            self._discarded += 1
        # 节流打印, 避免疯狂刷屏
        if self._discarded % 5 == 0 or self._discarded <= 2:
            log("代理池: 丢弃代理 %s (%s) [已丢 %d]" % (addr, reason,
                                                     self._discarded))

    def size(self):
        with self._lock:
            return len(self._stock)

    def stats(self):
        with self._lock:
            return (self._pulled, self._discarded, len(self._stock),
                    self._last_err)

    def stop(self):
        self._stop.set()
        with self._lock:
            self._stock.clear()


if __name__ == "__main__":
    # 自测: 启动池子, 打印拉取结果
    pool = ProxyPool()
    n = pool.start()
    print("initial size:", n)
    print("stats(pulled,discarded,idle,err):", pool.stats())
    for i in range(3):
        a = pool.acquire()
        print("acquire:", a)
    pool.stop()
