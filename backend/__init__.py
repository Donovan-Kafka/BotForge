from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

db = SQLAlchemy()


def create_app():
    load_dotenv()

    app = Flask(__name__)

    # --------------------
    # Core config
    # --------------------
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    if not app.config["SQLALCHEMY_DATABASE_URI"]:
        raise RuntimeError("DATABASE_URL not set")

    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    app.config["MONGO_DB_NAME"] = os.getenv("MONGO_DB_NAME")

    if not app.config["MONGO_URI"]:
        raise RuntimeError("MONGO_URI not set")
    if not app.config["MONGO_DB_NAME"]:
        raise RuntimeError("MONGO_DB_NAME not set")

    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True
    }

    db.init_app(app)
    
    def cors_origin_validator(origin):
        # Allow same-origin / server-side calls
        if origin is None:
            return True

        if origin == "https://botforge-1.onrender.com":
            return True

        if origin.startswith("https://"):
            return True

        return False

    CORS(
        app,
        origins=cors_origin_validator,
        supports_credentials=False,   # IMPORTANT for embeds
        resources={r"/api/*": {"origins": cors_origin_validator}},
    )

    from presentation.routes.unregisteredAPI import unregistered_bp
    from presentation.routes.faqAPI import faq_bp
    from presentation.routes.adminAPI import admin_bp
    from presentation.routes.operatorAPI import operator_bp
    from presentation.routes.sysAdminAPI import sysadmin_bp
    from presentation.routes.featuresAPI import features_bp
    from presentation.routes.feedbackAPI import feedback_bp
    from presentation.routes.chatRoutes import chat_bp
    from presentation.routes.orgRoleAPI import org_roles_bp
    from presentation.routes.subscriptionsAPI import subscriptions_bp
    from presentation.routes.orgAdminAPI import org_admin_bp
    from presentation.routes.notificationsAPI import notifications_bp

    app.register_blueprint(unregistered_bp, url_prefix="/api/public")
    app.register_blueprint(faq_bp, url_prefix="/api/public")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(operator_bp, url_prefix="/api/operator")
    app.register_blueprint(sysadmin_bp, url_prefix="/api/sysadmin")
    app.register_blueprint(features_bp, url_prefix="/api")
    app.register_blueprint(feedback_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(org_roles_bp, url_prefix="/api/org-roles")
    app.register_blueprint(subscriptions_bp, url_prefix="/api")
    app.register_blueprint(org_admin_bp, url_prefix="/api/org-admin")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    @app.get("/health")
    def health():
        return {"ok": True}

    return app
