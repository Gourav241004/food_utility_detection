import base64
import json
import os
from typing import Any, Dict, List

import cv2
from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel, Field

from src.rules import (
    FaceExpression,
    PlateState,
    face_to_satisfaction,
    plate_to_satisfaction,
)
from src.box_utils import filter_detections

load_dotenv()


class DetectedPlateItem(BaseModel):
    label: str = Field(default="plate", description="Short identifier like plate_1, plate_2")
    state: PlateState
    box_2d: List[int] = Field(
        default=[0, 0, 1000, 1000],
        description="Bounding box [ymin, xmin, ymax, xmax] normalized 0-1000",
    )
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class DetectedFaceItem(BaseModel):
    label: str = Field(default="face", description="Short identifier like face_1, face_2")
    expression: FaceExpression
    box_2d: List[int] = Field(
        default=[0, 0, 1000, 1000],
        description="Bounding box [ymin, xmin, ymax, xmax] normalized 0-1000",
    )
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class DiningSceneAnalysis(BaseModel):
    plates: List[DetectedPlateItem] = Field(default_factory=list)
    faces: List[DetectedFaceItem] = Field(default_factory=list)


SYSTEM_INSTRUCTION = """
You are a precision dining-scene computer vision analyst.
Detect ALL visible plates/thalis/bowls and ALL visible human faces in the image.

Plate rules:
- full_plate: Food served and not yet started/eaten (satisfaction = none).
- waste_plate: Uneaten food, solid leftovers, bones, peels, or shells left behind (satisfaction = unsatisfied).
- empty_plate: Food eaten/finished; only light oil/gravy/spice smears or crumbs remain (satisfaction = satisfied).

Face rules:
- happy: Clear smile or joyful expression (satisfaction = satisfied).
- normal: Neutral, calm, candid, or focused expression (satisfaction = none).
- angry: Angry, frowning, or visibly frustrated/upset expression (satisfaction = unsatisfied).

Respond ONLY with valid JSON matching this structure:
{
  "plates": [{"label": "plate_1", "state": "full_plate|waste_plate|empty_plate", "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.9}],
  "faces": [{"label": "face_1", "expression": "happy|normal|angry", "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.9}]
}
Use a 0 to 1000 scale for box_2d.
"""


class GroqDiningAnalyzer:
    def __init__(self, api_key: str | None = None, model: str = "qwen/qwen3.8-27b"):
        resolved_key = api_key or os.getenv("GROQ_API_KEY")
        if not resolved_key:
            raise ValueError("GROQ_API_KEY is missing. Set it in .env or pass api_key.")
        self.client = Groq(api_key=resolved_key)
        self.model = model

    def analyze_frame_bgr(self, frame_bgr: Any) -> Dict[str, List[Dict[str, Any]]]:
        h, w, _ = frame_bgr.shape
        ok, encoded = cv2.imencode(".jpg", frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        if not ok:
            raise RuntimeError("Failed to encode frame to JPEG.")

        b64_jpg = base64.b64encode(encoded.tobytes()).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64_jpg}"

        completion = self.client.chat.completions.create(
            model=self.model,
            temperature=0.1,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Detect every plate and every visible human face in this image and classify each accurately.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url},
                        },
                    ],
                },
            ],
        )

        raw_content = completion.choices[0].message.content or "{}"
        parsed = DiningSceneAnalysis.model_validate(json.loads(raw_content))

        plates_out: List[Dict[str, Any]] = []
        for idx, item in enumerate(parsed.plates):
            box = item.box_2d if len(item.box_2d) == 4 else [0, 0, 1000, 1000]
            ymin, xmin, ymax, xmax = box
            x1 = max(0, min(w, int((xmin / 1000.0) * w)))
            y1 = max(0, min(h, int((ymin / 1000.0) * h)))
            x2 = max(0, min(w, int((xmax / 1000.0) * w)))
            y2 = max(0, min(h, int((ymax / 1000.0) * h)))
            plates_out.append({
                "id": item.label or f"plate_{idx + 1}",
                "bbox": [x1, y1, x2, y2],
                "bbox_norm": box,
                "state": item.state.value,
                "satisfaction": plate_to_satisfaction(item.state).value,
                "confidence": round(item.confidence, 3),
            })

        faces_out: List[Dict[str, Any]] = []
        for idx, item in enumerate(parsed.faces):
            box = item.box_2d if len(item.box_2d) == 4 else [0, 0, 1000, 1000]
            ymin, xmin, ymax, xmax = box
            x1 = max(0, min(w, int((xmin / 1000.0) * w)))
            y1 = max(0, min(h, int((ymin / 1000.0) * h)))
            x2 = max(0, min(w, int((xmax / 1000.0) * w)))
            y2 = max(0, min(h, int((ymax / 1000.0) * h)))
            faces_out.append({
                "id": item.label or f"face_{idx + 1}",
                "bbox": [x1, y1, x2, y2],
                "bbox_norm": box,
                "expression": item.expression.value,
                "satisfaction": face_to_satisfaction(item.expression).value,
                "confidence": round(item.confidence, 3),
            })

        print("RAW PLATES:", len(plates_out), plates_out)
        print("RAW FACES:", len(faces_out), faces_out)
        filtered_plates = filter_detections(plates_out, frame_w=w, frame_h=h)
        filtered_faces = filter_detections(faces_out, frame_w=w, frame_h=h)
        print("FILTERED PLATES:", len(filtered_plates), "FILTERED FACES:", len(filtered_faces))

        return {"plates": filtered_plates, "faces": filtered_faces}
