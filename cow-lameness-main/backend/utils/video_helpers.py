import cv2
import os
import tempfile
from typing import Generator

def save_upload_file_tmp(upload_file) -> str:
    """Save starlette UploadFile to a temporary file and return path."""
    suffix = os.path.splitext(upload_file.filename)[1] or ".mp4"
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        while True:
            chunk = upload_file.file.read(1024*1024)
            if not chunk:
                break
            f.write(chunk)
    return tmp_path

def iter_frames(video_path: str, skip: int = 0) -> Generator:
    """Yield frames from a video as (frame_index, bgr_frame). `skip` skip factor to process fewer frames."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video {video_path}")
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % (skip + 1) == 0:
            yield idx, frame
        idx += 1
    cap.release()
