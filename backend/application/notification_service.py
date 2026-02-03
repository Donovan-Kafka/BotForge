import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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

        #smtp config from environmental variable
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_pass = os.getenv("SMTP_PASS", "")
        self.smtp_from = os.getenv("SMTP_FROM", self.smtp_user)

    def send_email(self, to: str, subject: str, html_content: str, text_content: str | None = None) -> None:
        if not to:
            raise ValueError("Missing recipient email")
        if not self.smtp_host or not self.smtp_port or not self.smtp_from:
            raise RuntimeError("SMTP config missing (SMTP_HOST/SMTP_PORT/SMTP_FROM)")

        msg = MIMEMultipart("alternative")
        msg["From"] = self.smtp_from
        msg["To"] = to
        msg["Subject"] = subject

        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()

            if self.smtp_user and self.smtp_pass:
                server.login(self.smtp_user, self.smtp_pass)

            server.sendmail(self.smtp_from, [to], msg.as_string())


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

        count = 0
        for user in users:
            if user.status:
                self.notification_repo.create(
                    user_id=user.user_id,
                    title=title,
                    content=content
                )
                count += 1

        return count
    
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

    def dismiss_notification(self, user_id: int, message_id: int):
        notification = self.notification_repo.get_by_id(message_id)
        if not notification:
            raise ValueError("Notification not found")

        if notification.user_id != user_id:
            raise ValueError("Not allowed")

        self.notification_repo.dismiss_notification(notification)



