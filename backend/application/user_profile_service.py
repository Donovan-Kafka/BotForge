from werkzeug.security import check_password_hash
from backend.data_access.Users.users import UserRepository
from backend.models import AppUser
from backend.application.notification_service import NotificationService


class UserProfileService:

    def __init__(
        self,
        user_repo: UserRepository,
        notification_service: NotificationService
    ):
        self.user_repo = user_repo
        self.notification_service = notification_service

    def update_profile(
        self,
        user_id: int,
        username: str | None,
        email: str | None
    ) -> AppUser:

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if username is not None:
            if not username.strip():
                raise ValueError("Username cannot be empty")
            user.username = username.strip()

        if email is not None:
            if not email.strip():
                raise ValueError("Email cannot be empty")
            user.email = email.strip().lower()

        updated_user = self.user_repo.update_profile(user)

        # Notify user
        self.notification_service.notify_user(
            user_id=updated_user.user_id,
            title="Profile updated",
            content="Your profile information has been updated successfully."
        )

        return updated_user

    def change_password(
        self,
        user_id: int,
        old_password: str,
        new_password: str
    ):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if not check_password_hash(user.password, old_password):
            raise ValueError("Old password is incorrect")

        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters")

        self.user_repo.update_password(user, new_password)
        # Notify user
        self.notification_service.notify_user(
            user_id=user.user_id,
            title="Password changed",
            content="Your account password was changed successfully."
        )

    def delete_account(self, user_id: int):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        self.user_repo.soft_delete_user(user)