# -*- coding: utf-8 -*-
"""
test_getblock_rate.py — getBlock 请求频率压力测试 (独立脚本)
================================================================================
目的: 测出 getBlock 的安全轮询频率, 并区分三种响应:
  1) HTTP200 code200          -> 有票(拿到验证码)
  2) HTTP200 code550 余票不足  -> 没票(正常空转, 可继续秒刷)
  3) HTTP200 code550 访问太频繁 -> 应用层限流 (会自动解除, ~5~8s) -> 触发后应退避
  4) HTTP491 / 非JSON / 其他4xx -> WAF/风控封锁 (需停手等解除)
结论会给出: 在哪个间隔档开始出现「太频繁」/「封锁」, 用于校准 HOT_EMPTY_GAP。

用法: 用装有依赖的解释器运行(如 D:\\TOOLSOFTWARE\\Python\\python.exe);
  前置: 本地微信协议服务在线 + cache/login 有账号登录缓存(没有就先跑一次 main.py)。
  档位在顶部 PACES 改, 或用环境变量 TEST_PACES 覆盖(见下)。

环境变量(可选):
  TEST_PACES="5.0:6,4.0:6,3.0:6,2.0:8,1.0:8"
  TEST_CAP=50
  TEST_HALL / TEST_SCHEDULE / TEST_DATE   固定测试场次
  TEST_ACCOUNT=openid                     指定账号(默认用有缓存的)
"""
import os
import sys
import time
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import cycronet
except ModuleNotFoundError:
    print("找不到 cycronet (依赖没装在当前解释器里)。")
    print("请用你平时跑 main.py 的那个解释器运行本脚本, 例如:")
    print("  & D:\\TOOLSOFTWARE\\Python\\python.exe c:/Users/CHMRL/Desktop/GBCS/museum-reverse/test_getblock_rate.py")
    sys.exit(1)

import config as cfg
import login as login_mod
import api
import scanner as scan_mod
from api import log


# ============================ 可调参数 ============================
PACES = [
    ("间隔5.0s", 5.0, 6),
    ("间隔4.0s", 4.0, 6),
    ("间隔3.0s", 3.0, 6),
    ("间隔2.0s", 2.0, 8),
    ("间隔1.0s", 1.0, 8),
    ("间隔0.5s", 0.5, 6),
]
OVERALL_CAP = 50
FREQ_BACKOFF = 6.0        # 命中「访问太频繁」后退避秒数(它会自动解除)
BLOCK_BACKOFF = 15.0      # WAF封锁后由恢复探测接管, 此处仅防抖
FREQ_MSG_HINTS = ("频繁", "频率", "稍后", "过快", "太")      # 命中 => 限流
EMPTY_MSG_HINTS = ("余票", "不足", "已满", "满", "售")       # 命中 => 正常无票


def _env_paces():
    raw = os.environ.get("TEST_PACES", "")
    if not raw:
        return PACES
    out = []
    for seg in raw.split(","):
        if ":" not in seg:
            continue
        iv, n = seg.split(":")
        out.append(("间隔%ss" % iv, float(iv), int(n)))
    return out or PACES


def _classify(st, j, txt):
    """
    返回: ("200"|"empty"|"freq"|"block", code, msg)
      empty = 没票(余票不足), 可继续秒刷;
      freq  = 应用层限流(访问太频繁), 应退避数秒;
      block = WAF/HTTP 层封锁或无法解析, 应停手等恢复。
    """
    if st != 200 or j is None:
        return "block", None, "HTTP%s %s" % (st, (txt or "")[:60])
    code = j.get("code")
    msg = str(j.get("msg") or "")
    if code == 200:
        if j.get("data"):
            return "200", code, msg
        return "block", code, msg or "200但无data"
    if code == 550:
        if any(k in msg for k in FREQ_MSG_HINTS):
            return "freq", code, msg
        if any(k in msg for k in EMPTY_MSG_HINTS) or not msg:
            return "empty", code, msg
        return "freq", code, msg          # 其它 550 文案按限流处理更安全
    return "block", code, msg


