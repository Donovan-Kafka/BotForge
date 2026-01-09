class FaqService:
    def __init__(self, faq_repository):
        self.faq_repository = faq_repository

    # CREATE
    def create_faq(self, question, answer, user_id, status=0, display_order=0):
        if not question.strip():
            raise ValueError("Question cannot be empty")

        if not answer.strip():
            raise ValueError("Answer cannot be empty")

        return self.faq_repository.create_faq(
            question=question,
            answer=answer,
            user_id=user_id,
            status=status,
            display_order=display_order
        )

    # READ (all)
    def list_faqs(self):
        return self.faq_repository.get_all()

    # READ by faq id
    def get_faq(self, faq_id: int):
        faq = self.faq_repository.get_by_id(faq_id)
        if not faq:
            raise ValueError("FAQ not found")
        return faq

    # UPDATE
    def update_faq(self, faq_id: int, question=None, answer=None, status=None, display_order=None):
        faq = self.faq_repository.get_by_id(faq_id)
        if not faq:
            raise ValueError("FAQ not found")

        if question is not None:
            if not question.strip():
                raise ValueError("Question cannot be empty")
            faq.question = question

        if answer is not None:
            if not answer.strip():
                raise ValueError("Answer cannot be empty")
            faq.answer = answer

        if status is not None:
            faq.status = status

        if display_order is not None:
            faq.display_order = display_order

        return self.faq_repository.update(faq)

    # DELETE
    def delete_faq(self, faq_id: int):
        faq = self.faq_repository.get_by_id(faq_id)
        if not faq:
            raise ValueError("FAQ not found")

        self.faq_repository.delete(faq)
