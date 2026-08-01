import asyncio
import base64
import io
import os
from typing import List, Tuple

import numpy as np
import onnxruntime as ort
from PIL import Image
from fastapi import FastAPI
from pydantic import BaseModel
from uvicorn.logging import DefaultFormatter

PORT = 8000
HOST = "0.0.0.0"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATU_MODEL_PATH = os.path.join(MODELS_DIR, "datu.onnx")
XIAOTU_MODEL_PATH = os.path.join(MODELS_DIR, "xiaotu.onnx")

DATU_IMGSZ = 640
XIAOTU_IMGSZ = 128
CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45
LETTERBOX_FILL = (114, 114, 114)


def _build_providers() -> List[str]:
    providers = []
    try:
        if ort.get_device() == "GPU":
            providers.append("CUDAExecutionProvider")
    except Exception:
        pass
    providers.append("CPUExecutionProvider")
    return providers


def letterbox(img: Image.Image, new_shape: int) -> Tuple[Image.Image, float, float, float]:
    w, h = img.size
    r = min(new_shape / w, new_shape / h)
    new_w = max(1, int(round(w * r)))
    new_h = max(1, int(round(h * r)))
    resized = img.resize((new_w, new_h), Image.BILINEAR)
    dx = (new_shape - new_w) / 2.0
    dy = (new_shape - new_h) / 2.0
    canvas = Image.new("RGB", (new_shape, new_shape), LETTERBOX_FILL)
    canvas.paste(resized, (int(dx), int(dy)))
    return canvas, r, dx, dy


def xywh2xyxy(x: np.ndarray) -> np.ndarray:
    y = np.copy(x)
    y[..., 0] = x[..., 0] - x[..., 2] / 2.0
    y[..., 1] = x[..., 1] - x[..., 3] / 2.0
    y[..., 2] = x[..., 0] + x[..., 2] / 2.0
    y[..., 3] = x[..., 1] + x[..., 3] / 2.0
    return y


def nms(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float) -> List[int]:
    if len(boxes) == 0:
        return []
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep: List[int] = []
    while order.size > 0:
        i = order[0]
        keep.append(int(i))
        if order.size == 1:
            break
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        iw = np.maximum(0.0, xx2 - xx1)
        ih = np.maximum(0.0, yy2 - yy1)
        inter = iw * ih
        union = areas[i] + areas[order[1:]] - inter + 1e-9
        ovr = inter / union
        inds = np.where(ovr <= iou_threshold)[0]
        order = order[inds + 1]
    return keep


class YOLOModel:
    def __init__(self, model_path: str, imgsz: int):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"model not found: {model_path}")
        self.imgsz = imgsz
        self.session = ort.InferenceSession(model_path, providers=_build_providers())
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def _preprocess(self, img: Image.Image):
        img_rgb = img.convert("RGB")
        canvas, r, dx, dy = letterbox(img_rgb, self.imgsz)
        arr = np.asarray(canvas, dtype=np.float32) / 255.0
        arr = arr.transpose(2, 0, 1)[None, ...]
        return np.ascontiguousarray(arr, dtype=np.float32), r, dx, dy

    def _postprocess(self, pred: np.ndarray, r: float, dx: float, dy: float, orig_w: int, orig_h: int):
        pred = pred[0]
        if pred.shape[0] < pred.shape[1]:
            pred = pred.T
        boxes_xywh = pred[:, :4]
        scores_all = pred[:, 4:]
        max_scores = scores_all.max(axis=1)
        mask = max_scores > CONF_THRESHOLD
        if not mask.any():
            return []
        boxes_xywh = boxes_xywh[mask]
        max_scores = max_scores[mask]
        class_ids = scores_all[mask].argmax(axis=1)
        boxes_xyxy = xywh2xyxy(boxes_xywh)
        keep = nms(boxes_xyxy, max_scores, IOU_THRESHOLD)
        results = []
        for i in keep:
            x1, y1, x2, y2 = boxes_xyxy[i]
            x1 = (x1 - dx) / r
            y1 = (y1 - dy) / r
            x2 = (x2 - dx) / r
            y2 = (y2 - dy) / r
            x1 = float(max(0, min(orig_w, x1)))
            y1 = float(max(0, min(orig_h, y1)))
            x2 = float(max(0, min(orig_w, x2)))
            y2 = float(max(0, min(orig_h, y2)))
            results.append(
                {
                    "class_id": int(class_ids[i]),
                    "score": float(max_scores[i]),
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                }
            )
        return results

    def detect(self, img: Image.Image):
        orig_w, orig_h = img.size
        arr, r, dx, dy = self._preprocess(img)
        pred = self.session.run([self.output_name], {self.input_name: arr})[0]
        return self._postprocess(pred, r, dx, dy, orig_w, orig_h)


