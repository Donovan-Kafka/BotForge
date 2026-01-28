from flask import Blueprint, request, jsonify
from backend.models import Feedback, AppUser, Feature, FAQ, OrgRole, Organisation, SystemRole, OrgPermission, OrgRolePermission, Subscription, SubscriptionFeature
from backend import db
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

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

    out = []
    for fb in rows:
        sender = AppUser.query.get(fb.sender_id)

        role_name = None
        if sender and sender.org_role_id:
            r = OrgRole.query.get(sender.org_role_id)
            role_name = r.name if r else None
        elif sender and sender.system_role_id is not None:
            role_name = "SYS_ADMIN"

        # group mapping for landing slots
        group = "STAFF"
        if role_name == "ORG_ADMIN":
            group = "ORG_ADMIN"
        elif role_name == "SYS_ADMIN":
            group = "SYS_ADMIN"  # not used for landing, but still useful

        out.append({
            "feedback_id": fb.feedback_id,
            "sender_id": fb.sender_id,
            "sender_username": sender.username if sender else None,
            "sender_role_name": role_name,
            "group": group,
            "rating": fb.rating,
            "purpose": fb.purpose,
            "content": fb.content,
            "is_testimonial": bool(fb.is_testimonial),
            "creation_date": fb.creation_date.isoformat() if fb.creation_date else None
        })

    return jsonify({"ok": True, "candidates": out}), 200


@sysadmin_bp.post("/testimonials/feature")
def feature_feedback():
    _, err = _require_sysadmin()
    if err:
        return err

    payload = request.get_json(force=True) or {}
    feedback_id = payload.get("feedback_id")
    is_testimonial = payload.get("is_testimonial")

    if feedback_id is None or is_testimonial is None:
        return jsonify({"ok": False, "error": "feedback_id and is_testimonial required."}), 400

    fb = Feedback.query.get(int(feedback_id))
    if not fb:
        return jsonify({"ok": False, "error": "Feedback not found."}), 404

    sender = AppUser.query.get(fb.sender_id)
    if not sender:
        return jsonify({"ok": False, "error": "Sender not found."}), 404

    # Determine group of sender
    sender_role_name = None
    if sender.org_role_id:
        r = OrgRole.query.get(sender.org_role_id)
        sender_role_name = r.name if r else None
    elif sender.system_role_id is not None:
        sender_role_name = "SYS_ADMIN"

    # Only allow featuring for ORG_ADMIN/STAFF (landing needs these)
    if sender_role_name not in ("ORG_ADMIN", "STAFF"):
        return jsonify({"ok": False, "error": "Only ORG_ADMIN or STAFF feedback can be featured."}), 400

    # Set/unset
    fb.is_testimonial = bool(is_testimonial)

    # If featuring: ensure ONLY ONE featured per group
    if fb.is_testimonial:
        # Find all feedback IDs from same group (ORG_ADMIN or STAFF)
        # Strategy: join feedback->app_user->org_role
        same_group_feedbacks = (
            Feedback.query
            .join(AppUser, Feedback.sender_id == AppUser.user_id)
            .join(OrgRole, AppUser.org_role_id == OrgRole.org_role_id)
            .filter(OrgRole.name == sender_role_name)
            .filter(Feedback.feedback_id != fb.feedback_id)
            .all()
        )
        for other in same_group_feedbacks:
            other.is_testimonial = False

    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Updated testimonial flag.",
        "feedback_id": fb.feedback_id,
        "is_testimonial": bool(fb.is_testimonial),
        "group": sender_role_name
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
    print(f"[DEBUG] _require_sysadmin: Header X-USER-ID={user_id}")

    if not user_id:
        print("[DEBUG] Missing X-USER-ID header")
        return None, (jsonify({"ok": False, "error": "Missing X-USER-ID header."}), 401)

    try:
        user_id = int(user_id)
    except ValueError:
        print(f"[DEBUG] Invalid X-USER-ID format: {user_id}")
        return None, (jsonify({"ok": False, "error": "Invalid X-USER-ID header."}), 401)

    user = AppUser.query.get(user_id)
    if user:
        print(f"[DEBUG] User Found: ID={user.user_id}, Name={user.username}, Role={user.system_role_id}, Status={user.status}")
    else:
        print(f"[DEBUG] User NOT found for ID {user_id}")

    if not user or not user.status:
        return None, (jsonify({"ok": False, "error": "Invalid user."}), 401)

    # SYS_ADMIN is system_role_id = 0 (based on your system_role table)
    if user.system_role_id != 0:
        print(f"[DEBUG] Forbidden: User {user.username} has system_role_id={user.system_role_id}, expected 0")
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


