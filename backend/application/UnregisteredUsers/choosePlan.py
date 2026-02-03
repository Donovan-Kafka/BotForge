from backend.data_access.Users.users import UserRepository
from backend.data_access.Organisation.organisation import OrganisationRepository
from backend.data_access.Subscriptions.subscriptions import SubscriptionRepository

class AssignSubscriptionUseCase:
    """
    Assigns a subscription plan to a user's organisation.
    Called during registration after user selects a plan.
    """

    def __init__(
        self,
        user_repo: UserRepository,
        organisation_repo: OrganisationRepository,
        subscription_repo: SubscriptionRepository,
    ):
        self.user_repo = user_repo
        self.organisation_repo = organisation_repo
        self.subscription_repo = subscription_repo

    def execute(self, user_id: int, subscription_id: int) -> dict:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return {"ok": False, "error": "User not found."}

        if not user.organisation_id:
            return {"ok": False, "error": "User has no organisation."}

        subscription = self.subscription_repo.get_active_by_id(subscription_id)
        if not subscription:
            return {"ok": False, "error": "Invalid or inactive subscription."}

        organisation = self.organisation_repo.get_by_id(user.organisation_id)
        if not organisation:
            return {"ok": False, "error": "Organisation not found."}

        organisation.subscription_id = subscription.subscription_id
        self.organisation_repo.update(organisation)

        return {
            "ok": True,
            "organisation_id": organisation.organisation_id,
            "subscription_id": subscription.subscription_id,
        }
