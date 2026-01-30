from flask import Blueprint, jsonify, request
from backend.data_access.Subscriptions.subscriptions import SubscriptionRepository
from backend.data_access.Users.users import UserRepository
from backend.data_access.Organisation.organisation import OrganisationRepository
from backend.application.UnregisteredUsers.getActiveSubscriptions import GetActiveSubscriptions
from backend.application.UnregisteredUsers.choosePlan import AssignSubscriptionUseCase

subscriptions_bp = Blueprint("subscriptions", __name__, url_prefix="/api")


@subscriptions_bp.get("/subscriptions/active")
def active_subscriptions():
    """
    GET /api/subscriptions/active
    Returns active subscription plans for the landing page.
    """
    subscription_repo = SubscriptionRepository()
    get_active_subscriptions = GetActiveSubscriptions(subscription_repo)

    result = get_active_subscriptions.execute()
    return jsonify(result), 200


@subscriptions_bp.post("/subscriptions/assign")
def assign_subscription():
    """
    POST /api/subscriptions/assign
    Body:
    {
        "user_id": 1,
        "subscription_id": 2
    }
    """
    data = request.get_json() or {}
    user_id = data.get("user_id")
    subscription_id = data.get("subscription_id")

    if not user_id or not subscription_id:
        return jsonify({
            "ok": False,
            "error": "user_id and subscription_id are required."
        }), 400

    user_repo = UserRepository()
    organisation_repo = OrganisationRepository()
    subscription_repo = SubscriptionRepository()
    
    use_case = AssignSubscriptionUseCase(
        user_repo=user_repo,
        organisation_repo=organisation_repo,
        subscription_repo=subscription_repo
    )

    result = use_case.execute(
        user_id=user_id,
        subscription_id=subscription_id
    )

    status_code = 200 if result.get("ok") else 400
    return jsonify(result), status_code
