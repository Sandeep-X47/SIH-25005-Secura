# main.py
import os
import uuid
import shutil
import datetime
import logging
import json
import requests

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model.yolo_model import is_cow_in_image
from model.landmark_model import detect_landmarks_and_scale
from utils.calculations import compute_measurements_and_score
from utils.json_handler import save_result, read_results

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-atc-backend")

app = FastAPI(title="AI-ATC Backend (Prototype)", version="0.1.0")

# Llama API configuration
LLAMA_API_URL = "https://api.llama.com/v1/chat/completions"
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY", "your-llama-api-key-here")
USE_MOCK_RESPONSES = os.getenv("USE_MOCK_RESPONSES", "true").lower() == "true"

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    context: str = "cattle_health_veterinary_assistant"
    conversation_history: list[ChatMessage] = []

def get_mock_response(message: str) -> str:
    """Generate mock responses for testing when Llama API is not available"""
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['hello', 'hi', 'hey']):
        return "Hello! I'm your virtual veterinary assistant. How can I help you with your cattle today?"
    
    elif any(word in message_lower for word in ['sick', 'ill', 'disease', 'problem']):
        return "I understand you're concerned about a sick animal. Can you describe the symptoms? Common signs include loss of appetite, lethargy, abnormal breathing, or changes in behavior. It's important to isolate the animal and contact a local veterinarian for proper diagnosis."
    
    elif any(word in message_lower for word in ['feed', 'nutrition', 'food', 'diet']):
        return "Proper nutrition is crucial for cattle health. Adult cattle typically need 2-3% of their body weight in dry matter daily. Ensure access to clean water (30-50 gallons per day), quality forage, and appropriate supplements. Would you like specific feeding recommendations based on your cattle's age or condition?"
    
    elif any(word in message_lower for word in ['pregnancy', 'pregnant', 'breeding', 'calf']):
        return "Pregnant cattle require special care. Gestation period is about 283 days. Ensure proper nutrition with increased protein and energy intake, especially in the last trimester. Regular veterinary checkups are essential. Keep detailed breeding records and prepare a clean calving area."
    
    elif any(word in message_lower for word in ['vaccine', 'vaccination', 'immunization']):
        return "Vaccination schedules vary by region and herd conditions. Common vaccines include those for respiratory diseases, clostridial diseases, and reproductive diseases. Consult with your local veterinarian to develop an appropriate vaccination program based on your area's disease risks."
    
    elif any(word in message_lower for word in ['milk', 'milking', 'production']):
        return "Milk production depends on breed, nutrition, and management. Ensure hygienic milking practices, proper udder health management, and maintain consistent milking schedules. Average daily production varies greatly by breed - dairy breeds can produce 20-40+ liters per day."
    
    elif any(word in message_lower for word in ['temperature', 'fever', 'hot']):
        return "Normal cattle body temperature is 101.5°F (38.6°C). Temperatures above 103°F (39.4°C) indicate fever. Check for other symptoms like reduced appetite, lethargy, or labored breathing. Contact a veterinarian if fever persists or if the animal shows other concerning symptoms."
    
    elif any(word in message_lower for word in ['lameness', 'limp', 'walking', 'leg']):
        return "Lameness in cattle can be caused by various factors including foot rot, laminitis, or joint issues. Provide a clean, dry resting area and limit movement. If lameness persists or worsens, consult a veterinarian for proper diagnosis and treatment."
    
    elif any(word in message_lower for word in ['breathing', 'cough', 'respiratory']):
        return "Respiratory issues in cattle can be serious. Monitor for coughing, nasal discharge, labored breathing, or fever. Ensure good ventilation and reduce dust. If symptoms persist, contact a veterinarian immediately as respiratory diseases can spread quickly through the herd."
    
    else:
        return "Thank you for your question. While I can provide general guidance, for specific health concerns, I recommend consulting with a local veterinarian who can examine your cattle in person. Is there a particular aspect of cattle health or management you'd like to know more about?"

# CORS (adjust allow_origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {"status": "ok", "message": "AI-ATC backend running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running", "llama_available": not USE_MOCK_RESPONSES}


