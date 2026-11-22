from typing import List, Dict, Any


def compute_iou(box_a: List[int], box_b: List[int]) -> float:
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0

    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    union_area = area_a + area_b - inter_area
    return inter_area / union_area if union_area > 0 else 0.0


def compute_containment(box_a: List[int], box_b: List[int]) -> float:
    """Calculates intersection area divided by the area of the smaller box (0.0 to 1.0).

    Catches nested/sub-boxes (e.g. food/bowl boxes placed inside a larger plate box).
    """
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0

    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    min_area = min(area_a, area_b)
    return inter_area / min_area if min_area > 0 else 0.0


def filter_detections(
    items: List[Dict[str, Any]],
    frame_w: int,
    frame_h: int,
    min_confidence: float = 0.65,
    iou_threshold: float = 0.40,
    containment_threshold: float = 0.70,
    min_box_ratio: float = 0.04,
) -> List[Dict[str, Any]]:
    valid: List[Dict[str, Any]] = []
    min_w = frame_w * min_box_ratio
    min_h = frame_h * min_box_ratio

    # Sort descending by confidence
    for item in sorted(items, key=lambda x: x.get("confidence", 0.0), reverse=True):
        if item.get("confidence", 0.0) < min_confidence:
            continue
        x1, y1, x2, y2 = item["bbox"]
        bw = x2 - x1
        bh = y2 - y1
        if bw < min_w or bh < min_h:
            continue

        # Check for IoU overlap or sub-box containment
        is_duplicate = False
        for existing in valid:
            if compute_iou([x1, y1, x2, y2], existing["bbox"]) > iou_threshold:
                is_duplicate = True
                break
            if compute_containment([x1, y1, x2, y2], existing["bbox"]) > containment_threshold:
                is_duplicate = True
                break

        if not is_duplicate:
            valid.append(item)

    # Re-index IDs cleanly (plate_1, plate_2... or face_1, face_2...)
    prefix = "plate" if valid and "state" in valid[0] else "face"
    for idx, item in enumerate(valid):
        item["id"] = f"{prefix}_{idx + 1}"

    return valid
