"""
captcha_auto.py — 自动验证码识别模块 (YOLO 检测 + ResNet50 孪生匹配)
================================================================================
按 YOLO 检测 + ResNet50 孪生匹配的识别方法实现 (生产方案):
  1. YOLO (best.onnx, yolo v3 训练)  在大图里检测所有目标 bbox;
  2. ResNet50 (resnet50_embed.onnx)  把「目标小图」和「每个 bbox 裁剪图」都编成
     2048 维 embedding;
  3. 余弦相似度最高的 bbox 中心 = 目标位置; 多字 (wordsCount>1) 时取相似度 topN。

相比旧方案 (xiaotu 小图分类 → datu 大图筛同类) 的改进:
  - 不依赖"小图分类再筛同类"两阶段, 类别相近/光照差异时不易认错;
  - 直接比对特征相似度, 对目标尺度/姿态变化更鲁棒 (文档称单字 90%+)。

模型文件 (已复制到 captcha/models/):
  best.onnx            YOLO 大图检测
  resnet50_embed.onnx  ResNet50 特征提取 (孪生)

对外接口与原实现保持一致:
  CaptchaAutoRecognizer.check_api_available / recognize_center_point / recognize_center_points
  auto_recognize_captcha (便捷入口, 返回多点列表)
"""

import base64
import os
import sys
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import onnxruntime as ort

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

# ---- 模型路径 ----
_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "..", "captcha", "models")
YOLO_ONNX = os.path.join(_MODELS_DIR, "best.onnx")
RESNET_ONNX = os.path.join(_MODELS_DIR, "resnet50_embed.onnx")

# ---- 推理参数 (与模型原始训练源码一致) ----
INFER_IMGSZ = 640
INFER_CONF = 0.02
NMS_IOU = 0.45
MIN_AFFINITY = 0.25          # 目标 embedding 与 bbox 的最低余弦相似度 (低于=失败)
NUM_THREADS = 2

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

_SESSIONS = {"yolo": None, "resnet": None}


# ============ 图像工具 ============

def decode_b64_image(b64: str) -> Optional[np.ndarray]:
    """base64 -> BGR np.ndarray; 失败返回 None。"""
    if not b64:
        return None
    b64 = b64.strip()
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    try:
        data = base64.b64decode(b64)
        arr = np.frombuffer(data, dtype=np.uint8)
        if arr.size == 0:
            return None
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception:
        return None


def strip_center(img: np.ndarray) -> np.ndarray:
    """目标小图宽>高时取中间正方形 (水果恒在正中, 去两侧干扰)。"""
    h, w = img.shape[:2]
    if w <= h:
        return img
    x1 = (w - h) // 2
    return img[:, x1:x1 + h]


# ============ YOLO 预处理 / 后处理 ============

def letterbox(img: np.ndarray, new_shape: int = 640,
              color: tuple = (114, 114, 114)):
    """等比缩放 + 灰色补边到 new_shape × new_shape。返回 (padded, scale, pad)。"""
    h, w = img.shape[:2]
    scale = min(new_shape / h, new_shape / w)
    new_h, new_w = int(round(h * scale)), int(round(w * scale))
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    pad_h, pad_w = new_shape - new_h, new_shape - new_w
    top, bottom = pad_h // 2, pad_h - pad_h // 2
    left, right = pad_w // 2, pad_w - pad_w // 2
    padded = cv2.copyMakeBorder(resized, top, bottom, left, right,
                                cv2.BORDER_CONSTANT, value=color)
    return padded, scale, (left, top)


def yolo_preprocess(img: np.ndarray, imgsz: int = 640):
    """YOLO 输入预处理: BGR→RGB, letterbox, HWC→CHW, /255。"""
    padded, scale, pad = letterbox(img, imgsz)
    rgb = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB)
    tensor = rgb.transpose(2, 0, 1).astype(np.float32) / 255.0
    return tensor[np.newaxis, ...], scale, pad


