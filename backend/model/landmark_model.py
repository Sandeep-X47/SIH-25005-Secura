# model/landmark_model.py
import cv2
import numpy as np
from typing import Tuple, Dict, Any

# ArUco dictionary and detector compatible with OpenCV >= 4.8
ARUCO_DICT = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
ARUCO_PARAMS = cv2.aruco.DetectorParameters()
DETECTOR = cv2.aruco.ArucoDetector(ARUCO_DICT, ARUCO_PARAMS)

# physical marker size (cm) - change if you use a different marker
MARKER_SIZE_CM = 10.0


def detect_aruco_scale_from_image(img: np.ndarray) -> float | None:
    """
    Returns cm_per_pixel if marker detected, else None.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    corners, ids, rejected = DETECTOR.detectMarkers(gray)
    if ids is None or len(corners) == 0:
        return None
    # Use first marker
    c = corners[0].reshape((4, 2))
    # compute average edge length in pixels
    edge_lengths = [
        np.linalg.norm(c[0] - c[1]),
        np.linalg.norm(c[1] - c[2]),
        np.linalg.norm(c[2] - c[3]),
        np.linalg.norm(c[3] - c[0]),
    ]
    avg_px = float(np.mean(edge_lengths))
    if avg_px <= 0:
        return None
    cm_per_px = MARKER_SIZE_CM / avg_px
    return cm_per_px


def detect_landmarks_and_scale(image_path: str) -> Tuple[Dict[str, Any], float | None]:
    """
    Given image_path, returns (landmarks_dict, cm_per_pixel or None).
    Raises Exceptions on failure.
    Landmarks: bbox, leftmost, rightmost, topmost, bottommost, centroid, head, tail, hoof_front, hoof_back, contour_area
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError("Image not found or cannot be opened")

    # optional scale detection using ArUco
    scale = detect_aruco_scale_from_image(img)  # cm per pixel or None

    # Preprocess - silhouette extraction
    blur = cv2.GaussianBlur(img, (5, 5), 0)
    gray = cv2.cvtColor(blur, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(
        gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # If background is darker -> invert so animal is white (foreground)
    white_ratio = np.sum(thresh == 255) / (thresh.shape[0] * thresh.shape[1])
    if white_ratio < 0.2:
        thresh = cv2.bitwise_not(thresh)

    # Morphological cleaning
    kernel = np.ones((5, 5), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

    # find contours
    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise RuntimeError("No contours found for animal silhouette")

    # pick the largest contour by area
    contour = max(contours, key=cv2.contourArea)
    area = float(cv2.contourArea(contour))

    # require area relative to image size (1% threshold)
    min_area = 0.01 * (img.shape[0] * img.shape[1])
    if area < min_area:
        raise RuntimeError(
            "Detected contour too small - bad input or wrong foreground/background")

    # bounding rectangle and extreme points
    x, y, w, h = cv2.boundingRect(contour)
    leftmost = tuple(contour[contour[:, :, 0].argmin()][0])
    rightmost = tuple(contour[contour[:, :, 0].argmax()][0])
    topmost = tuple(contour[contour[:, :, 1].argmin()][0])
    bottommost = tuple(contour[contour[:, :, 1].argmax()][0])

    # centroid
    M = cv2.moments(contour)
    if M["m00"] != 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
    else:
        cx, cy = (int(x + w / 2), int(y + h / 2))

    # head/tail estimation: choose leftmost/rightmost and use the one with smaller y as head candidate
    # this is heuristic and may fail on angled poses
    head_est = leftmost if leftmost[1] < rightmost[1] else rightmost
    tail_est = rightmost if head_est == leftmost else leftmost

    # hoof detection: consider contour points near bottom
    bottom_y = bottommost[1]
    thresh_y = int(y + 0.92 * h)
    lower_pts = [tuple(pt[0]) for pt in contour if pt[0][1] >= thresh_y]

    hoof_front = None
    hoof_back = None
    if lower_pts:
        xs = [p[0] for p in lower_pts]
        median_x = float(np.median(xs))
        left_foot_pts = [p for p in lower_pts if p[0] < median_x]
        right_foot_pts = [p for p in lower_pts if p[0] >= median_x]
        if left_foot_pts:
            # higher up is smaller y
            hoof_front = min(left_foot_pts, key=lambda p: p[1])
        if right_foot_pts:
            hoof_back = min(right_foot_pts, key=lambda p: p[1])

    landmarks = {
        "bbox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
        "leftmost": {"x": int(leftmost[0]), "y": int(leftmost[1])},
        "rightmost": {"x": int(rightmost[0]), "y": int(rightmost[1])},
        "topmost": {"x": int(topmost[0]), "y": int(topmost[1])},
        "bottommost": {"x": int(bottommost[0]), "y": int(bottommost[1])},
        "centroid": {"x": int(cx), "y": int(cy)},
        "head": {"x": int(head_est[0]), "y": int(head_est[1])},
        "tail": {"x": int(tail_est[0]), "y": int(tail_est[1])},
        "hoof_front": {"x": int(hoof_front[0]), "y": int(hoof_front[1])} if hoof_front else None,
        "hoof_back": {"x": int(hoof_back[0]), "y": int(hoof_back[1])} if hoof_back else None,
        "contour_area": float(area)
    }

    return landmarks, scale
