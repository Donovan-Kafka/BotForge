# backend/application/ai/chatbot_service.py

from typing import Any, Dict, List, Optional
import re
from datetime import datetime, timezone
from backend import db
from backend.models import ChatMessage, AppUser


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
        chatbot_repository=None,
        personality_repository=None,
    ):
        self.intent_service = intent_service
        self.company_repository = company_repository
        self.template_repository = template_repository
        self.template_engine = template_engine
        self.chatbot_repository = chatbot_repository
        self.personality_repository = personality_repository

    def chat(
        self,
        company_id: str | int,
        message: str,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
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

        # 3) Fetch chatbot settings (if available)
        chatbot = None
        if self.chatbot_repository:
            chatbot = self.chatbot_repository.get_by_organisation_id(company_id)

        # 4) Load personality (if configured)
        personality = None
        if chatbot and chatbot.personality_id and self.personality_repository:
            personality = self.personality_repository.get_by_id(chatbot.personality_id)

        # 5) Determine industry (restaurant / retail / education / default)
        industry = None
        if company:
            industry = company.get("industry") or "default"
        else:
            industry = "default"

        # 6) Fetch template for (industry, intent)
        template = self.template_repository.get_template(
            company_id=company_id,
            industry=industry,
            intent=intent,
        )

        # 7) Render response text
        reply = self.template_engine.render(
            template=template,
            company=company or {},
            entities=entities,
        )

        # 8) Override greeting with chatbot welcome message if configured
        if chatbot and intent in ("greet", "greeting") and chatbot.welcome_message:
            reply = self.template_engine.render(
                template=chatbot.welcome_message,
                company=company or {},
                entities=entities,
            )

        # 9) Apply personality styling
        if personality:
            reply = self._apply_personality(reply, personality.name)

        # 10) Emoji handling
        if chatbot and chatbot.allow_emojis is False:
            reply = self._strip_emojis(reply)
        elif chatbot and chatbot.allow_emojis is True:
            reply = self._ensure_emoji(reply)

        # 11) Quick replies (you can customize per industry later)
        quick_replies = self._quick_replies_for(industry, intent)

        # 12) Log chat history (user + bot messages)
        self._log_chat_message(
            organisation_id=company_id,
            chatbot_id=chatbot.bot_id if chatbot else None,
            session_id=session_id,
            sender="user",
            sender_user_id=user_id,
            message=message,
            intent=intent,
        )
        self._log_chat_message(
            organisation_id=company_id,
            chatbot_id=chatbot.bot_id if chatbot else None,
            session_id=session_id,
            sender="bot",
            sender_user_id=None,
            message=reply,
            intent=intent,
        )

        return {
            "ok": True,
            "intent": intent,
            "confidence": confidence,
            "entities": entities,
            "reply": reply,
            "quick_replies": quick_replies,
            "chatbot": {
                "name": chatbot.name if chatbot else None,
                "primary_language": chatbot.primary_language if chatbot else None,
                "allow_emojis": chatbot.allow_emojis if chatbot else None,
                "personality": personality.name if personality else None,
            },
        }

    def welcome(self, company_id: str | int, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns a welcome message payload for initial chat open.
        """
        # Load company and chatbot settings
        company = self.company_repository.get_company_profile(company_id)

        chatbot = None
        if self.chatbot_repository:
            chatbot = self.chatbot_repository.get_by_organisation_id(company_id)

        personality = None
        if chatbot and chatbot.personality_id and self.personality_repository:
            personality = self.personality_repository.get_by_id(chatbot.personality_id)

        industry = company.get("industry") if company else "default"

        # Use chatbot welcome message if configured; otherwise fall back to greeting template
        if chatbot and chatbot.welcome_message:
            reply = self.template_engine.render(
                template=chatbot.welcome_message,
                company=company or {},
                entities=[],
            )
        else:
            template = self.template_repository.get_template(
                company_id=company_id,
                industry=industry,
                intent="greet",
            )
            reply = self.template_engine.render(
                template=template,
                company=company or {},
                entities=[],
            )

        # Apply personality styling
        if personality:
            reply = self._apply_personality(reply, personality.name)

        # Emoji handling
        if chatbot and chatbot.allow_emojis is False:
            reply = self._strip_emojis(reply)
        elif chatbot and chatbot.allow_emojis is True:
            reply = self._ensure_emoji(reply)

        return {
            "ok": True,
            "intent": "greet",
            "confidence": 1.0,
            "entities": [],
            "reply": reply,
            "quick_replies": self._quick_replies_for(industry, "greet"),
            "chatbot": {
                "name": chatbot.name if chatbot else None,
                "primary_language": chatbot.primary_language if chatbot else None,
                "allow_emojis": chatbot.allow_emojis if chatbot else None,
                "personality": personality.name if personality else None,
            },
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

    # ------------------------------------------------------------------
    # Helper: remove emoji characters from a string
    # ------------------------------------------------------------------
    def _strip_emojis(self, text: str) -> str:
        if not text:
            return text

        emoji_pattern = re.compile(
            "["
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F680-\U0001F6FF"  # transport & map
            "\U0001F700-\U0001F77F"  # alchemical symbols
            "\U0001F780-\U0001F7FF"  # geometric shapes extended
            "\U0001F800-\U0001F8FF"  # supplemental arrows-C
            "\U0001F900-\U0001F9FF"  # supplemental symbols & pictographs
            "\U0001FA00-\U0001FAFF"  # symbols & pictographs extended-A
            "\U00002700-\U000027BF"  # dingbats
            "\U00002600-\U000026FF"  # misc symbols
            "]+",
            flags=re.UNICODE,
        )

        return emoji_pattern.sub("", text)

    # ------------------------------------------------------------------
    # Helper: ensure at least one emoji if enabled
    # ------------------------------------------------------------------
    def _ensure_emoji(self, text: str) -> str:
        if not text:
            return text

        emoji_pattern = re.compile(
            "["
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F680-\U0001F6FF"  # transport & map
            "\U0001F700-\U0001F77F"  # alchemical symbols
            "\U0001F780-\U0001F7FF"  # geometric shapes extended
            "\U0001F800-\U0001F8FF"  # supplemental arrows-C
            "\U0001F900-\U0001F9FF"  # supplemental symbols & pictographs
            "\U0001FA00-\U0001FAFF"  # symbols & pictographs extended-A
            "\U00002700-\U000027BF"  # dingbats
            "\U00002600-\U000026FF"  # misc symbols
            "]+",
            flags=re.UNICODE,
        )

        if emoji_pattern.search(text):
            return text

        return f"{text} 🙂"

    # ------------------------------------------------------------------
    # Helper: persist chat message for history
    # ------------------------------------------------------------------
    def _log_chat_message(
        self,
        organisation_id: str | int,
        chatbot_id: Optional[int],
        session_id: Optional[str],
        sender: str,
        sender_user_id: Optional[int],
        message: str,
        intent: Optional[str],
    ) -> None:
        try:
            org_id = int(organisation_id)
        except (TypeError, ValueError):
            return

        sender_name = None
        if sender_user_id:
            user = AppUser.query.get(sender_user_id)
            if user:
                sender_name = user.username

        chat_msg = ChatMessage(
            organisation_id=org_id,
            chatbot_id=chatbot_id,
            session_id=session_id,
            sender=sender,
            sender_user_id=sender_user_id,
            sender_name=sender_name,
            message=message or "",
            intent=intent,
            created_at=datetime.now(timezone.utc),
        )
        db.session.add(chat_msg)
        db.session.commit()

    # ------------------------------------------------------------------
    # Helper: apply simple personality adjustments
    # ------------------------------------------------------------------
    def _apply_personality(self, text: str, personality_name: str) -> str:
        if not text:
            return text

        name_normalized = (personality_name or "").strip().lower()

        if "friendly" in name_normalized or "casual" in name_normalized:
            prefix = "Hey there! "
            suffix = " Let me know if you want anything else."
        elif "professional" in name_normalized or "formal" in name_normalized:
            prefix = "Certainly. "
            suffix = " Please let me know if you need further assistance."
        else:
            return text

        return f"{prefix}{text}{suffix}"

    # ------------------------------------------------------------------