@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    # Basic validation
    if not file.content_type.startswith("image/"):
        return JSONResponse({"status": "error", "message": "Invalid file type"}, status_code=400)

    # Save uploaded file
    filename = f"{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.exception("Failed saving uploaded file")
        return JSONResponse({"status": "error", "message": f"File save error: {e}"}, status_code=500)

    # 1) Detection: is there a cow/buffalo?
    try:
        found, detections = is_cow_in_image(file_path)
    except Exception as e:
        logger.exception("YOLO detection error")
        return JSONResponse({"status": "error", "message": f"Detection error: {e}"}, status_code=500)

    if not found:
        return JSONResponse({"status": "error", "message": "No cow/buffalo detected in image"}, status_code=400)

    # 2) Landmark detection + optional scale detection (returns dict of landmarks and scale factor)
    try:
        landmarks, scale_cm_per_pixel = detect_landmarks_and_scale(file_path)
    except Exception as e:
        logger.exception("Landmark detection error")
        return JSONResponse({"status": "error", "message": f"Landmark detection error: {e}"}, status_code=500)

    # 3) Measurements and score
    try:
        measurements = compute_measurements_and_score(
            landmarks, scale_cm_per_pixel)
    except Exception as e:
        logger.exception("Calculation error")
        return JSONResponse({"status": "error", "message": f"Computation error: {e}"}, status_code=500)

    # 4) Save result
    result = {
        "id": uuid.uuid4().hex,
        "filename": filename,
        "file_url": f"/uploads/{filename}",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "detections": detections,
        "landmarks": landmarks,
        "measurements": measurements
    }
    try:
        save_result(result)
    except Exception as e:
        logger.exception("Failed to save result")
        # still return success payload, but log the persistence error
        return JSONResponse({"status": "warning", "message": f"Result computed but failed to save: {e}", "data": result})

    return JSONResponse({"status": "success", "data": result})


@app.get("/results/")
def get_results():
    return {"status": "success", "data": read_results()}


@app.post("/chat/")
async def chat_with_llama(request: ChatRequest):
    """
    Chat endpoint that integrates with Llama API for dynamic cattle health responses
    """
    try:
        # Use mock responses if configured or if no API key is provided
        if USE_MOCK_RESPONSES or LLAMA_API_KEY == "your-llama-api-key-here":
            logger.info("Using mock responses for chat")
            ai_response = get_mock_response(request.message)
            return JSONResponse({
                "status": "success",
                "response": ai_response,
                "model": "mock-veterinary-assistant"
            })
        
        # Prepare the conversation context
        system_prompt = """You are a professional veterinary assistant specializing in cattle and buffalo health. 
        You provide expert advice on cattle health, nutrition, breeding, disease prevention, and management practices.
        Always be helpful, accurate, and professional. If you're unsure about something, recommend consulting a local veterinarian.
        Keep responses concise but informative. Focus on practical, actionable advice for cattle farmers."""
        
        # Build messages for Llama API
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history
        for msg in request.conversation_history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current message
        messages.append({
            "role": "user", 
            "content": request.message
        })
        
        # Prepare Llama API request
        llama_payload = {
            "model": "llama-3.1-8b-instruct",  # Use appropriate Llama model
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.7,
            "stream": False
        }
        
        headers = {
            "Authorization": f"Bearer {LLAMA_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Call Llama API
        response = requests.post(
            LLAMA_API_URL,
            headers=headers,
            json=llama_payload,
            timeout=30
        )
        
        if response.status_code != 200:
            logger.error(f"Llama API error: {response.status_code} - {response.text}")
            # Fallback to mock response
            ai_response = get_mock_response(request.message)
            return JSONResponse({
                "status": "success",
                "response": ai_response,
                "model": "mock-fallback"
            })
        
        llama_response = response.json()
        
        # Extract the response content
        if "choices" in llama_response and len(llama_response["choices"]) > 0:
            ai_response = llama_response["choices"][0]["message"]["content"]
        else:
            raise Exception("Invalid response format from Llama API")
        
        return JSONResponse({
            "status": "success",
            "response": ai_response,
            "model": "llama-3.1-8b-instruct"
        })
        
    except requests.exceptions.Timeout:
        logger.error("Llama API timeout")
        ai_response = get_mock_response(request.message)
        return JSONResponse({
            "status": "success",
            "response": ai_response,
            "model": "mock-timeout-fallback"
        })
    except requests.exceptions.RequestException as e:
        logger.error(f"Llama API request error: {e}")
        ai_response = get_mock_response(request.message)
        return JSONResponse({
            "status": "success",
            "response": ai_response,
            "model": "mock-error-fallback"
        })
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}")
        ai_response = get_mock_response(request.message)
        return JSONResponse({
            "status": "success",
            "response": ai_response,
            "model": "mock-exception-fallback"
        })