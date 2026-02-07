from backend import db
from sqlalchemy.sql import func
from datetime import datetime, timezone

# Organisation (base)

class Organisation(db.Model):
    __tablename__ = "organisation"

    organisation_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    industry = db.Column(db.String(50), nullable=False)  # restaurant / education / retail
    subscription_id = db.Column(db.Integer, db.ForeignKey("subscription.subscription_id"))

    description = db.Column(db.Text)
    location = db.Column(db.String(255))
    city = db.Column(db.String(100))
    country = db.Column(db.String(100))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(50))
    website_url = db.Column(db.String(255))
    business_hours = db.Column(db.String(255))

    # one-to-one subtype relationships
    restaurant = db.relationship("OrganisationRestaurant", uselist=False, backref="organisation")
    education = db.relationship("OrganisationEducation", uselist=False, backref="organisation")
    retail = db.relationship("OrganisationRetail", uselist=False, backref="organisation")


# =========================
# Organisation subtypes
# =========================

class OrganisationRestaurant(db.Model):
    __tablename__ = "organisation_restaurant"

    organisation_id = db.Column(
        db.Integer,
        db.ForeignKey("organisation.organisation_id", ondelete="CASCADE"),
        primary_key=True
    )

    cuisine_type = db.Column(db.String(255))
    restaurant_style = db.Column(db.String(100))
    dining_options = db.Column(db.String(255))
    supports_reservations = db.Column(db.Boolean, default=False)
    reservation_link = db.Column(db.String(255))
    price_range = db.Column(db.String(10))
    seating_capacity = db.Column(db.Integer)
    specialties = db.Column(db.Text)


class OrganisationEducation(db.Model):
    __tablename__ = "organisation_education"

    organisation_id = db.Column(
        db.Integer,
        db.ForeignKey("organisation.organisation_id", ondelete="CASCADE"),
        primary_key=True
    )

    institution_type = db.Column(db.String(100))
    target_audience = db.Column(db.String(255))
    course_types = db.Column(db.String(255))
    delivery_mode = db.Column(db.String(255))
    intake_periods = db.Column(db.String(255))
    application_link = db.Column(db.String(255))
    response_time = db.Column(db.String(100))
    key_programs = db.Column(db.Text)


class OrganisationRetail(db.Model):
    __tablename__ = "organisation_retail"

    organisation_id = db.Column(
        db.Integer,
        db.ForeignKey("organisation.organisation_id", ondelete="CASCADE"),
        primary_key=True
    )

    retail_type = db.Column(db.String(100))
    product_categories = db.Column(db.String(255))
    has_physical_store = db.Column(db.Boolean, default=True)
    has_online_store = db.Column(db.Boolean, default=False)
    online_store_url = db.Column(db.String(255))
    delivery_options = db.Column(db.String(255))
    return_policy = db.Column(db.Text)
    warranty_info = db.Column(db.Text)
    payment_methods = db.Column(db.String(255))
    promotions_note = db.Column(db.Text)


# =========================
# System & roles
# =========================

class SystemRole(db.Model):
    __tablename__ = "system_role"

    system_role_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(255))


class OrgRole(db.Model):
    __tablename__ = "org_role"

    org_role_id = db.Column(db.Integer, primary_key=True)
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))
    is_default = db.Column(db.Boolean, nullable=False, default=False)
    
    __table_args__ = (
        db.UniqueConstraint("organisation_id", "name", name="uq_org_role_name"),
    )


class OrgPermission(db.Model):
    __tablename__ = "org_permission"

    org_permission_id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(255))


class OrgRolePermission(db.Model):
    __tablename__ = "org_role_permission"

    org_role_id = db.Column(db.Integer, db.ForeignKey("org_role.org_role_id"), primary_key=True)
    org_permission_id = db.Column(db.Integer, db.ForeignKey("org_permission.org_permission_id"), primary_key=True)


# =========================
# Users
# =========================

class AppUser(db.Model):
    __tablename__ = "app_user"

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    status = db.Column(db.Boolean, default=False)

    system_role_id = db.Column(db.Integer, db.ForeignKey("system_role.system_role_id"), nullable=False)
    org_role_id = db.Column(db.Integer, db.ForeignKey("org_role.org_role_id"))
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"))

    org_role = db.relationship("OrgRole")


# =========================
# Subscription & features
# =========================

class Subscription(db.Model):
    __tablename__ = "subscription"

    subscription_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    staff_user_limit = db.Column(db.Integer, nullable=False, default=3)
    status = db.Column(db.SmallInteger, nullable=False, default=0)
    description = db.Column(db.String(255))


class Feature(db.Model):
    __tablename__ = "feature"

    feature_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))


