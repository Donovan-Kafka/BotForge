from backend import db
from backend.models import Notification
from datetime import datetime, timezone


class NotificationRepository:

    def create(self, user_id: int, title: str, content: str) -> Notification:
        notification = Notification(user_id=user_id, title=title, content=content, creation_date=datetime.now(timezone.utc), is_read=False)
        db.session.add(notification)
        db.session.commit()
        db.session.refresh(notification)
        return notification

    def get_by_user(self, user_id: int):
        return (
            Notification.query
            .filter(Notification.user_id == user_id)
            .order_by(Notification.creation_date.desc())
            .all()
        )

    def get_by_id(self, message_id: int) -> Notification | None:
        return db.session.get(Notification, message_id)

    # dismisses notification
    def dismiss_notification(self, notification: Notification):
        notification.is_read = True
        db.session.commit()