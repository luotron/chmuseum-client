"""
captcha_auto.py — 自动验证码识别模块
================================================================================
直接加载本地 ONNX 模型 (captcha/app.py) 进程内推理, 不启动 FastAPI 服务、
不经过 HTTP 通信, 省去服务启动与网络序列化开销, 大幅提升识别速度。

对外接口与原实现保持一致:
  - CaptchaAutoRecognizer: check_api_available / recognize_center_point / recognize_bounding_box
  - auto_recognize_captcha: 便捷入口
"""

import os
import sys
from typing import Dict, List, Tuple, Optional

# 确保项目根目录在 sys.path, 才能 import captcha.app
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)


def _load_models_once():
    """
    首次调用时加载 ONNX 模型 (import captcha.app 即完成 datu/xiaotu 模型初始化)。
    之后 import 命中模块缓存, 不再重复加载。模型缺失/加载失败不抛异常, 由调用方判断。
    """
    try:
        from captcha.app import datu_model, xiaotu_model  # noqa: F401
    except Exception as e:
        print("模型加载失败: %s" % e)


class CaptchaAutoRecognizer:
    """自动验证码识别器 — 进程内直接调用 ONNX 模型, 无需本地 API 服务。"""

    def __init__(self, api_url: str = "", timeout: int = 10, auto_start_server: bool = True):
        """
        兼容旧签名; api_url / timeout / auto_start_server 已不再使用,
        识别改为直接调用本地模型。
        """
        _load_models_once()

    def check_api_available(self) -> bool:
        """模型是否可用 (能成功加载两个 ONNX 模型)。"""
        try:
            from captcha.app import datu_model, xiaotu_model
            return True
        except Exception as e:
            print("模型不可用: %s" % e)
            return False

    def recognize_center_point(self,
                              original_image_base64: str,
                              jigsaw_image_base64: str,
                              secret_key: str = "") -> Optional[Tuple[int, int]]:
        """
        识别验证码目标中心点, 返回 (x, y); 识别失败返回 None。
        """
        try:
            from captcha.app import predict_center_point
        except Exception as e:
            print("模型加载失败: %s" % e)
            return None
        return predict_center_point(original_image_base64, jigsaw_image_base64)

    def recognize_bounding_box(self,
                               original_image_base64: str,
                               jigsaw_image_base64: str,
                               secret_key: str = "") -> Optional[Tuple[int, int, int, int]]:
        """
        识别验证码目标边界框, 返回 (x1, y1, x2, y2); 识别失败返回 None。
        """
        try:
            from captcha.app import predict_bounding_box
        except Exception as e:
            print("模型加载失败: %s" % e)
            return None
        return predict_bounding_box(original_image_base64, jigsaw_image_base64)


def auto_recognize_captcha(block_data: Dict) -> Optional[List[Tuple[int, int]]]:
    """
    自动识别验证码目标位置 (直接模型推理)。

    Args:
        block_data: getBlock返回的数据字典

    Returns:
        点坐标列表, 识别失败返回None
    """
    original_image_base64 = block_data.get("originalImageBase64")
    jigsaw_image_base64 = block_data.get("jigsawImageBase64")

    if not original_image_base64 or not jigsaw_image_base64:
        print("缺少验证码图像数据")
        return None

    recognizer = CaptchaAutoRecognizer()
    result = recognizer.recognize_center_point(
        original_image_base64=original_image_base64,
        jigsaw_image_base64=jigsaw_image_base64,
        secret_key=block_data.get("secretKey", ""),
    )
    if not result:
        print("识别失败")
        return None

    x, y = result
    print(f"识别成功: 中心点坐标 ({x}, {y})")

    # 转换为像素坐标 (POINT_OFFSET 偏移 + 裁剪到原图范围)
    import config as cfg
    px = x - cfg.POINT_OFFSET
    py = y - cfg.POINT_OFFSET
    px = max(0, min(310, px))
    py = max(0, min(155, py))
    return [(px, py)]
