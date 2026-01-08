from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from backend.application.invitation_service import validate_invitation_token, accept_invitation_and_create_operator

operator_bp = Blueprint("operator", __name__)

@operator_bp.get("/invitations/validate")
def validate():
    token = request.args.get("token", "")
    result = validate_invitation_token(token)
    return jsonify(result), (200 if result.get("ok") else 400)

@operator_bp.post("/operator/register")
def operator_register():
    payload = request.get_json(force=True)

    password = payload.get("password") or ""
    confirm = payload.get("confirmPassword") or ""
    if not password or password != confirm:
        return jsonify({"ok": False, "error": "Password mismatch."}), 400
    if len(password) < 8:
        return jsonify({"ok": False, "error": "Password must be at least 8 characters."}), 400

    # Hash password here, then pass to service
    payload["password_hash"] = generate_password_hash(password)

    result = accept_invitation_and_create_operator(payload)
    return jsonify(result), (200 if result.get("ok") else 400)
