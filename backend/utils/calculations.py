# utils/calculations.py
import math
from typing import Dict, Any

def _dist(p1, p2):
    """Euclidean distance between two pixel points (dicts with x,y)"""
    return math.hypot(p2['x'] - p1['x'], p2['y'] - p1['y'])


def _angle(A, B, C):
    """Angle at B formed by A-B-C in degrees"""
    AB = (A['x'] - B['x'], A['y'] - B['y'])
    CB = (C['x'] - B['x'], C['y'] - B['y'])
    dot = AB[0] * CB[0] + AB[1] * CB[1]
    magA = math.hypot(AB[0], AB[1])
    magC = math.hypot(CB[0], CB[1])
    if magA == 0 or magC == 0:
        return None
    cosv = dot / (magA * magC)
    cosv = max(-1.0, min(1.0, cosv))
    return math.degrees(math.acos(cosv))


def pixels_to_cm(pixels, cm_per_pixel):
    if cm_per_pixel is not None and cm_per_pixel > 0:
        return pixels * cm_per_pixel
    else:
        return None  # unknown scale


def compute_measurements_and_score(landmarks: Dict[str, Any], cm_per_pixel: float = None) -> Dict[str, Any]:
    """
    Given landmarks (pixel coordinates) and optional cm_per_pixel scaling,
    compute measurements and a 0-100 score.
    """
    # Points
    left = landmarks.get("leftmost")
    right = landmarks.get("rightmost")
    top = landmarks.get("topmost")
    bottom = landmarks.get("bottommost")
    centroid = landmarks.get("centroid")
    head = landmarks.get("head")
    tail = landmarks.get("tail")
    hoof_front = landmarks.get("hoof_front")
    hoof_back = landmarks.get("hoof_back")

    # distances in pixels
    body_length_px = None
    if left is not None and right is not None:
        body_length_px = _dist(left, right)
    elif centroid is not None and tail is not None:
        body_length_px = _dist(centroid, tail)

    height_px = None
    if top is not None and bottom is not None:
        height_px = _dist(top, bottom)

    # angles
    back_angle = None
    if head is not None and centroid is not None and tail is not None:
        back_angle = _angle(head, centroid, tail)

    hip_angle = None
    if left is not None and centroid is not None and tail is not None:
        hip_angle = _angle(left, centroid, tail)

    # convert to cm if possible
    body_length_cm = pixels_to_cm(body_length_px, cm_per_pixel) if body_length_px is not None else None
    height_cm = pixels_to_cm(height_px, cm_per_pixel) if height_px is not None else None

    # scoring helpers: pass actual value (cm preferred, else px)
    def score_length(val):
        if val is None:
            return 20.0
        if cm_per_pixel is not None:
            ideal = 160.0
            diff = abs(val - ideal)
            s = max(0.0, 30.0 - diff * 0.2)
            return s
        else:
            ideal_px = 400.0
            diff = abs(val - ideal_px)
            s = max(0.0, 30.0 - diff * 0.03)
            return s

    def score_height(val):
        if val is None:
            return 15.0
        if cm_per_pixel is not None:
            ideal = 135.0
            diff = abs(val - ideal)
            s = max(0.0, 25.0 - diff * 0.2)
            return s
        else:
            ideal_px = 350.0
            diff = abs(val - ideal_px)
            s = max(0.0, 25.0 - diff * 0.03)
            return s

    def score_angle(angle_deg):
        if angle_deg is None:
            return 10.0
        ideal = 175.0
        diff = abs(angle_deg - ideal)
        s = max(0.0, 45.0 - diff * 0.5)
        return s

    len_val = body_length_cm if body_length_cm is not None else body_length_px
    ht_val = height_cm if height_cm is not None else height_px

    len_comp = score_length(len_val)
    ht_comp = score_height(ht_val)
    ang_comp = score_angle(back_angle)

    # hip angle contribution (optional small weight)
    hip_comp = 0.0
    if hip_angle is not None:
        ideal_hip = 140.0
        diff = abs(hip_angle - ideal_hip)
        hip_comp = max(0.0, 10.0 - diff * 0.05)

    # hoof bonus and symmetry check
    hoof_bonus = 0.0
    if hoof_front and hoof_back:
        hoof_bonus = 5.0
        # symmetry: compare distance between hoofs to body length
        try:
            hoof_dx = abs(hoof_front['x'] - hoof_back['x'])
            if body_length_px:
                ratio = hoof_dx / body_length_px
                if 0.1 <= ratio <= 0.5:
                    hoof_bonus += 2.0
        except Exception:
            pass

    raw_score = len_comp + ht_comp + ang_comp + hip_comp + hoof_bonus

    # Cap between 0 and 100
    score = max(0.0, min(100.0, raw_score))

    measurements = {
        "body_length_px": float(body_length_px) if body_length_px is not None else None,
        "body_length_cm": float(body_length_cm) if body_length_cm is not None else None,
        "height_px": float(height_px) if height_px is not None else None,
        "height_cm": float(height_cm) if height_cm is not None else None,
        "back_angle_deg": float(back_angle) if back_angle is not None else None,
        "hip_angle_deg": float(hip_angle) if hip_angle is not None else None,
        "hoof_front": hoof_front,
        "hoof_back": hoof_back,
        "score_0_100": float(score),
        "score_components": {
            "length": float(len_comp),
            "height": float(ht_comp),
            "back_angle": float(ang_comp),
            "hip_angle": float(hip_comp),
            "hoof_bonus": float(hoof_bonus)
        }
    }
    return measurements
