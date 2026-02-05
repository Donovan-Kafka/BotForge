# file to be run everytime when the training data changes.

import numpy as np
from sentence_transformers import SentenceTransformer
from intent_training_data import INTENT_EXAMPLES

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

def main():
    print("Loading model...")
    model = SentenceTransformer(MODEL_NAME)

    texts = []
    labels = []

    for intent, examples in INTENT_EXAMPLES.items():
        for ex in examples:
            texts.append(ex)
            labels.append(intent)

    print("Generating embeddings...")
    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
        batch_size=8,
    )

    np.save("intent_embeddings.npy", embeddings)
    np.save("intent_labels.npy", np.array(labels))

    print("Embeddings saved successfully.")

if __name__ == "__main__":
    main()