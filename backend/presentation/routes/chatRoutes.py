# What it does:

# Accepts HTTP requests

# Calls chatbot_service

# Returns JSON response

from flask import Blueprint, request, jsonify

from backend.application.ai.chatbot_service import ChatbotService
from backend.application.ai.intent_service import IntentService
from backend.application.ai.template_engine import TemplateEngine
from backend.data_access.ai.company_profile_repo import CompanyProfileRepository
from backend.data_access.ai.template_repo import TemplateRepository

# BP for chat endpoints
chat_bp = Blueprint("chat", __name__)


@chat_bp.post("/chat")
def chat():
    """
    POST /api/chat
    Body:
      {
        "company_id": "c123",
        "message": "What time do you open?",
        "session_id": "optional-session-id"
      }

    Returns:
      {
        "ok": true,
        "reply": "...",
        "intent": "business_hours",
        "entities": [],
        "quick_replies": ["Pricing", "Business hours", "Contact support"]
      }
    """
    payload = request.get_json(force=True)

    company_id = payload.get("company_id")
    message = payload.get("message", "").strip()
    session_id = payload.get("session_id")  # optional (future use)

    if not company_id:
        return jsonify({"ok": False, "error": "company_id is required"}), 400
    if not message:
        return jsonify({"ok": False, "error": "message is required"}), 400

    try:
        # Wire dependencies
        company_repo = CompanyProfileRepository()
        template_repo = TemplateRepository()
        template_engine = TemplateEngine()
        intent_service = IntentService()  # can start as keyword-based, later swap to Rasa
        chatbot_service = ChatbotService(
            intent_service=intent_service,
            company_repository=company_repo,
            template_repository=template_repo,
            template_engine=template_engine,
        )

        result = chatbot_service.chat(
            company_id=company_id,
            message=message,
            session_id=session_id,
        )

        return jsonify({
            "ok": True,
            "reply": result["reply"],
            "intent": result.get("intent"),
            "entities": result.get("entities", []),
            "quick_replies": result.get("quick_replies", []),
        }), 200

    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception as e:
        # Log full traceback in terminal
        current_app.logger.error("Chat endpoint failed:\n%s", traceback.format_exc())

        # During development, return the real error to help debugging
        if current_app.debug:
            return jsonify({"ok": False, "error": str(e)}), 500

        # In production, keep it generic
        return jsonify({"ok": False, "error": "Internal server error"}), 500