from backend import db
from sqlalchemy.sql import func
from datetime import datetime, timezone

class Organisation(db.Model):
    __tablename__ = "organisation"

    organisation_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

    # High-level info
    industry = db.Column(db.String(50))     # 'restaurant', 'education', 'retail'
    subscription_id = db.Column(db.Integer, db.ForeignKey("subscription.subscription_id"))

    # ===== Common profiling fields (all industries) =====
    description = db.Column(db.Text)
    location = db.Column(db.String(255))
    city = db.Column(db.String(100))
    country = db.Column(db.String(100))

    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(50))
    website_url = db.Column(db.String(255))

    business_hours = db.Column(db.String(255))  # e.g. "Mon–Sun, 10am–10pm"

    # ===== Restaurant-specific fields =====
    cuisine_type = db.Column(db.String(255))          # e.g. "Japanese, Fusion"
    restaurant_style = db.Column(db.String(100))      # e.g. "Casual", "Fine Dining"

    dining_options = db.Column(db.String(255))        # e.g. "dine_in,takeaway,delivery"
    supports_reservations = db.Column(db.Boolean, default=False)
    reservation_link = db.Column(db.String(255))

    price_range = db.Column(db.String(10))            # "$", "$$", "$$$"
    seating_capacity = db.Column(db.Integer)
    specialties = db.Column(db.Text)

    # ===== Education-specific fields =====
    institution_type = db.Column(db.String(100))      # e.g. "Tuition Centre", "University"
    target_audience = db.Column(db.String(255))       # e.g. "Secondary, JC, Adult Learners"
    course_types = db.Column(db.String(255))          # e.g. "Diploma, Short Courses"
    delivery_mode = db.Column(db.String(255))         # e.g. "online,in_person,hybrid"

    intake_periods = db.Column(db.String(255))        # e.g. "January,May,September"
    application_link = db.Column(db.String(255))
    response_time = db.Column(db.String(100))         # e.g. "Within 3 working days"
    key_programs = db.Column(db.Text)

    # ===== Retail-specific fields =====
    retail_type = db.Column(db.String(100))           # e.g. "Fashion", "Electronics"
    product_categories = db.Column(db.String(255))    # e.g. "Shoes,Bags,Accessories"

    has_physical_store = db.Column(db.Boolean, default=True)
    has_online_store = db.Column(db.Boolean, default=False)
    online_store_url = db.Column(db.String(255))

    delivery_options = db.Column(db.String(255))      # e.g. "Standard,Express,Self-collection"
    return_policy = db.Column(db.Text)
    warranty_info = db.Column(db.Text)

    payment_methods = db.Column(db.String(255))       # e.g. "Cash,Credit Card,PayNow"
    promotions_note = db.Column(db.Text)

class OrgRole(db.Model):
    __tablename__ = "org_role"

    org_role_id = db.Column(db.Integer, primary_key=True)
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255))

    __table_args__ = (
        db.UniqueConstraint("organisation_id", "name", name="uq_org_role_name"), )

class OrgPermission(db.Model):
    __tablename__ = "org_permission"

    org_permission_id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(255))

class OrgRolePermission(db.Model):
    __tablename__ = "org_role_permission"

    org_role_id = db.Column(db.Integer, db.ForeignKey("org_role.org_role_id"), primary_key=True)
    org_permission_id = db.Column(db.Integer, db.ForeignKey("org_permission.org_permission_id"), primary_key=True)

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

class SystemRole(db.Model):
    __tablename__ = "system_role"

    system_role_id = db.Column(db.Integer, primary_key=True)  # 0=SYS_ADMIN, 1=APP_USER
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
    name = db.Column(db.String(50), nullable=False)  # <-- used as "Bot Name" in UI
    description = db.Column(db.String(255))
    creation_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    organisation_id = db.Column(db.Integer, db.ForeignKey("organisation.organisation_id"), nullable=False)
    personality_id = db.Column(db.Integer, db.ForeignKey("personality.personality_id"))

    # === Customize Chatbot fields ===
    welcome_message = db.Column(db.Text, nullable=False, default="Hi! How can I help you today?")
    primary_language = db.Column(db.String(10), nullable=False, default="English")
    tone = db.Column(db.String(20), nullable=False, default="Friendly")  # e.g. 'Friendly', 'Professional'
    allow_emojis = db.Column(db.Boolean, nullable=False, default=True)
    
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

    __table_args__ = (db.UniqueConstraint("bot_id", "date", name="uq_analytics_bot_date"), )

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