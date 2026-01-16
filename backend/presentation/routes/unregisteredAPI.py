from flask import Blueprint, request, jsonify
from backend import db
from backend.models import Organisation, Feedback, AppUser, FAQ, OrgRole
from sqlalchemy import desc
from backend.application.auth_service import (
    register_org_admin, confirm_email, login, update_org_profile
)

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
    #   - 1 Admin + 1 Operator
    #
    testimonials = []

    # Fetch one Admin testimonial
    # We search for OrgRole with name 'ORG_ADMIN'
    admin_fb = (
        db.session.query(Feedback, AppUser, OrgRole)
        .join(AppUser, Feedback.sender_id == AppUser.user_id)
        .join(OrgRole, AppUser.org_role_id == OrgRole.org_role_id)
        .filter(Feedback.is_testimonial.is_(True))
        .filter(Feedback.rating == 5)
        .filter(Feedback.content.isnot(None))
        .filter(OrgRole.name == 'ORG_ADMIN') 
        .order_by(Feedback.creation_date.desc())
        .first()
    )

    if admin_fb:
        fb, user, role = admin_fb
        testimonials.append({
            "feedback_id": fb.feedback_id,
            "role": "Org Admin", # Display name
            "author": user.username,
            "rating": fb.rating,
            "title": fb.title,
            "content": fb.content,
            "date": fb.creation_date.isoformat()
        })

    # Fetch one Staff testimonial
    operator_fb = (
        db.session.query(Feedback, AppUser, OrgRole)
        .join(AppUser, Feedback.sender_id == AppUser.user_id)
        .join(OrgRole, AppUser.org_role_id == OrgRole.org_role_id)
        .filter(Feedback.is_testimonial.is_(True))
        .filter(Feedback.rating == 5)
        .filter(Feedback.content.isnot(None))
        .filter(OrgRole.name == 'STAFF')
        .order_by(Feedback.creation_date.desc())
        .first()
    )

    if operator_fb:
        fb, user, role = operator_fb
        testimonials.append({
            "feedback_id": fb.feedback_id,
            "role": "Staff", # Display name
            "author": user.username,
            "rating": fb.rating,
            "title": fb.title,
            "content": fb.content,
            "date": fb.creation_date.isoformat()
        })
    
    # Fallback: if we couldn't find specific roles, just fill up to 2 with any
    if len(testimonials) < 2:
        existing_ids = [t["feedback_id"] for t in testimonials]
        
        others = (
            db.session.query(Feedback, AppUser, OrgRole)
            .join(AppUser, Feedback.sender_id == AppUser.user_id)
            .outerjoin(OrgRole, AppUser.org_role_id == OrgRole.org_role_id)
            .filter(Feedback.is_testimonial.is_(True))
            .filter(Feedback.rating == 5)
            .filter(Feedback.content.isnot(None))
            .filter(Feedback.feedback_id.notin_(existing_ids))
            .order_by(Feedback.creation_date.desc())
            .limit(2 - len(testimonials))
            .all()
        )
        
        for fb, user, role in others:
            testimonials.append({
                "feedback_id": fb.feedback_id,
                "role": role.name if role else "User",
                "author": user.username,
                "rating": fb.rating,
                "title": fb.title,
                "content": fb.content,
                "date": fb.creation_date.isoformat()
            })

    return jsonify({"ok": True, "testimonials": testimonials}), 200



@unregistered_bp.get("/faq")
def list_public_faq():
    rows = (
        FAQ.query
        .filter(FAQ.status == 0)
        .order_by(FAQ.display_order.asc(), FAQ.faq_id.asc())
        .all()
    )

    return jsonify({
        "ok": True,
        "faqs": [
            {
                "faq_id": f.faq_id,
                "question": f.question,
                "answer": f.answer
            } for f in rows
        ]
    }), 200