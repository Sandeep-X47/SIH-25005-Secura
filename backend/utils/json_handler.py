# utils/json_handler.py
import json
import os
import threading
from typing import Dict, Any

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)
RESULT_FILE = os.path.join(DATA_DIR, "results.json")

_lock = threading.Lock()

def _ensure_file():
    if not os.path.exists(RESULT_FILE):
        with open(RESULT_FILE, "w") as f:
            json.dump([], f)


def save_result(data: Dict[str, Any]) -> str:
    """
    Append data to the results file in a thread-safe manner.
    Returns the id of saved record if available.
    """
    _ensure_file()
    with _lock:
        try:
            with open(RESULT_FILE, "r") as f:
                arr = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            arr = []
        arr.append(data)
        with open(RESULT_FILE, "w") as f:
            json.dump(arr, f, indent=2)
    return data.get("id", "")


def read_results():
    if not os.path.exists(RESULT_FILE):
        return []
    try:
        with open(RESULT_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        # recover gracefully
        return []
