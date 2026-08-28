from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from extensions import db
from models.remittance import Remittance
from models.user import User
from models.vehicle import Vehicle
from schemas.vehicle_schema import vehicle_create_schema, vehicle_schema, vehicle_update_schema, vehicles_schema

vehicle_bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")


def _can_access_vehicle(user, vehicle):
	"""Fleet owners can access vehicles they own. Drivers can access a vehicle
	once they have submitted at least one remittance against it, since vehicles
	no longer carry a fixed driver assignment."""
	if user.role == "owner":
		return vehicle.fleet_owner_id == user.id
	if user.role == "driver":
		return Remittance.query.filter_by(vehicle_id=vehicle.id, driver_id=user.id).first() is not None
	return False


@vehicle_bp.get("")
@jwt_required()
def list_vehicles():
	user_id = int(get_jwt_identity())
	user = db.session.get(User, user_id)
	if user is None:
		return jsonify(message="User not found"), 404
	if user.role != "owner":
		return jsonify(message="Only owners can list fleet vehicles"), 403
	vehicles = Vehicle.query.filter_by(fleet_owner_id=user_id).order_by(Vehicle.id).all()
	return jsonify(vehicles=vehicles_schema.dump(vehicles))


@vehicle_bp.post("")
@jwt_required()
def create_vehicle():
	user_id = int(get_jwt_identity())
	user = db.session.get(User, user_id)
	if user is None:
		return jsonify(message="User not found"), 404
	if user.role != "owner":
		return jsonify(message="Only owners can add vehicles"), 403
	try:
		data = vehicle_create_schema.load(request.get_json(silent=True) or {})
	except ValidationError as error:
		return jsonify(message="Invalid vehicle data", errors=error.messages), 400
	if Vehicle.query.filter_by(plate_number=data["plate_number"]).first():
		return jsonify(message="plate_number is already registered"), 409
	vehicle = Vehicle(
		plate_number=data["plate_number"],
		vehicle_type=data["vehicle_type"],
		fleet_owner_id=user_id,
		is_active=data.get("is_active", True),
	)
	db.session.add(vehicle)
	db.session.commit()
	return jsonify(vehicle=vehicle_schema.dump(vehicle)), 201


@vehicle_bp.get("/<int:vehicle_id>")
@jwt_required()
def get_vehicle(vehicle_id):
	user_id = int(get_jwt_identity())
	user = db.session.get(User, user_id)
	if user is None:
		return jsonify(message="User not found"), 404
	vehicle = db.session.get(Vehicle, vehicle_id)
	if vehicle is None:
		return jsonify(message="Vehicle not found"), 404
	if not _can_access_vehicle(user, vehicle):
		return jsonify(message="You do not have access to this vehicle"), 403
	return jsonify(vehicle=vehicle_schema.dump(vehicle))


@vehicle_bp.patch("/<int:vehicle_id>")
@jwt_required()
def update_vehicle(vehicle_id):
	user_id = int(get_jwt_identity())
	vehicle = db.session.get(Vehicle, vehicle_id)
	if vehicle is None:
		return jsonify(message="Vehicle not found"), 404
	if vehicle.fleet_owner_id != user_id:
		return jsonify(message="Only the owning fleet owner can update this vehicle"), 403
	try:
		data = vehicle_update_schema.load(request.get_json(silent=True) or {})
	except ValidationError as error:
		return jsonify(message="Invalid vehicle data", errors=error.messages), 400
	if not data:
		return jsonify(message="At least one vehicle field is required"), 400
	if "plate_number" in data:
		existing = Vehicle.query.filter(Vehicle.plate_number == data["plate_number"], Vehicle.id != vehicle_id).first()
		if existing:
			return jsonify(message="plate_number is already registered"), 409
	for field, value in data.items():
		setattr(vehicle, field, value)
	db.session.commit()
	return jsonify(vehicle=vehicle_schema.dump(vehicle))


@vehicle_bp.delete("/<int:vehicle_id>")
@jwt_required()
def delete_vehicle(vehicle_id):
	user_id = int(get_jwt_identity())
	vehicle = db.session.get(Vehicle, vehicle_id)
	if vehicle is None:
		return jsonify(message="Vehicle not found"), 404
	if vehicle.fleet_owner_id != user_id:
		return jsonify(message="Only the owning fleet owner can remove this vehicle"), 403
	has_remittances = Remittance.query.filter_by(vehicle_id=vehicle_id).first() is not None
	if has_remittances:
		return jsonify(
			message="Cannot delete a vehicle with remittance history. Mark it inactive instead."
		), 409
	db.session.delete(vehicle)
	db.session.commit()
	return "", 204