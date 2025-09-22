#!/bin/bash
# Example usage: ./test_request.sh mycowvideo.mp4
FILE=${1:-"examples/cow_walk.mp4"}
curl -X POST "http://127.0.0.1:8000/detect_lameness" \
  -F "file=@${FILE}" \
  -F "method=heuristic" \
  -F "frame_skip=2" \
  -F "asymmetry_threshold=12.0" \
  -H "Accept: application/json"