# ============================ 会话/场次 ============================
def _bootstrap(session):
    """选「cache/login 有缓存」的存活账号并加载登录态; 不弹选择、不重新登录。"""
    if not login_mod.check_local_service(session):
        log("❌ 本地微信协议服务未启动。请先像跑 main.py 一样启动服务。")
        return None
    alive, _, _ = login_mod.refresh_accounts(session)
    accounts = login_mod.get_accounts(session)
    valid = [a for a in accounts
             if a.get("openid") and a.get("openid") in alive]
    if not valid:
        log("❌ 没有存活账号。")
        return None
    want = os.environ.get("TEST_ACCOUNT", "")
    pick = None
    if want:
        pick = next((a for a in valid if a.get("openid") == want), None)
    else:
        cached = [a for a in valid if cfg.login_exists(a.get("openid"))]
        if cached:
            pick = cached[0]
    if pick is None:
        log("❌ cache/login 没有任何账号登录缓存 —— 先微信会话在线跑一次 main.py 补登录。")
        return None
    log("使用已有登录缓存账号: %s (openid=%s)"
        % (pick.get("nickname") or pick.get("alias") or "", pick.get("openid")))
    if not cfg.load_login(pick.get("openid")):
        log("❌ 加载登录缓存失败 (cache/login/%s.json)。" % pick.get("openid"))
        return None
    return pick.get("openid")


def _pick_ctx(session):
    hall = os.environ.get("TEST_HALL")
    sch = os.environ.get("TEST_SCHEDULE")
    date = os.environ.get("TEST_DATE")
    if hall and sch and date:
        return {"date": date, "hallId": int(hall), "scheduleId": int(sch)}
    anon = scan_mod._local_session()
    data, err = scan_mod.fetch_all_config(anon)
    if err:
        log("拉取余票数据失败: %s" % err)
        return None
    cands = scan_mod.extract_candidates(
        data, cfg.TARGET_DATE, cfg.TARGET_HALL_IDS, cfg.TARGET_SCHEDULE_IDS)
    if not cands:
        log("当前没有可选场次, 无法测试。")
        return None
    # 探测前 2 个候选(间隔≥1s, 避免探测阶段就连发触发限流), 优先选有票(200)的
    for idx, c in enumerate(cands[:2]):
        base = {"date": c["date"], "hallId": c["hallId"],
                "scheduleId": c["sch"].get("hallScheduleId")}
        st, j, txt = _get_block_raw(session, base)
        kind, code, msg = _classify(st, j, txt)
        log("探测候选 %s hall=%s schedule=%s -> %s(code=%s) %s"
            % (base["date"], base["hallId"], base["scheduleId"], kind, code, msg[:30]))
        if kind == "200":
            return base
        if idx == 0:
            time.sleep(1.2)
    c = cands[0]
    return {"date": c["date"], "hallId": c["hallId"],
            "scheduleId": c["sch"].get("hallScheduleId")}


def _get_block_raw(session, ctx):
    """getBlock 请求, 保留 HTTP 状态; 不存图不下单。"""
    nonce = api.build_nonce(session, ctx["hallId"], ctx["scheduleId"], ctx["date"])
    params = {"nonce": nonce, "platform": str(cfg.PLATFORM),
              "docType": "1", "p": "wxmini"}
    try:
        resp = session.get(cfg.GETBLOCK_URL, headers=cfg.build_headers(),
                           params=params, timeout=8)
    except Exception as e:
        return 0, None, "请求异常: %s" % e
    text = (resp.text or "")[:200]
    try:
        j = resp.json()
    except Exception:
        j = None
    return resp.status_code, j, text


# ============================ 压测 ============================
def _summary(paces_stats, freq_stop_name):
    log("")
    log("=" * 76)
    log("getBlock 频率测试结论")
    log("=" * 76)
    log("%-10s %6s %6s %6s %8s %8s %10s" %
        ("档位", "请求", "有票200", "无票550", "太频繁", "WAF封锁", "均耗时ms"))
    for name, sent, c200, cempty, cfreq, cblock, avg, first in paces_stats:
        log("%-10s %6d %6d %6d %8d %8d %10.0f   %s"
            % (name, sent, c200, cempty, cfreq, cblock, avg,
               ("首个%s:%s" % (first[0], first[1][:26])) if first else ""))
    log("-" * 76)
    total = sum(s[1] for s in paces_stats)
    ok = sum(s[2] for s in paces_stats) + sum(s[3] for s in paces_stats)
    bad = sum(s[4] for s in paces_stats) + sum(s[5] for s in paces_stats)
    log("合计 %d 次请求: 正常 %d 次, 被限流 %d 次" % (total, ok, bad))
    if freq_stop_name:
        log("⚠ 到 [%s] 这个频率已开始出现「访问太频繁」—— 别比它更快。" % freq_stop_name)
        log("  建议秒刷间隔(HOT_EMPTY_GAP) ≥ 该档间隔×2, 且抢票主程序遇到"
            "「访问太频繁」必须退避数秒, 不能硬刷。")
    else:
        log("✅ 测到的所有频率都未触发限流(可再加快或加大样本复核)。")
    if any(s[5] for s in paces_stats):
        log("⚠ 出现 WAF 封锁(HTTP491/非JSON) —— 这类要靠恢复探测, 秒刷中碰到必须长停手。")
    log("=" * 76)


