import os
from functools import lru_cache
from typing import Dict, Any

import joblib
from sklearn.pipeline import Pipeline
from sklearn.exceptions import NotFittedError


@lru_cache(maxsize=1)
def _load_model() -> Pipeline:
    base_dir = os.path.dirname(__file__)
    model_path = os.path.join(base_dir, "models", "intent_model.joblib")

    if not os.path.exists(model_path):
        raise RuntimeError(
            f"Intent model not found at {model_path}. "
            "Run `python -m backend.application.ai.intent_model` to train it."
        )

    return joblib.load(model_path)


class IntentService:

    def __init__(self):
        self.model = _load_model()

    def parse(self, message: str) -> Dict[str, Any]:

        if not message or not message.strip():
            return {
                "intent": "fallback",
                "confidence": 0.0,
                "entities": [],
            }

        try:
            if hasattr(self.model, "predict_proba"):
                probs = self.model.predict_proba([message])[0]
                labels = self.model.classes_
                pred_idx = probs.argmax()

                intent = labels[pred_idx]
                confidence = float(probs[pred_idx])
            else:
                intent = self.model.predict([message])[0]
                confidence = 1.0

        except NotFittedError:
            intent = "fallback"
            confidence = 0.0

        return {
            "intent": intent,
            "confidence": confidence,
            "entities": [],
        }