# -*- coding: utf-8 -*-
"""
scanner.py — 查票监视器 (查票与下单分离)
===============================================================================
查票逻辑完全独立成后台线程组:
  * 代理查票线程: 每个线程持一个 xkdaili 代理(requests 轻量会话), 高频轮询
    免登录余票接口; 代理读不到数据(被墙/超时/异常/HTTP错误)立即丢弃换下一个,
    池子由 proxy_pool 自动按水位续拉 (每次 200)。
  * 本地兜底线程: 代理池暂时为空时, 自动用本机匿名轮询顶上。
  * 每个线程解析出「当前最优场次」, 只要 出现/消失/换场/放票(>0) 变化,
    就刷新共享 ctx 并 epoch+=1 唤醒下单线程 —— 下单线程只需 wait_change()。

下单(getBlock/验证码/placeOrder)走本机 IP 的主会话, 与本文件互不阻塞:
查票线程永远不会因验证码弹窗/下单重试而停摆。

对外接口:
  mon = TicketMonitor(pool)           # pool 可为 None(只用本地)
  mon.start()                         # 启动后台查票线程
  epoch, ctx = mon.wait_change(epoch) # 阻塞到场次状态变化, 返回新状态
  mon.epoch_value() / mon.snapshot() / mon.stop()
"""
import os
import sys
import time
import random
import threading
import urllib3

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import config as cfg
from api import is_in_time_range, _date_sort_key, _schedule_time_key, log


# ============================ 拉取 + 解析 ============================
def fetch_all_config(client):
    """
    拉一次 gainAllSystemConfig。HTTP200 且 code==200 返回 (data, None);
    否则返回 (None, 原因)。网络层/HTTP/业务失败都走 err, 供换代理判断。
    client 为 requests.Session (代理或本机)。
    """
    try:
        resp = client.get(cfg.ALL_CONFIG_URL, headers=cfg.build_headers_anon(),
                          timeout=(cfg.XKD_POLL_TIMEOUT, cfg.XKD_POLL_TIMEOUT),
                          verify=False)
        if resp.status_code != 200:
            return None, "HTTP %s" % resp.status_code
        j = resp.json()
    except Exception as e:
        return None, "请求异常: %s" % e
    if j.get("code") != 200:
        return None, "接口 code=%s msg=%s" % (j.get("code"), str(j.get("msg"))[:80])
    return j.get("data") or {}, None


def _passes_filters(cand_date, hall_id, schedule_id,
                    target_date, hall_ids, schedule_ids):
    if target_date and cand_date != target_date:
        return False
    if hall_ids and hall_id not in hall_ids:
        return False
    if schedule_ids and schedule_id not in schedule_ids:
        return False
    # 与原版一致: 放票时段(16:55~17:55)只看基本陈列
    if is_in_time_range() and hall_id != 1:
        return False
    return True


def extract_candidates(data, target_date="", hall_ids=(1,), schedule_ids=()):
    """
    从 gainAllSystemConfig 的 data 提取候选场次, 并按原版 api.scan_for_ticket
    相同规则排序: 有余票优先 / hallId==1 优先 / 日期最大 / 时间最大。
    返回 list[ {date, hallId, hallName, sch, pool} ]。
    """
    pools = (data or {}).get("calendarTicketPoolsByDate", []) or []
    cands = []
    for item in pools:
        date_i = item.get("currentDate")
        for hall in (item.get("hallTicketPoolVOS") or []):
            hall_id = hall.get("hallId")
            if hall_id is None:
                continue
            for sch in (hall.get("scheduleTicketPoolVOS") or []):
                sched_id = sch.get("hallScheduleId")
                if sched_id is None:
                    continue
                if not _passes_filters(date_i, hall_id, sched_id,
                                       target_date, hall_ids, schedule_ids):
                    continue
                cands.append({
                    "date": date_i,
                    "hallId": hall_id,
                    "hallName": hall.get("name", "未知展厅"),
                    "sch": sch,
                    "pool": sch.get("ticketPool", 0) or 0,
                })
    cands.sort(key=lambda c: (
        0 if c["pool"] > 0 else 1,
        0 if c["hallId"] == 1 else 1,
        -_date_sort_key(c["date"]),
        -_schedule_time_key(c["sch"]),
    ))
    return cands


def best_candidate(data, target_date=None, hall_ids=None, schedule_ids=None):
    """当前数据里的最优候选 (排序后第一个); 没有返回 None。"""
    tdate = target_date if target_date is not None else cfg.TARGET_DATE
    hids = hall_ids if hall_ids is not None else cfg.TARGET_HALL_IDS
    sids = schedule_ids if schedule_ids is not None else cfg.TARGET_SCHEDULE_IDS
    cands = extract_candidates(data, tdate, hids, sids)
    return cands[0] if cands else None


