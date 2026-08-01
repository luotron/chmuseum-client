"""
captcha_auto.py — 自动验证码识别模块
================================================================================
通过调用本地模型API (http://127.0.0.1:8000/CNM) 自动识别验证码目标位置
支持自动在后台启动服务端，并且只开启一次服务端
"""

import requests
import subprocess
import time
import threading
import atexit
import os
import sys
from typing import Dict, List, Tuple, Optional

# 全局变量，用于跟踪服务是否已启动
_server_process = None
_server_started = False
_server_lock = threading.Lock()


def _start_server_if_needed():
    """如果需要，启动本地模型API服务"""
    global _server_process, _server_started
    
    with _server_lock:
        if _server_started:
            return True
        
        print("正在启动本地验证码识别模型...")
        
        try:
            # 检查服务是否已经在运行
            try:
                response = requests.get("http://127.0.0.1:8000", timeout=2)
                if response.status_code < 500:
                    print("服务已在运行")
                    _server_started = True
                    return True
            except:
                pass  # 服务未运行，继续启动
            
            # 启动服务
            script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            app_path = os.path.join(script_dir, "captcha", "app.py")
            
            if not os.path.exists(app_path):
                print(f"错误: 找不到服务端脚本: {app_path}")
                return False
            
            # 在后台启动服务
            _server_process = subprocess.Popen(
                [sys.executable, app_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            
            # 等待服务启动
            for i in range(10):  # 最多等待10秒
                time.sleep(1)
                try:
                    response = requests.get("http://127.0.0.1:8000", timeout=2)
                    if response.status_code < 500:
                        _server_started = True
                        print("服务启动成功")
                        
                        # 注册退出时的清理函数
                        atexit.register(_stop_server)
                        return True
                except:
                    if i == 9:
                        print("服务启动超时")
                        return False
                    continue
            
        except Exception as e:
            print(f"启动服务失败: {e}")
            return False
        
        return False


def _stop_server():
    """停止服务"""
    global _server_process, _server_started
    
    with _server_lock:
        if _server_process and _server_started:
            print("正在停止本地模型API服务...")
            try:
                _server_process.terminate()
                _server_process.wait(timeout=5)
            except:
                try:
                    _server_process.kill()
                except:
                    pass
            finally:
                _server_process = None
                _server_started = False
                print("服务已停止")


class CaptchaAutoRecognizer:
    """自动验证码识别器，通过调用本地模型API获取目标位置"""
    
    def __init__(self, api_url: str = "http://127.0.0.1:8000/CNM", timeout: int = 10, auto_start_server: bool = True):
        """
        初始化自动识别器
        
        Args:
            api_url: 本地模型API地址
            timeout: 请求超时时间（秒）
            auto_start_server: 是否自动启动服务端
        """
        self.api_url = api_url
        self.timeout = timeout
        
        if auto_start_server:
            self._ensure_server_running()
    
    def _ensure_server_running(self):
        """确保服务正在运行"""
        if not self.check_api_available():
            if not _start_server_if_needed():
                print("无法启动服务，请手动启动: python captcha/app.py")
                return False
        return True
    
    def check_api_available(self) -> bool:
        """检查本地模型API是否可用"""
        try:
            # 简单尝试连接服务器
            response = requests.get(self.api_url.replace('/CNM', ''), timeout=2)
            return True
        except requests.exceptions.ConnectionError:
            return False
        except Exception:
            # 其他异常也认为服务不可用
            return False
    
    def recognize_center_point(self, 
                              original_image_base64: str, 
                              jigsaw_image_base64: str, 
                              secret_key: str) -> Optional[Tuple[int, int]]:
        """
        识别验证码目标中心点
        
        Args:
            original_image_base64: 原始图像Base64
            jigsaw_image_base64: 拼图图像Base64
            secret_key: 密钥
            
        Returns:
            目标中心点坐标 (x, y)，识别失败返回None
        """
        return self._call_api(
            mode=1,
            original_image_base64=original_image_base64,
            jigsaw_image_base64=jigsaw_image_base64,
            secret_key=secret_key
        )
    
    def recognize_bounding_box(self,
                              original_image_base64: str,
                              jigsaw_image_base64: str,
                              secret_key: str) -> Optional[Tuple[int, int, int, int]]:
        """
        识别验证码目标边界框
        
        Args:
            original_image_base64: 原始图像Base64
            jigsaw_image_base64: 拼图图像Base64
            secret_key: 密钥
            
        Returns:
            目标边界框坐标 (x1, y1, x2, y2)，识别失败返回None
        """
        return self._call_api(
            mode=2,
            original_image_base64=original_image_base64,
            jigsaw_image_base64=jigsaw_image_base64,
            secret_key=secret_key
        )
    
    def _call_api(self,
                 mode: int,
                 original_image_base64: str,
                 jigsaw_image_base64: str,
                 secret_key: str) -> Optional[Tuple]:
        """
        调用本地模型API
        
        Args:
            mode: 模式（1=中心点，2=边界框）
            original_image_base64: 原始图像Base64
            jigsaw_image_base64: 拼图图像Base64
            secret_key: 密钥
            
        Returns:
            坐标元组，识别失败返回None
        """
        try:
            # 准备请求数据
            request_data = {
                "mode": mode,
                "data": {
                    "secretKey": secret_key,
                    "originalImageBase64": original_image_base64,
                    "jigsawImageBase64": jigsaw_image_base64,
                }
            }
            
            # 发送请求
            response = requests.post(
                self.api_url,
                json=request_data,
                timeout=self.timeout
            )
            
            # 检查响应
            if response.status_code != 200:
                print(f"API请求失败，状态码: {response.status_code}")
                return None
            
            result = response.json()
            if result.get("code") != 0:
                print(f"API识别失败: {result.get('msg', '未知错误')}")
                return None
            
            data = result.get("data", {})
            if mode == 1:
                # 中心点模式
                x = data.get("x")
                y = data.get("y")
                if x is not None and y is not None:
                    return (x, y)
            elif mode == 2:
                # 边界框模式
                x1 = data.get("x1")
                y1 = data.get("y1")
                x2 = data.get("x2")
                y2 = data.get("y2")
                if all(v is not None for v in [x1, y1, x2, y2]):
                    return (x1, y1, x2, y2)
            
            return None
            
        except requests.exceptions.Timeout:
            print("API请求超时")
            return None
        except requests.exceptions.ConnectionError:
            print("无法连接到本地模型API")
            return None
        except Exception as e:
            print(f"API调用异常: {e}")
            return None


def auto_recognize_captcha(block_data: Dict, api_url: str = "http://127.0.0.1:8000/CNM") -> Optional[List[Tuple[int, int]]]:
    """
    自动识别验证码目标位置
    
    Args:
        block_data: getBlock返回的数据字典
        api_url: 本地模型API地址
        
    Returns:
        点坐标列表，识别失败返回None
    """
    # 获取必要数据
    original_image_base64 = block_data.get("originalImageBase64")
    jigsaw_image_base64 = block_data.get("jigsawImageBase64")
    secret_key = block_data.get("secretKey")
    
    if not original_image_base64 or not jigsaw_image_base64:
        print("缺少验证码图像数据")
        return None
    
    # 创建识别器（自动启动服务）
    recognizer = CaptchaAutoRecognizer(api_url=api_url, auto_start_server=True)
    
    print("正在调用本地模型API识别验证码...")
    
    # 尝试识别中心点
    result = recognizer.recognize_center_point(
        original_image_base64=original_image_base64,
        jigsaw_image_base64=jigsaw_image_base64,
        secret_key=secret_key
    )
    
    if result:
        x, y = result
        print(f"识别成功: 中心点坐标 ({x}, {y})")
        
        # 转换为像素坐标（根据原图尺寸310x155）
        # 注意：API返回的坐标已经是原图上的坐标，不需要转换
        # 但需要根据POINT_OFFSET进行调整
        import config as cfg
        px = x - cfg.POINT_OFFSET
        py = y - cfg.POINT_OFFSET
        
        # 确保坐标在图像范围内
        px = max(0, min(310, px))
        py = max(0, min(155, py))
        
        return [(px, py)]
    
    print("识别失败")
    return None


if __name__ == "__main__":
    # 测试代码
    import os
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # 模拟测试数据
    test_data = {
        "originalImageBase64": "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",
        "jigsawImageBase64": "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",
        "secretKey": "YhoWBYYGw74Jtnpc"
    }
    
    print("测试自动识别功能...")
    points = auto_recognize_captcha(test_data)
    if points:
        print(f"识别结果: {points}")
    else:
        print("识别失败或API不可用")