class SubscriptionFeature(db.Model):
    __tablename__ = "subscription_features"

    subscription_id = db.Column(db.Integer, db.ForeignKey("subscription.subscription_id"), primary_key=True)
    feature_id = db.Column(db.Integer, db.ForeignKey("feature.feature_id"), primary_key=True)
    display_order = db.Column(db.SmallInteger)


class FeaturedVideo(db.Model):
    __tablename__ = "featured_video"

    id = db.Column(db.SmallInteger, primary_key=True)  # constrained to id=1
    url = db.Column(db.String(255))
    title = db.Column(db.String(100))
    description = db.Column(db.String(255))
    updated_date = db.Column(db.DateTime, default=datetime.now(timezone.utc))


# =========================
# Content & system data
# =========================

class FAQ(db.Model):
    __tablename__ = "faq"

    faq_id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(255), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    status = db.Column(db.SmallInteger, nullable=False, default=0)
    display_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now())


class Notification(db.Model):
    __tablename__ = "notification"

    message_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    creation_date = db.Column(db.DateTime, server_default=func.now())
    is_read = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey("app_user.user_id"), nullable=False)


class Feedback(db.Model):
    __tablename__ = "feedback"

    feedback_id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("app_user.user_id"), nullable=False)
    purpose = db.Column(db.String(100))
    rating = db.Column(db.Integer)
    content = db.Column(db.Text)
    creation_date = db.Column(db.DateTime, server_default=func.now())
    is_testimonial = db.Column(db.Boolean, default=False)


# =========================
# Chatbot & analytics
# =========================

class Personality(db.Model):
    __tablename__ = "personality"

    personality_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))
    type = db.Column(db.String(50))


class Chatbot(db.Model):
    __tablename__ = "chatbot"

    bot_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))
    creation_date = db.Column(db.DateTime, server_default=func.now())
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=False)
    personality_id = db.Column(db.Integer, db.ForeignKey("personality.personality_id"))

    welcome_message = db.Column(db.Text, nullable=False, default="Hi! How can I help you today?")
    primary_language = db.Column(db.String(10), nullable=False, default="English")
    tone = db.Column(db.String(20), nullable=False, default="Friendly")
    allow_emojis = db.Column(db.Boolean, nullable=False, default=True)
    auto_detect_language = db.Column(db.Boolean, nullable=False, default=False)


class ChatbotTemplate(db.Model):
    __tablename__ = "chatbot_template"

    template_id = db.Column(db.Integer, primary_key=True)
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=True)
    industry = db.Column(db.String(50), nullable=False, default="default")
    intent = db.Column(db.String(50), nullable=False, default="fallback")
    language = db.Column(db.String(5), nullable=False, default="en")
    template_text = db.Column(db.Text, nullable=False)
    is_default = db.Column(db.Boolean, nullable=False, default=False)


class ChatbotQuickReply(db.Model):
    __tablename__ = "chatbot_quick_reply"

    quick_reply_id = db.Column(db.Integer, primary_key=True)
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=True)
    industry = db.Column(db.String(50), nullable=False, default="default")
    intent = db.Column(db.String(50), nullable=False, default="fallback")
    language = db.Column(db.String(5), nullable=False, default="en")
    text = db.Column(db.String(120), nullable=False)
    display_order = db.Column(db.Integer, nullable=False, default=0)


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

class Invitation(db.Model):
    __tablename__ = "invitation"

    invitation_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)

    organisation_id = db.Column(
        db.Integer,
        db.ForeignKey("organisation.organisation_id"),
        nullable=False
    )

    invited_by_user_id = db.Column(
        db.Integer,
        db.ForeignKey("app_user.user_id"),
        nullable=False
    )

    token = db.Column(db.String(255), nullable=False, unique=True)
    status = db.Column(db.SmallInteger, nullable=False, default=0)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=func.now()
    )

class ChatMessage(db.Model):
    __tablename__ = "chat_message"

    message_id = db.Column(db.Integer, primary_key=True)
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=False)
    chatbot_id = db.Column(db.Integer, db.ForeignKey("chatbot.bot_id"))
    session_id = db.Column(db.String(100))
    sender = db.Column(db.String(20), nullable=False)
    sender_user_id = db.Column(db.Integer, db.ForeignKey("app_user.user_id"))
    sender_name = db.Column(db.String(100))
    message = db.Column(db.Text, nullable=False)
    intent = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, server_default=func.now())

class LandingImage(db.Model):
    __tablename__ = "landing_image"

    image_id = db.Column(db.Integer, primary_key=True)
    image_url = db.Column(db.String(255), nullable=False)
    alt_text = db.Column(db.String(150))
    display_order = db.Column(db.SmallInteger, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
