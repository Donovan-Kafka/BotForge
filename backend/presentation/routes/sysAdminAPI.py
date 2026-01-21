from flask import Blueprint, request, jsonify
from backend.models import Feedback, AppUser, Feature, FAQ, OrgRole, Organisation, SystemRole, OrgPermission, OrgRolePermission
from backend import db
from sqlalchemy.exc import IntegrityError

sysadmin_bp = Blueprint("sysadmin", __name__)

@sysadmin_bp.get("/org-roles")
def list_org_roles():
    _, err = _require_sysadmin()
    if err:
        return err

    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return jsonify({"ok": False, "error": "organisation_id query param is required."}), 400

    org = Organisation.query.get(organisation_id)
    if not org:
        return jsonify({"ok": False, "error": "Organisation not found."}), 404

    roles = (
        OrgRole.query
        .filter(OrgRole.organisation_id == organisation_id)
        .order_by(OrgRole.name.asc(), OrgRole.org_role_id.asc())
        .all()
    )

    return jsonify({
        "ok": True,
        "organisation_id": organisation_id,
        "roles": [
            {
                "org_role_id": r.org_role_id,
                "name": r.name,
                "description": r.description
            } for r in roles
        ]
    }), 200


@sysadmin_bp.get("/feedback/candidates")
def list_feedback_candidates():
    _, err = _require_sysadmin()
    if err:
        return err
    
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
    _, err = _require_sysadmin()
    if err:
        return err

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
    _, err = _require_sysadmin()
    if err:
        return err

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
    _, err = _require_sysadmin()
    if err:
        return err
    
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
    _, err = _require_sysadmin()
    if err:
        return err

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
    _, err = _require_sysadmin()
    if err:
        return err

    feature = Feature.query.get(feature_id)
    if not feature:
        return jsonify({"ok": False, "error": "Feature not found."}), 404

    db.session.delete(feature)
    db.session.commit()

    return jsonify({"ok": True, "message": "Feature deleted."}), 200

@sysadmin_bp.get("/faq")
def list_faq_admin():
    _, err = _require_sysadmin()
    if err:
        return err

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
    _, err = _require_sysadmin()
    if err:
        return err
    
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
    _, err = _require_sysadmin()
    if err:
        return err
    
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
    _, err = _require_sysadmin()
    if err:
        return err
    
    faq = FAQ.query.get(faq_id)
    if not faq:
        return jsonify({"ok": False, "error": "FAQ not found."}), 404

    faq.status = 1  # hidden
    db.session.commit()
    return jsonify({"ok": True, "message": "FAQ hidden (soft-deleted)."}), 200


def _require_sysadmin():
   
    # guard
    # caller must send header: X-USER-ID: <user_id>
    # only allow if that user is SYS_ADMIN (system_role_id == 0) and active
    
    user_id = request.headers.get("X-USER-ID")

    if not user_id:
        return None, (jsonify({"ok": False, "error": "Missing X-USER-ID header."}), 401)

    try:
        user_id = int(user_id)
    except ValueError:
        return None, (jsonify({"ok": False, "error": "Invalid X-USER-ID header."}), 401)

    user = AppUser.query.get(user_id)
    if not user or not user.status:
        return None, (jsonify({"ok": False, "error": "Invalid user."}), 401)

    # SYS_ADMIN is system_role_id = 0 (based on your system_role table)
    if user.system_role_id != 0:
        return None, (jsonify({"ok": False, "error": "Forbidden: SYS_ADMIN only."}), 403)

    return user, None


@sysadmin_bp.get("/users")
def list_users():
    _, err = _require_sysadmin()
    if err:
        return err

    users = AppUser.query.order_by(AppUser.user_id.asc()).all()

    org_cache = {}
    org_role_cache = {}
    system_role_cache = {}

    results = []
    for u in users:
        org_name = None
        if u.organisation_id is not None:
            if u.organisation_id not in org_cache:
                org = Organisation.query.get(u.organisation_id)
                org_cache[u.organisation_id] = org.name if org else None
            org_name = org_cache[u.organisation_id]

        org_role_name = None
        if u.org_role_id is not None:
            if u.org_role_id not in org_role_cache:
                r = OrgRole.query.get(u.org_role_id)
                org_role_cache[u.org_role_id] = r.name if r else None
            org_role_name = org_role_cache[u.org_role_id]

        system_role_name = None
        if u.system_role_id is not None:
            if u.system_role_id not in system_role_cache:
                sr = SystemRole.query.get(u.system_role_id)
                system_role_cache[u.system_role_id] = sr.name if sr else None
            system_role_name = system_role_cache[u.system_role_id]

        results.append({
            "user_id": u.user_id,
            "username": u.username,
            "email": u.email,
            "status": bool(u.status),

            "system_role_id": u.system_role_id,
            "system_role_name": system_role_name,

            "organisation_id": u.organisation_id,
            "organisation_name": org_name,

            "org_role_id": u.org_role_id,
            "org_role_name": org_role_name,
        })

    return jsonify({"ok": True, "users": results}), 200


