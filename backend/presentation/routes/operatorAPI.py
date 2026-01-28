from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError

from backend.application.invitation_service import (
    validate_invitation_token,
    accept_invitation_and_create_operator
)
from backend.application.user_profile_service import UserProfileService
from backend.application.notification_service import NotificationService
from backend.data_access.Users.users import UserRepository
from backend.data_access.Notifications.notifications import NotificationRepository

operator_bp = Blueprint("operator", __name__, url_prefix="/api/operator")

# ---------- Service wiring ----------
user_repo = UserRepository()
notification_repo = NotificationRepository()
notification_service = NotificationService(notification_repo, user_repo)

profile_service = UserProfileService(user_repo, notification_service)

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
