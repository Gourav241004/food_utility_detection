import base64
from typing import Dict, Any, Optional
import cv2
import numpy as np

from src.local_detector import LocalVisionDetector
from src.groq_analyzer import GroqDiningAnalyzer
from src.rules import summarize_frame


class DiningSatisfactionPipeline:
    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        custom_plate_model_path: str = "models/custom_plates.pt",
        sample_every_n_frames: int = 24,
    ):
        self.local_detector = LocalVisionDetector(
            custom_plate_model_path=custom_plate_model_path
        )
        self.analyzer = GroqDiningAnalyzer(api_key=groq_api_key)
        self.sample_every_n_frames = max(1, sample_every_n_frames)

    @staticmethod
    def encode_base64_jpeg(frame_bgr: np.ndarray) -> str:
        ok, buf = cv2.imencode(".jpg", frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        if not ok:
            return ""
        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"

    def analyze_frame_bgr(self, frame_bgr: np.ndarray, include_annotated: bool = True) -> Dict[str, Any]:
        h, w, _ = frame_bgr.shape
        local_hints = self.local_detector.detect_candidates(frame_bgr)
        analysis_res = self.analyzer.analyze_frame_bgr(frame_bgr)

        plates = analysis_res["plates"]
        faces = analysis_res["faces"]
        summary = summarize_frame(plates, faces)

        result: Dict[str, Any] = {
            "width": w,
            "height": h,
            "summary": summary,
            "plates": plates,
            "faces": faces,
            "local_person_count": len(local_hints["persons"]),
        }
        if include_annotated:
            annotated = self.local_detector.draw_annotations(frame_bgr, plates, faces)
            result["annotated_image"] = self.encode_base64_jpeg(annotated)

        return result

    def analyze_video_file(self, video_path: str, max_samples: int = 8) -> Dict[str, Any]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise FileNotFoundError(f"Could not open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        step = max(self.sample_every_n_frames, total_frames // max(1, max_samples) if total_frames > 0 else self.sample_every_n_frames)

        frame_idx = 0
        sampled_events = []
        last_annotated = None
        agg_plates = []
        agg_faces = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % step == 0 and len(sampled_events) < max_samples:
                res = self.analyze_frame_bgr(frame, include_annotated=True)
                last_annotated = res.get("annotated_image")
                agg_plates = res["plates"]
                agg_faces = res["faces"]
                sampled_events.append({
                    "frame": frame_idx,
                    "timestamp_sec": round(frame_idx / fps, 2),
                    "summary": res["summary"],
                    "plates": res["plates"],
                    "faces": res["faces"],
                })

            frame_idx += 1

        cap.release()

        latest_summary = sampled_events[-1]["summary"] if sampled_events else summarize_frame([], [])
        return {
            "total_frames_processed": frame_idx,
            "sampled_events": sampled_events,
            "summary": latest_summary,
            "plates": agg_plates,
            "faces": agg_faces,
            "annotated_image": last_annotated,
        }
