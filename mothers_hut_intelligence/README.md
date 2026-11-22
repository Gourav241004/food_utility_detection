# Mother's Hut Intelligence Workspace (Full Stack)

Complete full-stack AI computer vision & sentiment verification platform matching the Mother's Hut Intelligence Workspace UI and backed by your Gemini + YOLO11/OpenCV dining satisfaction pipeline.

## Project Structure

- `backend/` — FastAPI server + ML pipeline (`full_plate`, `waste_plate`, `empty_plate`, `happy`, `normal`, `angry`)
- `frontend/` — React + Vite + Tailwind CSS application matching the Mother's Hut UI

## 1. Run Backend (`http://localhost:8000`)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Add your Gemini API key in `backend/.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Start the FastAPI server:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## 2. Run Frontend (`http://localhost:3000`)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
