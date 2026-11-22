# Dining Satisfaction ML (`dining_satisfaction_ml`)

Hybrid computer vision & Gemini API pipeline for detecting plates (`full_plate`, `waste_plate`, `empty_plate`) and human faces (`happy`, `normal`, `angry`) across images, videos, and live webcam streams.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Add your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. *(Optional)* Place custom-trained YOLO plate weights at `models/custom_plates.pt`.

## Usage

Run `python -m src.pipeline` or import `DiningSatisfactionPipeline` from `src.pipeline`.
