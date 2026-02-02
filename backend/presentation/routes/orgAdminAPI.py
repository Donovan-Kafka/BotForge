from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
from sqlalchemy.exc import IntegrityError
from __init__ import db
from application.user_service import UserService
from application.user_profile_service import UserProfileService
from data_access.Users.users import UserRepository
from models import Organisation, Chatbot, Personality
from infrastructure.mongodb.mongo_client import get_mongo_db
from data_access.ChatMessages.chatMessages import ChatMessageRepository
from application.notification_service import NotificationService
from data_access.Notifications.notifications import NotificationRepository

org_admin_bp = Blueprint("org_admin", __name__, url_prefix="/api/org-admin")

user_repo = UserRepository()
notification_repo = NotificationRepository()
notification_service = NotificationService(notification_repo, user_repo)

user_service = UserService(user_repo)
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

# ORG ADMIN: manage organisation users
@org_admin_bp.get("/users")
def list_org_users():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    users = user_service.get_users_by_organisation(organisation_id)

    return jsonify([
        {
            "user_id": u.user_id,
            "username": u.username,
            "email": u.email,
            "status": u.status,
            "org_role_id": u.org_role_id,
            "org_role_name": u.org_role.name if u.org_role else None
        }
        for u in users
    ]), 200


@org_admin_bp.put("/users/<int:user_id>/role")
def update_user_role(user_id: int):
    data = request.json or {}
    new_org_role_id = data.get("new_org_role_id")

    if not new_org_role_id:
        return {"error": "new_org_role_id is required"}, 400

    try:
        updated_user = user_service.change_user_org_role(
            target_user_id=user_id,
            new_org_role_id=new_org_role_id
        )
    except ValueError as e:
        return {"error": str(e)}, 400

    return {
        "user_id": updated_user.user_id,
        "username": updated_user.username,
        "org_role_id": updated_user.org_role_id,
        "org_role_name": updated_user.org_role.name if updated_user.org_role else None
    }, 200

# ORG ADMIN: own account management
@org_admin_bp.put("/profile")
def update_admin_profile():
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


@org_admin_bp.put("/password")
def change_admin_password():
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

@org_admin_bp.delete("/account")
def deactivate_admin_account():
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return {"error": "user_id is required"}, 400

    try:
        profile_service.delete_account(user_id)
    except ValueError as e:
        return {"error": str(e)}, 400

    return {"message": "Account deactivated"}, 200



# ORG ADMIN: personalities
@org_admin_bp.get("/personalities")
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


# ORG ADMIN: chat history
@org_admin_bp.get("/chat-history")
def get_chat_history():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    q = (request.args.get("q") or "").strip()
    date_from = request.args.get("from")
    date_to = request.args.get("to")
    page = request.args.get("page", type=int) or 1
    page_size = request.args.get("page_size", type=int) or 20

    repo = ChatMessageRepository(get_mongo_db())

    # Build date filters
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

    query = {
        "organisationId": organisation_id
    }

    if q:
        query["message"] = {"$regex": q, "$options": "i"}

    if from_dt or to_dt:
        query["timestamp"] = {}
        if from_dt:
            query["timestamp"]["$gte"] = from_dt
        if to_dt:
            query["timestamp"]["$lte"] = to_dt

    collection = repo.collection

    total = collection.count_documents(query)

    cursor = (
        collection.find(query)
        .sort("timestamp", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )

    results = []
    for r in cursor:
        ts = r.get("timestamp")

        if ts and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        results.append({
            "message_id": str(r["_id"]),
            "sender": r.get("sender"),
            "sender_name": r.get("senderName") or "Guest",
            "message": r.get("message"),
            "timestamp": ts.isoformat() if ts else None,
        })

    return jsonify({
        "ok": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "messages": results,
    }), 200

# ORG ADMIN: chatbot analytics
@org_admin_bp.get("/analytics")
def get_chatbot_analytics():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    date_from = request.args.get("from")
    date_to = request.args.get("to")

    # Default range: last 7 days (UTC)
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

    # Inclusive end of day
    end = end.replace(hour=23, minute=59, second=59)
    # mongo query
    repo = ChatMessageRepository(get_mongo_db())

    query = {
        "organisationId": organisation_id,
        "sender": "user",
        "timestamp": {
            "$gte": start,
            "$lte": end,
        },
    }

    rows = repo.collection.find(query)
    # analytics calculations
    daily_counts = {}
    unique_users = set()
    unique_sessions = set()
    hourly_counts = {}

    for r in rows:
        ts = r.get("timestamp")
        if not ts:
            continue

        day_key = ts.date()
        daily_counts[day_key] = daily_counts.get(day_key, 0) + 1

        hour = ts.hour
        hourly_counts[hour] = hourly_counts.get(hour, 0) + 1

        if r.get("senderUserId"):
            unique_users.add(r.get("senderUserId"))
        elif r.get("sessionId"):
            unique_sessions.add(r.get("sessionId"))

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

    # Most active hour
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
            "label": (
                None
                if most_active_hour is None
                else datetime.strptime(str(most_active_hour), "%H").strftime("%I %p")
            ),
            "count": hourly_counts.get(most_active_hour, 0)
            if most_active_hour is not None
            else 0,
        },
    }), 200

# ORG ADMIN: customize chatbot
@org_admin_bp.get("/chatbot")
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


@org_admin_bp.put("/chatbot")
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

    # Core fields
    if data.get("name") is not None:
        chatbot.name = data.get("name")
    if data.get("description") is not None:
        chatbot.description = data.get("description")
    if data.get("personality_id") is not None:
        chatbot.personality_id = data.get("personality_id")

    # Customize fields
    if data.get("welcome_message") is not None:
        chatbot.welcome_message = data.get("welcome_message")
    if data.get("primary_language") is not None:
        chatbot.primary_language = data.get("primary_language")
    if data.get("allow_emojis") is not None:
        chatbot.allow_emojis = data.get("allow_emojis")

    db.session.commit()

    notification_service.notify_organisation_users(
        organisation_id=organisation_id,
        title="Chatbot settings updated",
        content="Chatbot settings were updated by your organisation admin.",
    )

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
