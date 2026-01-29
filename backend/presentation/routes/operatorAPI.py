from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta

from backend import db
from backend.application.invitation_service import (
    validate_invitation_token,
    accept_invitation_and_create_operator
)
from backend.application.user_profile_service import UserProfileService
from backend.application.notification_service import NotificationService
from backend.data_access.Users.users import UserRepository
from backend.data_access.Notifications.notifications import NotificationRepository
from backend.models import Organisation, Chatbot, Personality, ChatMessage, AppUser

operator_bp = Blueprint("operator", __name__, url_prefix="/api/operator")

# ---------- Service wiring ----------
user_repo = UserRepository()
notification_repo = NotificationRepository()
notification_service = NotificationService(notification_repo, user_repo)

profile_service = UserProfileService(user_repo, notification_service)

def _get_or_create_chatbot(organisation_id: int) -> Chatbot | None:
    org = Organisation.query.get(organisation_id)
    if not org:
        return None

    chatbot = Chatbot.query.filter_by(organisation_id=organisation_id).first()
    if chatbot:
        return chatbot

    chatbot = Chatbot(
        organisation_id=organisation_id,
        name=f"{org.name} Chatbot" if org.name else "Chatbot"
    )
    db.session.add(chatbot)
    db.session.commit()
    return chatbot


def _validate_chatbot_payload(data: dict) -> str | None:
    if "name" in data and data.get("name") is not None:
        if not isinstance(data.get("name"), str) or len(data.get("name")) > 50:
            return "name must be a string up to 50 characters."

    if "description" in data and data.get("description") is not None:
        if not isinstance(data.get("description"), str) or len(data.get("description")) > 255:
            return "description must be a string up to 255 characters."

    if "personality_id" in data and data.get("personality_id") is not None:
        try:
            personality_id = int(data.get("personality_id"))
        except (TypeError, ValueError):
            return "personality_id must be an integer."
        if not Personality.query.get(personality_id):
            return "personality_id is invalid."

    if "welcome_message" in data and data.get("welcome_message") is not None:
        if not isinstance(data.get("welcome_message"), str) or len(data.get("welcome_message")) > 500:
            return "welcome_message must be a string up to 500 characters."

    if "primary_language" in data and data.get("primary_language") is not None:
        if not isinstance(data.get("primary_language"), str) or len(data.get("primary_language")) > 10:
            return "primary_language must be a string up to 10 characters."
        if data.get("primary_language").strip().lower() != "english":
            return "primary_language must be English for now."

    if "allow_emojis" in data and data.get("allow_emojis") is not None:
        if not isinstance(data.get("allow_emojis"), bool):
            return "allow_emojis must be a boolean."

    return None

# =========================
# Invitation & registration
# =========================

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

    result = accept_invitation_and_create_operator(
        payload,
        notification_service
    )

    return jsonify(result), (200 if result.get("ok") else 400)

# ================================
# Operator: manage account section
# ================================

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
        return {
            "error": "user_id, old_password, new_password and confirm_password are required"
        }, 400

    if new_password != confirm_password:
        return {"error": "New password and confirm password do not match"}, 400

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


# ================================
# Operator: chatbot customization
# ================================

@operator_bp.get("/personalities")
def list_personalities():
    rows = Personality.query.order_by(Personality.personality_id.asc()).all()

    return jsonify({
        "ok": True,
        "personalities": [
            {
                "personality_id": p.personality_id,
                "name": p.name,
                "description": p.description,
                "type": p.type,
            }
            for p in rows
        ]
    }), 200


@operator_bp.get("/chatbot")
def get_chatbot_settings():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    chatbot = _get_or_create_chatbot(organisation_id)
    if not chatbot:
        return {"error": "Organisation not found"}, 404

    return jsonify({
        "ok": True,
        "chatbot": {
            "bot_id": chatbot.bot_id,
            "organisation_id": chatbot.organisation_id,
            "name": chatbot.name,
            "description": chatbot.description,
            "personality_id": chatbot.personality_id,
            "welcome_message": chatbot.welcome_message,
            "primary_language": chatbot.primary_language,
            "allow_emojis": chatbot.allow_emojis,
        }
    }), 200


@operator_bp.put("/chatbot")
def update_chatbot_settings():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    data = request.get_json() or {}
    error = _validate_chatbot_payload(data)
    if error:
        return {"error": error}, 400

    chatbot = _get_or_create_chatbot(organisation_id)
    if not chatbot:
        return {"error": "Organisation not found"}, 404

    if data.get("name") is not None:
        chatbot.name = data.get("name")
    if data.get("description") is not None:
        chatbot.description = data.get("description")
    if data.get("personality_id") is not None:
        chatbot.personality_id = data.get("personality_id")
    if data.get("welcome_message") is not None:
        chatbot.welcome_message = data.get("welcome_message")
    if data.get("primary_language") is not None:
        chatbot.primary_language = data.get("primary_language")
    if data.get("allow_emojis") is not None:
        chatbot.allow_emojis = data.get("allow_emojis")

    db.session.commit()

    return jsonify({
        "ok": True,
        "chatbot": {
            "bot_id": chatbot.bot_id,
            "organisation_id": chatbot.organisation_id,
            "name": chatbot.name,
            "description": chatbot.description,
            "personality_id": chatbot.personality_id,
            "welcome_message": chatbot.welcome_message,
            "primary_language": chatbot.primary_language,
            "allow_emojis": chatbot.allow_emojis,
        }
    }), 200


