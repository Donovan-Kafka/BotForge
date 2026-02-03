from sqlalchemy.exc import IntegrityError
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
from urllib.parse import quote
import os

from backend import db
from backend.models import (
    Organisation,
    OrganisationRestaurant,
    OrganisationEducation,
    OrganisationRetail,
    AppUser,
    OrgRole,
)
from backend.application.notification_service import NotificationService
from backend.data_access.Notifications.notifications import NotificationRepository
from backend.data_access.Users.users import UserRepository


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
    raw_industry = (payload.get("industry") or "").strip().lower()
    industry_map = {"f&b": "restaurant", "retail": "retail", "education": "education",}

    industry = industry_map.get(raw_industry)
    if not industry:
        return {"ok": False, "error": "Invalid industry."}
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
        system_role_id=1,
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

    frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
    verify_link = f"{frontend_base}/activated?token={quote(token)}"

    subject = "Verify your email for BotForge"
    html = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2>Verify your email</h2>
    <p>Thanks for signing up. Please verify your email to activate your account.</p>
    <p><a href="{verify_link}">Verify email</a></p>
    <p>If the link doesn't work, copy this:</p>
    <p>{verify_link}</p>
    <p style="color:#666;font-size:12px;">This link expires in 24 hours.</p>
    </div>
    """
    text = f"Verify your email: {verify_link} (expires in 24 hours)"

    notification_service = NotificationService(
        NotificationRepository(),
        UserRepository()
    )

    try:
        notification_service.send_email(
            to=email,
            subject=subject,
            html_content=html,
            text_content=text
        )
        email_sent = True
        email_error = None
    except Exception as e:
        email_sent = False
        email_error = str(e)

    return {
        "ok": True,
        "message": "Registered. Please verify your email.",
        "organisation_id": org.organisation_id,
        "user_id": user.user_id,
        "email_sent": email_sent,
        "email_error": email_error
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

    org = Organisation.query.get(user.organisation_id) if user.organisation_id else None
    
    is_profile_complete = False
    subscription_id = None
    
    if org:
        # Check if profile is "complete" (has basic info)
        if org.location and org.city and org.country:
            is_profile_complete = True
        subscription_id = org.subscription_id

    return {
        "ok": True,
        "message": "Logged in.",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "system_role_id": user.system_role_id,
            "org_role_id": user.org_role_id,
            "org_role_name": user.org_role.name if user.org_role else None,
            "organisation_id": user.organisation_id,
            "is_profile_complete": is_profile_complete,
            "subscription_id": subscription_id
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

    # Normalize industry to match DB subtypes
    prev_industry_raw = (org.industry or "").strip().lower()
    raw_industry = (payload.get("industry") or org.industry or "").strip().lower()
    industry_map = {
        "f&b": "restaurant",
        "restaurant": "restaurant",
        "education": "education",
        "retail": "retail",
    }
    prev_industry = industry_map.get(prev_industry_raw)
    industry = industry_map.get(raw_industry)
    if industry:
        org.industry = industry

    # If industry changed, clear old subtype row to avoid stale data
    if industry and prev_industry and industry != prev_industry:
        if industry != "restaurant":
            OrganisationRestaurant.query.filter_by(
                organisation_id=org.organisation_id
            ).delete()
        if industry != "education":
            OrganisationEducation.query.filter_by(
                organisation_id=org.organisation_id
            ).delete()
        if industry != "retail":
            OrganisationRetail.query.filter_by(
                organisation_id=org.organisation_id
            ).delete()

    # Industry-specific fields -> subtype tables
    if industry == "restaurant":
        restaurant = OrganisationRestaurant.query.get(org.organisation_id)
        if not restaurant:
            restaurant = OrganisationRestaurant(organisation_id=org.organisation_id)
            db.session.add(restaurant)

        if payload.get("cuisine_type") is not None:
            restaurant.cuisine_type = payload.get("cuisine_type")
        if payload.get("restaurant_style") is not None:
            restaurant.restaurant_style = payload.get("restaurant_style")
        if payload.get("dining_options") is not None:
            restaurant.dining_options = payload.get("dining_options")
        if payload.get("supports_reservations") is not None:
            restaurant.supports_reservations = payload.get("supports_reservations")
        if payload.get("reservation_link") is not None:
            restaurant.reservation_link = payload.get("reservation_link")
        if payload.get("price_range") is not None:
            restaurant.price_range = payload.get("price_range")
        if payload.get("seating_capacity") is not None:
            restaurant.seating_capacity = payload.get("seating_capacity")
        if payload.get("specialties") is not None:
            restaurant.specialties = payload.get("specialties")

    elif industry == "education":
        education = OrganisationEducation.query.get(org.organisation_id)
        if not education:
            education = OrganisationEducation(organisation_id=org.organisation_id)
            db.session.add(education)

        if payload.get("institution_type") is not None:
            education.institution_type = payload.get("institution_type")
        if payload.get("target_audience") is not None:
            education.target_audience = payload.get("target_audience")
        if payload.get("course_types") is not None:
            education.course_types = payload.get("course_types")
        if payload.get("delivery_mode") is not None:
            education.delivery_mode = payload.get("delivery_mode")
        if payload.get("intake_periods") is not None:
            education.intake_periods = payload.get("intake_periods")
        if payload.get("application_link") is not None:
            education.application_link = payload.get("application_link")
        if payload.get("response_time") is not None:
            education.response_time = payload.get("response_time")
        if payload.get("key_programs") is not None:
            education.key_programs = payload.get("key_programs")

    elif industry == "retail":
        retail = OrganisationRetail.query.get(org.organisation_id)
        if not retail:
            retail = OrganisationRetail(organisation_id=org.organisation_id)
            db.session.add(retail)

        if payload.get("retail_type") is not None:
            retail.retail_type = payload.get("retail_type")
        if payload.get("product_categories") is not None:
            retail.product_categories = payload.get("product_categories")
        if payload.get("has_physical_store") is not None:
            retail.has_physical_store = payload.get("has_physical_store")
        if payload.get("has_online_store") is not None:
            retail.has_online_store = payload.get("has_online_store")
        if payload.get("online_store_url") is not None:
            retail.online_store_url = payload.get("online_store_url")
        if payload.get("delivery_options") is not None:
            retail.delivery_options = payload.get("delivery_options")
        if payload.get("return_policy") is not None:
            retail.return_policy = payload.get("return_policy")
        if payload.get("warranty_info") is not None:
            retail.warranty_info = payload.get("warranty_info")
        if payload.get("payment_methods") is not None:
            retail.payment_methods = payload.get("payment_methods")
        if payload.get("promotions_note") is not None:
            retail.promotions_note = payload.get("promotions_note")

    db.session.commit()
    # Build response with subtype fields
    restaurant = OrganisationRestaurant.query.get(org.organisation_id)
    education = OrganisationEducation.query.get(org.organisation_id)
    retail = OrganisationRetail.query.get(org.organisation_id)

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
        "restaurant": {
            "cuisine_type": restaurant.cuisine_type if restaurant else None,
            "restaurant_style": restaurant.restaurant_style if restaurant else None,
            "dining_options": restaurant.dining_options if restaurant else None,
            "supports_reservations": restaurant.supports_reservations if restaurant else None,
            "reservation_link": restaurant.reservation_link if restaurant else None,
            "price_range": restaurant.price_range if restaurant else None,
            "seating_capacity": restaurant.seating_capacity if restaurant else None,
            "specialties": restaurant.specialties if restaurant else None,
        } if restaurant else None,
        "education": {
            "institution_type": education.institution_type if education else None,
            "target_audience": education.target_audience if education else None,
            "course_types": education.course_types if education else None,
            "delivery_mode": education.delivery_mode if education else None,
            "intake_periods": education.intake_periods if education else None,
            "application_link": education.application_link if education else None,
            "response_time": education.response_time if education else None,
            "key_programs": education.key_programs if education else None,
        } if education else None,
        "retail": {
            "retail_type": retail.retail_type if retail else None,
            "product_categories": retail.product_categories if retail else None,
            "has_physical_store": retail.has_physical_store if retail else None,
            "has_online_store": retail.has_online_store if retail else None,
            "online_store_url": retail.online_store_url if retail else None,
            "delivery_options": retail.delivery_options if retail else None,
            "return_policy": retail.return_policy if retail else None,
            "warranty_info": retail.warranty_info if retail else None,
            "payment_methods": retail.payment_methods if retail else None,
            "promotions_note": retail.promotions_note if retail else None,
        } if retail else None,
    }}


# Patron Registration
def register_patron(payload: dict) -> dict:
    username = (payload.get("username") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    confirm = payload.get("confirmPassword") or ""

    if not username or not email or not password or not confirm:
        return {"ok": False, "error": "Missing required fields."}
    if password != confirm:
        return {"ok": False, "error": "Password and confirm password do not match."}
    if len(password) < 8:
        return {"ok": False, "error": "Password must be at least 8 characters."}

    user = AppUser(
        username=username,
        email=email,
        password=generate_password_hash(password),
        system_role_id=2,
        org_role_id=None,
        organisation_id=None,
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
    frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
    verify_link = f"{frontend_base}/activated?token={quote(token)}"

    subject = "Verify your email for BotForge"
    html = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Verify your email</h2>
      <p>Please verify your email to activate your Patron account.</p>
      <p><a href="{verify_link}">Verify email</a></p>
      <p style="color:#666;font-size:12px;">This link expires in 24 hours.</p>
    </div>
    """
    text = f"Verify your email: {verify_link} (expires in 24 hours)"

    notification_service = NotificationService(NotificationRepository(), UserRepository())
    try:
        notification_service.send_email(to=email, subject=subject, html_content=html, text_content=text)
        email_sent = True
        email_error = None
    except Exception as e:
        email_sent = False
        email_error = str(e)

    return {
        "ok": True,
        "message": "Registered. Please verify your email.",
        "user_id": user.user_id,
        "email_sent": email_sent,
        "email_error": email_error
    }

