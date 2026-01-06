from datetime import datetime, timezone
from bson import ObjectId


class ChatMessage:
    def __init__(
        self,
        chatbot_id: ObjectId,
        session_id: str,
        sender: str,
        message: str,
        intent: str = None,
        embedding_id: str = None,
        timestamp: datetime = None,
    ):
        self.chatbot_id = chatbot_id
        self.session_id = session_id
        self.sender = sender
        self.message = message
        self.timestamp = timestamp or datetime.now(timezone.utc)
        self.metadata = {
            "intent": intent,
            "embeddingId": embedding_id,
        }

    def to_dict(self):
        return {
            "chatbotId": self.chatbot_id,
            "sessionId": self.session_id,
            "timestamp": self.timestamp,
            "sender": self.sender,
            "message": self.message,
            "metadata": self.metadata,
        }
