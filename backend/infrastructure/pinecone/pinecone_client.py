from pinecone import Pinecone
from openai import OpenAI
from backend.config import PINECONE_API_KEY, OPENAI_API_KEY, PINECONE_INDEX_NAME, EMBEDDING_MODEL

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

openai_client = OpenAI(api_key=OPENAI_API_KEY)


def embed_text(text: str) -> list[float]:
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding
