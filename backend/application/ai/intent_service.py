# What it does:

# Sends user text to Rasa

# Receives:

# intent (e.g. business_hours)

# entities (e.g. date, time, pax)

from typing import Any, Dict, List, Tuple


class IntentService:
    """
    Simple intent detection service (keyword-based for now).

    Later, you can swap the implementation to call Rasa NLU,
    but this class interface stays the same:
        parse(message) -> (intent, entities)
    """

    def parse(self, message: str) -> Tuple[str, List[Dict[str, Any]]]:
        text = (message or "").lower().strip()

        if not text:
            return "fallback", []

        # Very simple rules (starter)
        if any(k in text for k in ["hi", "hello", "hey", "good morning", "good evening"]):
            return "greeting", []

        if any(k in text for k in ["open", "opening", "close", "closing", "hours", "time"]):
            return "business_hours", []

        if any(k in text for k in ["price", "pricing", "cost", "fee", "plan", "subscription"]):
            return "pricing", []

        if any(k in text for k in ["book", "booking", "reserve", "reservation", "appointment"]):
            return "booking", []

        if any(k in text for k in ["where", "location", "address", "how to get there"]):
            return "location", []

        if any(k in text for k in ["contact", "email", "phone", "call", "support", "helpdesk"]):
            return "contact_support", []

        # Default fallback
        return "fallback", []