from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from backend.data_access.Organisation.orgRoles import OrgRoleRepository
from backend.application.Organisation.orgRoles import ManageOrgRoles

org_roles_bp = Blueprint("org_roles", __name__, url_prefix="/api/org-roles")


@org_roles_bp.get("/")
def list_roles():
    organisation_id = request.args.get("organisation_id", type=int)
    if not organisation_id:
        return {"error": "organisation_id is required"}, 400

    repo = OrgRoleRepository()
    service = ManageOrgRoles(repo)

    roles = service.list_roles(organisation_id)

    return jsonify([
        {
            "id": r.org_role_id,
            "name": r.name,
            "description": r.description
        }
        for r in roles
    ]), 200


@org_roles_bp.post("/")
def create_role():
    data = request.get_json()
    if not data:
        return {"error": "Request body is required"}, 400

    if "organisation_id" not in data or "name" not in data:
        return {"error": "organisation_id and name are required"}, 400

    repo = OrgRoleRepository()
    service = ManageOrgRoles(repo)

    try:
        role = service.create_role(
            organisation_id=data["organisation_id"],
            name=data["name"],
            description=data.get("description")
        )
    except ValueError as e:
        return {"error": str(e)}, 400
    except IntegrityError:
        return {"error": "Role name already exists in this organisation"}, 409

    return jsonify({
        "id": role.org_role_id,
        "name": role.name,
        "description": role.description
    }), 201


@org_roles_bp.put("/<int:org_role_id>")
def update_role(org_role_id):
    data = request.get_json()
    if not data:
        return {"error": "Request body is required"}, 400

    repo = OrgRoleRepository()
    service = ManageOrgRoles(repo)

    try:
        role = service.update_role(
            org_role_id=org_role_id,
            name=data.get("name"),
            description=data.get("description")
        )
    except ValueError as e:
        return {"error": str(e)}, 400
    except IntegrityError:
        return {"error": "Role name already exists in this organisation"}, 409

    return jsonify({
        "id": role.org_role_id,
        "name": role.name,
        "description": role.description
    }), 200


@org_roles_bp.delete("/<int:org_role_id>")
def delete_role(org_role_id):
    repo = OrgRoleRepository()
    service = ManageOrgRoles(repo)

    try:
        service.delete_role(org_role_id)
    except ValueError as e:
        return {"error": str(e)}, 404

    return jsonify({"message": "Role deleted"}), 200
