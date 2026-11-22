# Mother's Hut Intelligence - Smart Dining & Sentiment Verification

Autonomous Computer Vision & Sentiment Intelligence system for restaurants. It monitors customer dining satisfaction by combining:
- **Facial Emotion Recognition**: Real-time expression analysis (`happy`, `normal`, `angry`)
- **Plate Fullness & Waste Detection**: Food consumption and table state (`full_plate`, `waste_plate`, `empty_plate`)
- **Manager Alerting**: Automatic escalation when negative sentiments or heavy food waste are detected.

---

## 📁 Project Structure

```text
smart_detection/
├── mothers_hut_intelligence/
│   ├── backend/               # FastAPI REST backend & Groq AI vision engine
│   │   ├── src/               # Vision pipelines, Groq analyzer, box utilities
│   │   ├── app.py             # FastAPI entrypoint
│   │   └── requirements.txt
│   └── frontend/              # React + Vite + Tailwind CSS dashboard
│       ├── src/
│       └── package.json
└── dining_satisfaction_ml/    # Standalone ML pipeline and video/webcam scripts
```

---

## 🚀 Quick Setup & Run

### 1. Backend Setup
1. Open terminal and navigate to the backend:
   ```bash
   cd mothers_hut_intelligence/backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux / macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` file:
   - Copy `.env.example` to `.env`:
     ```bash
     copy .env.example .env
     ```
   - Add your free Groq API key from [Groq Console](https://console.groq.com/keys).
5. Start the backend:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

### 2. Frontend Setup
1. In a new terminal, navigate to the frontend:
   ```bash
   cd mothers_hut_intelligence/frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the workspace at: `http://localhost:3000` (or `http://localhost:5173`).

---

## 🔒 Security
- All sensitive credentials and API keys (`.env`) are excluded from version control via `.gitignore`.
- Always keep your `.env` private and configure your own keys when deploying.
