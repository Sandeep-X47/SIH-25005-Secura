from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime
from .inference import analyze_video
from .utils.video_helpers import save_upload_file_tmp

app = FastAPI(title="Cow Lameness Detector")

# Ensure results folder exists
RESULTS_DIR = "results"
os.makedirs(RESULTS_DIR, exist_ok=True)

@app.post("/detect_lameness")
async def detect_lameness(
    file: UploadFile = File(...),
    method: str = Form("heuristic"),
    model_path: str = Form(None),
    frame_skip: int = Form(2),
    asymmetry_threshold: float = Form(12.0)
):
    """
    Upload video file (mp4/avi). Form fields:
    - method: 'heuristic' (default) or 'model'
    - model_path: path on server to model (if method=='model')
    - frame_skip: process every (frame_skip+1) frame
    - asymmetry_threshold: threshold in degrees for heuristic
    """
    # Save upload to temp
    try:
        tmp_path = save_upload_file_tmp(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error saving uploaded file: {e}")

    try:
        # Run inference
        result = analyze_video(
            tmp_path,
            method=method,
            model_path=model_path,
            frame_skip=int(frame_skip),
            asymmetry_threshold=float(asymmetry_threshold)
        )

        # Save result to JSON file with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = os.path.splitext(file.filename)[0]
        result_filename = os.path.join(RESULTS_DIR, f"{base_name}_{timestamp}.json")
        with open(result_filename, "w") as f:
            json.dump(result, f, indent=4)

    except Exception as e:
        # Ensure temp file removed
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))

    # Cleanup temp file
    try:
        os.remove(tmp_path)
    except Exception:
        pass

    return JSONResponse(content=result)
