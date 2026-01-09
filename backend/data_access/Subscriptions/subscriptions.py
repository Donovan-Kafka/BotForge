from backend import db
from backend.models import Subscription


class SubscriptionRepository:

    # for pricing section at landing page
    def get_active_subscriptions(self):
        """
        Checks for subscriptions with status = 0 (active) and returns them ordered by price (asc), subscription_id (asc).
        E.g.:
        [(subscription_id, name, price, description), ...]
        """
        return (
            db.session.query(
                Subscription.subscription_id,
                Subscription.name,
                Subscription.price,
                Subscription.description
            )
            .filter(Subscription.status == 0)
            .order_by(
                Subscription.price.asc(),
                Subscription.subscription_id.asc()
            )
            .all()
        )
