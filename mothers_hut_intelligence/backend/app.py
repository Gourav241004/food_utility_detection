import os
import tempfile
from datetime import datetime
from typing import List, Dict, Any, Optional
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.pipeline import DiningSatisfactionPipeline

app = FastAPI(title="Mother's Hut Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline: Optional[DiningSatisfactionPipeline] = None


def get_pipeline() -> DiningSatisfactionPipeline:
    global pipeline
    if pipeline is None:
        pipeline = DiningSatisfactionPipeline(sample_every_n_frames=24)
    return pipeline


# In-memory dashboard store seeded with initial overview metrics, updated live on scans
dashboard_state: Dict[str, Any] = {
    "total_faces": 96,
    "total_happy_faces": 19,
    "total_plates": 94,
    "total_plate_waste": 36,
    "alerts": [
        {
            "id": "alert-1",
            "initials": "RM",
            "guest_name": "Rohan Mukherjee",
            "table": "Table 04",
            "time": "1:15 PM",
            "reason": "Meal delayed / soup cold · Half Finished (45%)",
            "resolved": False,
        },
        {
            "id": "alert-2",
            "initials": "SS",
            "guest_name": "Sneha Sen",
            "table": "Table 09",
            "time": "2:04 PM",
            "reason": "Spice level too high in curry · Half Finished (52%)",
            "resolved": False,
        },
        {
            "id": "alert-3",
            "initials": "AR",
            "guest_name": "Amitabha Roy",
            "table": "Table 12",
            "time": "2:40 PM",
            "reason": "Cutlery missing & beverage delay · Full (Customer waiting)",
            "resolved": False,
        },
    ],
}


def update_dashboard_from_scan(summary: Dict[str, Any], plates: List[Dict[str, Any]], faces: List[Dict[str, Any]]) -> None:
    dashboard_state["total_plates"] += summary.get("total_plates", 0)
    dashboard_state["total_faces"] += summary.get("total_faces", 0)

    happy_count = sum(1 for f in faces if f.get("expression") == "happy")
    angry_count = sum(1 for f in faces if f.get("expression") == "angry")
    waste_count = sum(1 for p in plates if p.get("state") == "waste_plate")

    dashboard_state["total_happy_faces"] += happy_count
    dashboard_state["total_plate_waste"] += waste_count

    if angry_count > 0 or waste_count > 0:
        reasons = []
        if angry_count > 0:
            reasons.append(f"Angry Face detected ({angry_count})")
        if waste_count > 0:
            reasons.append(f"Waste Plate left ({waste_count})")
        new_id = f"alert-{len(dashboard_state['alerts']) + 1}"
        table_num = (len(dashboard_state["alerts"]) % 15) + 1
        dashboard_state["alerts"].insert(
            0,
            {
                "id": new_id,
                "initials": "GS",
                "guest_name": f"Guest Scan #{len(dashboard_state['alerts']) + 1}",
                "table": f"Table {table_num:02d}",
                "time": datetime.now().strftime("%I:%M %p").lstrip("0"),
                "reason": " · ".join(reasons),
                "resolved": False,
            },
        )


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    key_present = bool(os.getenv("GEMINI_API_KEY"))
    return {"status": "online", "gemini_configured": key_present}


@app.get("/api/overview")
def get_overview() -> Dict[str, Any]:
    total_faces = max(1, dashboard_state["total_faces"])
    total_plates = max(1, dashboard_state["total_plates"])
    satisfaction_pct = round((dashboard_state["total_happy_faces"] / total_faces) * 100)
    waste_pct = round((dashboard_state["total_plate_waste"] / total_plates) * 100)
    unresolved = sum(1 for a in dashboard_state["alerts"] if not a["resolved"])

    return {
        **dashboard_state,
        "satisfaction_ratio": satisfaction_pct,
        "waste_ratio": waste_pct,
        "unresolved_count": unresolved,
    }


@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str) -> Dict[str, Any]:
    for alert in dashboard_state["alerts"]:
        if alert["id"] == alert_id:
            alert["resolved"] = True
            return {"ok": True, "alert": alert}
    raise HTTPException(status_code=404, detail="Alert not found")


@app.post("/api/analyze/image")
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    record_metrics: bool = True,
) -> Dict[str, Any]:
    raw = await file.read()
    arr = np.frombuffer(raw, np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    try:
        pipe = get_pipeline()
        res = pipe.analyze_frame_bgr(frame, include_annotated=True)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if record_metrics:
        update_dashboard_from_scan(res["summary"], res["plates"], res["faces"])

    return res


@app.post("/api/analyze/video")
async def analyze_video_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    suffix = os.path.splitext(file.filename or "upload.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        pipe = get_pipeline()
        res = pipe.analyze_video_file(tmp_path, max_samples=6)
        update_dashboard_from_scan(res["summary"], res["plates"], res["faces"])
        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


class ScenarioRequest(BaseModel):
    scenario: str


@app.post("/api/analyze/scenario")
def analyze_preset_scenario(req: ScenarioRequest) -> Dict[str, Any]:
    scenarios: Dict[str, Dict[str, Any]] = {
        "full_plate": {
            "summary": {
                "total_plates": 1,
                "total_faces": 1,
                "satisfied_signals": 0,
                "unsatisfied_signals": 0,
                "none_signals": 2,
                "overall_satisfaction": "none",
            },
            "plates": [
                {
                    "id": "plate_1",
                    "bbox": [180, 140, 620, 480],
                    "state": "full_plate",
                    "satisfaction": "none",
                    "confidence": 0.98,
                }
            ],
            "faces": [
                {
                    "id": "face_1",
                    "bbox": [310, 40, 470, 190],
                    "expression": "normal",
                    "satisfaction": "none",
                    "confidence": 0.94,
                }
            ],
            "scenario_note": "Full Plate detected: User has not started eating yet (Satisfaction: None).",
        },
        "empty_plate": {
            "summary": {
                "total_plates": 1,
                "total_faces": 1,
                "satisfied_signals": 2,
                "unsatisfied_signals": 0,
                "none_signals": 0,
                "overall_satisfaction": "satisfied",
            },
            "plates": [
                {
                    "id": "plate_1",
                    "bbox": [180, 140, 620, 480],
                    "state": "empty_plate",
                    "satisfaction": "satisfied",
                    "confidence": 0.97,
                }
            ],
            "faces": [
                {
                    "id": "face_1",
                    "bbox": [310, 40, 470, 190],
                    "expression": "happy",
                    "satisfaction": "satisfied",
                    "confidence": 0.96,
                }
            ],
            "scenario_note": "Empty Plate + Happy Face detected: User finished food and is Satisfied.",
        },
        "waste_plate": {
            "summary": {
                "total_plates": 1,
                "total_faces": 1,
                "satisfied_signals": 0,
                "unsatisfied_signals": 2,
                "none_signals": 0,
                "overall_satisfaction": "unsatisfied",
            },
            "plates": [
                {
                    "id": "plate_1",
                    "bbox": [180, 140, 620, 480],
                    "state": "waste_plate",
                    "satisfaction": "unsatisfied",
                    "confidence": 0.95,
                }
            ],
            "faces": [
                {
                    "id": "face_1",
                    "bbox": [310, 40, 470, 190],
                    "expression": "angry",
                    "satisfaction": "unsatisfied",
                    "confidence": 0.93,
                }
            ],
            "scenario_note": "Waste Plate + Angry Face detected: User left food behind and is Unsatisfied.",
        },
    }
    if req.scenario not in scenarios:
        raise HTTPException(status_code=400, detail="Unknown scenario")
    return scenarios[req.scenario]
