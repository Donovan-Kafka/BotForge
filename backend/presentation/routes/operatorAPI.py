from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError

from application.invitation_service import (
    validate_invitation_token,
    accept_invitation_and_create_operator
)
from application.user_profile_service import UserProfileService
from application.notification_service import NotificationService
from data_access.Users.users import UserRepository
from data_access.Notifications.notifications import NotificationRepository

from infrastructure.mongodb.mongo_client import get_mongo_db
from data_access.ChatMessages.chatMessages import ChatMessageRepository


operator_bp = Blueprint("operator", __name__, url_prefix="/api/operator")

# ---------- Services ----------
user_repo = UserRepository()
notification_repo = NotificationRepository()
notification_service = NotificationService(notification_repo, user_repo)
profile_service = UserProfileService(user_repo, notification_service)

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

# Operator: chat history (MongoDB)
@operator_bp.get("/chat-history")
def get_operator_chat_history():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    q = (request.args.get("q") or "").strip()
    date_from = request.args.get("from")
    date_to = request.args.get("to")

    repo = ChatMessageRepository(get_mongo_db(current_app))

    query = {"organisationId": organisation_id}

    if q:
        query["message"] = {"$regex": q, "$options": "i"}

    if date_from or date_to:
        query["timestamp"] = {}
        if date_from:
            query["timestamp"]["$gte"] = datetime.strptime(date_from, "%Y-%m-%d")
        if date_to:
            end = datetime.strptime(date_to, "%Y-%m-%d")
            end = end.replace(hour=23, minute=59, second=59)
            query["timestamp"]["$lte"] = end

    cursor = repo.collection.find(query).sort("timestamp", -1).limit(50)

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
        "messages": results
    }), 200

# Operator: analytics (MongoDB)
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

    repo = ChatMessageRepository(get_mongo_db(current_app))

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