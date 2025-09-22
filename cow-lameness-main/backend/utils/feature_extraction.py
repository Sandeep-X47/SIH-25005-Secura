import numpy as np
from typing import List, Dict

def angle_between(a, b, c):
    """
    angle at point b formed by points a-b-c (in degrees)
    a,b,c are (x,y)
    """
    a = np.array(a); b = np.array(b); c = np.array(c)
    ba = a - b
    bc = c - b
    # handle degenerate
    if np.linalg.norm(ba) < 1e-6 or np.linalg.norm(bc) < 1e-6:
        return 0.0
    cosang = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    cosang = np.clip(cosang, -1.0, 1.0)
    return float(np.degrees(np.arccos(cosang)))

def compute_leg_angles(landmarks):
    """
    landmarks: dict with keys for 'left_hip','left_knee','left_ankle','right_hip','right_knee','right_ankle'
    each value is (x, y) in image coords
    returns dict of angles: knee_angle_left, knee_angle_right, hip_angle_left, hip_angle_right
    """
    res = {}
    if all(k in landmarks for k in ('left_hip','left_knee','left_ankle')):
        res['knee_left'] = angle_between(landmarks['left_hip'], landmarks['left_knee'], landmarks['left_ankle'])
        res['hip_left']  = angle_between(landmarks.get('left_shoulder', landmarks['left_hip']), landmarks['left_hip'], landmarks['left_knee'])
    else:
        res['knee_left'] = None; res['hip_left'] = None

    if all(k in landmarks for k in ('right_hip','right_knee','right_ankle')):
        res['knee_right'] = angle_between(landmarks['right_hip'], landmarks['right_knee'], landmarks['right_ankle'])
        res['hip_right']  = angle_between(landmarks.get('right_shoulder', landmarks['right_hip']), landmarks['right_hip'], landmarks['right_knee'])
    else:
        res['knee_right'] = None; res['hip_right'] = None
    return res

def summary_stats(numbers: List[float]) -> Dict:
    arr = np.array(numbers, dtype=float)
    arr = arr[~np.isnan(arr)]
    if arr.size == 0:
        return {"mean": None, "std": None, "min": None, "max": None}
    return {"mean": float(arr.mean()), "std": float(arr.std()), "min": float(arr.min()), "max": float(arr.max())}