@sysadmin_bp.get("/subscriptions")
def list_subscriptions():
    """
    Returns all subscriptions + their linked features (id + name + description) ordered by display_order.
    """
    _, err = _require_sysadmin()
    if err:
        return err

    subs = Subscription.query.order_by(Subscription.subscription_id.asc()).all()

    # prefetch mapping rows
    sub_ids = [s.subscription_id for s in subs]
    sf_rows = []
    if sub_ids:
        sf_rows = (
            SubscriptionFeature.query
            .filter(SubscriptionFeature.subscription_id.in_(sub_ids))
            .all()
        )

    # prefetch features
    feature_ids = list({r.feature_id for r in sf_rows})
    features_by_id = {}
    if feature_ids:
        features = Feature.query.filter(Feature.feature_id.in_(feature_ids)).all()
        features_by_id = {f.feature_id: f for f in features}

    # build per-sub lists
    features_by_sub = {sid: [] for sid in sub_ids}
    # sort by display_order (NULL last), then feature_id for stability
    sf_rows_sorted = sorted(
        sf_rows,
        key=lambda r: ((r.display_order is None), (r.display_order or 9999), r.feature_id)
    )
    for r in sf_rows_sorted:
        f = features_by_id.get(r.feature_id)
        features_by_sub[r.subscription_id].append({
            "feature_id": r.feature_id,
            "name": f.name if f else None,
            "description": f.description if f else None,
            "display_order": r.display_order
        })

    return jsonify({
        "ok": True,
        "subscriptions": [
            {
                "subscription_id": s.subscription_id,
                "name": s.name,
                "price": float(s.price) if s.price is not None else None,
                "status": int(s.status) if s.status is not None else 0,
                "description": s.description,
                "features": features_by_sub.get(s.subscription_id, [])
            }
            for s in subs
        ]
    }), 200

@sysadmin_bp.post("/subscriptions")
def create_subscription():
    _, err = _require_sysadmin()
    if err:
        return err

    payload = request.get_json(force=True) or {}
    name = (payload.get("name") or "").strip()
    description = (payload.get("description") or "").strip() or None

    # price: accept number or string
    price = payload.get("price", None)
    status = payload.get("status", 0)

    if not name:
        return jsonify({"ok": False, "error": "name is required."}), 400
    if len(name) > 50:
        return jsonify({"ok": False, "error": "name max length is 50."}), 400
    if description and len(description) > 255:
        return jsonify({"ok": False, "error": "description max length is 255."}), 400

    if price is None:
        return jsonify({"ok": False, "error": "price is required."}), 400
    try:
        price_val = float(price)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "price must be a number."}), 400
    if price_val < 0:
        return jsonify({"ok": False, "error": "price must be >= 0."}), 400

    try:
        status_val = int(status)
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "status must be 0 (active) or 1 (inactive)."}), 400
    if status_val not in (0, 1):
        return jsonify({"ok": False, "error": "status must be 0 (active) or 1 (inactive)."}), 400

    s = Subscription(
        name=name,
        price=price_val,
        status=status_val,
        description=description
    )
    db.session.add(s)
    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Subscription created.",
        "subscription": {
            "subscription_id": s.subscription_id,
            "name": s.name,
            "price": float(s.price),
            "status": int(s.status),
            "description": s.description
        }
    }), 201

@sysadmin_bp.put("/subscriptions/<int:subscription_id>")
def update_subscription(subscription_id):
    _, err = _require_sysadmin()
    if err:
        return err

    payload = request.get_json(force=True) or {}
    s = Subscription.query.get(subscription_id)
    if not s:
        return jsonify({"ok": False, "error": "Subscription not found."}), 404

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return jsonify({"ok": False, "error": "name cannot be empty."}), 400
        if len(name) > 50:
            return jsonify({"ok": False, "error": "name max length is 50."}), 400
        s.name = name

    if "description" in payload:
        desc = (payload.get("description") or "").strip() or None
        if desc and len(desc) > 255:
            return jsonify({"ok": False, "error": "description max length is 255."}), 400
        s.description = desc

    if "price" in payload:
        try:
            price_val = float(payload.get("price"))
        except (TypeError, ValueError):
            return jsonify({"ok": False, "error": "price must be a number."}), 400
        if price_val < 0:
            return jsonify({"ok": False, "error": "price must be >= 0."}), 400
        s.price = price_val

    if "status" in payload:
        try:
            status_val = int(payload.get("status"))
        except (TypeError, ValueError):
            return jsonify({"ok": False, "error": "status must be 0 (active) or 1 (inactive)."}), 400
        if status_val not in (0, 1):
            return jsonify({"ok": False, "error": "status must be 0 (active) or 1 (inactive)."}), 400
        s.status = status_val

    db.session.commit()

    return jsonify({
        "ok": True,
        "message": "Subscription updated.",
        "subscription": {
            "subscription_id": s.subscription_id,
            "name": s.name,
            "price": float(s.price) if s.price is not None else None,
            "status": int(s.status) if s.status is not None else 0,
            "description": s.description
        }
    }), 200

