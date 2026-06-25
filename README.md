# 🐄 SIH-25005-SECURA  
**Prototype: Image & Video Based Cattle Health Monitoring with Multilingual Support**

---

## 📌 Overview
SIH-25005-SECURA is a prototype system designed for **image-based animal type classification** with a special focus on cows.  
It provides a simple interface where farmers can upload **images** or **videos** and receive insights about cattle health, nutrition, and local weather.  

Since this is a **prototype**, all outputs and interactions are stored in **JSON files inside the GitHub repo** (no external database, no deployment).

---

## ✨ Features
- **Image-based Cow Detection** 🖼️  
  - Upload an image → Model checks if it’s a cow.  
  - If cow → outputs **height, length, angles**.  
  - If not → displays **“No cow detected.”**  

- **Video-based Lameness Recognition** 🎥  
  - Upload a video → System checks gait.  
  - Detects signs of **lameness** in cows.  

- **AI Chatbot (LLaMA)** 🤖  
  - Simple question-answer system for cattle care.  
  - Prototype trained on limited domain FAQs.  

- **Weather Forecasting (IP-based)** ☁️  
  - Auto-detects location via IP.  
  - Shows **basic weather info** (for livestock care).  

- **Nutrition Suggestions** 🥬  
  - Based on detected cow → provides **basic feed recommendations**.  

- **Speech-to-Text (STT)** 🎙️  
  - Supports **5 Indian languages + English**.  
  - Farmers can speak queries directly.  

- **Multilingual Website** 🌍  
  - Website interface available in **6 languages**.  
  - Built using **TypeScript + i18n**.  

---

## 🛠️ Tech Stack
- **Frontend:** TypeScript, React.js, TailwindCSS, i18n  
- **Backend:** FastAPI (Python)  
- **ML Models:**  
  - YOLOv8 (Image & Video recognition)  
  - Mediapipe (Pose detection for gait)  
  - LLaMA (Prototype chatbot)  
- **Storage:** JSON files in GitHub repo (no database)  
- **Speech-to-Text:** Vosk / Google API (multilingual)  
- **Weather API:** OpenWeatherMap (IP-based)  

---

User → Website (TypeScript) → FastAPI Backend
       |                     | 
       |                     → YOLO + Mediapipe Models
       |                     → Chatbot (LLaMA)
       |                     → Weather API + Nutrition Engine
       |
       → Multilingual UI + Speech-to-Text
       → Stores results in JSON (GitHub repo)

---       

## 🚀 Running Locally
### 1. Clone Repository

```bash
git clone https://github.com/username/SIH-25005-SECURA.git
cd SIH-25005-SECURA

cd backend
pip install -r requirements.txt
uvicorn main:app --reload

cd frontend
npm install
npm run dev
```

--- 

# 📄 License

Licensed under the MIT License.

---

# 👨‍💻 Author

## Sandeep Kumar

Software Engineer • AI Builder • Full Stack Developer

📍 Chennai, India

---

# 🌐 Connect With Me

<p align="left">

<a href="https://github.com/sandeep-x47" target="_blank">
  <img src="https://skillicons.dev/icons?i=github" height="45" />
</a>

<a href="https://www.linkedin.com/in/sandeep-kumar-b7a8012bb/" target="_blank">
  <img src="https://skillicons.dev/icons?i=linkedin" height="45" />
</a>

<a href="https://www.instagram.com/x.sandeepkumar" target="_blank">
  <img src="https://skillicons.dev/icons?i=instagram" height="45" />
</a>

<a href="https://x.com/Sandeep_X47" target="_blank">
  <img src="https://cdn.simpleicons.org/x/white" height="45" />
</a>

</p>

---

