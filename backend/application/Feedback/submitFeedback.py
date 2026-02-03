from backend.data_access.Feedback.feedback import FeedbackRepository
from backend.data_access.Users.users import UserRepository
from backend.application.notification_service import NotificationService


class SubmitFeedbackUseCase:
    """
    Submit feedback from user, ensures all fields are not empty
    """

    def __init__(
        self,
        feedback_repo: FeedbackRepository,
        user_repo: UserRepository,
        notification_service: NotificationService
    ):
        self.feedback_repo = feedback_repo
        self.user_repo = user_repo
        self.notification_service = notification_service

    def execute(self, payload: dict):
        sender_id = payload.get("sender_id")
        purpose = (payload.get("purpose") or "").strip()
        content = (payload.get("content") or "").strip()
        rating = payload.get("rating")

        # Validation
        if sender_id is None:
            return {"ok": False, "error": "sender_id is required."}

        if not isinstance(sender_id, int):
            return {"ok": False, "error": "sender_id must be an integer."}

        if not purpose:
            return {"ok": False, "error": "Purpose is required."}

        if not content:
            return {"ok": False, "error": "Content is required."}

        if rating is None:
            return {"ok": False, "error": "Rating is required."}

        if not isinstance(rating, int) or not (1 <= rating <= 5):
            return {"ok": False, "error": "Rating must be an integer between 1 and 5."}

        user = self.user_repo.get_by_id(sender_id)
        if not user:
            return {"ok": False, "error": "User not found."}

        feedback = self.feedback_repo.create(
            sender_id=sender_id,
            purpose=purpose,
            rating=rating,
            content=content
        )

        # Notify sender
        self.notification_service.notify_user(
            user_id=sender_id,
            title="Feedback submitted",
            content="Thank you for your feedback. We appreciate your input."
        )

        return {
            "ok": True,
            "feedback_id": feedback.feedback_id,
            "message": "Feedback submitted successfully."
        }
