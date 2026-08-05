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
import random
import time
import json
from datetime import datetime

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
import argparse

import api as api
from utils.captcha import CaptchaPicker, build_point_json
from utils.captcha_auto import auto_recognize_captcha
from api import log

def manualOrder(session, ctx):
    try:
        resp = api.get_block(session, ctx)
        if not resp:
            return
        if resp.get("code") != 200 or not resp.get("data"):
            raise RuntimeError(json.dumps(resp, ensure_ascii=False)[:200])
        block = resp["data"]
        log("getBlock 成功: docType=%s secretKey=%s captchaToken=%s"
                % (block.get("docType"), block.get("secretKey"), block.get("token")))
    except Exception as e:
        log("getBlock 失败: %s" % e)
        main()  # 失败重试
        return
    picker = CaptchaPicker(block)
    points = picker.run()
    if not points:
        log("已取消点选, 退出。")
        return
    point_json_cipher = build_point_json(points, block.get("secretKey"))
    log("pointJson(加密)=%s..." % point_json_cipher[:40])
    captcha_token = block.get("token")

    device_token = api.get_device_token(session)
    if not device_token:
        log("⚠ 未获得 deviceToken, 仍尝试下单 (可能被风控拒绝)。")
        return

    resp = api.place_order(session, ctx, point_json_cipher, captcha_token, device_token)
    if resp.get("code") == 200 and resp.get("data"):
        d = resp["data"]
        log("=" * 60)
        log("🎉 下单成功! 订单号=%s 场次=%s"
            % (d.get("orderNumber"), d.get("schduleDate")))
        log("=" * 60)
    else:
        log("placeOrder 返回: %s" % json.dumps(resp, ensure_ascii=False)[:300])

def main():
    # 打印所有 cycronet 请求响应的 Set-Cookie (全局 patch, 只需一次)
    # import config as cfg
    # cfg.install_cookie_logger()
    session = cycronet.CronetClient(chrometls="chrome_133")

    from utils.captcha_auto import CaptchaAutoRecognizer
    recognizer = CaptchaAutoRecognizer()
    # 0) 先校验登录态 —— checkToken 返回 userInfo 才继续
    check_info = api.check_token(session)
    if not check_info:
        log("❌ apiToken 无效或校验失败, 请更新 config.API_TOKEN 后重试。退出。")
        return
    user_info = api.get_user_info(session)
    if not user_info:
        log("❌ 获取用户信息失败, 请检查网络或 API_TOKEN。退出。")
        return
    bind_info = api.get_real_name_bind(session)
    if not bind_info:
        log("❌ 获取实名绑定信息失败, 请检查网络或 API_TOKEN。退出。")
        return
    # 设置风控参数
    os.environ['TDID_PLUGIN_CODE'] = '0f5f79aee9b174f340e8f6d3704a6e29b101ba2353ddde239e60e2a3c2b07974'
    os.environ['TDID_HOST_SIGN'] = '{"noncestr":"02be882ced06c9b5aa04ebf6d54ceda4","timestamp":1785939102,"signature":"3fe337f24cee505e9573ce3cd540630f2b58658a"}'

    device_token = api.get_device_token(session)
    if not device_token:
        log("⚠ 未获得 deviceToken, 仍尝试下单 (可能被风控拒绝)。")
        device_token = ""
        return
    # 1) 扫描 + 锁定 (三者齐备立即停止扫描)
    ctx = api.scan_for_ticket(session)
    if not ctx:
        return

    time.sleep(random.uniform(1.0, 2.0))
    # 2) getBlock 验证码
    try:
        resp = api.get_block(session, ctx)
        if not resp:
            return
        if resp.get("code") != 200 or not resp.get("data"):
            raise RuntimeError(json.dumps(resp, ensure_ascii=False)[:200])
        block = resp["data"]
        api._save_captcha_images(block)  # 保存验证码图 + 提示图
        log("getBlock 成功: docType=%s secretKey=%s captchaToken=%s"
                % (block.get("docType"), block.get("secretKey"), block.get("token")))
    except Exception as e:
        log("getBlock 失败: %s" % e)
        main()  # 失败重试
        return

    # 3) 验证码识别
    points = None
    # 检查API是否可用
    if recognizer.check_api_available():
        log("本地模型API可用，开始识别...")
        original_image_base64 = block.get("originalImageBase64")
        jigsaw_image_base64 = block.get("jigsawImageBase64")
        secret_key = block.get("secretKey")
        
        if original_image_base64 and jigsaw_image_base64:
            result = recognizer.recognize_center_point(
                original_image_base64=original_image_base64,
                jigsaw_image_base64=jigsaw_image_base64,
                secret_key=secret_key
            )
            if result:
                x, y = result
                log(f"识别成功: 中心点坐标 ({x}, {y})")
                points = [(x, y)]
            else:
                log("自动识别失败")
        else:
            log("缺少验证码图像数据，无法自动识别")
    else:
        log("本地模型API不可用")
    
    # 如果自动识别失败或模式为manual，使用手动识别
    if not points:
        log("弹出验证码窗口，请点选目标图案后点『确认提交』...")
        picker = CaptchaPicker(block)
        points = picker.run()
        if not points:
            log("已取消点选, 退出。")
            return
    if not points:
        log("❌ 验证码识别失败，退出。")
        return

    # 4) pointJson 加密
    point_json_cipher = build_point_json(points, block.get("secretKey"))
    log("pointJson(加密)=%s..." % point_json_cipher[:40])
    captcha_token = block.get("token")

    device_token = api.get_device_token(session)
    if not device_token:
        log("⚠ 未获得 deviceToken, 仍尝试下单 (可能被风控拒绝)。")
        device_token = ""

    time.sleep(random.uniform(0.5, 1))
    resp = api.place_order(session, ctx, point_json_cipher, captcha_token, device_token)
    if resp.get("code") == 200 and resp.get("data"):
        d = resp["data"]
        log("=" * 60)
        log("🎉 下单成功! 订单号=%s 场次=%s"
            % (d.get("orderNumber"), d.get("schduleDate")))
        log("=" * 60)
    elif resp.get("code") == 502:
        log("placeOrder 返回: %s" % json.dumps(resp, ensure_ascii=False)[:300])
        log("自动识别失败，尝试手动点选验证码...")
        manualOrder(session, ctx)
    else:
        log("placeOrder 返回: %s" % json.dumps(resp, ensure_ascii=False)[:300])

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已退出。")
