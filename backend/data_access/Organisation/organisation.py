from backend import db
from backend.models import Organisation


class OrganisationRepository:
    def get_by_id(self, organisation_id: int) -> Organisation | None:
        return db.session.get(Organisation, organisation_id)

    def update(self, organisation: Organisation):
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
