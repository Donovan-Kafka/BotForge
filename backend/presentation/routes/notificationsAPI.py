from flask import Blueprint, request, jsonify
from application.notification_service import NotificationService
from data_access.Notifications.notifications import NotificationRepository
from data_access.Users.users import UserRepository

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

user_repo = UserRepository()
notification_repo = NotificationRepository()
service = NotificationService(notification_repo, user_repo)


@notifications_bp.get("/")
def list_notifications():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return {"error": "user_id is required"}, 400

    notifications = service.list_notifications(user_id)

    return jsonify({
        "ok": True,
        "notifications": [
            {
                "message_id": n.message_id,
                "title": n.title,
                "content": n.content,
                "creation_date": n.creation_date
            }
            for n in notifications
        ]
    }), 200


@notifications_bp.put("/<int:message_id>/dismiss")
def dismiss_notification(message_id: int):
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return {"error": "user_id is required"}, 400

    try:
        service.dismiss_notification(user_id, message_id)
    except ValueError as e:
        return {"error": str(e)}, 400

    return {"ok": True, "message": "Notification dismissed"}, 200
