import json
import os
import random
import sys
import time
from datetime import datetime


# ------------------ 屏蔽 Native 层的 GLib 警告 ------------------
def suppress_native_stderr():
    """将底层 C/C++ (GLib/GIO) 的 stderr 重定向到 /dev/null"""
    try:
        null_fd = os.open(os.devnull, os.O_RDWR)
        os.dup2(null_fd, 2)
        os.close(null_fd)
    except Exception:
        pass


suppress_native_stderr()
# -----------------------------------------------------------------

import cycronet

# 接口 URL 配置
ALL_CONFIG_URL = "https://wapticket.chnmuseum.cn/prod-api/basesetting/HallSetting/ingore/gainAllSystemConfig?channel=wxMini&requestTaskKey=gainAllSystemConfigLogin&ticketUseType=1&p=wxmini"
PRICE_URL = "https://wxmini.chnmuseum.cn/prod-api/pool/ingore/getPriceByScheduleId"

# 请求头配置（包含 Authorization Token）
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 16; PLR110 Build/BP2A.250605.015; wv) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 "
        "Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460249 "
        "MMWEBSDK/20260202 MMWEBID/8213 MicroMessenger/8.0.71.3080(0x28004750) "
        "WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64 "
        "MiniProgramEnv/android"
    ),
    "Accept": "application/json",
    "content-type": "application/json",
    "Host-Ip": "",
    "charset": "utf-8",
    "Referer": "https://servicewechat.com/wx9e2927dd595b0473/100/page-frame.html",
    "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbl91c2VyX25hbWUiOiLmuLjlrqIgMTUzMDMwMjE5MDkiLCJsb2dpbl_leHBpcmVkX3RpbWUiOjE3ODUzMTU1OTA4MjcsImxvZ2luX3VzZXJfYWNjb3VudCI6IjE1MzAzMDIxOTA5In0.5TVMh9ar8j10gHrsi4HDG6w8JCkR65nWqsKJKS0lhmk",
}


def clear_screen():
    """跨平台清屏"""
    os.system("cls" if os.name == "nt" else "clear")


def append_log_to_file(text_content):
    """追加控制台文本信息到本地 log 文件"""
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    filepath = os.path.join(log_dir, "ticket_monitor.log")

    try:
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(text_content + "\n\n")
    except Exception as e:
        print(f"⚠️ 保存日志失败: {e}")


def fetch_price_details(session, hall_id, schedule_id, query_date):
    """查询指定场次的详细票价和价格ID (priceId)"""
    params = {
        "hallId": hall_id,
        "openPerson": "1",
        "queryDate": query_date.replace("-", "/"),
        "saleMode": "1",
        "scheduleId": schedule_id,
        "p": "wxmini",
    }
    try:
        resp = session.get(PRICE_URL, headers=HEADERS, params=params, timeout=5)
        if resp.status_code == 200:
            res_json = resp.json()
            if res_json.get("code") == 200:
                return res_json.get("data", [])
    except Exception as e:
        print(f"    ⚠️  查询价格接口异常: {e}")
    return []


def parse_and_print_ticket_info(session, target_date, hall_vos, now_str):
    """解析并打印展厅、场次以及对应的 priceId 票价余票信息，同时写盘存日志"""
    lines = []
    lines.append(f"🎉 [{now_str}] 发现可用票源/展厅配置！")
    lines.append(f"📅 目标日期: {target_date}")
    lines.append("=" * 65)

    has_available = False

    for hall in hall_vos:
        hall_id = hall.get("hallId")
        hall_name = hall.get("name", "未知展厅")
        hall_ticket_pool = hall.get("ticketPool", 0)
        schedules = hall.get("scheduleTicketPoolVOS")

        lines.append(
            f"🏛️  展厅: {hall_name} (hallId: {hall_id} | 总余票: {hall_ticket_pool})"
        )

        if schedules and isinstance(schedules, list):
            for sch in schedules:
                schedule_id = sch.get("hallScheduleId")
                sch_name = sch.get("scheduleName") or sch.get(
                    "timeRange", "全天/通用"
                )
                sch_ticket_pool = sch.get("ticketPool", 0)

                lines.append(
                    f"  └─ ⏰ 场次: {sch_name} (scheduleId: {schedule_id}) | 场次余票: {sch_ticket_pool}"
                )

                if sch_ticket_pool > 0:
                    has_available = True
                    price_list = fetch_price_details(
                        session, hall_id, schedule_id, target_date
                    )

                    if price_list:
                        for item in price_list:
                            p_id = item.get("priceId")
                            p_name = item.get("priceName", "未知类型")
                            p_price = item.get("price", "0.00")
                            p_pool = item.get("ticketPool", 0)
                            lines.append(
                                f"      ├─ 🎟️  [priceId: {p_id}] {p_name} | 价格: ¥{p_price} | 余票: {p_pool}"
                            )
                    else:
                        lines.append(
                            "      └─ ⚠️  未能获取到具体的 priceId 明细"
                        )
        else:
            if hall_ticket_pool > 0:
                has_available = True
            lines.append("  └─ ⏰ 场次: 全天/无具体时段 | 🎟️ 余票: 0")

        lines.append("-" * 65)

    if not has_available:
        lines.append(
            "ℹ️  提示：配置已更新，但目前暂无可用余票 (ticketPool 为 0)"
        )
    lines.append("=" * 65)

    full_text = "\n".join(lines)

    # 1. 屏幕显示
    clear_screen()
    print(full_text)

    # 2. 本地写入 txt/log 文件
    append_log_to_file(full_text)


def check_ticket_pool():
    session = cycronet.CronetClient(chrometls="chrome_144")
    print(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始监听预约及票价接口 (随机 2~3 秒间隔)..."
    )

    while True:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

        try:
            response = session.get(ALL_CONFIG_URL, headers=HEADERS, timeout=5)

            if response.status_code == 200:
                res_json = response.json()

                if res_json.get("code") == 200:
                    data = res_json.get("data", {})
                    calendar_pools = data.get("calendarTicketPoolsByDate", [])

                    triggered = False
                    for item in calendar_pools:
                        target_date = item.get("currentDate")
                        hall_vos = item.get("hallTicketPoolVOS")

                        if hall_vos is not None:
                            triggered = True
                            parse_and_print_ticket_info(
                                session, target_date, hall_vos, now_str
                            )

                    if not triggered:
                        clear_screen()
                        print(
                            f"[{now_str}] 扫描正常：所有 hallTicketPoolVOS 均为 null",
                            end="\r",
                        )

                    interval = random.uniform(2.0, 3.0)
                    time.sleep(interval)

                else:
                    backoff = random.uniform(2.0, 5.0)
                    print(
                        f"\n[{now_str}] 接口响应异常 (code: {res_json.get('code')})，随机等待 {backoff:.2f} 秒..."
                    )
                    time.sleep(backoff)

            else:
                backoff = random.uniform(2.0, 5.0)
                print(
                    f"\n[{now_str}] HTTP 请求失败 (Status: {response.status_code})，随机等待 {backoff:.2f} 秒..."
                )
                time.sleep(backoff)

        except Exception as e:
            backoff = random.uniform(2.0, 5.0)
            print(
                f"\n[{now_str}] 请求发生异常 ({e})，重建 Session 并随机等待 {backoff:.2f} 秒..."
            )
            try:
                session = cycronet.CronetClient(chrometls="chrome_144")
            except Exception:
                pass
            time.sleep(backoff)


if __name__ == "__main__":
    check_ticket_pool()