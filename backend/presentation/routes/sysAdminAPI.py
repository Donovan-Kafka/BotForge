from flask import Blueprint, request, jsonify
from backend.models import Feedback, AppUser, Feature, FAQ, OrgRole
from backend import db

sysadmin_bp = Blueprint("sysadmin", __name__)

@sysadmin_bp.get("/feedback/candidates")
def list_feedback_candidates():

    rows = (
        Feedback.query
        .order_by(
            Feedback.rating.desc().nullslast(),
            Feedback.creation_date.desc()
        )
        .all()
    )

    candidates = []
    for fb in rows:
        sender = AppUser.query.get(fb.sender_id)
        sender_role_name = None
        if sender and sender.org_role_id:
            org_role = OrgRole.query.get(sender.org_role_id)
            sender_role_name = org_role.name if org_role else None
        elif sender and sender.system_role_id is not None:
            sender_role_name = "SYS_ADMIN"
        candidates.append({
            "feedback_id": fb.feedback_id,
            "sender_id": fb.sender_id,
            "sender_username": sender.username if sender else None,
            "sender_system_role_id": sender.system_role_id if sender else None,
            "sender_org_role_id": sender.org_role_id if sender else None,
            "organisation_id": sender.organisation_id if sender else None,
            "sender_role_name": sender_role_name,
            "rating": fb.rating,
            "title": fb.title,
            "content": fb.content,
            "is_testimonial": fb.is_testimonial,
            "creation_date": fb.creation_date.isoformat() if fb.creation_date else None
        })

    return jsonify({"ok": True, "candidates": candidates}), 200


@sysadmin_bp.post("/testimonials/feature")
def feature_feedback():
    
    # Body: { "feedback_id": 1, "is_testimonial": true/false }
    
    payload = request.get_json(force=True)
    feedback_id = payload.get("feedback_id")
    is_testimonial = payload.get("is_testimonial")

    if feedback_id is None or is_testimonial is None:
        return jsonify({"ok": False, "error": "feedback_id and is_testimonial required."}), 400

    fb = Feedback.query.get(int(feedback_id))
    if not fb:
        return jsonify({"ok": False, "error": "Feedback not found."}), 404

    fb.is_testimonial = bool(is_testimonial)
    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Updated testimonial flag.",
        "feedback_id": fb.feedback_id,
        "is_testimonial": fb.is_testimonial
    }), 200

@sysadmin_bp.get("/features")
def list_features():
    features = Feature.query.order_by(Feature.feature_id.asc()).all()
    return jsonify({
        "ok": True,
        "features": [
            {
                "feature_id": f.feature_id,
                "name": f.name,
                "description": f.description
            } for f in features
        ]
    }), 200


@sysadmin_bp.post("/features")
def create_feature():
    payload = request.get_json(force=True) or {}
    name = (payload.get("name") or "").strip()
    description = (payload.get("description") or "").strip()

    if not name:
        return jsonify({"ok": False, "error": "Feature name is required."}), 400
    if len(name) > 50:
        return jsonify({"ok": False, "error": "Feature name max length is 50."}), 400
    if description and len(description) > 255:
        return jsonify({"ok": False, "error": "Description max length is 255."}), 400

    feature = Feature(name=name, description=description or None)
    db.session.add(feature)
    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Feature created.",
        "feature": {
            "feature_id": feature.feature_id,
            "name": feature.name,
            "description": feature.description
        }
    }), 201


@sysadmin_bp.put("/features/<int:feature_id>")
def update_feature(feature_id):
    payload = request.get_json(force=True) or {}

    feature = Feature.query.get(feature_id)
    if not feature:
        return jsonify({"ok": False, "error": "Feature not found."}), 404

    # Allow partial updates via PUT (simple)
    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return jsonify({"ok": False, "error": "Feature name cannot be empty."}), 400
        if len(name) > 50:
            return jsonify({"ok": False, "error": "Feature name max length is 50."}), 400
        feature.name = name

    if "description" in payload:
        description = (payload.get("description") or "").strip()
        if description and len(description) > 255:
            return jsonify({"ok": False, "error": "Description max length is 255."}), 400
        feature.description = description or None

    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Feature updated.",
        "feature": {
            "feature_id": feature.feature_id,
            "name": feature.name,
            "description": feature.description
        }
    }), 200


