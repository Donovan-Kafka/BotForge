from flask import Blueprint, jsonify
from backend.data_access.Subscriptions.subscriptions import SubscriptionRepository
from backend.application.UnregisteredUsers.getActiveSubscriptions import GetActiveSubscriptions

# Bp for subscriptions end points.
subscriptions_bp = Blueprint("subscriptions", __name__, url_prefix="/api")

@subscriptions_bp.get("/subscriptions/active")
def active_subscriptions():
    """
    GET /api/subscriptions/active
    Returns active subscription plans for the landing page.
    """
    # Initialize repository and service
    subscription_repo = SubscriptionRepository()
    get_active_subscriptions = GetActiveSubscriptions(subscription_repo)

    # Execute service
    result = get_active_subscriptions.execute()

    return jsonify(result), 200
