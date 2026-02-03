import re
from typing import Dict, List, Any


class TemplateEngine:
    """
    Renders response templates by injecting company data and entities.

    Example template:
        "We are open from {{business_hours}} at {{location}}."

    Company data:
        { "business_hours": "10am–10pm", "location": "Singapore" }
    """

    VARIABLE_PATTERN = re.compile(r"\{\{\s*(.*?)\s*\}\}")

    def render(self, template: str, company: Dict[str, Any], entities: List[Dict[str, Any]]):
        if not template:
            return "Sorry, I don't have an answer for that yet."

        if not company:
            return template

        def replace_var(match):
            key = match.group(1)

            # Replace from company profile
            if key in company and company[key] is not None:
                return str(company[key])

            # Replace from extracted entities (future use)
            for entity in entities:
                if entity.get("entity") == key:
                    return str(entity.get("value"))

            # Fallback if missing
            return f"<{key}>"

        return self.VARIABLE_PATTERN.sub(replace_var, template)