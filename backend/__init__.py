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

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "https://fyp-three-sage.vercel.app", "http://localhost:3000"]}})

    from backend.presentation.routes.unregisteredAPI import unregistered_bp
    from backend.presentation.routes.faqAPI import faq_bp
    from backend.presentation.routes.adminAPI import admin_bp
    from backend.presentation.routes.operatorAPI import operator_bp
    from backend.presentation.routes.sysAdminAPI import sysadmin_bp
    from backend.presentation.routes.featuresAPI import features_bp

    app.register_blueprint(unregistered_bp, url_prefix="/api/public")
    app.register_blueprint(faq_bp, url_prefix="/api/public")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(operator_bp, url_prefix="/api/public")
    app.register_blueprint(sysadmin_bp, url_prefix="/api/sysadmin")
    app.register_blueprint(features_bp, url_prefix="/api")

    @app.get("/health")
    def health():
        return {"ok": True}

    return app
