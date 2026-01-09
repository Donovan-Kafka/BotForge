from flask import Blueprint, request, jsonify
from backend.models import Organisation, Feedback, AppUser
from sqlalchemy import desc
from backend.application.auth_service import (
    register_org_admin, confirm_email, login, update_org_profile
)
from backend.data_access.Subscriptions.subscriptions import SubscriptionRepository
from backend.application.UnregisteredUsers.getActiveSubscriptions import GetActiveSubscriptions

unregistered_bp = Blueprint("unregistered", __name__)

@unregistered_bp.post("/register")
def register():
    payload = request.get_json(force=True)
    result = register_org_admin(payload)
    return jsonify(result), (200 if result.get("ok") else 400)

@unregistered_bp.get("/verify-email")
def verify_email():
    token = request.args.get("token", "")
    result = confirm_email(token)
    return jsonify(result), (200 if result.get("ok") else 400)

@unregistered_bp.post("/login")
def do_login():
    payload = request.get_json(force=True)
    result = login(payload)
    return jsonify(result), (200 if result.get("ok") else 401)

@unregistered_bp.post("/organisation/profile")
def org_profile():
    payload = request.get_json(force=True)
    result = update_org_profile(payload)
    return jsonify(result), (200 if result.get("ok") else 400)

@unregistered_bp.get("/organisation/profile/<int:organisation_id>")
def get_org_profile(organisation_id):
    org = Organisation.query.get(organisation_id)

    if not org:
        return jsonify({
            "ok": False,
            "error": "Organisation not found."
        }), 404

    return jsonify({
        "ok": True,
        "organisation": {
            "organisation_id": org.organisation_id,
            "name": org.name,
            "industry": org.industry,
            "size": org.size,
            "subscription_id": org.subscription_id
        }
    }), 200

@unregistered_bp.get("/testimonials")
def get_testimonials():
    #
    # Public landing page testimonials:
    #   - curated by SystemAdmin (is_testimonial = true)
    #   - rating = 5
    #   - 1 OrgAdmin + 1 Operator (if available)
    #
    testimonials = []

    # OrgAdmin testimonial (role_id=1)
    orgadmin_fb = (
        Feedback.query
        .join(AppUser, Feedback.sender_id == AppUser.user_id)
        .filter(Feedback.is_testimonial.is_(True))
        .filter(Feedback.rating == 5)
        .filter(AppUser.role_id == 1)
        .filter(Feedback.content.isnot(None))
        .order_by(Feedback.creation_date.desc())
        .first()
    )

    if orgadmin_fb:
        sender = AppUser.query.get(orgadmin_fb.sender_id)
        testimonials.append({
            "feedback_id": orgadmin_fb.feedback_id,
            "role": "OrgAdmin",
            "author": sender.username if sender else "Anonymous",
            "rating": orgadmin_fb.rating,
            "title": orgadmin_fb.title,
            "content": orgadmin_fb.content,
            "date": orgadmin_fb.creation_date.isoformat()
        })

    # Operator testimonial (role_id=2)
    operator_fb = (
        Feedback.query
        .join(AppUser, Feedback.sender_id == AppUser.user_id)
        .filter(Feedback.is_testimonial.is_(True))
        .filter(Feedback.rating == 5)
        .filter(AppUser.role_id == 2)
        .filter(Feedback.content.isnot(None))
        .order_by(Feedback.creation_date.desc())
        .first()
    )

    if operator_fb:
        sender = AppUser.query.get(operator_fb.sender_id)
        testimonials.append({
            "feedback_id": operator_fb.feedback_id,
            "role": "Operator",
            "author": sender.username if sender else "Anonymous",
            "rating": operator_fb.rating,
            "title": operator_fb.title,
            "content": operator_fb.content,
            "date": operator_fb.creation_date.isoformat()
        })

    return jsonify({"ok": True, "testimonials": testimonials}), 200


