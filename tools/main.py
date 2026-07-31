"""
bmuseum.py — 国博余票监控 + 自动验证码点选下单 (主入口)
================================================================================
运行流程:
  0. checkToken 校验 API_TOKEN 有效性 -> 返回 userInfo 才继续 (保存 userId/登录信息)
  1. 轮询 gainAllSystemConfig 扫描余票, 发现 hallId/scheduleId/priceId 齐备立即锁定
  2. getBlock 拿验证码图 (nonce = AES(userId:ts:date:hall:sch:platform))
  3. tkinter 可视化点选 -> pointJson = AES(secretKey, {x,y})
  4. deviceToken (node tdid_client.js)
  5. placeOrder 下单

模块划分:
  bm_config.py   配置常量 / 请求头 / 登录信息落盘路径
  bm_aes.py      纯 Python AES-128-ECB (nonce / pointJson)
  bm_api.py      接口调用 (checkToken / 校时 / nonce / 扫描 / getBlock / deviceToken / placeOrder)
  bm_captcha.py  点选窗口 + build_point_json

依赖: cycronet + Pillow + tkinter(内置) + node(deviceToken)
"""

import os
import sys


# ------------------ 屏蔽 Native 层的 GLib 警告 (仅 posix) ------------------
def _suppress_native_stderr():
    if os.name == "nt":
        return
    try:
        null_fd = os.open(os.devnull, os.O_RDWR)
        os.dup2(null_fd, 2)
        os.close(null_fd)
    except Exception:
        pass


_suppress_native_stderr()

# 确保能 import 同目录模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import cycronet

import api as api
from utils.captcha import CaptchaPicker, build_point_json
from api import log


def main():
    session = cycronet.CronetClient(chrometls="chrome_133")

    # 0) 先校验登录态 —— checkToken 返回 userInfo 才继续
    log("Step 0: 校验 apiToken (checkToken) ...")
    user_info = api.check_token(session)
    if not user_info:
        log("❌ apiToken 无效或校验失败, 请更新 bm_config.API_TOKEN 后重试。退出。")
        return
    log("✅ 登录有效, 继续执行。")

    # 1) 扫描 + 锁定 (三者齐备立即停止扫描)
    log("Step 1: 监控余票 ...")
    ctx = api.scan_for_ticket(session)
    if not ctx:
        return

    # 2) getBlock 验证码
    log("Step 2: 获取验证码 (getBlock) ...")
    try:
        block = api.get_block(session, ctx)
    except Exception as e:
        log("getBlock 失败: %s" % e)
        return

    # 3) 可视化点选
    log("Step 3: 弹出验证码窗口, 请点选目标图案后点『确认提交』...")
    picker = CaptchaPicker(block)
    points = picker.run()
    if not points:
        log("已取消点选, 退出。")
        return

    # 4) pointJson 加密
    point_json_cipher = build_point_json(points, block.get("secretKey"))
    log("pointJson(加密)=%s..." % point_json_cipher[:40])
    captcha_token = block.get("token")

    # 5) deviceToken
    log("Step 4: 获取 deviceToken ...")
    device_token = api.get_device_token()
    if not device_token:
        log("⚠ 未获得 deviceToken, 仍尝试下单 (可能被风控拒绝)。")
        device_token = ""

    # 6) placeOrder
    log("Step 5: 提交下单 (placeOrder) ...")
    api.place_order(session, ctx, point_json_cipher, captcha_token, device_token)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已退出。")
