from flask import Blueprint, request, jsonify
from backend.models import Organisation, Chatbot, AppUser
from backend.application.ai.chatbot_service import ChatbotService
from backend.application.ai.intent_service_embed import EmbeddingIntentService
from backend.application.ai.template_engine import TemplateEngine
from backend.application.ai.speech_to_text import transcribe_audio
from backend.application.chat_service import ChatMessageService
from backend.data_access.ai.company_profile_repo import CompanyProfileRepository
from backend.data_access.ai.chatbot_repo import ChatbotRepository
from backend.data_access.ai.personality_repo import PersonalityRepository
from backend.data_access.ai.template_repo import TemplateRepository
from backend.data_access.ChatMessages.chatMessages import ChatMessageRepository
from backend.infrastructure.mongodb.mongo_client import get_mongo_db
from backend import db

patron_bp = Blueprint("patron", __name__)

def _require_patron():
    user_id = request.headers.get("X-USER-ID")
    if not user_id:
        return None, jsonify({"ok": False, "error": "Unauthorized"}), 401

    user = AppUser.query.get(user_id)
    if not user or user.system_role_id != 2:
        return None, jsonify({"ok": False, "error": "Forbidden"}), 403

    return user, None, None

def _build_chatbot_service() -> ChatbotService:
    company_repo = CompanyProfileRepository()
    template_repo = TemplateRepository()
    template_engine = TemplateEngine()
    intent_service = EmbeddingIntentService()
    chatbot_repo = ChatbotRepository()
    personality_repo = PersonalityRepository()
    mongo_repo = ChatMessageRepository(get_mongo_db())
    chat_message_service = ChatMessageService(mongo_repo)

    return ChatbotService(
        intent_service=intent_service,
        company_repository=company_repo,
        template_repository=template_repo,
        template_engine=template_engine,
        chatbot_repository=chatbot_repo,
        personality_repository=personality_repo,
        chat_message_service=chat_message_service,
    )

@patron_bp.get("/chat-directory")
def chat_directory():
    user, error_response, status_code = _require_patron()
    if error_response:
        return error_response, status_code

    rows = (
        db.session.query(
            Chatbot.bot_id,
            Chatbot.name.label("bot_name"),
            Chatbot.organisation_id,
            Organisation.industry,
        )
        .join(Organisation)
        .order_by(Organisation.industry.asc(), Chatbot.name.asc())
        .all()
    )

    grouped = {}
    for r in rows:
        industry = r.industry or "Other"
        grouped.setdefault(industry, []).append({
            "bot_id": r.bot_id,
            "company_id": r.organisation_id,
            "name": r.bot_name,
        })

    return jsonify({
        "ok": True,
        "industries": [{"title": k, "orgs": v} for k, v in grouped.items()]
    }), 200

# Patron: chatbot welcome
@patron_bp.get("/chat/welcome")
def patron_chat_welcome():
    user, error_response, status_code = _require_patron()
    if error_response:
        return error_response, status_code

    company_id = request.args.get("company_id", type=int)
    session_id = request.args.get("session_id")

    if not company_id:
        return jsonify({"ok": False, "error": "company_id is required"}), 400

    try:
        chatbot_repo = ChatbotRepository()
        chatbot = chatbot_repo.get_by_organisation_id(company_id)
        if not chatbot:
            return jsonify({"ok": False, "error": "Chatbot not found"}), 404

        chatbot_service = _build_chatbot_service()
        result = chatbot_service.welcome(
            company_id=company_id,
            session_id=session_id,
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

# Patron: chatbot message
@patron_bp.post("/chat")
def patron_chat():
    user, error_response, status_code = _require_patron()
    if error_response:
        return error_response, status_code

    payload = request.get_json(force=True)
    company_id = payload.get("company_id")
    message = payload.get("message")
    session_id = payload.get("session_id")

    if not company_id or not message:
        return jsonify({"ok": False, "error": "company_id and message are required"}), 400

    try:
        chatbot_repo = ChatbotRepository()
        chatbot = chatbot_repo.get_by_organisation_id(company_id)
        if not chatbot:
            return jsonify({"ok": False, "error": "Chatbot not found"}), 404

        chatbot_service = _build_chatbot_service()
        result = chatbot_service.chat(
            company_id=company_id,
            message=message,
            session_id=session_id,
            user_id=user.user_id,
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

# Patron: voice chat (STT)
@patron_bp.post("/chat-voice")
def patron_chat_voice():
    user, error_response, status_code = _require_patron()
    if error_response:
        return error_response, status_code

    audio_file = request.files.get("audio")
    organisation_id = request.form.get("organisation_id") or request.args.get("organisation_id")
    session_id = request.form.get("session_id")

    if not organisation_id:
        return jsonify({"ok": False, "error": "organisation_id is required"}), 400
    if not audio_file:
        return jsonify({"ok": False, "error": "audio file is required"}), 400

    audio_bytes = audio_file.read()
    if not audio_bytes:
        return jsonify({"ok": False, "error": "audio file is empty"}), 400

    try:
        organisation_id = int(organisation_id)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "organisation_id must be an integer"}), 400

    try:
        transcript, confidence = transcribe_audio(audio_bytes)
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"ok": False, "error": "Transcription failed"}), 500

    if not transcript:
        return jsonify({"ok": False, "error": "No speech detected"}), 400

    try:
        chatbot_service = _build_chatbot_service()
        result = chatbot_service.chat(
            company_id=organisation_id,
            message=transcript,
            session_id=session_id,
            user_id=user.user_id,
        )
        result["transcript"] = transcript
        result["transcript_confidence"] = confidence
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"ok": False, "error": "Chatbot response failed"}), 500
