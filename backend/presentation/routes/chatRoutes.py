from flask import Blueprint, request, jsonify
import traceback
from backend.application.ai.chatbot_service import ChatbotService
from backend.application.ai.intent_service import IntentService
from backend.application.ai.template_engine import TemplateEngine
from backend.data_access.ai.company_profile_repo import CompanyProfileRepository
from backend.data_access.ai.chatbot_repo import ChatbotRepository
from backend.data_access.ai.personality_repo import PersonalityRepository
from backend.data_access.ai.template_repo import TemplateRepository

chat_bp = Blueprint("chat", __name__)

@chat_bp.get("/chat/welcome")
def chat_welcome():
    company_id = request.args.get("company_id")
    session_id = request.args.get("session_id")  # optional

    try:
        company_repo = CompanyProfileRepository()
        template_repo = TemplateRepository()
        template_engine = TemplateEngine()
        intent_service = IntentService()
        chatbot_repo = ChatbotRepository()
        personality_repo = PersonalityRepository()

        chatbot_service = ChatbotService(
            intent_service=intent_service,
            company_repository=company_repo,
            template_repository=template_repo,
            template_engine=template_engine,
            chatbot_repository=chatbot_repo,
            personality_repository=personality_repo,
        )

        result = chatbot_service.welcome(
            company_id=company_id,
            session_id=session_id,
        )

        return jsonify(result), 200

    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"ok": False, "error": "Internal server error"}), 500

@chat_bp.post("/chat")
def chat():
    payload = request.get_json(force=True)

    company_id = payload.get("company_id")
    message = payload.get("message", "")
    session_id = payload.get("session_id")  # optional
    user_id = payload.get("user_id")  # optional

    try:
        # Wire dependencies
        company_repo = CompanyProfileRepository()
        template_repo = TemplateRepository()
        template_engine = TemplateEngine()
        intent_service = IntentService()
        chatbot_repo = ChatbotRepository()
        personality_repo = PersonalityRepository()

        chatbot_service = ChatbotService(
            intent_service=intent_service,
            company_repository=company_repo,
            template_repository=template_repo,
            template_engine=template_engine,
            chatbot_repository=chatbot_repo,
            personality_repository=personality_repo,
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
    except Exception:
        # For now just return generic error
        return jsonify({"ok": False, "error": "Internal server error"}), 500
