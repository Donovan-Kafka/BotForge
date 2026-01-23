# backend/application/ai/intent_model.py

import os
from typing import List, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

from backend.application.ai.intent_training_data import INTENT_EXAMPLES


def build_training_data() -> Tuple[List[str], List[str]]:
    texts: List[str] = []
    labels: List[str] = []

    for intent, examples in INTENT_EXAMPLES.items():
        for ex in examples:
            texts.append(ex)
            labels.append(intent)

    return texts, labels


def train_intent_model():
    X, y = build_training_data()

    # Simple train/test split for checking performance
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # TF-IDF + Logistic Regression pipeline
    pipeline = Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(lowercase=True, ngram_range=(1, 2))),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )

    pipeline.fit(X_train, y_train)

    # Quick evaluation (printed in terminal)
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred))

    # Save model to disk
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, "intent_model.joblib")
    joblib.dump(pipeline, model_path)

    print(f"Intent model saved to: {model_path}")


if __name__ == "__main__":
    train_intent_model()
