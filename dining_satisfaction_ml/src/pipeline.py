import time
from typing import Dict, Any, Optional
import cv2

from src.local_detector import LocalVisionDetector
from src.groq_analyzer import GroqDiningAnalyzer
from src.rules import summarize_frame


class DiningSatisfactionPipeline:
    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        custom_plate_model_path: str = "models/custom_plates.pt",
        sample_every_n_frames: int = 15,
    ):
        self.local_detector = LocalVisionDetector(
            custom_plate_model_path=custom_plate_model_path
        )
        self.analyzer = GroqDiningAnalyzer(api_key=groq_api_key)
        self.sample_every_n_frames = max(1, sample_every_n_frames)

    def analyze_image(
        self, image_path: str, output_image_path: Optional[str] = None
    ) -> Dict[str, Any]:
        frame = cv2.imread(image_path)
        if frame is None:
            raise FileNotFoundError(f"Could not read image: {image_path}")

        local_hints = self.local_detector.detect_candidates(frame)
        analysis_res = self.analyzer.analyze_frame_bgr(frame)

        plates = analysis_res["plates"]
        faces = analysis_res["faces"]
        summary = summarize_frame(plates, faces)
        annotated = self.local_detector.draw_annotations(frame, plates, faces)

        if output_image_path:
            cv2.imwrite(output_image_path, annotated)

        return {
            "summary": summary,
            "plates": plates,
            "faces": faces,
            "local_person_count": len(local_hints["persons"]),
            "annotated_frame": annotated,
        }

    def analyze_video(
        self,
        video_path: str,
        output_video_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise FileNotFoundError(f"Could not open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        writer = None
        if output_video_path:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_video_path, fourcc, fps, (w, h))

        frame_idx = 0
        latest_plates = []
        latest_faces = []
        timeline = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % self.sample_every_n_frames == 0:
                res = self.analyzer.analyze_frame_bgr(frame)
                latest_plates = res["plates"]
                latest_faces = res["faces"]
                timeline.append({
                    "frame": frame_idx,
                    "timestamp_sec": round(frame_idx / fps, 2),
                    "summary": summarize_frame(latest_plates, latest_faces),
                })

            annotated = self.local_detector.draw_annotations(
                frame, latest_plates, latest_faces
            )
            if writer is not None:
                writer.write(annotated)

            frame_idx += 1

        cap.release()
        if writer is not None:
            writer.release()

        return {
            "total_frames_processed": frame_idx,
            "sampled_events": timeline,
        }

    def run_live_webcam(self, camera_index: int = 0) -> None:
        cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open webcam index {camera_index}")

        print("Live webcam started. Press 'q' to quit, 's' to force immediate Groq scan.")
        frame_idx = 0
        last_scan_time = 0.0
        latest_plates = []
        latest_faces = []
        latest_summary = summarize_frame([], [])

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            key = cv2.waitKey(1) & 0xFF
            force_scan = key == ord("s")
            now = time.time()

            if force_scan or (
                frame_idx % self.sample_every_n_frames == 0 and (now - last_scan_time) >= 2.5
            ):
                try:
                    res = self.analyzer.analyze_frame_bgr(frame)
                    latest_plates = res["plates"]
                    latest_faces = res["faces"]
                    latest_summary = summarize_frame(latest_plates, latest_faces)
                    last_scan_time = now
                except Exception as exc:
                    print(f"[Scan warning]: {exc}")

            annotated = self.local_detector.draw_annotations(
                frame, latest_plates, latest_faces
            )
            hud = (
                f"Plates: {latest_summary['total_plates']} | "
                f"Faces: {latest_summary['total_faces']} | "
                f"Overall: {latest_summary['overall_satisfaction']}"
            )
            cv2.putText(
                annotated, hud, (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2,
            )
            cv2.imshow("Dining Plate & Face Satisfaction Monitor", annotated)

            if key == ord("q"):
                break
            frame_idx += 1

        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    pipeline = DiningSatisfactionPipeline(sample_every_n_frames=15)
    # Example 1: Single image
    # out = pipeline.analyze_image("path/to/plate_image.jpg", "annotated_out.jpg")
    # print(out["summary"], out["plates"], out["faces"])

    # Example 2: Video file
    # vid_out = pipeline.analyze_video("path/to/dining_video.mp4", "annotated_video.mp4")
    # print(vid_out["sampled_events"])

    # Example 3: Live webcam
    # pipeline.run_live_webcam(camera_index=0)
