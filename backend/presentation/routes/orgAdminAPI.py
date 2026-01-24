from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from backend import db
from backend.application.user_service import UserService
from backend.application.user_profile_service import UserProfileService
from backend.data_access.Users.users import UserRepository
from backend.models import Organisation, Chatbot

org_admin_bp = Blueprint("org_admin", __name__, url_prefix="/api/org-admin")

user_service = UserService(UserRepository())
profile_service = UserProfileService(UserRepository())

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


# =================================
# ORG ADMIN: manage organisation users
# =================================

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


# =================================
# ORG ADMIN: own account management
# =================================

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


# =================================
# ORG ADMIN: customize chatbot
# =================================

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
            "tone": chatbot.tone,
            "allow_emojis": chatbot.allow_emojis,
        }
    }), 200


@org_admin_bp.put("/chatbot")
def update_chatbot_settings():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    data = request.get_json() or {}
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
    if data.get("tone") is not None:
        chatbot.tone = data.get("tone")
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
            "tone": chatbot.tone,
            "allow_emojis": chatbot.allow_emojis,
        }
    }), 200
