from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from extensions import db
from models.fleet_owner import FleetOwner
from models.user import User
from schemas.fleet_owner_schema import FleetOwnerSchema


fleet_owner_bp = Blueprint(
	"fleet_owners",
	__name__,
	url_prefix="/api/fleet-owner",
)

fleet_owner_schema = FleetOwnerSchema()


def get_current_fleet_owner():
	user = db.session.get(User, int(get_jwt_identity()))
	if user is None:
		return None, (jsonify(message="User not found"), 404)

	fleet_owner = db.session.get(FleetOwner, user.fleet_owner_id)
	if fleet_owner is None:
		return None, (jsonify(message="Fleet owner account not found"), 404)

	return fleet_owner, None


@fleet_owner_bp.get("")
@jwt_required()
def get_fleet_owner():
	fleet_owner, error = get_current_fleet_owner()
	if error:
		return error

	return jsonify(fleet_owner=fleet_owner_schema.dump(fleet_owner))


@fleet_owner_bp.patch("")
@jwt_required()
def update_fleet_owner():
	fleet_owner, error = get_current_fleet_owner()
	if error:
		return error

	try:
		data = fleet_owner_schema.load(
			request.get_json(silent=True) or {},
			partial=True,
		)
	except ValidationError as validation_error:
		return jsonify(
			message="Invalid fleet owner data",
			errors=validation_error.messages,
		), 400

	if not data:
		return jsonify(message="At least one fleet owner field is required"), 400

	for field, value in data.items():
		setattr(fleet_owner, field, value)

	db.session.commit()
	return jsonify(fleet_owner=fleet_owner_schema.dump(fleet_owner))


@fleet_owner_bp.delete("")
@jwt_required()
def delete_fleet_owner():
	fleet_owner, error = get_current_fleet_owner()
	if error:
		return error

	if fleet_owner.users:
		return jsonify(
			message="Cannot delete a fleet owner account with attached users"
		), 409

	db.session.delete(fleet_owner)
	db.session.commit()
	return "", 204
