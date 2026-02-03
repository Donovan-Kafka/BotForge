import os
from typing import Dict, Any

import joblib
from sklearn.pipeline import Pipeline
from sklearn.exceptions import NotFittedError


class IntentService:
    """
    Intent detection using a scikit-learn text classification pipeline.

    The model is trained in intent_model.py and saved as intent_model.joblib.
    """

    def __init__(self):
        base_dir = os.path.dirname(__file__)
        model_path = os.path.join(base_dir, "models", "intent_model.joblib")

        if not os.path.exists(model_path):
            raise RuntimeError(
                f"Intent model not found at {model_path}. "
                "Run `python -m backend.application.ai.intent_model` to train it."
            )

        self.model: Pipeline = joblib.load(model_path)

    def parse(self, message: str) -> Dict[str, Any]:
        """
        Returns:
        {
          "intent": "<intent_name>",
          "confidence": <float>,
          "entities": []  # placeholder for future entity extraction
        }
        """
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
            "entities": [],  # no entities yet
        }
