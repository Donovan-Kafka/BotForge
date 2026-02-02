class ManageOrgRolePermissions:

    def __init__(self, role_repo, permission_repo):
        self.role_repo = role_repo
        self.permission_repo = permission_repo

    def assign_permissions(self, org_role_id: int, permission_ids: list[int]):
        if not org_role_id:
            raise ValueError("org_role_id is required")

        role = self.role_repo.get_by_id(org_role_id)
        if not role:
            raise ValueError("Role not found")

        if role.is_default:
            raise ValueError("Permissions of default roles cannot be modified")

        if not permission_ids:
            raise ValueError("At least one permission is required")

        if not all(isinstance(pid, int) for pid in permission_ids):
            raise ValueError("permission_ids must be integers")

        self.permission_repo.delete_by_role(org_role_id)
        self.permission_repo.add_permissions(org_role_id, permission_ids)

        return {
            "org_role_id": org_role_id,
            "permission_ids": permission_ids
        }