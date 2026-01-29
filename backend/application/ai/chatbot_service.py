# backend/application/ai/chatbot_service.py

from typing import Any, Dict, List, Optional
import re
from datetime import datetime, timezone

class ChatbotService:
    def __init__(
        self,
        intent_service,
        company_repository,
        template_repository,
        template_engine,
        chatbot_repository=None,
        personality_repository=None,
        chat_message_repository=None,
    ):
        self.intent_service = intent_service
        self.company_repository = company_repository
        self.template_repository = template_repository
        self.template_engine = template_engine
        self.chatbot_repository = chatbot_repository
        self.personality_repository = personality_repository
        self.chat_message_repository = chat_message_repository

    # ============================================================
    # CHAT
    # ============================================================
    def chat(
        self,
        company_id: str | int,
        message: str,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> Dict[str, Any]:

        intent_result = self.intent_service.parse(message)
        intent = intent_result.get("intent", "fallback")
        confidence = float(intent_result.get("confidence", 0.0))
        entities = intent_result.get("entities", [])

        company = self.company_repository.get_company_profile(company_id)

        chatbot = (
            self.chatbot_repository.get_by_organisation_id(company_id)
            if self.chatbot_repository
            else None
        )

        personality = None
        if chatbot and chatbot.personality_id and self.personality_repository:
            personality = self.personality_repository.get_by_id(chatbot.personality_id)

        industry = (company or {}).get("industry", "default")

        template = self.template_repository.get_template(
            company_id=company_id,
            industry=industry,
            intent=intent,
        )

        reply = self.template_engine.render(
            template=template,
            company=company or {},
            entities=entities,
        )

        if chatbot and intent in ("greet", "greeting") and chatbot.welcome_message:
            reply = self.template_engine.render(
                template=chatbot.welcome_message,
                company=company or {},
                entities=entities,
            )

        if personality:
            reply = self._apply_personality(reply, personality.name)

        if chatbot and chatbot.allow_emojis is False:
            reply = self._strip_emojis(reply)
        elif chatbot and chatbot.allow_emojis is True:
            reply = self._ensure_emoji(reply)

        quick_replies = self._quick_replies_for(industry, intent)

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
        }

    # ============================================================
    # WELCOME 
    # ============================================================
    def welcome(
        self,
        company_id: str | int,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:

        company = self.company_repository.get_company_profile(company_id)

        chatbot = (
            self.chatbot_repository.get_by_organisation_id(company_id)
            if self.chatbot_repository
            else None
        )

        personality = None
        if chatbot and chatbot.personality_id and self.personality_repository:
            personality = self.personality_repository.get_by_id(chatbot.personality_id)

        industry = (company or {}).get("industry", "default")

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

        if personality:
            reply = self._apply_personality(reply, personality.name)

        if chatbot and chatbot.allow_emojis is False:
            reply = self._strip_emojis(reply)
        elif chatbot and chatbot.allow_emojis is True:
            reply = self._ensure_emoji(reply)

        if chatbot and session_id and self.chat_message_repository:
            self._log_chat_message(
                organisation_id=company_id,
                chatbot_id=chatbot.bot_id,
                session_id=session_id,
                sender="bot",
                sender_user_id=None,
                message=reply,
                intent="greet",
            )
        return {
            "ok": True,
            "intent": "greet",
            "confidence": 1.0,
            "entities": [],
            "reply": reply,
            "quick_replies": self._quick_replies_for(industry, "greet"),
        }

    # ============================================================
    # HELPERS
    # ============================================================
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
        if not self.chat_message_repository:
            return

        if not chatbot_id or not session_id:
            return

        doc = {
            "organisationId": int(organisation_id),
            "chatbotId": chatbot_id,
            "sessionId": session_id,
            "sender": sender,
            "senderUserId": sender_user_id,
            "senderName": None,
            "message": message or "",
            "timestamp": datetime.now(timezone.utc),
            "metadata": {},
        }

        if intent:
            doc["metadata"]["intent"] = intent

        self.chat_message_repository.collection.insert_one(doc)




    def _quick_replies_for(self, industry: str, intent: str) -> List[str]:
        return [
            "Business hours",
            "Location",
            "Pricing",
            "Contact support",
            "Make a booking",
        ]

    def _strip_emojis(self, text: str) -> str:
        return re.sub(
            "[\U0001F300-\U0001FAFF\U00002600-\U000027BF]+",
            "",
            text or "",
            flags=re.UNICODE,
        )

    def _ensure_emoji(self, text: str) -> str:
        if not re.search("[\U0001F600-\U0001F64F]", text or ""):
            return f"{text} 🙂"
        return text

    def _apply_personality(self, text: str, personality_name: str) -> str:
        name = (personality_name or "").lower()

        if "friendly" in name or "casual" in name:
            return f"Hey there! 😊 {text} If you need a hand, just shout!"
        if "professional" in name or "formal" in name:
            return f"Certainly. {text} Please let me know if you need further assistance."

        return text
