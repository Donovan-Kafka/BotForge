from backend import db
from sqlalchemy.sql import func
from datetime import datetime, timezone

class Organisation(db.Model):
    __tablename__ = "organisation"

    organisation_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    industry = db.Column(db.String(50))
    size = db.Column(db.String(20))
    subscription_id = db.Column(db.Integer, db.ForeignKey("subscription.subscription_id"))


class AppUser(db.Model):
    __tablename__ = "app_user"

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)   # store HASH
    email = db.Column(db.String(100), nullable=False, unique=True)
    status = db.Column(db.Boolean, default=False)          # false = not verified
    role_id = db.Column(db.Integer, db.ForeignKey("role.role_id"), nullable=False)
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"))


class Role(db.Model):
    __tablename__ = "role"

    role_id = db.Column(db.Integer, primary_key=True)  # 0=SYS_ADMIN, 1=ORG_ADMIN, 2=OPERATOR
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(255))


class Subscription(db.Model):
    __tablename__ = "subscription"

    subscription_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.SmallInteger, nullable=False, default=0) # 0 = active, 1 = inactive
    description = db.Column(db.String(255))

class SubscriptionFeature(db.Model):
    __tablename__ = "subscription_features"

    subscription_id = db.Column(db.Integer, db.ForeignKey("subscription.subscription_id"), primary_key=True)
    feature_id = db.Column(db.Integer, db.ForeignKey("feature.feature_id"), primary_key=True)
    display_order = db.Column(db.SmallInteger)

class Feature(db.Model):
    __tablename__ = "feature"

    feature_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))

class Invitation(db.Model):
    __tablename__ = "invitation"

    invitation_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=False)
    invited_by_user_id = db.Column(db.Integer, db.ForeignKey("app_user.user_id"), nullable=False)
    token = db.Column(db.String(255), nullable=False, unique=True)
    status = db.Column(db.SmallInteger, nullable=False, default=0)  # 0=pending, 1=accepted, 2=revoked
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

class Feedback(db.Model):
    __tablename__ = "feedback"

    feedback_id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("app_user.user_id"), nullable=False)
    title = db.Column(db.String(100))
    rating = db.Column(db.Integer)
    content = db.Column(db.Text)
    creation_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    is_testimonial = db.Column(db.Boolean, nullable=False, default=False)

class Personality(db.Model):
    __tablename__ = "personality"

    personality_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))
    type = db.Column(db.String(50))

class Notification(db.Model):
    __tablename__ = "notification"

    message_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    creation_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    is_read = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey("app_user.user_id"), nullable=False)
    
class Chatbot(db.Model):
    __tablename__ = "chatbot"

    bot_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))
    creation_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=False)
    personality_id = db.Column(db.Integer, db.ForeignKey("personality.personality_id"))
    
class Analytics(db.Model):
    __tablename__ = "analytics"

    analytic_id = db.Column(db.Integer, primary_key=True)
    bot_id = db.Column(db.Integer, db.ForeignKey("chatbot.bot_id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    total_messages = db.Column(db.Integer, default=0)
    avg_response_time = db.Column(db.Float, default=0)
    user_satisfaction = db.Column(db.Float, default=0)
    peak_hour = db.Column(db.Integer)
    top_intents = db.Column(db.Text)

    __table_args__ = (
        db.UniqueConstraint("bot_id", "date", name="uq_analytics_bot_date"),
    )

class FAQ(db.Model):
    __tablename__ = "faq"

    faq_id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(255), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    status = db.Column(db.SmallInteger, nullable=False, default=0)
    display_order = db.Column(db.Integer, nullable=False, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey("app_user.user_id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.now())
    updated_at = db.Column(db.DateTime, nullable=False, server_default=func.now())