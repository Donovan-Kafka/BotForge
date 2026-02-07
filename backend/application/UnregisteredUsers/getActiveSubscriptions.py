# used for pricing section at landing page.
class GetActiveSubscriptions:
    def __init__(self, subscription_repo):
        self.subscription_repo = subscription_repo

    def execute(self):
        rows = self.subscription_repo.get_active_subscriptions()

        return {
            "ok": True,
            "plans": [
                {
                    "id": sub_id,
                    "name": name,
                    "price": float(price),
                    "staff_user_limit": staff_user_limit,
                    "description": description
                }
                for sub_id, name, price, staff_user_limit, description in rows
            ]
        }
