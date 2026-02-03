from backend import db
from backend.models import FAQ

class FaqRepository:

    # CREATE 
    def create_faq(self, question, answer, user_id, status=0, display_order=0):
        faq = FAQ(
            question=question,
            answer=answer,
            user_id=user_id,
            status=status,
            display_order=display_order
        )

        try:
            db.session.add(faq)
            db.session.commit()
            db.session.refresh(faq)
            return faq
        except Exception:
            db.session.rollback()
            raise

    # READ all
    def get_all(self):
        return (
            FAQ.query
            .order_by(FAQ.display_order.asc(), FAQ.created_at.desc())
            .all()
        )

    # READ (by faq id)
    def get_by_id(self, faq_id: int):
        return FAQ.query.get(faq_id)

    # UPDATE
    def update(self, faq: FAQ):
        try:
            db.session.commit()
            db.session.refresh(faq)
            return faq
        except Exception:
            db.session.rollback()
            raise

    # DELETE
    def delete(self, faq: FAQ):
        try:
            db.session.delete(faq)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
