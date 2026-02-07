from backend import db
from backend.models import Subscription


class SubscriptionRepository:

    # for pricing section at landing page
    def get_active_subscriptions(self):
        """
        Returns active subscriptions ordered by price, then id.
        [(subscription_id, name, price, staff_user_limit, description), ...]
        """
        return (
            db.session.query(
                Subscription.subscription_id,
                Subscription.name,
                Subscription.price,
                Subscription.staff_user_limit,
                Subscription.description
            )
            .filter(Subscription.status == 0)
            .order_by(
                Subscription.price.asc(),
                Subscription.subscription_id.asc()
            )
            .limit(3)
            .all()
        )

    # for assigning subscription after registration
    def get_active_by_id(self, subscription_id: int) -> Subscription | None:
        """
        Returns active Subscription ORM object by id.
        """
        return (
            Subscription.query
            .filter(
                Subscription.subscription_id == subscription_id,
                Subscription.status == 0
            )
            .first()
        )

    # generic fetch (admin / internal use)
    def get_by_id(self, subscription_id: int) -> Subscription | None:
        """
        Returns Subscription ORM object by id (any status).
        """
        return Subscription.query.get(subscription_id)
