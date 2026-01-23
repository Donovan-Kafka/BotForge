# backend/application/ai/chatbot_service.py

from typing import Any, Dict, List, Optional


class ChatbotService:
    """
    Orchestrates:
    - intent detection (IntentService)
    - company profiling (CompanyProfileRepository)
    - response templates (TemplateRepository + TemplateEngine)
    """

    def __init__(
        self,
        intent_service,
        company_repository,
        template_repository,
        template_engine,
    ):
        self.intent_service = intent_service
        self.company_repository = company_repository
        self.template_repository = template_repository
        self.template_engine = template_engine

    def chat(
        self,
        company_id: str | int,
        message: str,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Main entrypoint called from chatRoutes.py

        Returns a dict that can be JSON-ified:
        {
          "ok": True,
          "intent": "...",
          "confidence": 0.9,
          "entities": [...],
          "reply": "...",
          "quick_replies": [...]
        }
        """

        # 1) Intent detection using sklearn model
        intent_result = self.intent_service.parse(message)
        intent = intent_result.get("intent", "fallback")
        confidence = float(intent_result.get("confidence", 0.0))
        entities: List[Dict[str, Any]] = intent_result.get("entities", [])

        # 2) Load company profile (Organisation-based)
        company = self.company_repository.get_company_profile(company_id)

        # 3) Determine industry (restaurant / retail / education / default)
        industry = None
        if company:
            industry = company.get("industry") or "default"
        else:
            industry = "default"

        # 4) Fetch template for (industry, intent)
        template = self.template_repository.get_template(
            company_id=company_id,
            industry=industry,
            intent=intent,
        )

        # 5) Render response text
        reply = self.template_engine.render(
            template=template,
            company=company or {},
            entities=entities,
        )

        # 6) Quick replies (you can customize per industry later)
        quick_replies = self._quick_replies_for(industry, intent)

        return {
            "ok": True,
            "intent": intent,
            "confidence": confidence,
            "entities": entities,
            "reply": reply,
            "quick_replies": quick_replies,
        }

    # ------------------------------------------------------------------
    # Helper: define quick replies shown to the user
    # ------------------------------------------------------------------
    def _quick_replies_for(self, industry: str, intent: str) -> List[str]:
        # You can later branch by industry (restaurant/education/retail).
        # For now a simple static set:
        return [
            "Business hours",
            "Location",
            "Pricing",
            "Contact support",
            "Make a booking",
        ]
