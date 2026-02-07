import secrets
import os
from sqlalchemy.exc import IntegrityError
from backend import db
from backend.models import Invitation, AppUser, OrgRole, Organisation, Subscription

STATUS_PENDING = 0
STATUS_ACCEPTED = 1
STATUS_REVOKED = 2


def _new_token() -> str:
    
    return secrets.token_urlsafe(32)


def _get_staff_capacity(organisation_id: int):
    org = Organisation.query.get(organisation_id)
    if not org:
        return None, "Organisation not found."

    if not org.subscription_id:
        return None, "Your organisation must choose a subscription plan before inviting staff."

    subscription = Subscription.query.get(org.subscription_id)
    if not subscription:
        return None, "Assigned subscription plan was not found."

    if subscription.staff_user_limit is None or int(subscription.staff_user_limit) < 1:
        return None, "Assigned subscription plan is missing a valid staff user limit."

    return subscription, None


def _count_active_staff_users(organisation_id: int) -> int:
    return (
        db.session.query(AppUser.user_id)
        .join(OrgRole, AppUser.org_role_id == OrgRole.org_role_id)
        .filter(
            AppUser.organisation_id == organisation_id,
            AppUser.status.is_(True),
            OrgRole.name == "STAFF",
        )
        .count()
    )


def _count_pending_staff_invitations(organisation_id: int) -> int:
    return (
        Invitation.query
        .filter_by(
            organisation_id=organisation_id,
            status=STATUS_PENDING
        )
        .count()
    )


def _check_staff_limit_not_exceeded(organisation_id: int, reserve_pending_invites: bool = False):
    subscription, error = _get_staff_capacity(organisation_id)
    if error:
        return False, error

    current_staff_count = _count_active_staff_users(organisation_id)
    pending_invites = _count_pending_staff_invitations(organisation_id) if reserve_pending_invites else 0
    used_seats = current_staff_count + pending_invites
    limit = int(subscription.staff_user_limit)

    if used_seats >= limit:
        if reserve_pending_invites:
            return False, (
                f"Staff user limit reached for plan '{subscription.name}'. "
                f"Active staff: {current_staff_count}, Pending invites: {pending_invites}, "
                f"Limit: {limit}. Please upgrade the subscription or revoke pending invites."
            )
        return False, (
            f"Staff user limit reached for plan '{subscription.name}'. "
            f"Current: {current_staff_count}, Limit: {limit}. Please upgrade the subscription."
        )

    return True, None

def create_invitation(payload: dict, notification_service) -> dict:
    email = (payload.get("email") or "").strip().lower()
    organisation_id = payload.get("organisation_id")
    invited_by_user_id = payload.get("invited_by_user_id")

    if not email or not organisation_id or not invited_by_user_id:
        return {"ok": False, "error": "email, organisation_id, invited_by_user_id are required."}

    try:
        organisation_id = int(organisation_id)
        invited_by_user_id = int(invited_by_user_id)
    except (TypeError, ValueError):
        return {"ok": False, "error": "organisation_id and invited_by_user_id must be integers."}

    inviter = AppUser.query.get(invited_by_user_id)
    if not inviter:
        return {"ok": False, "error": "Invited_by_user_id not found."}

    if AppUser.query.filter_by(email=email).first():
        return {"ok": False, "error": "This email already has an account."}

    can_add_staff, staff_limit_error = _check_staff_limit_not_exceeded(
        organisation_id,
        reserve_pending_invites=True
    )
    if not can_add_staff:
        return {"ok": False, "error": staff_limit_error}

    base_url = os.getenv("APP_BASE_URL", "http://localhost:5000")

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
        except IntegrityError:
            db.session.rollback()
            continue

        base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
        signup_link = f"{base_url}/operator-signup?token={token}"

        subject = "You're invited to join the organisation"
        html = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Invitation to join</h2>
            <p>You’ve been invited to join an organisation on BotForge.</p>
            <p><a href="{signup_link}">Click here to accept the invitation</a></p>
            <p>If the link doesn’t work, copy this:</p>
            <p>{signup_link}</p>
        </div>
        """
        text = f"You've been invited to join an organisation. Accept here: {signup_link}"

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
            # invitation is still created successfully, only email failed
            email_sent = False
            email_error = str(e)

        return {
            "ok": True,
            "message": "Invitation created.",
            "email_sent": email_sent,
            "email_error": email_error,
            "invitation_id": inv.invitation_id,
            "token": token,
            "signup_link": signup_link
        }
    print("FRONTEND_BASE_URL =", os.getenv("FRONTEND_BASE_URL"))

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

    can_add_staff, staff_limit_error = _check_staff_limit_not_exceeded(inv.organisation_id)
    if not can_add_staff:
        return {"ok": False, "error": staff_limit_error}

    user = AppUser(
        username=username,
        email=inv.email,
        password=password_hash,
        system_role_id=1,
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
