from backend import db
from backend.models import OrgRolePermission, OrgPermission


class OrgRolePermissionRepository:

    def delete_by_role(self, org_role_id: int):
        (
            OrgRolePermission.query
            .filter(OrgRolePermission.org_role_id == org_role_id)
            .delete()
        )
        db.session.commit()

    def add_permissions(self, org_role_id: int, permission_ids: list[int]):
        for perm_id in permission_ids:
            db.session.add(
                OrgRolePermission(
                    org_role_id=org_role_id,
                    org_permission_id=perm_id
                )
            )
        db.session.commit()

    def get_permission_ids(self, org_role_id: int) -> list[int]:
        rows = (
            db.session.query(OrgRolePermission.org_permission_id)
            .filter(OrgRolePermission.org_role_id == org_role_id)
            .all()
        )
        return [r[0] for r in rows]

    def get_permissions_by_codes(self, codes: list[str]) -> list[int]:
        rows = (
            db.session.query(OrgPermission.org_permission_id)
            .filter(OrgPermission.code.in_(codes))
            .all()
        )
        return [r[0] for r in rows]