@sysadmin_bp.delete("/subscriptions/<int:subscription_id>")
def delete_subscription(subscription_id):
    """
    IMPORTANT:
    - Since organisation.subscription_id references subscription,
      hard delete may fail if any organisation is using it.
    - SAFE delete:
        If any org references it -> set status=1 (inactive) (soft-delete)
        Else -> hard delete (also removes subscription_features via manual delete below)
    """
    _, err = _require_sysadmin()
    if err:
        return err

    s = Subscription.query.get(subscription_id)
    if not s:
        return jsonify({"ok": False, "error": "Subscription not found."}), 404

    # Check if referenced by any org 
    in_use = Organisation.query.filter(Organisation.subscription_id == subscription_id).first() is not None

    if in_use:
        s.status = 1
        db.session.commit()
        return jsonify({
            "ok": True,
            "message": "Subscription is in use; set to inactive instead of deleting.",
            "subscription_id": s.subscription_id,
            "status": int(s.status)
        }), 200

    # Not used -> safe to hard delete
    SubscriptionFeature.query.filter(SubscriptionFeature.subscription_id == subscription_id).delete()
    db.session.delete(s)
    db.session.commit()

    return jsonify({"ok": True, "message": "Subscription deleted."}), 200

@sysadmin_bp.get("/subscriptions/<int:subscription_id>/features")
def get_subscription_features(subscription_id):
    """
    Returns feature_ids currently linked to this subscription (plus display_order).
    """
    _, err = _require_sysadmin()
    if err:
        return err

    s = Subscription.query.get(subscription_id)
    if not s:
        return jsonify({"ok": False, "error": "Subscription not found."}), 404

    rows = (
        SubscriptionFeature.query
        .filter(SubscriptionFeature.subscription_id == subscription_id)
        .all()
    )

    rows_sorted = sorted(
        rows,
        key=lambda r: ((r.display_order is None), (r.display_order or 9999), r.feature_id)
    )

    return jsonify({
        "ok": True,
        "subscription_id": subscription_id,
        "features": [
            {
                "feature_id": r.feature_id,
                "display_order": r.display_order
            } for r in rows_sorted
        ]
    }), 200

@sysadmin_bp.put("/subscriptions/<int:subscription_id>/features")
def update_subscription_features(subscription_id):
    """
    Body:
      {
        "feature_ids": [1,2,3]                # simple
        OR
        "features": [{"feature_id":1,"display_order":1}, ...]   # advanced
      }
    - DB constraint says display_order must be 1..3 or NULL.
    """
    _, err = _require_sysadmin()
    if err:
        return err

    s = Subscription.query.get(subscription_id)
    if not s:
        return jsonify({"ok": False, "error": "Subscription not found."}), 404

    payload = request.get_json(force=True) or {}

    feature_ids = payload.get("feature_ids")
    features = payload.get("features")

    normalized = []  # list of (feature_id, display_order)
    if isinstance(features, list):
        for item in features:
            try:
                fid = int(item.get("feature_id"))
            except Exception:
                return jsonify({"ok": False, "error": "features[].feature_id must be an integer."}), 400
            d = item.get("display_order", None)
            if d is not None:
                try:
                    d = int(d)
                except Exception:
                    return jsonify({"ok": False, "error": "features[].display_order must be an integer or null."}), 400
            normalized.append((fid, d))
    elif isinstance(feature_ids, list):
        for x in feature_ids:
            try:
                normalized.append((int(x), None))
            except Exception:
                return jsonify({"ok": False, "error": "feature_ids must contain integers only."}), 400
    else:
        return jsonify({"ok": False, "error": "Provide feature_ids[] or features[]"}), 400

    # Deduplicate while keeping order (first occurrence wins)
    seen = set()
    deduped = []
    for fid, d in normalized:
        if fid not in seen:
            seen.add(fid)
            deduped.append((fid, d))

    # validate feature id exist
    if deduped:
        wanted_ids = [fid for fid, _ in deduped]
        existing = Feature.query.filter(Feature.feature_id.in_(wanted_ids)).all()
        existing_ids = {f.feature_id for f in existing}
        missing = [fid for fid in wanted_ids if fid not in existing_ids]
        if missing:
            return jsonify({"ok": False, "error": f"Invalid feature_id(s): {missing}"}), 400

    try:
        # replace existing mapping
        SubscriptionFeature.query.filter(
            SubscriptionFeature.subscription_id == subscription_id
        ).delete(synchronize_session=False)


        # only assigning display_order for first 3; rest become NULL.
        auto_counter = 1
        for fid, d in deduped:
            if d is None:
                if auto_counter <= 3:
                    d = auto_counter
                    auto_counter += 1
                else:
                    d = None

            # enforce DB constraint if provided:
            if d is not None and (d < 1 or d > 3):
                return jsonify({
                    "ok": False,
                    "error": "display_order must be 1..3 or null (based on DB constraint)."
                }), 400

            db.session.add(SubscriptionFeature(
                subscription_id=subscription_id,
                feature_id=fid,
                display_order=d
            ))

        db.session.commit()

    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"ok": False, "error": f"DB constraint failed: {str(e.orig)}"}), 400

    return jsonify({
        "ok": True,
        "message": "Subscription features updated.",
        "subscription_id": subscription_id,
        "feature_ids": [fid for fid, _ in deduped]
    }), 200