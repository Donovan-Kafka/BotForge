from bson import ObjectId
from datetime import datetime
from backend.infrastructure.pinecone.pinecone_client import index, embed_text

# store embedded messages, free version probably up to 1 million vectors
def upsert_chat_message(
    message_id: ObjectId,
    chatbot_id: int,
    session_id: str,
    sender: str,
    message: str,
    timestamp: datetime,
):
    embedding = embed_text(message)

    index.upsert(
        vectors=[
            {
                "id": str(message_id),
                "values": embedding,
                "metadata": {
                    "chatbotId": chatbot_id,
                    "sessionId": session_id,
                    "sender": sender,
                    "timestamp": timestamp.isoformat(),
                    "message": message,
                },
            }
        ]
    )

# for searching messages
def semantic_search_chat_messages(
    query: str,
    chatbot_id: int,
    top_k: int = 5,
):
    query_embedding = embed_text(query)

    result = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter={"chatbotId": chatbot_id},
    )

    return [
        {
            "score": match["score"],
            "message": match["metadata"]["message"],
            "sender": match["metadata"]["sender"],
            "timestamp": match["metadata"]["timestamp"],
        }
        for match in result["matches"]
    ]
