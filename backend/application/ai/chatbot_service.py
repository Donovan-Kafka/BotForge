from typing import Any, Dict, List, Optional
import re

class ChatbotService:
    def __init__(
        self,
        intent_service,
        company_repository,
        template_repository,
        template_engine,
        chatbot_repository=None,
        personality_repository=None,
        chat_message_service=None, 
        quick_reply_repository=None,
    ):
        self.intent_service = intent_service
        self.company_repository = company_repository
        self.template_repository = template_repository
        self.template_engine = template_engine
        self.chatbot_repository = chatbot_repository
        self.personality_repository = personality_repository
        self.chat_message_service = chat_message_service
        self.quick_reply_repository = quick_reply_repository

    # CHAT
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

        # Lightweight context retention: if the current message is ambiguous, try re-parsing with the
        # previous user message as context.
        if (
            (intent == "fallback" or confidence < 0.45)
            and session_id
            and chatbot
            and chatbot.bot_id
            and self.chat_message_service
            and hasattr(self.chat_message_service, "get_session_messages")
        ):
            try:
                history = self.chat_message_service.get_session_messages(
                    organisation_id=int(company_id),
                    chatbot_id=int(chatbot.bot_id),
                    session_id=session_id,
                    limit=12,
                )
                prev_user = None
                for m in reversed(history or []):
                    if getattr(m, "sender", None) == "user" and (getattr(m, "message", "") or "").strip():
                        prev_user = (getattr(m, "message", "") or "").strip()
                        break

                if prev_user and prev_user.strip().lower() != (message or "").strip().lower():
                    ctx_result = self.intent_service.parse(f"{prev_user}\n{message}")
                    ctx_intent = ctx_result.get("intent", "fallback")
                    ctx_conf = float(ctx_result.get("confidence", 0.0))
                    if ctx_intent != "fallback" and ctx_conf >= 0.45 and ctx_conf >= (confidence + 0.05):
                        intent = ctx_intent
                        confidence = ctx_conf
                        entities = ctx_result.get("entities", [])
            except Exception:
                # Never fail the chat call due to context logic.
                pass

        industry = (company or {}).get("industry", "default")

        # Intent refinement: for restaurants with a defined price range, answer pricing questions with the
        # more specific "price_range" template so users get the configured value.
        if industry == "restaurant" and intent == "pricing" and (company or {}).get("price_range"):
            intent = "price_range"

        # Avoid rendering templates with missing placeholders.
        if intent == "price_range" and not (company or {}).get("price_range"):
            intent = "pricing"
        if intent == "seating_capacity" and not (company or {}).get("seating_capacity"):
            intent = "contact_support"

        detected_language, lang_conf = self._detect_language(message)

        # Use detected language if confidence is high
        reply_language = detected_language if lang_conf >= 0.4 else "en"

        # Try detected language template
        template = self.template_repository.get_template(
            company_id=company_id,
            industry=industry,
            intent=intent,
            language=reply_language,
        )

        # Fallback to English if missing
        if not template:
            reply_language = "en"
            template = self.template_repository.get_template(
                company_id=company_id,
                industry=industry,
                intent=intent,
                language=reply_language,
            )

        reply = self.template_engine.render(
            template=template,
            company=company or {},
            entities=entities,
        )

        used_custom_welcome = False

        # Welcome override (e.g. user says "hi")
        if (
            chatbot
            and intent in ("greet", "greeting")
            and isinstance(chatbot.welcome_message, str)
            and chatbot.welcome_message.strip()
        ):
            reply = self.template_engine.render(
                template=chatbot.welcome_message,
                company=company or {},
                entities=entities,
            )
            used_custom_welcome = True

        # If the org provided a custom greeting, use it "as written" (no personality wrapping).
        if personality and not used_custom_welcome:
            reply = self._apply_personality(reply, personality.name, reply_language, intent=intent)

        # If the org provided a custom greeting, do not auto-add emojis; only strip if disallowed.
        if chatbot and chatbot.allow_emojis is False:
            reply = self._strip_emojis(reply)
        elif chatbot and chatbot.allow_emojis is True and not used_custom_welcome:
            reply = self._ensure_emoji(reply)

        quick_replies = self._quick_replies_for(company_id, industry, intent, reply_language)

        # Persist USER message
        self._save_chat_message(
            organisation_id=company_id,
            chatbot_id=chatbot.bot_id if chatbot else None,
            session_id=session_id,
            sender="user",
            sender_user_id=user_id,
            message=message,
            intent=intent,
        )

        # Persist BOT reply
        self._save_chat_message(
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
            "language": reply_language,
            "language_confidence": lang_conf,
            "detected_language": detected_language,
        }

    # WELCOME
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

        # Welcome is ALWAYS English
        language = "en"

        template = self.template_repository.get_template(
            company_id=company_id,
            industry=industry,
            intent="greet",
            language=language,
        )

        reply = self.template_engine.render(
            template=template,
            company=company or {},
            entities=[],
        )

        # Use the org-configured greeting (welcome_message) as the very first message in a session.
        # If it's empty/unset, fall back to the default greeting template above.
        used_custom_welcome = False
        if chatbot and isinstance(chatbot.welcome_message, str) and chatbot.welcome_message.strip():
            reply = self.template_engine.render(
                template=chatbot.welcome_message,
                company=company or {},
                entities=[],
            )
            used_custom_welcome = True

        # Apply personality using English language
        # If the org provided a custom greeting, use it "as written" (no personality wrapping).
        if personality and not used_custom_welcome:
            reply = self._apply_personality(reply, personality.name, language, intent="greet")

        # Emoji toggle
        # If the org provided a custom greeting, do not auto-add emojis; only strip if disallowed.
        if chatbot and chatbot.allow_emojis is False:
            reply = self._strip_emojis(reply)
        elif chatbot and chatbot.allow_emojis is True and not used_custom_welcome:
            reply = self._ensure_emoji(reply)
            
        if chatbot and session_id:
            self._save_chat_message(
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
            "quick_replies": self._quick_replies_for(
                company_id,
                industry,
                "greet",
                language,  # English quick replies for welcome
            ),
            "language": language,
            "language_confidence": 1.0,
        }

    # HELPERS
    def _save_chat_message(
        self,
        organisation_id: str | int,
        chatbot_id: Optional[int],
        session_id: Optional[str],
        sender: str,
        sender_user_id: Optional[int],
        message: str,
        intent: Optional[str],
    ) -> None:
        if not self.chat_message_service:
            return

        if not chatbot_id or not session_id:
            return

        self.chat_message_service.save_message(
            organisation_id=int(organisation_id),
            chatbot_id=chatbot_id,
            session_id=session_id,
            sender=sender,
            sender_user_id=sender_user_id,
            message=message or "",
            intent=intent,
        )

    def _quick_replies_for(self, company_id: str | int, industry: str, intent: str, language: str) -> List[str]:
        if not self.quick_reply_repository:
            return [
                "Business hours",
                "Location",
                "Pricing",
                "Contact support",
            ]

        return self.quick_reply_repository.get_quick_replies(
            company_id=company_id,
            industry=industry,
            intent=intent,
            language=language,
        )

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

    def _apply_personality(self, text: str, personality_name: str, language: str, intent: str | None = None) -> str:
        name = (personality_name or "").lower()
        language = (language or "en").lower()
        intent = (intent or "").lower()

        # Keep "personality" from becoming a repetitive opener like "Certainly." on every reply.
        personality_map = {
            "friendly": {
                "en": ("", " If you need a hand, just shout!"),
            },
            "professional": {
                "en": ("", " Please let me know if you need further assistance."),
            },
        }

        style = None
        if "friendly" in name or "casual" in name:
            style = "friendly"
        elif "professional" in name or "formal" in name:
            style = "professional"

        if not style:
            return text

        _prefix, suffix = personality_map.get(style, {}).get(language, personality_map[style]["en"])

        # Only add the closing line for intents where it helps.
        if intent in {"fallback", "contact_support"} and suffix:
            return f"{text}{suffix}"
        return text

    def _detect_language(self, text: str) -> tuple[str, float]:
        if not text:
            return "en", 0.0

        lower = text.lower()

        if re.search(r"[\u4e00-\u9fff]", text):
            return "zh", 0.99

        if re.search(r"[àâçéèêëîïôûùüÿœæ]", lower):
            return "fr", 0.85

        french_words = {
            "bonjour", "salut", "merci", "s'il", "vous", "aidez", "aide",
            "adresse", "prix", "tarif", "réservation", "reserver", "réserver",
            "heures", "ouverture", "fermeture",
        }

        tokens = re.findall(r"[a-zA-ZÀ-ÿ']+", lower)
        if tokens:
            hits = sum(1 for t in tokens if t in french_words)
            if hits >= 1:
                return "fr", 0.7

        return "en", 0.6
