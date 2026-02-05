import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

BASE_DIR = Path(__file__).parent
EMB_PATH = BASE_DIR / "intent_embeddings.npy"
LBL_PATH = BASE_DIR / "intent_labels.npy"

_model = None
_intent_embeddings = None
_intent_labels = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )
    return _model


def get_intent_data():
    global _intent_embeddings, _intent_labels

    if _intent_embeddings is None:
        _intent_embeddings = np.load(EMB_PATH)
        _intent_labels = np.load(LBL_PATH).tolist()

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

        sims = intent_embeddings @ query_emb   # cleaner than np.dot
        best_idx = int(np.argmax(sims))

        return {
            "intent": intent_labels[best_idx],
            "confidence": float(sims[best_idx]),
            "entities": [],
        }