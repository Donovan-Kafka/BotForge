import numpy as np
from sentence_transformers import SentenceTransformer
from backend.application.ai.intent_training_data import INTENT_EXAMPLES

_model = None
_intent_embeddings = None
_intent_labels = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def get_intent_data():
    global _intent_embeddings, _intent_labels

    if _intent_embeddings is None or _intent_labels is None:
        model = get_model()

        texts = []
        labels = []

        for intent, examples in INTENT_EXAMPLES.items():
            for ex in examples:
                texts.append(ex)
                labels.append(intent)

        embeddings = model.encode(
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )

        _intent_embeddings = embeddings
        _intent_labels = labels

    return _intent_embeddings, _intent_labels


class EmbeddingIntentService:
    def parse(self, message: str) -> dict:
        if not message or not message.strip():
            return {"intent": "fallback", "confidence": 0.0, "entities": []}

        model = get_model()
        intent_embeddings, intent_labels = get_intent_data()

        query_emb = model.encode(
            [message],
            normalize_embeddings=True,
            convert_to_numpy=True,
        )[0]

        sims = np.dot(intent_embeddings, query_emb)
        best_idx = int(np.argmax(sims))

        return {
            "intent": intent_labels[best_idx],
            "confidence": float(sims[best_idx]),
            "entities": [],
        }
