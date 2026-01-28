from flask import Blueprint, request, jsonify
from backend.data_access.Feedback.feedback import FeedbackRepository
from backend.data_access.Users.users import UserRepository
from backend.application.Feedback.submitFeedback import SubmitFeedbackUseCase

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api")


@feedback_bp.post("/feedback")
def submit_feedback():
    """
    POST /api/feedback
    Body:
    {
        "sender_id": 1,
        "purpose": "Bug Report",
        "rating": 4,
        "content": "The chatbot works well but lags occasionally."
    }
    """
    payload = request.get_json() or {}

    repo = FeedbackRepository()
    user_repo = UserRepository()
    use_case = SubmitFeedbackUseCase(repo, user_repo) #submitFeedback.py requires two arguments(feedback_repo and user_repo)

    result = use_case.execute(payload)

    status_code = 201 if result.get("ok") else 400
    return jsonify(result), status_code
