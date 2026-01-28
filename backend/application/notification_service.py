from backend.data_access.Notifications.notifications import NotificationRepository
from backend.data_access.Users.users import UserRepository


class NotificationService:

    def __init__(
        self,
        notification_repo: NotificationRepository,
        user_repo: UserRepository
    ):
        self.notification_repo = notification_repo
        self.user_repo = user_repo

    # System / application use
    # single specific user only
    def notify_user(self, user_id: int, title: str, content: str):
        if not user_id:
            raise ValueError("user_id is required")

        if not title or not content:
            raise ValueError("title and content are required")

        return self.notification_repo.create(
            user_id=user_id,
            title=title,
            content=content
        )
    # notify all users in an organisation
    def notify_organisation(
        self,
        organisation_id: int,
        title: str,
        content: str
    ):
        if not organisation_id:
            raise ValueError("organisation_id is required")

        users = self.user_repo.get_by_organisation(organisation_id)

        for user in users:
            if user.status:
                self.notification_repo.create(
                    user_id=user.user_id,
                    title=title,
                    content=content
                )
    # notify all active app users
    def notify_all_active_app_users(
        self,
        title: str,
        content: str
    ):
        users = self.user_repo.get_active_app_users()

        for user in users:
            self.notification_repo.create(
                user_id=user.user_id,
                title=title,
                content=content
            )

    # User-facing APIs
    def list_notifications(self, user_id: int):
        return self.notification_repo.get_by_user(user_id)

    def mark_read(self, user_id: int, message_id: int):
        notification = self.notification_repo.get_by_id(message_id)
        if not notification:
            raise ValueError("Notification not found")

        if notification.user_id != user_id:
            raise ValueError("Not allowed")

        self.notification_repo.mark_as_read(notification)

    def delete_notification(self, user_id: int, message_id: int):
        notification = self.notification_repo.get_by_id(message_id)
        if not notification:
            raise ValueError("Notification not found")

        if notification.user_id != user_id:
            raise ValueError("Not allowed")

        self.notification_repo.delete(notification)