@sysadmin_bp.delete("/features/<int:feature_id>")
def delete_feature(feature_id):
    feature = Feature.query.get(feature_id)
    if not feature:
        return jsonify({"ok": False, "error": "Feature not found."}), 404

    db.session.delete(feature)
    db.session.commit()

    return jsonify({"ok": True, "message": "Feature deleted."}), 200

@sysadmin_bp.get("/faq")
def list_faq_admin():
    rows = FAQ.query.order_by(FAQ.display_order.asc(), FAQ.faq_id.asc()).all()
    return jsonify({
        "ok": True,
        "faqs": [
            {
                "faq_id": f.faq_id,
                "question": f.question,
                "answer": f.answer,
                "status": f.status,
                "display_order": f.display_order,
                "user_id": f.user_id,
                "created_at": f.created_at.isoformat() if f.created_at else None,
                "updated_at": f.updated_at.isoformat() if f.updated_at else None,
            } for f in rows
        ]
    }), 200

@sysadmin_bp.post("/faq")
def create_faq_admin():
    payload = request.get_json(force=True) or {}
    question = (payload.get("question") or "").strip()
    answer = (payload.get("answer") or "").strip()

    # status: 0 active, 1 hidden
    status = payload.get("status", 0)
    display_order = payload.get("display_order", 0)
    user_id = payload.get("user_id")

    if not question:
        return jsonify({"ok": False, "error": "Question is required."}), 400
    if not answer:
        return jsonify({"ok": False, "error": "Answer is required."}), 400
    if len(question) > 255:
        return jsonify({"ok": False, "error": "Question max length is 255."}), 400
    if user_id is None:
        return jsonify({"ok": False, "error": "user_id is required."}), 400

    faq = FAQ(
        question=question,
        answer=answer,
        status=int(status),
        display_order=int(display_order),
        user_id=int(user_id),
    )
    db.session.add(faq)
    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "FAQ created.",
        "faq": {
            "faq_id": faq.faq_id,
            "question": faq.question,
            "answer": faq.answer,
            "status": faq.status,
            "display_order": faq.display_order,
            "user_id": faq.user_id
        }
    }), 201

@sysadmin_bp.put("/faq/<int:faq_id>")
def update_faq_admin(faq_id):
    payload = request.get_json(force=True) or {}
    faq = FAQ.query.get(faq_id)
    if not faq:
        return jsonify({"ok": False, "error": "FAQ not found."}), 404

    if "question" in payload:
        q = (payload.get("question") or "").strip()
        if not q:
            return jsonify({"ok": False, "error": "Question cannot be empty."}), 400
        if len(q) > 255:
            return jsonify({"ok": False, "error": "Question max length is 255."}), 400
        faq.question = q

    if "answer" in payload:
        a = (payload.get("answer") or "").strip()
        if not a:
            return jsonify({"ok": False, "error": "Answer cannot be empty."}), 400
        faq.answer = a

    if "status" in payload:
        faq.status = int(payload.get("status"))

    if "display_order" in payload:
        faq.display_order = int(payload.get("display_order"))

    if "user_id" in payload:
        faq.user_id = int(payload.get("user_id"))

    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "FAQ updated.",
        "faq": {
            "faq_id": faq.faq_id,
            "question": faq.question,
            "answer": faq.answer,
            "status": faq.status,
            "display_order": faq.display_order,
            "user_id": faq.user_id
        }
    }), 200

@sysadmin_bp.delete("/faq/<int:faq_id>")
def delete_faq_admin(faq_id):
    faq = FAQ.query.get(faq_id)
    if not faq:
        return jsonify({"ok": False, "error": "FAQ not found."}), 404

    faq.status = 1  # hidden
    db.session.commit()
    return jsonify({"ok": True, "message": "FAQ hidden (soft-deleted)."}), 200
