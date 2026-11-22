from enum import Enum
from typing import List, Dict, Any


class PlateState(str, Enum):
    FULL = "full_plate"
    WASTE = "waste_plate"
    EMPTY = "empty_plate"


class FaceExpression(str, Enum):
    HAPPY = "happy"
    NORMAL = "normal"
    ANGRY = "angry"


class SatisfactionLevel(str, Enum):
    SATISFIED = "satisfied"
    UNSATISFIED = "unsatisfied"
    NONE = "none"


def plate_to_satisfaction(state: PlateState) -> SatisfactionLevel:
    if state == PlateState.EMPTY:
        return SatisfactionLevel.SATISFIED
    if state == PlateState.WASTE:
        return SatisfactionLevel.UNSATISFIED
    return SatisfactionLevel.NONE


def face_to_satisfaction(expression: FaceExpression) -> SatisfactionLevel:
    if expression == FaceExpression.HAPPY:
        return SatisfactionLevel.SATISFIED
    if expression == FaceExpression.ANGRY:
        return SatisfactionLevel.UNSATISFIED
    return SatisfactionLevel.NONE


def summarize_frame(
    plates: List[Dict[str, Any]],
    faces: List[Dict[str, Any]],
) -> Dict[str, Any]:
    satisfied_signals = 0
    unsatisfied_signals = 0
    none_signals = 0

    for p in plates:
        s = p["satisfaction"]
        if s == SatisfactionLevel.SATISFIED.value:
            satisfied_signals += 1
        elif s == SatisfactionLevel.UNSATISFIED.value:
            unsatisfied_signals += 1
        else:
            none_signals += 1

    for f in faces:
        s = f["satisfaction"]
        if s == SatisfactionLevel.SATISFIED.value:
            satisfied_signals += 1
        elif s == SatisfactionLevel.UNSATISFIED.value:
            unsatisfied_signals += 1
        else:
            none_signals += 1

    if unsatisfied_signals > satisfied_signals:
        overall = SatisfactionLevel.UNSATISFIED.value
    elif satisfied_signals > unsatisfied_signals:
        overall = SatisfactionLevel.SATISFIED.value
    else:
        overall = SatisfactionLevel.NONE.value

    return {
        "total_plates": len(plates),
        "total_faces": len(faces),
        "satisfied_signals": satisfied_signals,
        "unsatisfied_signals": unsatisfied_signals,
        "none_signals": none_signals,
        "overall_satisfaction": overall,
    }
