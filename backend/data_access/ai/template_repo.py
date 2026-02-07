# What it does:

# Fetches templates from the database

# Supports:

# company-specific templates

# industry default templates (fallback)

# backend/data_access/ai/template_repo.py

from backend.models import ChatbotTemplate

LANGUAGE_MAP = {
    "english": "en",
    "en": "en",
    "french": "fr",
    "fr": "fr",
    "chinese": "zh",
    "zh": "zh",
}

class TemplateRepository:
    """
    Data access layer for chatbot response templates.

    For now, this is a stub using in-code dictionaries so you can
    test the chatbot end-to-end without database dependency.

    Later, replace with real DB reads:
      - company-specific templates (override)
      - industry default templates (fallback)
    """

    # Industry-level default templates (English fallback)
    DEFAULT_TEMPLATES = {
    "restaurant": {
        "greeting": "Hi! Welcome to {{company_name}} 😊 How can I help you today?",
        "greet": "Hi! Welcome to {{company_name}} 😊 How can I help you today?",
        "business_hours": "🍽️ {{company_name}} is open from {{business_hours}} at {{location}}.",
        "pricing": "Our pricing may vary depending on your order. For details, contact us at {{contact_email}}.",
        "price_range": "Our typical price range is {{price_range}}. For more details, contact us at {{contact_email}}.",
        "menu": "Here are our specialties: {{specialties}}. We serve {{cuisine_type}} cuisine in a {{restaurant_style}} style.",
        "dining_options": "We offer {{dining_options}}. Let us know if you'd like delivery or takeaway.",
        "reservation": "Reservations are {{supports_reservations}}. Book here: {{reservation_link}}.",
        "seating_capacity": "Our seating capacity is {{seating_capacity}} guests. For large groups, please contact {{contact_email}}.",
        "booking": "Sure! What date/time would you like to reserve, and how many pax?",
        "location": "{{company_name}} is located at {{location}}.",
        "website": "You can visit {{company_name}} online at {{website_url}}.",
        "contact_support": "You can reach us at {{contact_email}} or {{contact_phone}}.",
        "fallback": "Sorry — I’m not sure about that. You can contact us at {{contact_email}}."
    },

    "education": {
        "greeting": "Hi! Welcome to {{company_name}} 🎓 How can I assist you today?",
        "greet": "Hi! Welcome to {{company_name}} 🎓 How can I assist you today?",
        "business_hours": "{{company_name}} operates during {{business_hours}}. Would you like admissions help?",
        "pricing": "Fees vary by course or program. Please email {{contact_email}} for the latest details.",
        "price_range": "Fees vary by course or program. Please email {{contact_email}} for the latest details.",
        "courses": "We offer {{course_types}} for {{target_audience}}. Popular programs include {{key_programs}}.",
        "intake": "Upcoming intake periods: {{intake_periods}}.",
        "apply": "You can apply here: {{application_link}}. Typical response time is {{response_time}}.",
        "delivery_mode": "We offer {{delivery_mode}} learning options.",
        "booking": "Sure — are you looking to book a consultation or enroll in a course?",
        "location": "{{company_name}} is located at {{location}}.",
        "website": "You can find more information at {{website_url}}.",
        "contact_support": "You can contact our team at {{contact_email}} or {{contact_phone}}.",
        "fallback": "Sorry — I’m not sure about that. Please reach out at {{contact_email}}."
    },

    "retail": {
        "greeting": "Hi! Welcome to {{company_name}} 🛍️ How can I help you today?",
        "greet": "Hi! Welcome to {{company_name}} 🛍️ How can I help you today?",
        "business_hours": "{{company_name}} is open from {{business_hours}} at {{location}}.",
        "pricing": "Prices may vary by product. For promotions or inquiries, contact us at {{contact_email}}.",
        "price_range": "Prices may vary by product. For promotions or inquiries, contact us at {{contact_email}}.",
        "products": "We carry {{product_categories}}. Let us know what you're looking for!",
        "delivery": "Delivery options: {{delivery_options}}. Online store: {{online_store_url}}.",
        "returns": "Our return policy: {{return_policy}}.",
        "warranty": "Warranty information: {{warranty_info}}.",
        "payment_methods": "We accept {{payment_methods}}.",
        "booking": "Are you looking to reserve an item, check availability, or place an order?",
        "location": "{{company_name}} store is located at {{location}}.",
        "website": "Our website is {{website_url}}.",
        "contact_support": "You can reach our support team at {{contact_email}} or {{contact_phone}}.",
        "fallback": "Sorry — I’m not sure about that. Please contact us at {{contact_email}}."
    },

    "default": {
        "greeting": "Hi! How can I help you today?",
        "greet": "Hi! How can I help you today?",
        "website": "You can visit our website at {{website_url}}.",
        "fallback": "Sorry — I’m not sure about that yet. Please contact {{contact_email}}."
    }
}


    # Optional: company-specific overrides (empty for now)
    # In real DB design, this would come from a table keyed by (company_id, intent)
    COMPANY_OVERRIDES = {
        # Example:
        # "demo_company": {
        #     "business_hours": "We’re open daily {{business_hours}} — walk-ins welcome!"
        # }
    }

    def _normalize_language(self, language: str | None) -> str:
        if not language:
            return "en"
        return LANGUAGE_MAP.get(language.strip().lower(), "en")

    def get_template(self, company_id: str, industry: str, intent: str, language: str | None = None) -> str:
        """
        Returns a template string using:
        1) company override in DB
        2) industry default in DB
        3) default fallback in DB
        4) English in-code fallback
        """
        intent = intent or "fallback"
        industry = industry or "default"
        language = self._normalize_language(language)

        def _db_lookup(org_id: int | None, ind: str, lang: str, it: str):
            return (
                ChatbotTemplate.query
                .filter_by(
                    organisation_id=org_id,
                    industry=ind,
                    language=lang,
                    intent=it,
                )
                .order_by(ChatbotTemplate.template_id.asc())
                .first()
            )

        org_id = None
        try:
            org_id = int(company_id) if company_id is not None else None
        except (TypeError, ValueError):
            org_id = None

        # Collect fallbacks, but prefer an explicit intent template (DB or in-code) over DB "fallback".
        fallback_templates: list[str] = []

        # 1) Company override (language)
        if org_id is not None:
            row = _db_lookup(org_id, industry, language, intent)
            if row:
                return row.template_text
            row = _db_lookup(org_id, industry, language, "fallback")
            if row and row.template_text:
                fallback_templates.append(row.template_text)

        # 2) Industry default (language)
        row = _db_lookup(None, industry, language, intent)
        if row:
            return row.template_text
        row = _db_lookup(None, industry, language, "fallback")
        if row and row.template_text:
            fallback_templates.append(row.template_text)

        # 3) Default industry (language)
        row = _db_lookup(None, "default", language, intent)
        if row:
            return row.template_text
        row = _db_lookup(None, "default", language, "fallback")
        if row and row.template_text:
            fallback_templates.append(row.template_text)

        # 4) In-code fallback for the requested intent (useful when DB doesn't have that intent yet).
        industry_templates = self.DEFAULT_TEMPLATES.get(industry, self.DEFAULT_TEMPLATES["default"])
        if intent in industry_templates:
            return industry_templates[intent]

        # 5) DB fallbacks in order (org -> industry -> default), then in-code fallback.
        if fallback_templates:
            return fallback_templates[0]

        return industry_templates.get("fallback") or self.DEFAULT_TEMPLATES["default"]["fallback"]
