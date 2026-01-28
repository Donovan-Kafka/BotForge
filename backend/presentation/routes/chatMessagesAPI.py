from flask import Blueprint, request, jsonify
from backend.application.chat_service import ChatMessageService
from backend.infrastructure.mongodb.mongo_client import get_mongo_db
from backend.data_access.ChatMessages.chatMessages import ChatMessageRepository

chat_messages_bp = Blueprint(
    "chat_messages",
    __name__,
    url_prefix="/api/chat-messages"
)

@chat_messages_bp.post("/")
def store_message():
    data = request.get_json() or {}

    required = ["chatbot_id", "session_id", "sender", "message"]
    if not all(k in data for k in required):
        return {"error": "Missing required fields"}, 400

    repo = ChatMessageRepository(get_mongo_db())
    service = ChatMessageService(repo)

    message_id = service.save_message(
        chatbot_id=data["chatbot_id"],
        session_id=data["session_id"],
        sender=data["sender"],
        message=data["message"],
        intent=data.get("intent"),
        embedding_id=data.get("embedding_id")
    )

    return {"message_id": str(message_id)}, 201


@chat_messages_bp.get("/")
def get_conversation():
    chatbot_id = request.args.get("chatbot_id", type=int)
    session_id = request.args.get("session_id")

    if not chatbot_id or not session_id:
        return {"error": "chatbot_id and session_id are required"}, 400

    repo = ChatMessageRepository(get_mongo_db())
    service = ChatMessageService(repo)

    messages = service.get_conversation(chatbot_id, session_id)

    for m in messages:
        m["_id"] = str(m["_id"])

    return jsonify(messages), 200
