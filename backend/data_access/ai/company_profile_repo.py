# What it does:

# Fetches company info:

# industry

# hours

# services

# contact info

# This is what the chatbot “knows”

class CompanyProfileRepository:
    """
    Data access layer for company profile information.

    For now, this is a stub (hardcoded data) so the chatbot
    can be tested without depending on the real database.

    Later, you can replace this with real SQLAlchemy queries.
    """

    def get_company_profile(self, company_id: str):
        # TEMPORARY STUB DATA
        # This simulates company-specific "memory"
        if not company_id:
            return None

        return {
            "company_id": company_id,
            "company_name": "Demo Company",
            "industry": "restaurant",  # change to 'education' to test
            "business_hours": "10am–10pm",
            "location": "Singapore",
            "contact_email": "support@demo.com",
            "contact_phone": "+65 6123 4567"
        }