def yolo_postprocess(output: np.ndarray, scale: float, pad: Tuple[int, int],
                     orig_shape: Tuple[int, int],
                     conf_thr: float = INFER_CONF,
                     iou_thr: float = NMS_IOU):
    """
    YOLO ONNX 输出 (1, 5, N) → 检测框列表 [(x1,y1,x2,y2), conf] (原图坐标)。
    输出格式: 5 = [cx, cy, w, h, cls0_conf] (单类)。
    """
    pred = output[0].transpose(1, 0)  # (N, 5)
    if pred.shape[1] < 5:
        return []
    boxes_xywh = pred[:, :4]
    scores = pred[:, 4:]
    max_scores = scores.max(axis=1)
    mask = max_scores >= conf_thr
    if not mask.any():
        return []
    boxes_xywh = boxes_xywh[mask]
    max_scores = max_scores[mask]

    # xywh -> xyxy (letterboxed 坐标系)
    xyxy = np.zeros_like(boxes_xywh)
    xyxy[:, 0] = boxes_xywh[:, 0] - boxes_xywh[:, 2] / 2
    xyxy[:, 1] = boxes_xywh[:, 1] - boxes_xywh[:, 3] / 2
    xyxy[:, 2] = boxes_xywh[:, 0] + boxes_xywh[:, 2] / 2
    xyxy[:, 3] = boxes_xywh[:, 1] + boxes_xywh[:, 3] / 2

    # NMS
    boxes_list = xyxy.astype(np.float32).tolist()
    scores_list = max_scores.astype(np.float32).tolist()
    idx = cv2.dnn.NMSBoxes(boxes_list, scores_list, conf_thr, iou_thr)
    if len(idx) == 0:
        return []
    idx = np.array(idx).flatten()

    # letterboxed -> 原图
    orig_h, orig_w = orig_shape
    pad_x, pad_y = pad
    out = []
    for i in idx:
        x1, y1, x2, y2 = xyxy[i]
        x1 = max((x1 - pad_x) / scale, 0)
        y1 = max((y1 - pad_y) / scale, 0)
        x2 = min((x2 - pad_x) / scale, orig_w)
        y2 = min((y2 - pad_y) / scale, orig_h)
        if x2 - x1 >= 8 and y2 - y1 >= 8:
            out.append(((int(x1), int(y1), int(x2), int(y2)),
                        float(max_scores[i])))
    return out


# ============ ResNet50 预处理 ============

def resnet_preprocess(img_bgr: np.ndarray) -> np.ndarray:
    """BGR → RGB → 224×224 → ImageNet normalize → CHW。"""
    if img_bgr is None or img_bgr.size == 0:
        return np.zeros((3, 224, 224), dtype=np.float32)
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_LINEAR)
    normalized = (resized.astype(np.float32) / 255.0 - IMAGENET_MEAN) / IMAGENET_STD
    return normalized.transpose(2, 0, 1)


# ============ 识别器 ============

def _load_sessions() -> bool:
    """懒加载两个 ONNX session (进程内单例)。失败返回 False。"""
    if _SESSIONS["yolo"] is not None and _SESSIONS["resnet"] is not None:
        return True
    try:
        so = ort.SessionOptions()
        so.intra_op_num_threads = NUM_THREADS
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        providers = ["CPUExecutionProvider"]
        _SESSIONS["yolo"] = ort.InferenceSession(
            YOLO_ONNX, sess_options=so, providers=providers)
        _SESSIONS["resnet"] = ort.InferenceSession(
            RESNET_ONNX, sess_options=so, providers=providers)
        return True
    except Exception as e:
        print("模型加载失败 (需要 captcha/models/best.onnx 和 resnet50_embed.onnx): %s" % e)
        _SESSIONS["yolo"] = None
        _SESSIONS["resnet"] = None
        return False


def _embed(img_bgr: np.ndarray) -> np.ndarray:
    """单张 BGR 图 -> 归一化 2048-d 向量。"""
    tensor = resnet_preprocess(img_bgr)[np.newaxis]
    out = _SESSIONS["resnet"].run(None,
        {_SESSIONS["resnet"].get_inputs()[0].name: tensor})[0]
    feat = out.squeeze()
    norm = np.linalg.norm(feat)
    if norm < 1e-8:
        return feat
    return (feat / norm).astype(np.float32)


def _embed_batch(imgs_bgr: List[np.ndarray]) -> np.ndarray:
    """批量 embedding: (N, 2048) 归一化向量。"""
    if not imgs_bgr:
        return np.zeros((0, 2048), dtype=np.float32)
    tensors = np.stack([resnet_preprocess(img) for img in imgs_bgr])
    out = _SESSIONS["resnet"].run(None,
        {_SESSIONS["resnet"].get_inputs()[0].name: tensors})[0]
    feats = out.reshape(out.shape[0], -1)
    norms = np.linalg.norm(feats, axis=1, keepdims=True)
    norms = np.maximum(norms, 1e-8)
    return (feats / norms).astype(np.float32)


def _detect(bg_bgr: np.ndarray):
    """YOLO 检测大图, 返回 [(x1,y1,x2,y2), conf] (原图坐标)。"""
    tensor, scale, pad = yolo_preprocess(bg_bgr, INFER_IMGSZ)
    out = _SESSIONS["yolo"].run(None,
        {_SESSIONS["yolo"].get_inputs()[0].name: tensor})[0]
    return yolo_postprocess(out, scale, pad, bg_bgr.shape[:2], INFER_CONF)


