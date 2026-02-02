from __init__ import db
from models import AppUser, OrgRole
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash


class UserRepository:

    # ---------- READ ----------

    def get_by_id(self, user_id: int) -> AppUser | None:
        return db.session.get(AppUser, user_id)

    def get_by_organisation(self, organisation_id: int):
        return (
            AppUser.query
            .filter(
                AppUser.organisation_id == organisation_id,
                AppUser.status == True  # hide users with status = False
            )
            .all()
        )

    def get_org_role(self, role_id: int) -> OrgRole | None:
        return db.session.get(OrgRole, role_id)

    def get_active_app_users(self):
        return (
            AppUser.query
            .filter(
                AppUser.status.is_(True),
                AppUser.system_role_id.is_(None)
            )
            .all()
    )

    # ---------- UPDATE (Organisation role update.) ----------

    def update_org_role(
        self,
        user_id: int,
        organisation_id: int,
        new_org_role_id: int
    ) -> AppUser:

        user = self.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if user.organisation_id != organisation_id:
            raise ValueError("Organisation mismatch")

        user.org_role_id = new_org_role_id

        try:
            db.session.commit()
            db.session.refresh(user)
            return user
        except Exception:
            db.session.rollback()
            raise

    # ---------- UPDATE (For manage account) ----------

    def update_profile(self, user: AppUser) -> AppUser:
        try:
            db.session.commit()
            db.session.refresh(user)
            return user
        except IntegrityError:
            db.session.rollback()
            raise

    def update_password(self, user: AppUser, new_password: str):
        user.password = generate_password_hash(new_password)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    # ---------- SOFT DELETE ----------

    def soft_delete_user(self, user: AppUser):
        """
        Soft delete by changing status to False
        """
        user.status = False
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        
    # ---------- ROLE USER REASSIGNMENT ----------   
    def reassign_users_role(
        self,
        from_role_id: int,
        to_role_id: int
    ):
        """
        Reassign all users from one org role to another.
        Used when deleting a custom role.
        """
        (
            db.session.query(AppUser)
            .filter(AppUser.org_role_id == from_role_id)
            .update(
                {AppUser.org_role_id: to_role_id},
                synchronize_session=False
            )
        )

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
