from flask import Blueprint, request, jsonify
from backend.models import Organisation, Feedback, AppUser, FAQ, OrgRole, FeaturedVideo
from backend.application.auth_service import (
    register_org_admin, confirm_email, login, update_org_profile, register_patron
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

    restaurant = org.restaurant
    education = org.education
    retail = org.retail

    return jsonify({
        "ok": True,
        "organisation": {
            "organisation_id": org.organisation_id,
            "name": org.name,
            "industry": org.industry,
            "subscription_id": org.subscription_id,

            # Common profiling fields
            "description": org.description,
            "location": org.location,
            "city": org.city,
            "country": org.country,
            "contact_email": org.contact_email,
            "contact_phone": org.contact_phone,
            "website_url": org.website_url,
            "business_hours": org.business_hours,

            # Restaurant-specific
            "restaurant": {
                "cuisine_type": restaurant.cuisine_type,
                "restaurant_style": restaurant.restaurant_style,
                "dining_options": restaurant.dining_options,
                "supports_reservations": restaurant.supports_reservations,
                "reservation_link": restaurant.reservation_link,
                "price_range": restaurant.price_range,
                "seating_capacity": restaurant.seating_capacity,
                "specialties": restaurant.specialties,
            } if restaurant else None,

            # Education-specific
            "education": {
                "institution_type": education.institution_type,
                "target_audience": education.target_audience,
                "course_types": education.course_types,
                "delivery_mode": education.delivery_mode,
                "intake_periods": education.intake_periods,
                "application_link": education.application_link,
                "response_time": education.response_time,
                "key_programs": education.key_programs,
            } if education else None,

            # Retail-specific
            "retail": {
                "retail_type": retail.retail_type,
                "product_categories": retail.product_categories,
                "has_physical_store": retail.has_physical_store,
                "has_online_store": retail.has_online_store,
                "online_store_url": retail.online_store_url,
                "delivery_options": retail.delivery_options,
                "return_policy": retail.return_policy,
                "warranty_info": retail.warranty_info,
                "payment_methods": retail.payment_methods,
                "promotions_note": retail.promotions_note,
            } if retail else None,
        }
    }), 200

@unregistered_bp.get("/testimonials")
def get_testimonials():
    testimonials = []

    def pick_for_group(role_name: str):
        # 1) override: featured first
        featured = (
            Feedback.query
            .join(AppUser, Feedback.sender_id == AppUser.user_id)
            .join(OrgRole, AppUser.org_role_id == OrgRole.org_role_id)
            .filter(OrgRole.name == role_name)
            .filter(Feedback.is_testimonial.is_(True))
            .filter(Feedback.content.isnot(None))
            .order_by(Feedback.creation_date.desc())
            .first()
        )
        if featured:
            return featured

        # 2) default: best rating then newest
        best = (
            Feedback.query
            .join(AppUser, Feedback.sender_id == AppUser.user_id)
            .join(OrgRole, AppUser.org_role_id == OrgRole.org_role_id)
            .filter(OrgRole.name == role_name)
            .filter(Feedback.content.isnot(None))
            .order_by(Feedback.rating.desc().nullslast(), Feedback.creation_date.desc())
            .first()
        )
        return best

    # Slot 1: ORG_ADMIN
    orgadmin_fb = pick_for_group("ORG_ADMIN")
    if orgadmin_fb:
        sender = AppUser.query.get(orgadmin_fb.sender_id)
        testimonials.append({
            "feedback_id": orgadmin_fb.feedback_id,
            "role": "ORG_ADMIN",
            "author": sender.username if sender else "Anonymous",
            "rating": orgadmin_fb.rating,
            "purpose": orgadmin_fb.purpose,
            "content": orgadmin_fb.content,
            "date": orgadmin_fb.creation_date.isoformat() if orgadmin_fb.creation_date else None
        })

    # Slot 2: STAFF (operator/staff)
    staff_fb = pick_for_group("STAFF")
    if staff_fb:
        sender = AppUser.query.get(staff_fb.sender_id)
        testimonials.append({
            "feedback_id": staff_fb.feedback_id,
            "role": "STAFF",
            "author": sender.username if sender else "Anonymous",
            "rating": staff_fb.rating,
            "purpose": staff_fb.purpose,
            "content": staff_fb.content,
            "date": staff_fb.creation_date.isoformat() if staff_fb.creation_date else None
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


#patron
@unregistered_bp.post("/patron/register")
def patron_register():
    payload = request.get_json(force=True) or {}
    result = register_patron(payload)
    return jsonify(result), (200 if result.get("ok") else 400)

@unregistered_bp.get("/featured-video")
def get_featured_video():
    row = FeaturedVideo.query.get(1)

    # If table exists but row is missing, return empty defaults
    if not row:
        return jsonify({
            "ok": True,
            "video": {
                "id": 1,
                "url": "",
                "title": "",
                "description": "",
                "updated_date": None
            }
        }), 200

    return jsonify({
        "ok": True,
        "video": {
            "id": row.id,
            "url": row.url or "",
            "title": row.title or "",
            "description": row.description or "",
            "updated_date": row.updated_date.isoformat() if row.updated_date else None
        }
    }), 200