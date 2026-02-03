from backend.models import Personality


class PersonalityRepository:
    """
    Read-only access to personality settings.
    """

    def get_by_id(self, personality_id: int | str):
        if not personality_id:
            return None

        try:
            pid = int(personality_id)
        except (TypeError, ValueError):
            return None

        return Personality.query.get(pid)
