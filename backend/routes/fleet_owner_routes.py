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