@sysadmin_bp.put("/users/<int:user_id>/status")
def update_user_status(user_id):
    _, err = _require_sysadmin()
    if err:
        return err

    payload = request.get_json(force=True) or {}
    if "status" not in payload:
        return jsonify({"ok": False, "error": "status is required."}), 400

    u = AppUser.query.get(user_id)
    if not u:
        return jsonify({"ok": False, "error": "User not found."}), 404

    u.status = bool(payload["status"])
    db.session.commit()

    return jsonify({"ok": True, "message": "User status updated.", "user_id": u.user_id, "status": bool(u.status)}), 200


@sysadmin_bp.put("/users/<int:user_id>/role")
def update_user_role(user_id):
    _, err = _require_sysadmin()
    if err:
        return err

    payload = request.get_json(force=True) or {}
    role_type = (payload.get("type") or "").strip().lower()

    u = AppUser.query.get(user_id)
    if not u:
        return jsonify({"ok": False, "error": "User not found."}), 404

    try:
        if role_type == "system":
            system_role_id = payload.get("system_role_id")
            if system_role_id is None:
                return jsonify({"ok": False, "error": "system_role_id is required for type=system."}), 400

            # enforce system user shape
            u.system_role_id = int(system_role_id)
            u.org_role_id = None
            u.organisation_id = None

        elif role_type == "org":
            org_role_id = payload.get("org_role_id")
            if org_role_id is None:
                return jsonify({"ok": False, "error": "org_role_id is required."}), 400

            org_role = OrgRole.query.get(int(org_role_id))
            if not org_role:
                return jsonify({"ok": False, "error": "Org role not found."}), 404

            # block cross-org role assignment (prevents transferring users)
            if u.organisation_id is not None and org_role.organisation_id != u.organisation_id:
                return jsonify({
                    "ok": False,
                    "error": "Cannot assign role from a different organisation."
                }), 400

            u.system_role_id = None
            u.org_role_id = org_role.org_role_id
            u.organisation_id = org_role.organisation_id

        else:
            return jsonify({"ok": False, "error": "type must be 'system' or 'org'."}), 400

        db.session.commit()

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"ok": False, "error": f"DB constraint failed: {str(e.orig)}"}), 400

    return jsonify({
        "ok": True,
        "message": "User role updated.",
        "user": {
            "user_id": u.user_id,
            "system_role_id": u.system_role_id,
            "org_role_id": u.org_role_id,
            "organisation_id": u.organisation_id
        }
    }), 200

@sysadmin_bp.get("/permissions")
def list_permissions():
    _, err = _require_sysadmin()
    if err:
        return err

    rows = OrgPermission.query.order_by(OrgPermission.code.asc()).all()
    return jsonify({
        "ok": True,
        "permissions": [
            {
                "org_permission_id": p.org_permission_id,
                "code": p.code,
                "description": p.description
            } for p in rows
        ]
    }), 200


