class ManageOrgRoles:

    def __init__(self, role_repo, user_repo, permission_repo):
        self.role_repo = role_repo
        self.user_repo = user_repo
        self.permission_repo = permission_repo

    def list_roles(self, organisation_id: int):
        return self.role_repo.get_by_organisation(organisation_id)


    def create_role(self, organisation_id: int, name: str, description: str | None):

        if not organisation_id:
            raise ValueError("organisation_id is required")

        if not name or not name.strip():
            raise ValueError("Role name cannot be empty")

        name = name.strip()

        existing = self.role_repo.get_by_name(organisation_id, name)
        if existing:
            raise ValueError("Role name already exists in this organisation")

        return self.role_repo.create(
            organisation_id=organisation_id,
            name=name,
            description=description,
            is_default=False,
        )


    def update_role(self, org_role_id: int, name: str | None, description: str | None):

        role = self.role_repo.get_by_id(org_role_id)

        if not role:
            raise ValueError("Role not found")

        protected_roles = ["STAFF", "ORG_ADMIN"]

        # Prevent renaming protected roles
        if name is not None:
            if role.is_default or role.name.upper() in protected_roles:
                raise ValueError(f"{role.name} role cannot be renamed")

            if not name.strip():
                raise ValueError("Role name cannot be empty")

            name = name.strip()

            existing = self.role_repo.get_by_name(role.organisation_id, name)

            if existing and existing.org_role_id != role.org_role_id:
                raise ValueError("Role name already exists in this organisation")

            role.name = name

        if description is not None:
            role.description = description

        return self.role_repo.update(role)


    def delete_role(self, org_role_id: int):

        role = self.role_repo.get_by_id(org_role_id)

        if not role:
            raise ValueError("Role not found")

        protected_roles = ["STAFF", "ORG_ADMIN"]

        if role.is_default or role.name.upper() in protected_roles:
            raise ValueError(f"{role.name} role cannot be deleted")

        # STAFF fallback role
        staff_role = self.role_repo.get_by_name(
            role.organisation_id,
            "STAFF"
        )

        if not staff_role:
            raise RuntimeError("STAFF role not found for organisation")

        # Reassign users
        self.user_repo.reassign_users_role(
            from_role_id=org_role_id,
            to_role_id=staff_role.org_role_id
        )

        # Remove permission mapping
        self.permission_repo.delete_by_role(org_role_id)

        # Delete role
        self.role_repo.delete(role)