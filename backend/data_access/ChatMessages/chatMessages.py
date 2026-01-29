from datetime import datetime, timezone
from bson import ObjectId

class ChatMessage:
    def __init__(
        self,
        organisation_id: int,
        chatbot_id: int,
        session_id: str,
        sender: str,
        message: str,
        sender_user_id: int | None = None,
        sender_name: str | None = None,
        intent: str | None = None,
        embedding_id: str | None = None,
        timestamp: datetime | None = None,
        _id: ObjectId | None = None,
    ):
        self._id = _id
        self.organisation_id = organisation_id
        self.chatbot_id = chatbot_id
        self.session_id = session_id
        self.sender = sender
        self.sender_user_id = sender_user_id
        self.sender_name = sender_name
        self.message = message
        self.timestamp = timestamp or datetime.now(timezone.utc)

        self.metadata = {}
        if intent:
            self.metadata["intent"] = intent
        if embedding_id:
            self.metadata["embeddingId"] = embedding_id

    def to_dict(self):
        doc = {
            "organisationId": self.organisation_id,
            "chatbotId": self.chatbot_id,
            "sessionId": self.session_id,
            "sender": self.sender,
            "senderUserId": self.sender_user_id,
            "senderName": self.sender_name,
            "message": self.message,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }

        if self._id:
            doc["_id"] = self._id

        return doc


# ==============================
# MongoDB Repository
# ==============================
class ChatMessageRepository:
    def __init__(self, db):
        # db is returned from get_mongo_db()
        self.collection = db.chatMessages
