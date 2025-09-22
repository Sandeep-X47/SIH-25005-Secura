import mediapipe as mp
import numpy as np
from typing import Dict, Optional
from utils.video_helpers import iter_frames
from utils.feature_extraction import compute_leg_angles, summary_stats
import time
import torch
import os

mp_pose = mp.solutions.pose

DEFAULT_THRESHOLD = 12.0  # asymmetry threshold (degrees) — tune per dataset

def _landmarks_from_mediapipe(landmark_list, image_w, image_h):
    """Return dict of selected landmarks scaled to pixel coords."""
    lm = {}
    # indexes per Mediapipe Pose
    # for reference:
    # 23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee, 27: left_ankle, 28: right_ankle
    mapping = {
        'left_hip': 23, 'right_hip': 24,
        'left_knee': 25, 'right_knee': 26,
        'left_ankle': 27, 'right_ankle': 28,
        'left_shoulder': 11, 'right_shoulder': 12
    }
    for name, idx in mapping.items():
        try:
            lm_obj = landmark_list.landmark[idx]
            lm[name] = (lm_obj.x * image_w, lm_obj.y * image_h)
        except Exception:
            pass
    return lm

def analyze_video(video_path: str, method: str = 'heuristic', model_path: Optional[str] = None,
                  frame_skip: int = 2, asymmetry_threshold: float = DEFAULT_THRESHOLD) -> Dict:
    """
    Analyze input video and return a JSON-like dict:
    { 'lame': 'yes'|'no', 'score': float, 'method': method, 'frames_analyzed': n, 'details': {...} }
    method: 'heuristic' or 'model'
    model_path: path to a PyTorch model if method == 'model'
    frame_skip: process every (frame_skip+1)-th frame
    """
    t0 = time.time()
    # Prepare mediapipe
    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    knee_left_list = []
    knee_right_list = []
    hip_left_list = []
    hip_right_list = []
    ankle_y_left = []
    ankle_y_right = []

    frames = 0
    for idx, frame in iter_frames(video_path, skip=frame_skip):
        frames += 1
        h, w = frame.shape[:2]
        # convert BGR->RGB
        rgb = frame[:, :, ::-1]
        result = pose.process(rgb)
        if not result.pose_landmarks:
            continue
        lm = _landmarks_from_mediapipe(result.pose_landmarks, w, h)
        angles = compute_leg_angles(lm)
        knee_left_list.append(np.nan if angles['knee_left'] is None else angles['knee_left'])
        knee_right_list.append(np.nan if angles['knee_right'] is None else angles['knee_right'])
        hip_left_list.append(np.nan if angles['hip_left'] is None else angles['hip_left'])
        hip_right_list.append(np.nan if angles['hip_right'] is None else angles['hip_right'])
        if 'left_ankle' in lm:
            ankle_y_left.append(lm['left_ankle'][1])
        else:
            ankle_y_left.append(np.nan)
        if 'right_ankle' in lm:
            ankle_y_right.append(lm['right_ankle'][1])
        else:
            ankle_y_right.append(np.nan)

    pose.close()
    # Summarize
    knee_left_stats = summary_stats(knee_left_list)
    knee_right_stats = summary_stats(knee_right_list)
    hip_left_stats = summary_stats(hip_left_list)
    hip_right_stats = summary_stats(hip_right_list)

    # Asymmetry score: mean abs difference between left/right knee angles across frames (ignoring NaNs)
    left_arr = np.array(knee_left_list, dtype=float)
    right_arr = np.array(knee_right_list, dtype=float)
    valid_mask = ~np.isnan(left_arr) & ~np.isnan(right_arr)
    if valid_mask.sum() == 0:
        asym_score = None
    else:
        asym_score = float(np.mean(np.abs(left_arr[valid_mask] - right_arr[valid_mask])))

    # Stride amplitude (ankle vertical range) — left vs right
    ank_left_stats = summary_stats(ankle_y_left)
    ank_right_stats = summary_stats(ankle_y_right)
    # if lower mean ankle Y pos (in pixel coords) across frames differs a lot, could indicate limping
    stride_asym = None
    if ank_left_stats['mean'] is not None and ank_right_stats['mean'] is not None:
        stride_asym = abs(ank_left_stats['mean'] - ank_right_stats['mean'])

    details = {
        "knee_left": knee_left_stats,
        "knee_right": knee_right_stats,
        "hip_left": hip_left_stats,
        "hip_right": hip_right_stats,
        "ankle_left": ank_left_stats,
        "ankle_right": ank_right_stats,
        "asymmetry_knee_deg_mean": asym_score,
        "stride_asymmetry_px": stride_asym,
        "frames_sampled": frames
    }

    if method == 'heuristic':
        if asym_score is None:
            label = "no"  # can't detect — default to no; you may wish to return unknown
            confidence = 0.0
        else:
            # score scaled 0..1 where higher is more likely lame
            # map asym_score from 0..(2*asymmetry_threshold) to 0..1
            score = min(1.0, asym_score / (2.0 * asymmetry_threshold))
            confidence = float(score)
            label = "yes" if asym_score > asymmetry_threshold else "no"

        out = {
            "lame": label,
            "score": confidence,
            "method": "heuristic",
            "details": details,
            "time_taken_sec": time.time() - t0
        }
        return out

    elif method == 'model':
        if model_path is None or not os.path.exists(model_path):
            raise ValueError("Model path must be provided for method='model' and must exist.")
        # load model (simple torch script) and run on aggregated features
        # features we pass: [knee_left_mean, knee_right_mean, hip_left_mean, hip_right_mean,
        #                    knee_left_std, knee_right_std, hip_left_std, hip_right_std,
        #                    stride_asymmetry_px]
        feats = []
        for stat in (knee_left_stats, knee_right_stats, hip_left_stats, hip_right_stats):
            feats.append(stat['mean'] if stat['mean'] is not None else 0.0)
        for stat in (knee_left_stats, knee_right_stats, hip_left_stats, hip_right_stats):
            feats.append(stat['std'] if stat['std'] is not None else 0.0)
        feats.append(stride_asym if stride_asym is not None else 0.0)
        x = np.array(feats, dtype=np.float32).reshape(1, -1)
        # load model
        device = torch.device("cpu")
        model = torch.load(model_path, map_location=device)
        model.eval()
        with torch.no_grad():
            tensor = torch.from_numpy(x)
            out_tensor = model(tensor)
            prob = torch.sigmoid(out_tensor).item() if out_tensor.numel() == 1 else float(out_tensor.softmax(dim=1)[0,1].item())
            label = "yes" if prob >= 0.5 else "no"
        return {
            "lame": label,
            "score": float(prob),
            "method": "model",
            "details": details,
            "time_taken_sec": time.time() - t0
        }
    else:
        raise ValueError(f"Unknown method {method}")
