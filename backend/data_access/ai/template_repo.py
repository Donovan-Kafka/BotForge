# What it does:

# Fetches templates from the database

# Supports:

# company-specific templates

# industry default templates (fallback)

# backend/data_access/ai/template_repo.py

class TemplateRepository:
    """
    Data access layer for chatbot response templates.

    For now, this is a stub using in-code dictionaries so you can
    test the chatbot end-to-end without database dependency.

    Later, replace with real DB reads:
      - company-specific templates (override)
      - industry default templates (fallback)
    """

    # Industry-level default templates
    DEFAULT_TEMPLATES = {
    "restaurant": {
        "greeting": "Hi! Welcome to {{company_name}} 😊 How can I help you today?",
        "business_hours": "🍽️ {{company_name}} is open from {{business_hours}} at {{location}}.",
        "pricing": "Our pricing may vary depending on your order. For details, contact us at {{contact_email}}.",
        "booking": "Sure! What date/time would you like to reserve, and how many pax?",
        "location": "{{company_name}} is located at {{location}}.",
        "contact_support": "You can reach us at {{contact_email}} or {{contact_phone}}.",
        "fallback": "Sorry — I’m not sure about that. You can contact us at {{contact_email}}."
    },

    "education": {
        "greeting": "Hi! Welcome to {{company_name}} 🎓 How can I assist you today?",
        "business_hours": "{{company_name}} operates during {{business_hours}}. Would you like admissions help?",
        "pricing": "Fees vary by course or program. Please email {{contact_email}} for the latest details.",
        "booking": "Sure — are you looking to book a consultation or enroll in a course?",
        "location": "{{company_name}} is located at {{location}}.",
        "contact_support": "You can contact our team at {{contact_email}} or {{contact_phone}}.",
        "fallback": "Sorry — I’m not sure about that. Please reach out at {{contact_email}}."
    },

    "retail": {
        "greeting": "Hi! Welcome to {{company_name}} 🛍️ How can I help you today?",
        "business_hours": "{{company_name}} is open from {{business_hours}} at {{location}}.",
        "pricing": "Prices may vary by product. For promotions or inquiries, contact us at {{contact_email}}.",
        "booking": "Are you looking to reserve an item, check availability, or place an order?",
        "location": "{{company_name}} store is located at {{location}}.",
        "contact_support": "You can reach our support team at {{contact_email}} or {{contact_phone}}.",
        "fallback": "Sorry — I’m not sure about that. Please contact us at {{contact_email}}."
    },

    "default": {
        "greeting": "Hi! How can I help you today?",
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

    def get_template(self, company_id: str, industry: str, intent: str) -> str:
        """
        Returns a template string using:
        1) company override if exists
        2) industry default
        3) default fallback
        """
        intent = intent or "fallback"
        industry = industry or "default"

        # 1) Company override
        company_templates = self.COMPANY_OVERRIDES.get(company_id, {})
        if intent in company_templates:
            return company_templates[intent]

        # 2) Industry template
        industry_templates = self.DEFAULT_TEMPLATES.get(industry, self.DEFAULT_TEMPLATES["default"])
        if intent in industry_templates:
            return industry_templates[intent]

        # 3) Fallback
        return industry_templates.get("fallback") or self.DEFAULT_TEMPLATES["default"]["fallback"]
