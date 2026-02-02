from flask import Blueprint, request, jsonify, Response, stream_with_context
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from application.invitation_service import (
    validate_invitation_token,
    accept_invitation_and_create_operator
)
from application.user_profile_service import UserProfileService
from application.notification_service import NotificationService
from application.chat_history_service import ChatHistoryService
from application.ai.chatbot_service import ChatbotService
from application.ai.intent_service_embed import EmbeddingIntentService
from application.ai.template_engine import TemplateEngine
from application.ai.speech_to_text import transcribe_audio
from application.chat_service import ChatMessageService
from data_access.ai.company_profile_repo import CompanyProfileRepository
from data_access.ai.chatbot_repo import ChatbotRepository
from data_access.ai.personality_repo import PersonalityRepository
from data_access.ai.template_repo import TemplateRepository
from data_access.Users.users import UserRepository
from data_access.Notifications.notifications import NotificationRepository
from data_access.ChatMessages.chatMessages import ChatMessageRepository
from infrastructure.mongodb.mongo_client import get_mongo_db

operator_bp = Blueprint("operator", __name__, url_prefix="/api/operator")

# Services & repositories

user_repo = UserRepository()
notification_repo = NotificationRepository()
notification_service = NotificationService(notification_repo, user_repo)
profile_service = UserProfileService(user_repo, notification_service)

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

# =================================
# Invitation & registration

@operator_bp.get("/invitations/validate")
def validate():
    token = request.args.get("token", "")
    result = validate_invitation_token(token)
    return jsonify(result), (200 if result.get("ok") else 400)


@operator_bp.post("/register")
def operator_register():
    payload = request.get_json(force=True)

    password = payload.get("password") or ""
    confirm = payload.get("confirmPassword") or ""

    if not password or password != confirm:
        return jsonify({"ok": False, "error": "Password mismatch."}), 400
    if len(password) < 8:
        return jsonify({"ok": False, "error": "Password must be at least 8 characters."}), 400

    payload["password_hash"] = generate_password_hash(password)

    result = accept_invitation_and_create_operator(payload, notification_service)
    return jsonify(result), (200 if result.get("ok") else 400)


# Operator account management

@operator_bp.put("/profile")
def update_operator_profile():
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return {"error": "user_id is required"}, 400

    try:
        user = profile_service.update_profile(
            user_id=user_id,
            username=data.get("username"),
            email=data.get("email")
        )
    except IntegrityError:
        return {"error": "Username or email already exists"}, 409
    except ValueError as e:
        return {"error": str(e)}, 400

    return jsonify({
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email
    }), 200


@operator_bp.put("/password")
def change_operator_password():
    data = request.get_json() or {}

    user_id = data.get("user_id")
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    if not all([user_id, old_password, new_password, confirm_password]):
        return {"error": "Missing required fields"}, 400

    if new_password != confirm_password:
        return {"error": "Passwords do not match"}, 400

    try:
        profile_service.change_password(
            user_id=user_id,
            old_password=old_password,
            new_password=new_password
        )
    except ValueError as e:
        return {"error": str(e)}, 400

    return {"message": "Password updated"}, 200


@operator_bp.delete("/account")
def delete_operator_account():
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return {"error": "user_id is required"}, 400

    try:
        profile_service.delete_account(user_id)
    except ValueError as e:
        return {"error": str(e)}, 400

    return {"message": "Account deactivated"}, 200

# Operator: chat history 

@operator_bp.get("/chat-history")
def get_operator_chat_history():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    q = (request.args.get("q") or "").strip()
    date_from = request.args.get("from")
    date_to = request.args.get("to")

    from_dt = None
    to_dt = None

    if date_from:
        try:
            from_dt = datetime.strptime(date_from, "%Y-%m-%d")
        except ValueError:
            return {"error": "from must be YYYY-MM-DD"}, 400

    if date_to:
        try:
            to_dt = datetime.strptime(date_to, "%Y-%m-%d")
            to_dt = to_dt.replace(hour=23, minute=59, second=59)
        except ValueError:
            return {"error": "to must be YYYY-MM-DD"}, 400

    service = ChatHistoryService(
        ChatMessageRepository(get_mongo_db())
    )

    # Operators only see recent messages (no pagination UI yet)
    _, rows = service.get_chat_history(
        organisation_id=organisation_id,
        keyword=q or None,
        date_from=from_dt,
        date_to=to_dt,
        page=1,
        page_size=50,
    )

    messages = []
    for r in rows:
        ts = r.get("timestamp")
        if ts and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        messages.append({
            "message_id": str(r["_id"]),
            "sender": r.get("sender"),
            "sender_name": r.get("senderName") or "Guest",
            "message": r.get("message"),
            "timestamp": ts.isoformat() if ts else None,
        })

    return jsonify({
        "ok": True,
        "messages": messages
    }), 200


