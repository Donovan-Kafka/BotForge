from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os

db = SQLAlchemy()
cors = CORS()

def create_app():
    load_dotenv()

    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    if not app.config["SQLALCHEMY_DATABASE_URI"]:
        raise RuntimeError("DATABASE_URL not set in .env")

    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    app.config["MONGO_DB_NAME"] = os.getenv("MONGO_DB_NAME")

    if not app.config["MONGO_URI"]:
        raise RuntimeError("MONGO_URI not set in .env")
    if not app.config["MONGO_DB_NAME"]:
        raise RuntimeError("MONGO_DB_NAME not set in .env")
    
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True
    }
    db.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})

    from backend.presentation.routes.unregisteredAPI import unregistered_bp
    from backend.presentation.routes.faqAPI import faq_bp
    from backend.presentation.routes.adminAPI import admin_bp
    from backend.presentation.routes.operatorAPI import operator_bp
    from backend.presentation.routes.sysAdminAPI import sysadmin_bp
    from backend.presentation.routes.featuresAPI import features_bp
    from backend.presentation.routes.feedbackAPI import feedback_bp
    from backend.presentation.routes.chatRoutes import chat_bp
    from backend.presentation.routes.orgRoleAPI import org_roles_bp
    from backend.presentation.routes.subscriptionsAPI import subscriptions_bp
    from backend.presentation.routes.orgAdminAPI import org_admin_bp
    from backend.presentation.routes.notificationsAPI import notifications_bp
    
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
