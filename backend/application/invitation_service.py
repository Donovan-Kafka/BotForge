import secrets
from sqlalchemy.exc import IntegrityError
from backend import db
from backend.models import Invitation, AppUser, OrgRole
from backend.application.notification_service import NotificationService

STATUS_PENDING = 0
STATUS_ACCEPTED = 1
STATUS_REVOKED = 2


def _new_token() -> str:
    
    return secrets.token_urlsafe(32)

def create_invitation(payload: dict) -> dict:
    
    email = (payload.get("email") or "").strip().lower()
    organisation_id = payload.get("organisation_id")
    invited_by_user_id = payload.get("invited_by_user_id")

    if not email or not organisation_id or not invited_by_user_id:
        return {"ok": False, "error": "email, organisation_id, invited_by_user_id are required."}

    # ensure inviter exists
    inviter = AppUser.query.get(invited_by_user_id)
    if not inviter:
        return {"ok": False, "error": "Invited_by_user_id not found."}

    # prevent inviting someone who already has an account
    if AppUser.query.filter_by(email=email).first():
        return {"ok": False, "error": "This email already has an account."}

    # Create token, handle rare collision with retry
    for _ in range(5):
        token = _new_token()
        inv = Invitation(
            email=email,
            organisation_id=organisation_id,
            invited_by_user_id=invited_by_user_id,
            token=token,
            status=STATUS_PENDING
        )
        db.session.add(inv)
        try:
            db.session.commit()
            signup_link = f"http://localhost:5000/operator-signup?token={token}"
            return {
                "ok": True,
                "message": "Invitation created.",
                "invitation_id": inv.invitation_id,
                "token": token,
                "signup_link": signup_link
            }
        except IntegrityError:
            db.session.rollback()
            # token unique collision or FK issue; retry token collisions
            continue

    return {"ok": False, "error": "Failed to generate a unique invitation token. Try again."}

def validate_invitation_token(token: str) -> dict:
    token = (token or "").strip()
    if not token:
        return {"ok": False, "error": "token required."}

    inv = Invitation.query.filter_by(token=token).first()
    if not inv:
        return {"ok": False, "error": "Invalid token."}
    if inv.status != STATUS_PENDING:
        return {"ok": False, "error": "Token already used or revoked."}

    return {
        "ok": True,
        "invitation": {
            "invitation_id": inv.invitation_id,
            "email": inv.email,
            "organisation_id": inv.organisation_id,
            "status": inv.status
        }
    }

def accept_invitation_and_create_operator(payload: dict, notification_service) -> dict:
    token = (payload.get("token") or "").strip()
    username = (payload.get("username") or "").strip()
    password_hash = payload.get("password_hash")  # 
    email = (payload.get("email") or "").strip().lower()  

    if not token or not username or not password_hash:
        return {"ok": False, "error": "token, username, password_hash are required."}

    inv = Invitation.query.filter_by(token=token).first()
    if not inv:
        return {"ok": False, "error": "Invalid token."}
    if inv.status != STATUS_PENDING:
        return {"ok": False, "error": "Token already used or revoked."}

    # Email must match invitation 
    if email and email != inv.email:
        return {"ok": False, "error": "Email does not match invitation."}

    # Prevent duplicates
    if AppUser.query.filter_by(email=inv.email).first():
        return {"ok": False, "error": "Account already exists for this email."}
    if AppUser.query.filter_by(username=username).first():
        return {"ok": False, "error": "Username already taken."}

    # Find STAFF org role for organisation
    staff_role = OrgRole.query.filter_by(
        organisation_id=inv.organisation_id,
        name="STAFF"
    ).first()

    if not staff_role:
        return {"ok": False, "error": "STAFF role not found for organisation."}

    user = AppUser(
        username=username,
        email=inv.email,
        password=password_hash,
        system_role_id=None,
        org_role_id=staff_role.org_role_id,
        organisation_id=inv.organisation_id,
        status=True
    )

    db.session.add(user)

    # Marking invitation accepted
    inv.status = STATUS_ACCEPTED

    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        return {"ok": False, "error": "Failed to create operator account (integrity error)."}

    # Notify org admins ONLY after successful verification
    notification_service.notify_organisation(
        organisation_id=inv.organisation_id,
        title="New staff joined",
        content=f"{user.username} has joined your organisation."
    )
    return {
        "ok": True,
        "message": "Operator account created.",
        "user": {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "system_role_id": user.system_role_id,
            "org_role_id": user.org_role_id,
            "organisation_id": user.organisation_id
        }
    }

def revoke_invitation(payload: dict) -> dict:
    token = (payload.get("token") or "").strip()
    if not token:
        return {"ok": False, "error": "token required."}

    inv = Invitation.query.filter_by(token=token).first()
    if not inv:
        return {"ok": False, "error": "Invalid token."}

    inv.status = STATUS_REVOKED
    db.session.commit()
    return {"ok": True, "message": "Invitation revoked."}