# Operator: analytics

@operator_bp.get("/analytics")
def get_operator_chatbot_analytics():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    date_from = request.args.get("from")
    date_to = request.args.get("to")

    if date_to:
        end = datetime.strptime(date_to, "%Y-%m-%d")
    else:
        end = datetime.utcnow()

    if date_from:
        start = datetime.strptime(date_from, "%Y-%m-%d")
    else:
        start = end - timedelta(days=6)

    end = end.replace(hour=23, minute=59, second=59)

    repo = ChatMessageRepository(get_mongo_db())

    query = {
        "organisationId": organisation_id,
        "sender": "user",
        "timestamp": {"$gte": start, "$lte": end},
    }

    rows = repo.collection.find(query)

    daily_counts = {}
    hourly_counts = {}
    unique_users = set()
    unique_sessions = set()

    for r in rows:
        ts = r.get("timestamp")
        if not ts:
            continue

        day = ts.date()
        daily_counts[day] = daily_counts.get(day, 0) + 1

        hour = ts.hour
        hourly_counts[hour] = hourly_counts.get(hour, 0) + 1

        if r.get("senderUserId"):
            unique_users.add(r.get("senderUserId"))
        elif r.get("sessionId"):
            unique_sessions.add(r.get("sessionId"))

    daily_list = []
    cursor = start.date()
    while cursor <= end.date():
        daily_list.append({
            "date": cursor.strftime("%d-%m-%Y"),
            "day": cursor.strftime("%A"),
            "count": daily_counts.get(cursor, 0),
        })
        cursor += timedelta(days=1)

    most_active_hour = max(hourly_counts, key=hourly_counts.get) if hourly_counts else None

    return jsonify({
        "ok": True,
        "daily_chats": daily_list,
        "total_chats": sum(daily_counts.values()),
        "unique_users": len(unique_users) if unique_users else len(unique_sessions),
        "most_active_hour": {
            "hour_24": most_active_hour,
            "label": None if most_active_hour is None else datetime.strptime(str(most_active_hour), "%H").strftime("%I %p"),
            "count": hourly_counts.get(most_active_hour, 0) if most_active_hour is not None else 0,
        }
    }), 200

# export chat history as CSV
@operator_bp.get("/chat-history/export")
def export_operator_chat_history_csv():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    q = (request.args.get("q") or "").strip()
    date_from = request.args.get("from")
    date_to = request.args.get("to")

    from_dt = None
    to_dt = None

    if date_from:
        try:
            from_dt = datetime.strptime(date_from, "%Y-%m-%d")
        except ValueError:
            return {"error": "from must be YYYY-MM-DD"}, 400

    if date_to:
        try:
            to_dt = datetime.strptime(date_to, "%Y-%m-%d")
            to_dt = to_dt.replace(hour=23, minute=59, second=59)
        except ValueError:
            return {"error": "to must be YYYY-MM-DD"}, 400

    service = ChatHistoryService(
        ChatMessageRepository(get_mongo_db())
    )

    filename = f"chat_export_operator_{organisation_id}.csv"

    return Response(
        stream_with_context(
            service.stream_csv_export(
                organisation_id=organisation_id,
                keyword=q or None,
                date_from=from_dt,
                date_to=to_dt,
            )
        ),
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        },
    )

# ============================
# Operator: voice chat (STT)
# ============================

@operator_bp.post("/chat-voice")
def chat_voice():
    audio_file = request.files.get("audio")
    organisation_id = request.form.get("organisation_id") or request.args.get("organisation_id")
    session_id = request.form.get("session_id")
    user_id = request.form.get("user_id")

    if not organisation_id:
        return jsonify({"ok": False, "error": "organisation_id is required"}), 400
    if not audio_file:
        return jsonify({"ok": False, "error": "audio file is required"}), 400

    audio_bytes = audio_file.read()
    if not audio_bytes:
        return jsonify({"ok": False, "error": "audio file is empty"}), 400

    try:
        transcript, confidence = transcribe_audio(audio_bytes)
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"ok": False, "error": "Transcription failed"}), 500

    if not transcript:
        return jsonify({"ok": False, "error": "No speech detected"}), 400

    try:
        try:
            organisation_id = int(organisation_id)
        except (TypeError, ValueError):
            return jsonify({"ok": False, "error": "organisation_id must be an integer"}), 400

        if user_id is not None and user_id != "":
            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                return jsonify({"ok": False, "error": "user_id must be an integer"}), 400
        else:
            user_id = None

        chatbot_service = _build_chatbot_service()
        result = chatbot_service.chat(
            company_id=organisation_id,
            message=transcript,
            session_id=session_id,
            user_id=user_id,
        )
        result["transcript"] = transcript
        result["transcript_confidence"] = confidence
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception:
        return jsonify({"ok": False, "error": "Chatbot response failed"}), 500
