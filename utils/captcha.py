"""
bm_captcha.py — 验证码可视化点选窗口 + pointJson 生成
================================================================================
- CaptchaPicker: tkinter 窗口显示 getBlock 的验证码图 (310x155, 与原图 1:1),
  用户点选目标图案。取点逻辑与 pointJson.html 一致: 输出 x=px-10, y=py-10。
- build_point_json: 按 secretKey 做 AES-128-ECB 加密 -> Base64。

依赖: Pillow (getBlock 返回 JPEG, tkinter 原生不支持) + tkinter (内置)。
"""

import base64
import io
import json
import random
import re
import tkinter as tk

import config as cfg
from utils.aes import aes_ecb_b64



class CaptchaPicker:
    """显示验证码原图, 用户点击选择目标图案 (仅支持单点点选 / 重选 / 确认)。"""


    PANEL_W = 310
    PANEL_H = 155

    def __init__(self, block_data):
        self.d = block_data
        self.points = []       # [(px, py), ...] 图上像素坐标
        self.result = None     # 确认后的 points 列表
        self._photo = None
        self._jig_photo = None

        self.root = tk.Tk()
        self.root.title("请完成安全验证 - 点选验证码")
        self.root.resizable(False, False)

        tips = block_data.get("tips") or "请点选出指定的图案"
        tk.Label(self.root, text=tips, font=("Microsoft YaHei", 12),
                 fg="#d44421").pack(padx=12, pady=(10, 4))

        # 原图 canvas
        self.canvas = tk.Canvas(self.root, width=self.PANEL_W, height=self.PANEL_H,
                                highlightthickness=1, highlightbackground="#ddd",
                                cursor="crosshair")
        self.canvas.pack(padx=12)
        self._load_image()
        self.canvas.bind("<Button-1>", self._on_click)

        # jigsaw / 目标图案 (若有) — getBlock 返回 JPEG, 用 Pillow 解码
        jig = block_data.get("jigsawImageBase64")
        if jig:
            try:
                self._jig_photo = self._pil_photo(jig)
                tk.Label(self.root, text="目标图案 / 拼图:",
                         font=("Microsoft YaHei", 9), fg="#888").pack(pady=(8, 0))
                tk.Label(self.root, image=self._jig_photo).pack()
            except Exception:
                pass

        self.info = tk.Label(self.root, text="点击图片选择目标 (仅可选一个点) →",
                             font=("Consolas", 9), fg="#555", wraplength=320,
                             justify="left")

        self.info.pack(padx=12, pady=6)

        btn_frame = tk.Frame(self.root)
        btn_frame.pack(pady=(0, 12))
        tk.Button(btn_frame, text="重选", width=8,
                  command=self._reset).pack(side="left", padx=5)
        tk.Button(btn_frame, text="确认提交", width=10, bg="#1abd6c", fg="white",
                  command=self._confirm).pack(side="left", padx=5)

    def _pil_photo(self, b64_str, size=None):
        """用 Pillow 把 (JPEG) base64 解码为 tkinter 可用的 PhotoImage"""
        from PIL import Image, ImageTk
        raw = base64.b64decode(b64_str)
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        if size:
            img = img.resize(size)
        return ImageTk.PhotoImage(img)

    def _load_image(self):
        """加载原图 (JPEG) 并按 310x155 显示。tkinter 原生不支持 JPEG, 用 Pillow 解码。"""
        try:
            self._photo = self._pil_photo(self.d["originalImageBase64"],
                                          (self.PANEL_W, self.PANEL_H))
        except ImportError:
            raise RuntimeError("缺少 Pillow, 请先安装: pip install pillow")
        self.canvas.create_image(0, 0, anchor="nw", image=self._photo)

    def _on_click(self, event):
        px = max(0, min(self.PANEL_W, event.x))
        py = max(0, min(self.PANEL_H, event.y))
        # 仅支持单点点选: 每次点击覆盖之前的选择
        self.canvas.delete("mark")
        self.points = [(px, py)]
        r = 11
        self.canvas.create_oval(px - r, py - r, px + r, py + r,
                                outline="#1abd6c", width=2, fill="", tags="mark")
        self.canvas.create_text(px, py, text="1", fill="#1abd6c",
                                font=("Arial", 10, "bold"), tags="mark")
        self._update_info()


    def _reset(self):
        self.points = []
        self.canvas.delete("mark")
        self._update_info()

    def _update_info(self):
        if not self.points:
            self.info.config(text="点击图片选择目标 →")
            return
        parts = []
        for i, (px, py) in enumerate(self.points, 1):
            parts.append("点%d 像素(%.1f,%.1f) -> 输出(%.1f,%.1f)"
                         % (i, px, py, px - cfg.POINT_OFFSET, py - cfg.POINT_OFFSET))
        self.info.config(text="\n".join(parts))

    def _confirm(self):
        if not self.points:
            self.info.config(text="⚠ 请先在图片上点选目标!")
            return
        self.result = list(self.points)
        self.root.destroy()

    def run(self):
        self.root.mainloop()
        return self.result


def build_point_json(points, secret_key):
    """
    按 pointJson.html / monitor.html 逻辑生成加密 pointJson:
      单点:  明文 = {"x": px-10, "y": py-10}
      多点:  明文 = {"pointVOS":[{"x":px-10,"y":py-10}, ...]} (文字点选)
    然后 AES-128-ECB(secretKey) -> Base64。secret_key 为空则返回明文 (调试)。

    坐标均添加 ±0.5px 随机偏差以模拟人工点击。
    """
    off = cfg.POINT_OFFSET
    px, py = points[0]
    plain_obj = {
        "x": float(px - off) + random.uniform(-0.5, 0.5),
        "y": float(py - off) + random.uniform(-0.5, 0.5),
    }
    plain = json.dumps(plain_obj, separators=(",", ":"), ensure_ascii=False)
    # 统一浮点数精度为 15 位小数, 匹配小程序 JSON.stringify 的输出格式
    plain = re.sub(
        r"(?<=:)-?\d+\.\d+",
        lambda m: format(float(m.group()), ".15f"),
        plain,
    )
    print("pointJson 明文:", plain)
    if not secret_key:
        return plain
    return aes_ecb_b64(plain, secret_key)