def main():
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    session = cycronet.CronetClient(chrometls="chrome_133", verify=False)
    if not _bootstrap(session):
        return
    ui = api.get_user_info(session)
    if ui and ui.get("userId"):
        cfg.USER_ID = str(ui.get("userId"))
    if not cfg.USER_ID:
        log("❌ 拿不到 userId。先跑一次 main.py 完成登录/实名。")
        return
    log("测试账号 userId=%s" % cfg.USER_ID)

    ctx = _pick_ctx(session)
    if not ctx:
        return
    log("锁定测试场次: 日期=%s hallId=%s scheduleId=%s"
        % (ctx["date"], ctx["hallId"], ctx["scheduleId"]))

    paces = _env_paces()
    cap = int(os.environ.get("TEST_CAP", OVERALL_CAP))
    log("开始压测 (总上限 %d 次):" % cap)
    total = 0
    paces_stats = []
    freq_stop_name = ""
    for name, interval, count in paces:
        if total >= cap:
            break
        c200 = cempty = cfreq = cblock = 0
        lat = []
        first = ""
        log("--- %s (每 %.1fs 一次, 本档 %d 次) ---" % (name, interval, count))
        for i in range(count):
            if total >= cap:
                break
            t0 = time.time()
            st, j, txt = _get_block_raw(session, ctx)
            ms = (time.time() - t0) * 1000
            lat.append(ms)
            total += 1
            kind, code, msg = _classify(st, j, txt)
            if kind == "200":
                c200 += 1
            elif kind == "empty":
                cempty += 1
            elif kind == "freq":
                cfreq += 1
                if not first:
                    first = ("太频繁", msg)
            else:
                cblock += 1
                if not first:
                    first = ("WAF封锁", msg or txt)
            log("  #%02d HTTP%s code=%s [%s] %-22s %.0fms%s"
                % (i + 1, st, code, kind, msg[:22], ms,
                   "   ← %s" % kind if kind in ("freq", "block") else ""))

            # 下一跳前的节奏控制
            if kind == "block":
                log("  WAF/HTTP封锁, 停手 %ds 后交给恢复探测。"
                    % int(BLOCK_BACKOFF))
                time.sleep(BLOCK_BACKOFF)
                break
            if kind == "freq":
                time.sleep(FREQ_BACKOFF + random_jitter())
            else:
                time.sleep(interval)
        avg = (sum(lat) / len(lat)) if lat else 0
        paces_stats.append((name, c200 + cempty + cfreq + cblock,
                            c200, cempty, cfreq, cblock, avg, first or None))
        if cblock:
            log("本档出现 WAF 封锁, 提前结束(避免误伤账号)。")
            break
        if cfreq and not freq_stop_name:
            freq_stop_name = name
        if cfreq >= 3:
            log("本档连续出现多次「太频繁」, 提前结束, 不再测更快档位。")
            break

    if any(s[5] for s in paces_stats):
        _recovery_probe(session, ctx)
    _summary(paces_stats, freq_stop_name)


def random_jitter():
    import random
    return random.uniform(0.5, 1.5)


# ---- WAF 封锁恢复探测 ----
def _recovery_probe(session, ctx):
    wait = float(os.environ.get("TEST_RECOVER_WAIT", "10"))
    gap = float(os.environ.get("TEST_RECOVER_GAP", "8"))
    mx = int(os.environ.get("TEST_RECOVER_MAX", "20"))
    log("")
    log("⚠ 触发 WAF 封锁 —— 恢复探测: 先静默 %.0fs, 之后每 %.0fs 轻探一次(最多 %d 次)"
        % (wait, gap, mx))
    start = time.time()
    time.sleep(wait)
    for i in range(1, mx + 1):
        st, j, txt = _get_block_raw(session, ctx)
        kind, code, msg = _classify(st, j, txt)
        log("  恢复探测#%02d (封后 %.0fs) -> [%s] code=%s %s"
            % (i, time.time() - start, kind, code, msg[:30]))
        if kind in ("200", "empty"):
            log("★ WAF 封锁持续约 %.0f 秒后解除。" % (time.time() - start))
            return
        time.sleep(gap)
    log("★ %.0f 秒后仍未恢复, 等更久或换出口再试。" % (time.time() - start))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已终止。")
