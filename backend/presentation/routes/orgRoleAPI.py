from flask import Blueprint, jsonify, request
from backend.data_access.Organisation.orgRoles import OrganisationRoleRepository
from backend.data_access.Organisation.orgRolePermissions import OrgRolePermissionRepository
from backend.data_access.Users.users import UserRepository
from backend.application.Organisation.orgRoles import ManageRolesUseCase
from backend.application.Organisation.orgRolePermissions import ManagePermissionsUseCase

org_role_bp = Blueprint("org_role_bp", __name__, url_prefix="/api/org")

@org_role_bp.get("/<int:org_id>/roles")
def list_roles(org_id):
    """List all roles for an organisation"""
    repo = OrganisationRoleRepository()
    roles = repo.get_by_org_id(org_id)
    return jsonify({"ok": True, "roles": [r.to_dict() for r in roles]}), 200

@org_role_bp.post("/roles")
def create_role():
    """Create a new role with permissions"""
    data = request.get_json()
    org_id = data.get("organisation_id")
    name = data.get("name")
    permissions = data.get("permissions", []) # List of permission keys strings

    if not org_id or not name:
        return jsonify({"ok": False, "error": "Missing org_id or name"}), 400

    role_repo = OrganisationRoleRepository()
    perm_repo = OrgRolePermissionRepository()
    
    # 1. Create Role
    role = role_repo.create(org_id, name, data.get("description", ""))
    
    # 2. Assign Permissions
    if role and permissions:
        perm_repo.update_role_permissions(role.role_id, permissions)

    return jsonify({"ok": True, "role": role.to_dict()}), 201

@org_role_bp.put("/roles/<int:role_id>")
def update_role(role_id):
    """Update role details and permissions"""
    data = request.get_json()
    role_repo = OrganisationRoleRepository()
    perm_repo = OrgRolePermissionRepository()

    # Update basic info
    role = role_repo.get_by_id(role_id)
    if not role:
        return jsonify({"ok": False, "error": "Role not found"}), 404

    if "name" in data:
        role.name = data["name"]
    if "description" in data:
        role.description = data["description"]
    role_repo.update(role)

    # Update permissions if provided
    if "permissions" in data:
        perm_repo.update_role_permissions(role_id, data["permissions"])

    return jsonify({"ok": True, "message": "Role updated"}), 200

@org_role_bp.get("/permissions/list")
def list_permissions():
    """Return hardcoded list of available system permissions"""
    # In a real app, this might come from a DB or a constant file
    permissions = [
        {"key": "chatbot.manage", "label": "Manage Chatbots"},
        {"key": "staff.manage", "label": "Manage Staff"},
        {"key": "billing.manage", "label": "Manage Billing"},
        {"key": "analytics.view", "label": "View Analytics"},
    ]
    return jsonify({"ok": True, "permissions": permissions}), 200

@org_role_bp.post("/staff/assign-role")
def assign_user_role():
    """Assign a specific role to a user"""
    data = request.get_json()
    user_id = data.get("user_id")
    role_id = data.get("role_id")

    user_repo = UserRepository()
    user = user_repo.get_by_id(user_id)
    if not user:
        return jsonify({"ok": False, "error": "User not found"}), 404

    user.role_id = role_id
    user_repo.update(user)

    return jsonify({"ok": True, "message": "Role assigned successfully"}), 200