@sysadmin_bp.put("/role-permissions")
def update_role_permissions_matrix():
    _, err = _require_sysadmin()
    if err:
        return err

    payload = request.get_json(force=True) or {}
    organisation_id = payload.get("organisation_id")
    grants = payload.get("grants")  # list of {org_role_id, org_permission_id}

    if not organisation_id or not isinstance(grants, list):
        return jsonify({"ok": False, "error": "organisation_id and grants[] are required."}), 400

    organisation_id = int(organisation_id)

    # ensure org exists
    org = Organisation.query.get(organisation_id)
    if not org:
        return jsonify({"ok": False, "error": "Organisation not found."}), 404

    # validate roles belong to org
    valid_role_ids = {
        r.org_role_id for r in OrgRole.query.filter_by(organisation_id=organisation_id).all()
    }

    # validate permission ids exist
    valid_perm_ids = {p.org_permission_id for p in OrgPermission.query.all()}

    desired = set()
    for g in grants:
        rid = int(g.get("org_role_id"))
        pid = int(g.get("org_permission_id"))
        if rid not in valid_role_ids:
            return jsonify({"ok": False, "error": f"Invalid org_role_id for this org: {rid}"}), 400
        if pid not in valid_perm_ids:
            return jsonify({"ok": False, "error": f"Invalid org_permission_id: {pid}"}), 400
        desired.add((rid, pid))

    try:
        # delete existing grants for this org (via join)
        (
            OrgRolePermission.query
            .filter(OrgRolePermission.org_role_id.in_(valid_role_ids))
            .delete(synchronize_session=False)
        )

        for (rid, pid) in desired:
            db.session.add(OrgRolePermission(org_role_id=rid, org_permission_id=pid))

        db.session.commit()

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"ok": False, "error": f"DB constraint failed: {str(e.orig)}"}), 400

    return jsonify({"ok": True, "message": "Role permissions updated."}), 200


@sysadmin_bp.get("/org-role-permissions")
def get_org_role_permissions_matrix():
    _, err = _require_sysadmin()
    if err:
        return err

    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return jsonify({"ok": False, "error": "organisation_id query param is required."}), 400

    org = Organisation.query.get(organisation_id)
    if not org:
        return jsonify({"ok": False, "error": "Organisation not found."}), 404

    roles = (
        OrgRole.query
        .filter(OrgRole.organisation_id == organisation_id)
        .order_by(OrgRole.name.asc(), OrgRole.org_role_id.asc())
        .all()
    )

    permissions = OrgPermission.query.order_by(OrgPermission.code.asc()).all()

    role_ids = [r.org_role_id for r in roles]
    grants_rows = []
    if role_ids:
        grants_rows = (
            OrgRolePermission.query
            .filter(OrgRolePermission.org_role_id.in_(role_ids))
            .all()
        )

    grants = [{"org_role_id": g.org_role_id, "org_permission_id": g.org_permission_id} for g in grants_rows]

    return jsonify({
        "ok": True,
        "organisation_id": organisation_id,
        "roles": [{"org_role_id": r.org_role_id, "name": r.name, "description": r.description} for r in roles],
        "permissions": [{"org_permission_id": p.org_permission_id, "code": p.code, "description": p.description} for p in permissions],
        "grants": grants
    }), 200


@sysadmin_bp.put("/org-roles/<int:org_role_id>/permissions")
def set_permissions_for_org_role(org_role_id):
    _, err = _require_sysadmin()
    if err:
        return err

    payload = request.get_json(force=True) or {}
    organisation_id = payload.get("organisation_id")
    perm_ids = payload.get("org_permission_ids")

    if organisation_id is None:
        return jsonify({"ok": False, "error": "organisation_id is required."}), 400
    if not isinstance(perm_ids, list):
        return jsonify({"ok": False, "error": "org_permission_ids must be a list."}), 400

    role = OrgRole.query.get(org_role_id)
    if not role:
        return jsonify({"ok": False, "error": "Org role not found."}), 404

    if role.organisation_id != int(organisation_id):
        return jsonify({"ok": False, "error": "Role does not belong to this organisation."}), 400

    # Validate permissions exist
    perm_ids_int = []
    for x in perm_ids:
        try:
            perm_ids_int.append(int(x))
        except:
            return jsonify({"ok": False, "error": "org_permission_ids must contain integers only."}), 400

    existing = OrgPermission.query.filter(OrgPermission.org_permission_id.in_(perm_ids_int)).all()
    if len(existing) != len(set(perm_ids_int)):
        return jsonify({"ok": False, "error": "One or more org_permission_ids are invalid."}), 400

    # Replace mappings
    OrgRolePermission.query.filter_by(org_role_id=org_role_id).delete()
    for pid in set(perm_ids_int):
        db.session.add(OrgRolePermission(org_role_id=org_role_id, org_permission_id=pid))

    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Permissions updated.",
        "org_role_id": org_role_id,
        "org_permission_ids": sorted(set(perm_ids_int))
    }), 200
