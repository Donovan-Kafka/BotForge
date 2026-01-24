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

    # Accept both "name" and "company_name" for compatibility with UI payloads
    if payload.get("name") is not None:
        org.name = payload.get("name")
    if payload.get("company_name") is not None:
        org.name = payload.get("company_name")

    # Core profile fields
    if payload.get("industry") is not None:
        org.industry = payload.get("industry")
    if payload.get("description") is not None:
        org.description = payload.get("description")
    if payload.get("location") is not None:
        org.location = payload.get("location")
    if payload.get("city") is not None:
        org.city = payload.get("city")
    if payload.get("country") is not None:
        org.country = payload.get("country")
    if payload.get("contact_email") is not None:
        org.contact_email = payload.get("contact_email")
    if payload.get("contact_phone") is not None:
        org.contact_phone = payload.get("contact_phone")
    if payload.get("website_url") is not None:
        org.website_url = payload.get("website_url")
    if payload.get("business_hours") is not None:
        org.business_hours = payload.get("business_hours")

    # Restaurant-specific fields
    if payload.get("cuisine_type") is not None:
        org.cuisine_type = payload.get("cuisine_type")
    if payload.get("restaurant_style") is not None:
        org.restaurant_style = payload.get("restaurant_style")
    if payload.get("dining_options") is not None:
        org.dining_options = payload.get("dining_options")
    if payload.get("supports_reservations") is not None:
        org.supports_reservations = payload.get("supports_reservations")
    if payload.get("reservation_link") is not None:
        org.reservation_link = payload.get("reservation_link")
    if payload.get("price_range") is not None:
        org.price_range = payload.get("price_range")
    if payload.get("seating_capacity") is not None:
        org.seating_capacity = payload.get("seating_capacity")
    if payload.get("specialties") is not None:
        org.specialties = payload.get("specialties")

    # Education-specific fields
    if payload.get("institution_type") is not None:
        org.institution_type = payload.get("institution_type")
    if payload.get("target_audience") is not None:
        org.target_audience = payload.get("target_audience")
    if payload.get("course_types") is not None:
        org.course_types = payload.get("course_types")
    if payload.get("delivery_mode") is not None:
        org.delivery_mode = payload.get("delivery_mode")
    if payload.get("intake_periods") is not None:
        org.intake_periods = payload.get("intake_periods")
    if payload.get("application_link") is not None:
        org.application_link = payload.get("application_link")
    if payload.get("response_time") is not None:
        org.response_time = payload.get("response_time")
    if payload.get("key_programs") is not None:
        org.key_programs = payload.get("key_programs")

    # Retail-specific fields
    if payload.get("retail_type") is not None:
        org.retail_type = payload.get("retail_type")
    if payload.get("product_categories") is not None:
        org.product_categories = payload.get("product_categories")
    if payload.get("has_physical_store") is not None:
        org.has_physical_store = payload.get("has_physical_store")
    if payload.get("has_online_store") is not None:
        org.has_online_store = payload.get("has_online_store")
    if payload.get("online_store_url") is not None:
        org.online_store_url = payload.get("online_store_url")
    if payload.get("delivery_options") is not None:
        org.delivery_options = payload.get("delivery_options")
    if payload.get("return_policy") is not None:
        org.return_policy = payload.get("return_policy")
    if payload.get("warranty_info") is not None:
        org.warranty_info = payload.get("warranty_info")
    if payload.get("payment_methods") is not None:
        org.payment_methods = payload.get("payment_methods")
    if payload.get("promotions_note") is not None:
        org.promotions_note = payload.get("promotions_note")

    db.session.commit()
    return {"ok": True, "organisation": {
        "organisation_id": org.organisation_id,
        "name": org.name,
        "industry": org.industry,
        "subscription_id": org.subscription_id,
        "description": org.description,
        "location": org.location,
        "city": org.city,
        "country": org.country,
        "contact_email": org.contact_email,
        "contact_phone": org.contact_phone,
        "website_url": org.website_url,
        "business_hours": org.business_hours,
        "cuisine_type": org.cuisine_type,
        "restaurant_style": org.restaurant_style,
        "dining_options": org.dining_options,
        "supports_reservations": org.supports_reservations,
        "reservation_link": org.reservation_link,
        "price_range": org.price_range,
        "seating_capacity": org.seating_capacity,
        "specialties": org.specialties,
        "institution_type": org.institution_type,
        "target_audience": org.target_audience,
        "course_types": org.course_types,
        "delivery_mode": org.delivery_mode,
        "intake_periods": org.intake_periods,
        "application_link": org.application_link,
        "response_time": org.response_time,
        "key_programs": org.key_programs,
        "retail_type": org.retail_type,
        "product_categories": org.product_categories,
        "has_physical_store": org.has_physical_store,
        "has_online_store": org.has_online_store,
        "online_store_url": org.online_store_url,
        "delivery_options": org.delivery_options,
        "return_policy": org.return_policy,
        "warranty_info": org.warranty_info,
        "payment_methods": org.payment_methods,
        "promotions_note": org.promotions_note,
    }}
