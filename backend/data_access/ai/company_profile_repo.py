from backend import db
from backend.models import (
    Organisation,
    OrganisationRestaurant,
    OrganisationEducation,
    OrganisationRetail,
)


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

        # Convert SQLAlchemy model -> dictionary (including subtype)
        return self._to_dict(organisation)

    # -------------------------------------------------------------------
    # Helper: Converts Organisation model into data usable by templates
    # -------------------------------------------------------------------
    def _to_dict(self, org: Organisation):
        # Normalize industry for downstream template lookup
        industry_raw = (org.industry or "").strip().lower()
        industry_map = {
            "f&b": "restaurant",
            "restaurant": "restaurant",
            "education": "education",
            "retail": "retail",
        }
        industry = industry_map.get(industry_raw, industry_raw)

        data = {
            "organisation_id": org.organisation_id,
            "company_name": org.name,
            "industry": industry,

            # Common
            "description": org.description,
            "location": org.location,
            "city": org.city,
            "country": org.country,
            "contact_email": org.contact_email,
            "contact_phone": org.contact_phone,
            "website_url": org.website_url,
            "business_hours": org.business_hours,

            # Industry-specific fields are loaded from subtype tables below.
        }

        if industry == "restaurant":
            r = OrganisationRestaurant.query.get(org.organisation_id)
            if r:
                data.update({
                    "cuisine_type": r.cuisine_type,
                    "restaurant_style": r.restaurant_style,
                    "dining_options": r.dining_options,
                    "supports_reservations": r.supports_reservations,
                    "reservation_link": r.reservation_link,
                    "price_range": r.price_range,
                    "seating_capacity": r.seating_capacity,
                    "specialties": r.specialties,
                })

        elif industry == "education":
            e = OrganisationEducation.query.get(org.organisation_id)
            if e:
                data.update({
                    "institution_type": e.institution_type,
                    "target_audience": e.target_audience,
                    "course_types": e.course_types,
                    "delivery_mode": e.delivery_mode,
                    "intake_periods": e.intake_periods,
                    "application_link": e.application_link,
                    "response_time": e.response_time,
                    "key_programs": e.key_programs,
                })

        elif industry == "retail":
            r = OrganisationRetail.query.get(org.organisation_id)
            if r:
                data.update({
                    "retail_type": r.retail_type,
                    "product_categories": r.product_categories,
                    "has_physical_store": r.has_physical_store,
                    "has_online_store": r.has_online_store,
                    "online_store_url": r.online_store_url,
                    "delivery_options": r.delivery_options,
                    "return_policy": r.return_policy,
                    "warranty_info": r.warranty_info,
                    "payment_methods": r.payment_methods,
                    "promotions_note": r.promotions_note,
                })

        return data
