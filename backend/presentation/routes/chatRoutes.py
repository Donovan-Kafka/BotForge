from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from application.ai.chatbot_service import ChatbotService
from application.ai.intent_service_embed import EmbeddingIntentService
from application.ai.template_engine import TemplateEngine
from data_access.ai.company_profile_repo import CompanyProfileRepository
from data_access.ai.chatbot_repo import ChatbotRepository
from data_access.ai.personality_repo import PersonalityRepository
from data_access.ai.template_repo import TemplateRepository
from infrastructure.mongodb.mongo_client import get_mongo_db
from data_access.ChatMessages.chatMessages import ChatMessageRepository
import traceback

chat_bp = Blueprint("chat", __name__)

# GET /chat/welcome
@chat_bp.route("/chat/welcome", methods=["GET", "OPTIONS"])
@cross_origin()
def chat_welcome():
    company_id = request.args.get("company_id")
    session_id = request.args.get("session_id")  # optional

    try:
        # --- Wire dependencies ---
        company_repo = CompanyProfileRepository()
        template_repo = TemplateRepository()
        template_engine = TemplateEngine()
        intent_service = EmbeddingIntentService()
        chatbot_repo = ChatbotRepository()
        personality_repo = PersonalityRepository()

        mongo_repo = ChatMessageRepository(get_mongo_db())

        chatbot_service = ChatbotService(
            intent_service=intent_service,
            company_repository=company_repo,
            template_repository=template_repo,
            template_engine=template_engine,
            chatbot_repository=chatbot_repo,
            personality_repository=personality_repo,
            chat_message_repository=mongo_repo,  # Mongodb repo injected here
        )

        result = chatbot_service.welcome(
            company_id=company_id,
            session_id=session_id,
        )

        return jsonify(result), 200

    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500

# POST /chat
@chat_bp.route("/chat", methods=["POST", "OPTIONS"])
@cross_origin()
def chat():
    payload = request.get_json(force=True)
    company_id = payload.get("company_id")
    message = payload.get("message", "")
    session_id = payload.get("session_id") 
    user_id = payload.get("user_id")       

    if not company_id or not message:
        return jsonify({"ok": False, "error": "company_id and message are required"}), 400

    try:
        # --- Wire dependencies ---
        company_repo = CompanyProfileRepository()
        template_repo = TemplateRepository()
        template_engine = TemplateEngine()
        intent_service = EmbeddingIntentService()
        chatbot_repo = ChatbotRepository()
        personality_repo = PersonalityRepository()

        mongo_repo = ChatMessageRepository(get_mongo_db())

        chatbot_service = ChatbotService(
            intent_service=intent_service,
            company_repository=company_repo,
            template_repository=template_repo,
            template_engine=template_engine,
            chatbot_repository=chatbot_repo,
            personality_repository=personality_repo,
            chat_message_repository=mongo_repo,
        )

        result = chatbot_service.chat(
            company_id=company_id,
            message=message,
            session_id=session_id,
            user_id=user_id,
        )

        return jsonify(result), 200

    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500
    
@chat_bp.get("/chat/history")
def get_chat_history_for_session():
    session_id = request.args.get("session_id")
    company_id = request.args.get("company_id")

    if not session_id or not company_id:
        return {"ok": False, "error": "session_id and company_id are required"}, 400

    chatbot_repo = ChatbotRepository()
    chatbot = chatbot_repo.get_by_organisation_id(company_id)

    if not chatbot:
        return {"ok": False, "messages": []}, 200

    repo = ChatMessageRepository(get_mongo_db())

    cursor = (
        repo.collection
        .find({
            "organisationId": int(company_id),
            "chatbotId": chatbot.bot_id,
            "sessionId": session_id,
        })
        .sort("timestamp", 1)
    )

    messages = []
    for r in cursor:
        messages.append({
            "id": str(r["_id"]),
            "role": "assistant" if r["sender"] == "bot" else "user",
            "content": r.get("message"),
            "timestamp": r.get("timestamp").isoformat()
            if r.get("timestamp") else None,
        })

    return jsonify({
        "ok": True,
        "messages": messages,
    }), 200
