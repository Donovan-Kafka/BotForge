from flask import Blueprint, request, jsonify
from backend.application.Faq.faqServices import FaqService
from backend.data_access.Faq.faq import FaqRepository

faq_bp = Blueprint("faq", __name__)

faq_service = FaqService(FaqRepository())

@faq_bp.post("/faq")
def create_faq():
    payload = request.get_json(force=True)

    try:
        faq = faq_service.create_faq(
            question=payload.get("question", ""),
            answer=payload.get("answer", ""),
            user_id=payload.get("user_id"),
            status=payload.get("status", 0),
            display_order=payload.get("display_order", 0),
        )

        return jsonify({
            "ok": True,
            "faq": {
                "faq_id": faq.faq_id,
                "question": faq.question,
                "answer": faq.answer,
                "status": faq.status,
                "display_order": faq.display_order
            }
        }), 201

    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400

@faq_bp.get("/faq")
def list_faqs():
    faqs = faq_service.list_faqs()

    return jsonify({
        "ok": True,
        "faqs": [
            {
                "faq_id": f.faq_id,
                "question": f.question,
                "answer": f.answer,
                "status": f.status,
                "display_order": f.display_order
            }
            for f in faqs
        ]
    }), 200

@faq_bp.put("/faq/<int:faq_id>")
def update_faq(faq_id):
    payload = request.get_json(force=True)

    try:
        faq = faq_service.update_faq(
            faq_id=faq_id,
            question=payload.get("question"),
            answer=payload.get("answer"),
            status=payload.get("status"),
            display_order=payload.get("display_order"),
        )

        return jsonify({
            "ok": True,
            "message": "FAQ updated",
            "faq_id": faq.faq_id
        }), 200

    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400

@faq_bp.delete("/faq/<int:faq_id>")
def delete_faq(faq_id):
    try:
        faq_service.delete_faq(faq_id)
        return jsonify({"ok": True, "message": "FAQ deleted"}), 200
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 404
