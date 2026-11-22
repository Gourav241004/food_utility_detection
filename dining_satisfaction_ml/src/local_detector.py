from pathlib import Path
from typing import List, Dict, Any
import cv2
import numpy as np
from ultralytics import YOLO


class LocalVisionDetector:
    def __init__(
        self,
        general_model_path: str = "yolo11n.pt",
        custom_plate_model_path: str = "models/custom_plates.pt",
        conf_threshold: float = 0.35,
    ):
        self.conf_threshold = conf_threshold
        self.general_model = YOLO(general_model_path)

        custom_path = Path(custom_plate_model_path)
        self.custom_plate_model = YOLO(str(custom_path)) if custom_path.exists() else None

        cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(str(cascade_path))

    def detect_candidates(self, frame_bgr: np.ndarray) -> Dict[str, List[Dict[str, Any]]]:
        h, w, _ = frame_bgr.shape
        plates: List[Dict[str, Any]] = []
        faces: List[Dict[str, Any]] = []
        persons: List[Dict[str, Any]] = []

        if self.custom_plate_model is not None:
            p_results = self.custom_plate_model.predict(
                frame_bgr, conf=self.conf_threshold, verbose=False
            )[0]
            for idx, box in enumerate(p_results.boxes):
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                cls_id = int(box.cls[0].item())
                label = self.custom_plate_model.names.get(cls_id, "plate")
                plates.append({
                    "id": f"plate_{idx + 1}",
                    "bbox": [x1, y1, x2, y2],
                    "detector_label": label,
                    "confidence": round(float(box.conf[0].item()), 3),
                })

        g_results = self.general_model.predict(
            frame_bgr, conf=self.conf_threshold, classes=[0], verbose=False
        )[0]
        for idx, box in enumerate(g_results.boxes):
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            persons.append({
                "id": f"person_{idx + 1}",
                "bbox": [max(0, x1), max(0, y1), min(w, x2), min(h, y2)],
                "confidence": round(float(box.conf[0].item()), 3),
            })

        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        detected_faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(36, 36)
        )
        for idx, (x, y, fw, fh) in enumerate(detected_faces):
            pad_x = int(0.15 * fw)
            pad_y = int(0.15 * fh)
            x1 = max(0, x - pad_x)
            y1 = max(0, y - pad_y)
            x2 = min(w, x + fw + pad_x)
            y2 = min(h, y + fh + pad_y)
            faces.append({
                "id": f"face_{idx + 1}",
                "bbox": [x1, y1, x2, y2],
            })

        return {"plates": plates, "faces": faces, "persons": persons}

    @staticmethod
    def crop_bgr(frame_bgr: np.ndarray, bbox: List[int]) -> np.ndarray:
        x1, y1, x2, y2 = bbox
        return frame_bgr[y1:y2, x1:x2].copy()

    @staticmethod
    def draw_annotations(
        frame_bgr: np.ndarray,
        plates: List[Dict[str, Any]],
        faces: List[Dict[str, Any]],
    ) -> np.ndarray:
        annotated = frame_bgr.copy()

        for p in plates:
            x1, y1, x2, y2 = p["bbox"]
            text = f"{p['id']}: {p['state']} ({p['satisfaction']})"
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 180, 255), 2)
            cv2.putText(
                annotated, text, (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 180, 255), 2,
            )

        for f in faces:
            x1, y1, x2, y2 = f["bbox"]
            text = f"{f['id']}: {f['expression']} ({f['satisfaction']})"
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (60, 220, 90), 2)
            cv2.putText(
                annotated, text, (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (60, 220, 90), 2,
            )

        return annotated
