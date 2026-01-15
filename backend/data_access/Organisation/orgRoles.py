from backend import db
from backend.models import OrgRole
from sqlalchemy.exc import IntegrityError


class OrgRoleRepository:

    # create
    def create(self, organisation_id: int, name: str, description: str | None):
        role = OrgRole(
            organisation_id=organisation_id,
            name=name,
            description=description
        )
        try:
            db.session.add(role)
            db.session.commit()
            db.session.refresh(role)
            return role
        except IntegrityError:
            db.session.rollback()
            raise

    # read all roles from an organisation
    def get_by_organisation(self, organisation_id: int):
        return (
            OrgRole.query
            .filter(OrgRole.organisation_id == organisation_id)
            .order_by(OrgRole.name.asc())
            .all()
        )

    # read role by id
    def get_by_id(self, org_role_id: int):
        return db.session.get(OrgRole, org_role_id)

    # read role by name within an organisation
    def get_by_name(self, organisation_id: int, name: str):
        return (
            OrgRole.query
            .filter(
                OrgRole.organisation_id == organisation_id,
                OrgRole.name == name
            )
            .first()
        )

    # update role
    def update(self, role: OrgRole):
        try:
            db.session.commit()
            db.session.refresh(role)
            return role
        except IntegrityError:
            db.session.rollback()
            raise

    # delete role
    def delete(self, role: OrgRole):
        db.session.delete(role)
        db.session.commit()
