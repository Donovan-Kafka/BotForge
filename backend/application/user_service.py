from models import AppUser, OrgRole
from data_access.Users.users import UserRepository


class UserService:

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_users_by_organisation(self, organisation_id: int):
        return self.user_repo.get_by_organisation(organisation_id)

    def change_user_org_role(
        self,
        *,
        target_user_id: int,
        new_org_role_id: int
    ) -> AppUser:

        user = self.user_repo.get_by_id(target_user_id)
        if not user:
            raise ValueError("User not found")

        role = self.user_repo.get_org_role(new_org_role_id)
        if not role:
            raise ValueError("Role not found")

        # Minimal correctness: role must belong to same org
        if role.organisation_id != user.organisation_id:
            raise ValueError("Role does not belong to user's organisation")

        return self.user_repo.update_org_role(
            user_id=user.user_id,
            organisation_id=user.organisation_id,
            new_org_role_id=new_org_role_id
        )
