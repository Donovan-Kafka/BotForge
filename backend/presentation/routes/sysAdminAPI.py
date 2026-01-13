from flask import Blueprint, request, jsonify
from backend.models import Feedback, AppUser, Feature
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

        candidates.append({
            "feedback_id": fb.feedback_id,
            "sender_id": fb.sender_id,
            "sender_username": sender.username if sender else None,
            "sender_role_id": sender.role_id if sender else None,
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
