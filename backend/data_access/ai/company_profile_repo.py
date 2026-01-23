from backend import db
from backend.models import Organisation


class CompanyProfileRepository:
    """
    Repository responsible for fetching organisation (company) profiling
    data used by the chatbot and admin UI.
    """

    def get_company_profile(self, organisation_id: int | str):
        """
        Returns a dictionary of all organisation fields needed for
        template rendering. Returns None if organisation does not exist.
        """

        if not organisation_id:
            return None

        # Ensure organisation_id is an integer
        try:
            org_id = int(organisation_id)
        except (TypeError, ValueError):
            return None

        organisation = db.session.get(Organisation, org_id)

        if not organisation:
            return None

        # Convert SQLAlchemy model -> dictionary
        return self._to_dict(organisation)

    # -------------------------------------------------------------------
    # Helper: Converts Organisation model into data usable by templates
    # -------------------------------------------------------------------
    def _to_dict(self, org: Organisation):
        return {
            "organisation_id": org.organisation_id,
            "company_name": org.name,
            "industry": org.industry,

            # Common
            "description": org.description,
            "location": org.location,
            "city": org.city,
            "country": org.country,
            "contact_email": org.contact_email,
            "contact_phone": org.contact_phone,
            "website_url": org.website_url,
            "business_hours": org.business_hours,

            # Restaurant
            "cuisine_type": org.cuisine_type,
            "restaurant_style": org.restaurant_style,
            "dining_options": org.dining_options,
            "supports_reservations": org.supports_reservations,
            "reservation_link": org.reservation_link,
            "price_range": org.price_range,
            "seating_capacity": org.seating_capacity,
            "specialties": org.specialties,

            # Education
            "institution_type": org.institution_type,
            "target_audience": org.target_audience,
            "course_types": org.course_types,
            "delivery_mode": org.delivery_mode,
            "intake_periods": org.intake_periods,
            "application_link": org.application_link,
            "response_time": org.response_time,
            "key_programs": org.key_programs,

            # Retail
            "retail_type": org.retail_type,
            "product_categories": org.product_categories,
            "has_physical_store": org.has_physical_store,
            "has_online_store": org.has_online_store,
            "online_store_url": org.online_store_url,
            "delivery_options": org.delivery_options,
            "return_policy": org.return_policy,
            "warranty_info": org.warranty_info,
            "payment_methods": org.payment_methods,
            "promotions_note": org.promotions_note,
        }
