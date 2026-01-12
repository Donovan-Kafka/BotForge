from backend import db
from backend.models import Feature, SubscriptionFeature


class FeatureRepository:

    def get_highlighted_features(self, subscription_id: int):
        """
        Returns up to 3 highlighted features for a subscription,
        ordered left → right for the landing page UI.
        """

        return (
            db.session.query(
                Feature.feature_id,
                Feature.name,
                Feature.description,
                SubscriptionFeature.display_order
            )
            .join(
                SubscriptionFeature,
                Feature.feature_id == SubscriptionFeature.feature_id
            )
            .filter(
                SubscriptionFeature.subscription_id == subscription_id,
                SubscriptionFeature.display_order.isnot(None)
            )
            .order_by(SubscriptionFeature.display_order.asc())
            .limit(3)
            .all()
        )
