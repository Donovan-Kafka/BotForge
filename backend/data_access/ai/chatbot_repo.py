from backend.models import Chatbot


class ChatbotRepository:
    """
    Read-only access to chatbot settings for a given organisation.
    """

    def get_by_organisation_id(self, organisation_id: int | str):
        if not organisation_id:
            return None

        try:
            org_id = int(organisation_id)
        except (TypeError, ValueError):
            return None

        return Chatbot.query.filter_by(organisation_id=org_id).first()