def _resolve_ctx_local(best):
    """
    给最优候选查价, 返回可下单 ctx
    {hallId, scheduleId, priceId, date, hallName, schedName, priceName, ticketPool}。
    查价接口(getPriceByScheduleId)是免登录只读接口, 且每个场次状态只需查一次 ——
    走本地快速连接, 避免慢代理拖累 ctx 产出; 查不到有效价返回 None。
    """
    import requests
    params = {
        "hallId": best["hallId"],
        "openPerson": "1",
        "queryDate": str(best["date"]).replace("-", "/"),
        "saleMode": "1",
        "scheduleId": best["sch"].get("hallScheduleId"),
        "p": "wxmini",
    }
    try:
        r = requests.get(cfg.PRICE_URL, headers=cfg.build_headers_anon(),
                         params=params, timeout=5, verify=False)
        if r.status_code != 200:
            return None
        j = r.json()
        if j.get("code") != 200:
            return None
        price_list = j.get("data") or []
    except Exception:
        return None
    valid_prices = [p for p in price_list if p.get("priceId") is not None]
    if not valid_prices:
        return None
    avail_prices = [p for p in valid_prices if (p.get("ticketPool", 0) or 0) > 0]
    chosen = avail_prices or valid_prices
    p = max(chosen, key=lambda x: x.get("ticketPool", 0) or 0)
    sch_pool = best["pool"]
    p_pool = p.get("ticketPool", 0) or 0
    return {
        "hallId": best["hallId"],
        "scheduleId": best["sch"].get("hallScheduleId"),
        "priceId": p.get("priceId"),
        "date": best["date"],
        "hallName": best["hallName"],
        "schedName": best["sch"].get("scheduleName") or best["sch"].get("timeRange", "全天"),
        "priceName": p.get("priceName", "未知类型"),
        "ticketPool": min(sch_pool, p_pool) if p_pool > 0 else 0,
    }


def log_lock(ctx):
    log("=" * 60)
    log("🎉 发现可下单场次并锁定! 停止扫描")
    log("   展厅: %s (hallId=%s)" % (ctx["hallName"], ctx["hallId"]))
    log("   场次: %s (scheduleId=%s)" % (ctx["schedName"], ctx["scheduleId"]))
    log("   票价: %s (priceId=%s)" % (ctx["priceName"], ctx["priceId"]))
    log("   日期: %s" % ctx["date"])
    log("=" * 60)


# ============================ 查票监视器 ============================
def _sig_of(best):
    """最优候选的身份签名: 日期/展厅/场次/是否放票(>0)。任何变化都算新状态。"""
    if best is None:
        return None
    return (best["date"], best["hallId"],
            best["sch"].get("hallScheduleId"), best["pool"] > 0)


def _proxy_session(addr):
    """requests 轻量会话: 每个代理一个会话, 长连接复用; 换代理即新建(无 native 负担)。"""
    import requests
    s = requests.Session()
    s.proxies = {"http": "http://" + addr, "https": "http://" + addr}
    s.verify = False
    return s


def _local_session():
    import requests
    s = requests.Session()
    s.verify = False
    return s


