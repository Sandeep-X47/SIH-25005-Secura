# model/yolo_model.py
import logging
from typing import Tuple, List, Dict, Any

try:
    from ultralytics import YOLO
except Exception as e:
    # If ultralytics not installed or import fails, let user know at runtime
    YOLO = None
import numpy as np

logger = logging.getLogger(__name__)

MODEL_NAME = "yolov8n.pt"  # small model for speed
_model = None

# Expandable set of names to check (lowercase)
TARGET_NAMES = {"cow", "ox", "buffalo", "bull"}


def get_model():
    global _model
    if _model is None:
        if YOLO is None:
            raise ImportError("ultralytics YOLO package is not available")
        _model = YOLO(MODEL_NAME)
    return _model


def is_cow_in_image(image_path: str) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Returns (found_boolean, detections_list).
    detections_list: [{"class": name, "confidence": float, "box": [x1,y1,x2,y2]}, ...]
    """
    try:
        model = get_model()
        results = model.predict(
            source=image_path, imgsz=640, conf=0.25, max_det=20)
        r = results[0]  # single image
        detections = []
        found = False

        # r.boxes may be a Boxes object; iterate safely
        if hasattr(r, "boxes") and r.boxes is not None and len(r.boxes) > 0:
            # r.boxes.data may contain (x1,y1,x2,y2,conf,cls)
            for box in r.boxes:
                try:
                    cls_id = int(box.cls.cpu().numpy()) if hasattr(
                        box, "cls") else int(box[5].cpu().numpy())
                except Exception:
                    # fallback reading from box tensor
                    try:
                        arr = box.cpu().numpy()
                        cls_id = int(arr[5])
                    except Exception:
                        cls_id = None

                name = r.names.get(cls_id, "unknown") if hasattr(
                    r, "names") else None
                conf = float(box.conf.cpu().numpy()) if hasattr(
                    box, "conf") else None

                # bounding box coordinates
                try:
                    xyxy = box.xyxy.cpu().numpy().tolist()[
                        0] if hasattr(box, "xyxy") else None
                except Exception:
                    xyxy = None

                if name:
                    name_l = name.lower()
                else:
                    name_l = "unknown"

                detections.append(
                    {"class": name_l, "confidence": conf, "box": xyxy})

                if name_l in TARGET_NAMES:
                    found = True

        return found, detections

    except Exception as e:
        logger.exception("YOLO inference failed")
        raise
