from sqlalchemy.exc import IntegrityError
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app

from backend import db
from backend.models import Organisation, AppUser, OrgRole


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="email-verify")

def generate_verify_token(user_id: int, email: str) -> str:
    return _serializer().dumps({"user_id": user_id, "email": email})

def verify_token(token: str, max_age_seconds: int = 60 * 60 * 24) -> dict:
    return _serializer().loads(token, max_age=max_age_seconds)

def register_org_admin(payload: dict) -> dict:
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    confirm = payload.get("confirmPassword") or ""
    company = (payload.get("company") or "").strip()
    industry = (payload.get("industry") or "").strip() or None

    if not username or not email or not password or not confirm or not company:
        return {"ok": False, "error": "Missing required fields."}
    if password != confirm:
        return {"ok": False, "error": "Password and confirm password do not match."}
    if len(password) < 8:
        return {"ok": False, "error": "Password must be at least 8 characters."}

    # Create org + user (status=false until verified)
    org = Organisation(name=company, industry=industry)
    db.session.add(org)
    db.session.flush()  

    # Ensure default org roles exist for new organisation
    org_admin_role = OrgRole.query.filter_by(organisation_id=org.organisation_id, name="ORG_ADMIN").first()
    staff_role = OrgRole.query.filter_by(organisation_id=org.organisation_id, name="STAFF").first()

    if not org_admin_role:
        org_admin_role = OrgRole(
            organisation_id=org.organisation_id,
            name="ORG_ADMIN",
            description="Organisation administrator"
        )
        db.session.add(org_admin_role)

    if not staff_role:
        staff_role = OrgRole(
            organisation_id=org.organisation_id,
            name="STAFF",
            description="Standard staff user"
        )
        db.session.add(staff_role)

    db.session.flush()  # so org_admin_role gets id

    # Fetch ORG_ADMIN role for the organisation
    org_admin_role = OrgRole.query.filter_by(
        organisation_id=org.organisation_id,
        name="ORG_ADMIN"
    ).first()

    if not org_admin_role:
        db.session.rollback()
        return {"ok": False, "error": "ORG_ADMIN role not found for organisation."}

    user = AppUser(
        username=username,
        email=email,
        password=generate_password_hash(password),
        system_role_id=None,
        org_role_id=org_admin_role.org_role_id,
        organisation_id=org.organisation_id,
        status=False
    )
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        msg = str(e.orig).lower()

        if "app_user_email_key" in msg or "email" in msg:
            return {"ok": False, "error": "Email already registered."}
        if "app_user_username_key" in msg or "username" in msg:
            return {"ok": False, "error": "Username already taken."}
        return {"ok": False, "error": "Registration failed (duplicate or invalid data)."}

    token = generate_verify_token(user.user_id, user.email)
    
    # Print token to console 
    print(f"\n[DEBUG] Verification Link: http://localhost:3000?token={token}\n")

    return {
        "ok": True,
        "message": "Registered. Please verify your email.",
        "organisation_id": org.organisation_id,
        "user_id": user.user_id,
        "verify_token": token  # Week 1: return token (later email it)
    }

def confirm_email(token: str) -> dict:
    try:
        data = verify_token(token)
        user_id = data["user_id"]

        user = AppUser.query.get(user_id)
        if not user:
            return {"ok": False, "error": "User not found."}

        user.status = True
        db.session.commit()
        return {"ok": True, "message": "Email verified."}

    except SignatureExpired:
        return {"ok": False, "error": "Verification link expired."}
    except BadSignature:
        return {"ok": False, "error": "Invalid verification token."}

def login(payload: dict) -> dict:
    identifier = (payload.get("identifier") or "").strip()
    password = payload.get("password") or ""

    if not identifier or not password:
        return {"ok": False, "error": "Missing login fields."}

    user = AppUser.query.filter(
        (AppUser.email == identifier.lower()) | (AppUser.username == identifier)
    ).first()

    if not user:
        print(f"[DEBUG] Login failed: User '{identifier}' not found.")
        return {"ok": False, "error": "Invalid credentials."}
    
    print(f"[DEBUG] User found: {user.username} (ID: {user.user_id}, Status: {user.status})")

    if not user.status:
        print("[DEBUG] Login failed: Email not verified.")
        return {"ok": False, "error": "Email not verified."}
    
    if not check_password_hash(user.password, password):
        print("[DEBUG] Login failed: Password hash mismatch.")
        return {"ok": False, "error": "Invalid credentials."}

    return {
        "ok": True,
        "message": "Logged in.",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "system_role_id": user.system_role_id,
            "org_role_id": user.org_role_id,
            "organisation_id": user.organisation_id,
        }
    }

def update_org_profile(payload: dict) -> dict:
    org_id = payload.get("organisation_id")
    if not org_id:
        return {"ok": False, "error": "organisation_id required."}

    org = Organisation.query.get(org_id)
    if not org:
        return {"ok": False, "error": "Organisation not found."}

    if payload.get("industry") is not None:
        org.industry = payload.get("industry")
    if payload.get("size") is not None:
        org.size = payload.get("size")

    db.session.commit()
    return {"ok": True, "organisation": {
        "organisation_id": org.organisation_id,
        "name": org.name,
        "industry": org.industry,
        "size": org.size,
        "subscription_id": org.subscription_id
    }}
