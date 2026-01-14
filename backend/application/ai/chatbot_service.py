# What it does (in order):

# Receives user message + company ID

# Calls NLP to detect intent & entities

# Loads company profile (hours, services, etc.)

# Loads the correct response template

# Fills the template with company data

class ChatbotService:
    def __init__(self, intent_service, company_repository, template_repository, template_engine):
        self.intent_service = intent_service
        self.company_repository = company_repository
        self.template_repository = template_repository
        self.template_engine = template_engine

    def chat(self, company_id: str, message: str, session_id=None):
        if not company_id:
            raise ValueError("company_id is required")

        if not message or not message.strip():
            raise ValueError("message cannot be empty")

        message = message.strip()

        # 1) Intent + entities
        intent, entities = self._detect_intent(message)

        # 2) Company profile
        company = self.company_repository.get_company_profile(company_id)
        if not company:
            raise ValueError("Company not found")

        industry = company.get("industry", "default")

        # 3) Template
        template = self.template_repository.get_template(
            company_id=company_id,
            industry=industry,
            intent=intent
        )

        # 4) Render
        reply = self.template_engine.render(
            template=template,
            company=company,
            entities=entities
        )

        quick_replies = self._get_quick_replies(industry)

        return {
            "reply": reply,
            "intent": intent,
            "entities": entities,
            "quick_replies": quick_replies
        }

    def _detect_intent(self, message: str):
        try:
            intent, entities = self.intent_service.parse(message)
            if not intent:
                intent = "fallback"
            if entities is None:
                entities = []
            return intent, entities
        except Exception:
            return "fallback", []

    def _get_quick_replies(self, industry: str):
        common = ["Pricing", "Business hours", "Contact support"]

        if industry == "restaurant":
            return common + ["Make a reservation", "Menu", "Location"]
        elif industry == "education":
            return common + ["Courses", "Admissions", "Schedule"]
        else:
            return common + ["FAQ", "Services"]