class TicketMonitor:
    """
    后台查票监视器: 常驻轮询, 场次状态一变就推送 (epoch 自增 + 共享 ctx)。
    pool=None 时只用本地匿名轮询; pool 存在时用代理线程并发查, 本地兜底。
    """

    def __init__(self, pool=None, workers=None):
        self.pool = pool
        self.workers = int(workers or cfg.XKD_SCAN_WORKERS)
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._threads = []
        # 共享状态
        self._epoch = 0
        self._ctx = None
        self._evt = threading.Event()
        self._sig = "INIT"          # 上次已处理的签名 (初始占位触发首查)
        self._need_ctx = False      # 有候选待解析出 priceId
        self._resolving = False
        self._had_ctx = False
        self._last_beat = 0.0
        self._poll_times = []       # 成功轮询时间戳(最近10秒窗口), 算查票频率

    # ---------- 状态读取 ----------
    def epoch_value(self):
        return self._epoch

    def snapshot(self):
        with self._lock:
            return self._epoch, self._ctx

    def wait_change(self, epoch):
        """阻塞到 epoch 变化, 返回 (epoch, ctx)。ctx 可能为 None(场次消失)。"""
        while self._epoch == epoch and not self._stop.is_set():
            self._evt.wait(0.4)
            self._evt.clear()
        with self._lock:
            return self._epoch, self._ctx

    def _mark_poll(self):
        """记录一次成功轮询 (算每秒查票次数, 最近10秒窗口)。"""
        now = time.time()
        with self._lock:
            self._poll_times.append(now)
            while self._poll_times and self._poll_times[0] < now - 10:
                self._poll_times.pop(0)

    def _rps(self):
        """每秒查票次数 ≈ 最近10秒成功轮询数/10。"""
        with self._lock:
            now = time.time()
            n = sum(1 for t in self._poll_times if t >= now - 10)
        return n / 10.0

    # ---------- 状态写入 ----------
    def _on_data(self, data):
        """处理一次成功拉到的余票数据 (查价走本地快速连接, 不占代理轮询线程)。"""
        best = best_candidate(data)
        sig = _sig_of(best)
        need_resolve = False
        with self._lock:
            if sig != self._sig:
                self._sig = sig
                self._need_ctx = best is not None
                self._had_ctx = self._ctx is not None
                if best is None:
                    # 场次配置全部消失
                    if self._ctx is not None:
                        log("查票: 场次已下架/消失, 等待下一波...")
                    self._ctx = None
                    self._need_ctx = False
                    self._epoch += 1
                    self._evt.set()
                elif not self._resolving:
                    self._resolving = True
                    need_resolve = True
            elif self._need_ctx and not self._resolving and best is not None:
                # 上次价没查出来, 换轮继续查
                self._resolving = True
                need_resolve = True
        if need_resolve and best is not None:
            ctx = _resolve_ctx_local(best)     # 本地快速查价
            with self._lock:
                self._resolving = False
                if self._sig == sig and self._need_ctx:
                    self._ctx = ctx          # None 表示价没查到, 下轮再试
                    self._need_ctx = ctx is None
                    if ctx is not None:
                        if not self._had_ctx:
                            log("查票: 出现可下单场次 → %s (scheduleId=%s) 日期=%s"
                                % (ctx["schedName"], ctx["scheduleId"], ctx["date"]))
                        else:
                            log("查票: 场次状态变化 → %s (scheduleId=%s) 日期=%s"
                                % (ctx["schedName"], ctx["scheduleId"], ctx["date"]))
                        self._epoch += 1
                        self._evt.set()

    # ---------- 线程 ----------
    def _proxy_worker(self, idx):
        addr = None
        session = None
        hold_since = 0.0
        while not self._stop.is_set():
            if addr is None or time.time() - hold_since > cfg.XKD_PROXY_LIFETIME:
                # 换/取一个新代理 (到期自动更换)
                if self.pool is not None:
                    new_addr = self.pool.acquire()
                    if new_addr is None:
                        time.sleep(0.4)
                        continue
                    addr = new_addr
                    hold_since = time.time()
                    try:
                        session = _proxy_session(addr)
                    except Exception:
                        session = None
                        continue
            data, err = fetch_all_config(session)
            if err:
                # 读不到数据 = 代理被墙/超时/异常 -> 换下一个
                self.pool.discard(addr, err)
                addr, session = None, None
                continue
            self._mark_poll()
            self._on_data(data)
            self._beat()
            time.sleep(random.uniform(*cfg.XKD_POLL_INTERVAL))

    def _local_worker(self):
        """
        本地兜底: 只在代理池为空时顶上 (代理恢复就退让); pool=None 时专职本地查。
        """
        session = _local_session()
        while not self._stop.is_set():
            if self.pool is not None and self.pool.size() > 0:
                time.sleep(1.0)
                continue
            data, err = fetch_all_config(session)
            if not err:
                self._mark_poll()
                self._on_data(data)
                self._beat()
            time.sleep(random.uniform(*cfg.LOCAL_POLL_INTERVAL))

    def _beat(self):
        """周期性心跳日志 (约每 20s 一次, 各线程竞争打印一次)。"""
        now = time.time()
        if now - self._last_beat < 20:
            return
        with self._lock:
            if now - self._last_beat < 20:
                return
            self._last_beat = now
        cur = "无" if self._ctx is None else self._ctx["date"] + " " + self._ctx["schedName"]
        rps = self._rps()
        if self.pool is not None:
            pulled, discarded, idle, err = self.pool.stats()
            log("查票运行中: 场次=%s | 查票频率≈%.1f 次/秒 (并发%d路) | 池闲置%d代理 (累计提取%d/报废%d)"
                % (cur, rps, self.workers, idle, pulled, discarded))
        else:
            log("查票运行中 (本地): 场次=%s | 查票频率≈%.1f 次/秒" % (cur, rps))
        if rps < cfg.XKD_MIN_RPS:
            log("⚠ 查票频率低于 %d 次/秒 —— 把 config.py 的 XKD_SCAN_WORKERS 调大即可提速"
                % cfg.XKD_MIN_RPS)

    # ---------- 启停 ----------
    def start(self):
        """启动查票线程。返回启动的线程数。"""
        if self._threads:
            return len(self._threads)
        n = self.workers if self.pool is not None else 1
        self._threads = [
            threading.Thread(target=self._proxy_worker, args=(i,), daemon=True)
            for i in range(n)
        ]
        if cfg.LOCAL_SCAN_BACKUP or self.pool is None:
            self._threads.append(threading.Thread(target=self._local_worker,
                                                  daemon=True))
        for t in self._threads:
            t.start()
        log("查票监视器启动: %d 路代理并发查票%s"
            % (n, " + 本地兜底" if self.pool is not None else ""))
        return len(self._threads)

    def stop(self):
        self._stop.set()
        self._evt.set()
