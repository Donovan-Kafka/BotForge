class ManageOrgRoles:

    def __init__(self, role_repo):
        self.role_repo = role_repo

    def list_roles(self, organisation_id: int):
        return self.role_repo.get_by_organisation(organisation_id)

    def create_role(self, organisation_id: int, name: str, description: str | None):
        if not organisation_id:
            raise ValueError("organisation_id is required")

        if not name or not name.strip():
            raise ValueError("Role name cannot be empty")

        name = name.strip()

        # Ensure uniqueness at service level
        existing = self.role_repo.get_by_name(organisation_id, name)
        if existing:
            raise ValueError("Role name already exists in this organisation")

        return self.role_repo.create(
            organisation_id=organisation_id,
            name=name,
            description=description
        )

    def update_role(self, org_role_id: int, name: str | None, description: str | None):
        role = self.role_repo.get_by_id(org_role_id)
        if not role:
            raise ValueError("Role not found")

        if name is not None:
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

        self.role_repo.delete(role)
