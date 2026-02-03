from backend import db
from backend.models import Feedback


class FeedbackRepository:

    def create(
        self,
        sender_id: int,
        purpose: str,
        rating: int,
        content: str,
        is_testimonial: bool = False
    ):
        feedback = Feedback(
            sender_id=sender_id,
            purpose=purpose,
            rating=rating,
            content=content,
            is_testimonial=is_testimonial
        )

        try:
            db.session.add(feedback)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return feedback
