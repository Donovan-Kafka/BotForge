from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import traceback
from backend.application.ai.chatbot_service import ChatbotService
from backend.application.ai.intent_service_embed import EmbeddingIntentService
from backend.application.ai.template_engine import TemplateEngine
from backend.application.chat_service import ChatMessageService
from backend.data_access.ai.company_profile_repo import CompanyProfileRepository
from backend.data_access.ai.chatbot_repo import ChatbotRepository
from backend.data_access.ai.personality_repo import PersonalityRepository
from backend.data_access.ai.template_repo import TemplateRepository
from backend.data_access.ChatMessages.chatMessages import ChatMessageRepository
from backend.infrastructure.mongodb.mongo_client import get_mongo_db


chat_bp = Blueprint("chat", __name__)

# GET /chat/welcome
@chat_bp.route("/chat/welcome", methods=["GET", "OPTIONS"])
@cross_origin()
def chat_welcome():
    company_id = request.args.get("company_id", type=int)
    session_id = request.args.get("session_id")

    try:
        chatbot_repo = ChatbotRepository()
        chatbot = chatbot_repo.get_by_organisation_id(company_id)

        if not chatbot:
            raise ValueError("Chatbot not found")

        chat_message_service = ChatMessageService(
            ChatMessageRepository(get_mongo_db())
        )

        chatbot_service = ChatbotService(
            intent_service=EmbeddingIntentService(),
            company_repository=CompanyProfileRepository(),
            template_repository=TemplateRepository(),
            template_engine=TemplateEngine(),
            chatbot_repository=chatbot_repo,
            personality_repository=PersonalityRepository(),
            chat_message_service=chat_message_service,  # ✅ FIXED
        )

        result = chatbot_service.welcome(
            company_id=company_id,
            session_id=session_id,
        )

        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500

# POST /chat
@chat_bp.route("/chat", methods=["POST", "OPTIONS"])
@cross_origin()
def chat():
    payload = request.get_json(force=True)

    company_id = payload.get("company_id")
    message = payload.get("message")
    session_id = payload.get("session_id")
    user_id = payload.get("user_id")

    if not company_id or not message:
        return jsonify(
            {"ok": False, "error": "company_id and message are required"}
        ), 400

    try:
        chatbot_repo = ChatbotRepository()
        chatbot = chatbot_repo.get_by_organisation_id(company_id)

        if not chatbot:
            raise ValueError("Chatbot not found")

        chat_message_service = ChatMessageService(
            ChatMessageRepository(get_mongo_db())
        )

        chatbot_service = ChatbotService(
            intent_service=EmbeddingIntentService(),
            company_repository=CompanyProfileRepository(),
            template_repository=TemplateRepository(),
            template_engine=TemplateEngine(),
            chatbot_repository=chatbot_repo,
            personality_repository=PersonalityRepository(),
            chat_message_service=chat_message_service,
        )

        result = chatbot_service.chat(
            company_id=company_id,
            message=message,
            session_id=session_id,
            user_id=user_id,
        )

        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500