class CaptchaAutoRecognizer:
    """自动验证码识别器 — YOLO + ResNet50 孪生匹配 (进程内推理)。"""

    def __init__(self, api_url: str = "", timeout: int = 10,
                 auto_start_server: bool = True):
        # 兼容旧签名; 参数不再使用
        _load_sessions()

    def check_api_available(self) -> bool:
        """模型是否可用 (能加载 YOLO + ResNet50)。"""
        return _load_sessions()

    # ---- 核心: 相似度匹配 ----
    def _match(self, bg_bgr: np.ndarray, tgt_bgr: np.ndarray,
               words_count: int = 1):
        """
        返回 [(center, affinity)] 按相似度降序, 最多 words_count 个。
        流程: 小图 strip_center -> embed; YOLO 检大图 -> 每框 crop -> embed ->
              cosine 相似度 -> 过滤 < MIN_AFFINITY -> 降序取 topN。
        """
        target_emb = _embed(strip_center(tgt_bgr))
        boxes = _detect(bg_bgr)
        if not boxes:
            return []

        crops = [bg_bgr[y1:y2, x1:x2] for (x1, y1, x2, y2), _ in boxes]
        embs = _embed_batch(crops)
        affs = (embs @ target_emb).tolist()

        cands = []
        for (bbox, _conf), aff in zip(boxes, affs):
            if aff < MIN_AFFINITY:
                continue
            x1, y1, x2, y2 = bbox
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            cands.append(((cx, cy), float(aff)))
        cands.sort(key=lambda kv: -kv[1])
        return cands[:max(1, int(words_count))]

    # ---- 对外接口 ----
    def recognize_center_point(self, original_image_base64: str,
                               jigsaw_image_base64: str,
                               secret_key: str = "") -> Optional[Tuple[int, int]]:
        """识别目标中心点 (最高相似度框), 返回 (x, y); 失败返回 None。"""
        points = self.recognize_center_points(
            original_image_base64, jigsaw_image_base64, words_count=1)
        return points[0] if points else None

    def recognize_center_points(self, original_image_base64: str,
                                jigsaw_image_base64: str,
                                words_count: int = 1) -> List[Tuple[int, int]]:
        """
        识别目标中心点列表 (多字按 wordsCount 取 topN), 按相似度降序。
        失败返回 []。
        """
        if not _load_sessions():
            return []
        bg = decode_b64_image(original_image_base64)
        tgt = decode_b64_image(jigsaw_image_base64)
        if bg is None or tgt is None:
            print("验证码图像解码失败")
            return []
        try:
            cands = self._match(bg, tgt, words_count)
        except Exception as e:
            print("识别异常: %s" % e)
            return []
        if not cands:
            print("未找到匹配目标 (全部相似度 < %.2f)" % MIN_AFFINITY)
            return []
        return [c for c, _a in cands]

    def recognize_bounding_box(self, original_image_base64: str,
                               jigsaw_image_base64: str,
                               secret_key: str = "") -> Optional[Tuple[int, int, int, int]]:
        """兼容旧接口: 返回最高相似度框 bbox; 失败返回 None。"""
        if not _load_sessions():
            return None
        bg = decode_b64_image(original_image_base64)
        tgt = decode_b64_image(jigsaw_image_base64)
        if bg is None or tgt is None:
            return None
        target_emb = _embed(strip_center(tgt))
        boxes = _detect(bg)
        if not boxes:
            return None
        crops = [bg[y1:y2, x1:x2] for (x1, y1, x2, y2), _ in boxes]
        embs = _embed_batch(crops)
        affs = embs @ target_emb
        best = int(np.argmax(affs))
        if affs[best] < MIN_AFFINITY:
            return None
        return tuple(int(v) for v in boxes[best][0])


def auto_recognize_captcha(block_data: Dict) -> Optional[List[Tuple[int, int]]]:
    """
    便捷入口: 识别验证码目标位置列表 (单字/多字)。
    Args:
        block_data: getBlock 返回的数据字典 (originalImageBase64/jigsawImageBase64/wordsCount)
    Returns:
        点坐标列表 (原图像素, 未做 -10 偏移), 失败返回 None
    """
    original_image_base64 = block_data.get("originalImageBase64")
    jigsaw_image_base64 = block_data.get("jigsawImageBase64")
    if not original_image_base64 or not jigsaw_image_base64:
        print("缺少验证码图像数据")
        return None
    words_count = int(block_data.get("wordsCount") or 1)
    rec = CaptchaAutoRecognizer()
    points = rec.recognize_center_points(
        original_image_base64=original_image_base64,
        jigsaw_image_base64=jigsaw_image_base64,
        words_count=words_count,
    )
    if not points:
        print("识别失败")
        return None
    print("识别成功: 中心点坐标 %s (wordsCount=%d)" % (points, words_count))
    return points
