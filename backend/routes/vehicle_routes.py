from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError
from flask_restful import Resource

from extensions import db
from models.user import User
from models.vehicle import Vehicle
from schemas.vehicle_schema import vehicle_create_schema, vehicle_schema, vehicle_update_schema, vehicles_schema

vehicle_bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")





class VehicleResource(Resource):

    @jwt_required()
    def get(self, vehicle_id):
        user_id = int(get_jwt_identity())

        vehicle = db.session.get(Vehicle, vehicle_id)

        if vehicle is None:
            return {"message": "Vehicle not found"}, 404

        if vehicle.owner_id != user_id and vehicle.driver_id != user_id:
            return {"message": "You do not have access to this vehicle"}, 403

        return {
            "vehicle": vehicle_schema.dump(vehicle)
        }, 200


@vehicle_bp.patch("/<int:vehicle_id>")
@jwt_required()
def update_vehicle(vehicle_id):
	user_id = int(get_jwt_identity())
	vehicle = db.session.get(Vehicle, vehicle_id)
	if vehicle is None:
		return jsonify(message="Vehicle not found"), 404
	if vehicle.owner_id != user_id:
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
	if "driver_id" in data and data["driver_id"] is not None:
		driver = db.session.get(User, data["driver_id"])
		if driver is None or driver.role != "driver":
			return jsonify(message="driver_id must reference an existing driver"), 400
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
	if vehicle.owner_id != user_id:
		return jsonify(message="Only the owning fleet owner can remove this vehicle"), 403
	db.session.delete(vehicle)
	db.session.commit()
	return "", 204