# ============================
# Operator: chat history
# ============================

@operator_bp.get("/chat-history")
def get_chat_history():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    q = (request.args.get("q") or "").strip()
    date_from = request.args.get("from")
    date_to = request.args.get("to")
    page = request.args.get("page", type=int) or 1
    page_size = request.args.get("page_size", type=int) or 20

    query = ChatMessage.query.filter(ChatMessage.organisation_id == organisation_id)

    if q:
        query = query.filter(ChatMessage.message.ilike(f"%{q}%"))

    if date_from:
        try:
            start = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(ChatMessage.created_at >= start)
        except ValueError:
            return {"error": "from must be YYYY-MM-DD"}, 400

    if date_to:
        try:
            end = datetime.strptime(date_to, "%Y-%m-%d")
            end = end.replace(hour=23, minute=59, second=59)
            query = query.filter(ChatMessage.created_at <= end)
        except ValueError:
            return {"error": "to must be YYYY-MM-DD"}, 400

    total = query.count()
    rows = (
        query.order_by(ChatMessage.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    user_ids = {r.sender_user_id for r in rows if r.sender_user_id}
    users = AppUser.query.filter(AppUser.user_id.in_(user_ids)).all() if user_ids else []
    user_map = {u.user_id: u.username for u in users}

    results = []
    for r in rows:
        sender_name = r.sender_name or user_map.get(r.sender_user_id) or "Guest"
        created_at = r.created_at
        results.append({
            "message_id": r.message_id,
            "sender": r.sender,
            "sender_name": sender_name,
            "message": r.message,
            "date": created_at.strftime("%d-%m-%Y") if created_at else None,
            "time": created_at.strftime("%I:%M %p") if created_at else None,
        })

    return jsonify({
        "ok": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "messages": results,
    }), 200


# ============================
# Operator: chatbot analytics
# ============================

@operator_bp.get("/analytics")
def get_chatbot_analytics():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    date_from = request.args.get("from")
    date_to = request.args.get("to")

    try:
        if date_to:
            end = datetime.strptime(date_to, "%Y-%m-%d")
        else:
            end = datetime.utcnow()

        if date_from:
            start = datetime.strptime(date_from, "%Y-%m-%d")
        else:
            start = end - timedelta(days=6)
    except ValueError:
        return {"error": "from/to must be YYYY-MM-DD"}, 400

    end = end.replace(hour=23, minute=59, second=59)

    rows = (
        ChatMessage.query
        .filter(ChatMessage.organisation_id == organisation_id)
        .filter(ChatMessage.sender == "user")
        .filter(ChatMessage.created_at >= start)
        .filter(ChatMessage.created_at <= end)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    daily_counts = {}
    unique_users = set()
    unique_sessions = set()
    hourly_counts = {}

    for r in rows:
        ts = r.created_at
        if not ts:
            continue
        day_key = ts.date()
        daily_counts[day_key] = daily_counts.get(day_key, 0) + 1

        hour = ts.hour
        hourly_counts[hour] = hourly_counts.get(hour, 0) + 1

        if r.sender_user_id:
            unique_users.add(r.sender_user_id)
        elif r.session_id:
            unique_sessions.add(r.session_id)

    daily_list = []
    cursor = start.date()
    end_date = end.date()
    while cursor <= end_date:
        daily_list.append({
            "date": cursor.strftime("%d-%m-%Y"),
            "day": cursor.strftime("%A"),
            "count": daily_counts.get(cursor, 0),
        })
        cursor += timedelta(days=1)

    most_active_hour = None
    if hourly_counts:
        most_active_hour = max(hourly_counts, key=hourly_counts.get)

    return jsonify({
        "ok": True,
        "range": {
            "from": start.strftime("%Y-%m-%d"),
            "to": end.strftime("%Y-%m-%d"),
            "timezone": "UTC",
        },
        "daily_chats": daily_list,
        "total_chats": sum(daily_counts.values()),
        "unique_users": len(unique_users) if unique_users else len(unique_sessions),
        "most_active_hour": {
            "hour_24": most_active_hour,
            "label": None if most_active_hour is None else datetime.strptime(str(most_active_hour), "%H").strftime("%I %p"),
            "count": hourly_counts.get(most_active_hour, 0) if most_active_hour is not None else 0,
        },
    }), 200