datu_model = YOLOModel(DATU_MODEL_PATH, DATU_IMGSZ)
xiaotu_model = YOLOModel(XIAOTU_MODEL_PATH, XIAOTU_IMGSZ)

app = FastAPI(title="ONNX Captcha Recognition Service")


class RequestData(BaseModel):
    secretKey: str
    originalImageBase64: str
    jigsawImageBase64: str


class CNMRequest(BaseModel):
    mode: int
    data: RequestData


def decode_base64_image(b64: str) -> Image.Image:
    b64 = b64.strip()
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(b64)))


@app.post("/CNM")
async def cnm(req: CNMRequest):
    if req.mode not in (1, 2):
        return {"code": -1, "msg": "mode must be 1 or 2"}

    try:
        jigsaw_img = await asyncio.to_thread(decode_base64_image, req.data.jigsawImageBase64)
        original_img = await asyncio.to_thread(decode_base64_image, req.data.originalImageBase64)
    except Exception as e:
        return {"code": -1, "secretKey": req.data.secretKey, "msg": f"image decode error: {e}"}

    xiaotu_dets = await asyncio.to_thread(xiaotu_model.detect, jigsaw_img)
    if not xiaotu_dets:
        return {
            "code": -1,
            "secretKey": req.data.secretKey,
            "msg": "no object detected in jigsaw image",
        }

    target_class = max(xiaotu_dets, key=lambda d: d["score"])["class_id"]

    datu_dets = await asyncio.to_thread(datu_model.detect, original_img)
    candidates = [d for d in datu_dets if d["class_id"] == target_class]
    if not candidates:
        return {
            "code": -1,
            "secretKey": req.data.secretKey,
            "msg": "no matching object detected in original image",
        }

    best = max(candidates, key=lambda d: d["score"])

    if req.mode == 1:
        cx = (best["x1"] + best["x2"]) / 2.0
        cy = (best["y1"] + best["y2"]) / 2.0
        return {
            "code": 0,
            "secretKey": req.data.secretKey,
            "data": {"x": int(round(cx)), "y": int(round(cy))},
        }

    return {
        "code": 0,
        "secretKey": req.data.secretKey,
        "data": {
            "x1": int(round(best["x1"])),
            "y1": int(round(best["y1"])),
            "x2": int(round(best["x2"])),
            "y2": int(round(best["y2"])),
        },
    }


@app.get("/health")
async def health():
    return {"code": 0, "msg": "ok"}


class CNDefaultFormatter(DefaultFormatter):
    TRANSLATIONS = [
        ("Started server process", "已启动服务进程"),
        ("Finished server process", "已结束服务进程"),
        ("Waiting for application startup.", "等待应用启动。"),
        ("Application startup complete.", "应用启动完成。"),
        ("Application startup failed. Exiting.", "应用启动失败，正在退出。"),
        ("Waiting for application shutdown.", "等待应用关闭。"),
        ("Application shutdown complete.", "应用关闭完成。"),
        ("Application shutdown failed. Exiting.", "应用关闭失败，正在退出。"),
        ("Shutting down", "正在关闭服务"),
        ("Uvicorn running on ", "Uvicorn 服务运行于 "),
        ("(Press CTRL+C to quit)", "(按 CTRL+C 退出)"),
        ("Waiting for connections to close. (CTRL+C to force quit)", "等待连接关闭。(按 CTRL+C 强制退出)"),
        ("Cancel ", "取消 "),
        (" running task(s), timeout graceful shutdown exceeded", " 个运行中的任务，优雅关闭超时"),
        ("Maximum request limit of", "已超过最大请求数限制"),
        (" exceeded. Terminating process.", "，正在终止进程。"),
    ]

    def formatMessage(self, record):
        s = super().formatMessage(record)
        for en, zh in self.TRANSLATIONS:
            if en in s:
                s = s.replace(en, zh)
        return s


CN_LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": f"{__name__}.CNDefaultFormatter",
            "fmt": "%(levelprefix)s %(message)s",
            "use_colors": None,
        },
        "access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": '%(levelprefix)s %(client_addr)s - 请求 "%(request_line)s" 状态码 %(status_code)s',
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
        "access": {
            "formatter": "access",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
    },
}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT, log_config=CN_LOG_CONFIG)
