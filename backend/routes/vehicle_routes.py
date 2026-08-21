"""Vehicle routes for FleetPesa.

Endpoints (all require a valid JWT unless noted):

    GET    /api/vehicles              List vehicles for the current owner
                                       (drivers get only their assigned vehicle)
    POST   /api/vehicles              Create a vehicle (owner only)
    GET    /api/vehicles/<id>         Get a single vehicle
    PATCH  /api/vehicles/<id>         Update a vehicle (owner only)
    DELETE /api/vehicles/<id>         Delete a vehicle (owner only)

All responses are JSON. Errors use {"error": "..."} with an appropriate
HTTP status code.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from extensions import db
from models.user import User
from models.vehicle import Vehicle, VehicleStatus
from schemas.vehicle_schema import VehicleSchema

vehicle_bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")

vehicle_schema = VehicleSchema()
vehicle_update_schema = VehicleSchema(partial=True)
vehicles_schema = VehicleSchema(many=True)


def _current_user():
    user_id = get_jwt_identity()
    return User.query.get(user_id)


def _owns_vehicle(user, vehicle):
    return user.role == "owner" and vehicle.owner_id == user.id


def _is_assigned_driver(user, vehicle):
    return user.role == "driver" and vehicle.driver_id == user.id


@vehicle_bp.get("")
@jwt_required()
def list_vehicles():
    user = _current_user()
    if user is None:
        return jsonify(error="User not found"), 404

    if user.role == "owner":
        vehicles = Vehicle.query.filter_by(owner_id=user.id).order_by(
            Vehicle.created_at.desc()
        )
    elif user.role == "driver":
        vehicles = Vehicle.query.filter_by(driver_id=user.id)
    else:
        return jsonify(error="Unrecognized role"), 403

    return jsonify(vehicles_schema.dump(vehicles)), 200


@vehicle_bp.post("")
@jwt_required()
def create_vehicle():
    user = _current_user()
    if user is None:
        return jsonify(error="User not found"), 404
    if user.role != "owner":
        return jsonify(error="Only owners can add vehicles"), 403

    payload = request.get_json(silent=True) or {}

    try:
        data = vehicle_schema.load(payload)
    except ValidationError as err:
        return jsonify(error="Validation failed", details=err.messages), 400

    if Vehicle.query.filter_by(plate_number=data["plate_number"]).first():
        return jsonify(error="A vehicle with that plate number already exists"), 409

    vehicle = Vehicle(
        plate_number=data["plate_number"],
        make=data["make"],
        model=data["model"],
        year=data.get("year"),
        color=data.get("color"),
        status=data.get("status", VehicleStatus.ACTIVE),
        daily_target=data.get("daily_target", 0),
        owner_id=user.id,
        driver_id=data.get("driver_id"),
    )

    db.session.add(vehicle)
    db.session.commit()

    return jsonify(vehicle_schema.dump(vehicle)), 201


@vehicle_bp.get("/<int:vehicle_id>")
@jwt_required()
def get_vehicle(vehicle_id):
    user = _current_user()
    if user is None:
        return jsonify(error="User not found"), 404

    vehicle = Vehicle.query.get(vehicle_id)
    if vehicle is None:
        return jsonify(error="Vehicle not found"), 404

    if not (_owns_vehicle(user, vehicle) or _is_assigned_driver(user, vehicle)):
        return jsonify(error="Not authorized to view this vehicle"), 403

    return jsonify(vehicle_schema.dump(vehicle)), 200


@vehicle_bp.patch("/<int:vehicle_id>")
@jwt_required()
def update_vehicle(vehicle_id):
    user = _current_user()
    if user is None:
        return jsonify(error="User not found"), 404

    vehicle = Vehicle.query.get(vehicle_id)
    if vehicle is None:
        return jsonify(error="Vehicle not found"), 404

    if not _owns_vehicle(user, vehicle):
        return jsonify(error="Only the owning owner can update this vehicle"), 403

    payload = request.get_json(silent=True) or {}

    try:
        data = vehicle_update_schema.load(payload)
    except ValidationError as err:
        return jsonify(error="Validation failed", details=err.messages), 400

    if "plate_number" in data and data["plate_number"] != vehicle.plate_number:
        clash = Vehicle.query.filter_by(plate_number=data["plate_number"]).first()
        if clash:
            return jsonify(error="A vehicle with that plate number already exists"), 409

    if "status" in data and data["status"] not in VehicleStatus.ALL:
        return jsonify(error=f"status must be one of {VehicleStatus.ALL}"), 400

    for field in (
        "plate_number",
        "make",
        "model",
        "year",
        "color",
        "status",
        "daily_target",
        "driver_id",
    ):
        if field in data:
            setattr(vehicle, field, data[field])

    db.session.commit()

    return jsonify(vehicle_schema.dump(vehicle)), 200


@vehicle_bp.delete("/<int:vehicle_id>")
@jwt_required()
def delete_vehicle(vehicle_id):
    user = _current_user()
    if user is None:
        return jsonify(error="User not found"), 404

    vehicle = Vehicle.query.get(vehicle_id)
    if vehicle is None:
        return jsonify(error="Vehicle not found"), 404

    if not _owns_vehicle(user, vehicle):
        return jsonify(error="Only the owning owner can delete this vehicle"), 403

    db.session.delete(vehicle)
    db.session.commit()

    return jsonify(message="Vehicle deleted"), 200