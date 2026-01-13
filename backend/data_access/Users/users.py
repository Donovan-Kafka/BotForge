from backend import db
from backend.models import AppUser


class UserRepository:
    def get_by_id(self, user_id: int) -> AppUser | None:
        return db.session.get(AppUser, user_id)
