from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource
from marshmallow import ValidationError

from extensions import db
from models.driver_assignment import DriverAssignment
from models.user import User
from models.vehicle import Vehicle
from schemas.vehicle_schema import (
	vehicle_create_schema,
	vehicle_schema,
	vehicle_update_schema,
	vehicles_schema,
)

from utils.access_control import _can_access_vehicle


def _current_user():
	return db.session.get(User, int(get_jwt_identity()))


class VehicleList(Resource):
	@jwt_required()
	def get(self):
		user = _current_user()
		if user is None:
			return {"message": "User not found"}, 404
		if user.role == "owner":
			query = Vehicle.query.filter_by(
				fleet_owner_id=user.fleet_owner_id,
				is_active=True,
			).order_by(Vehicle.id)
		else:
			query = (
				Vehicle.query
				.join(DriverAssignment)
				.filter(
					DriverAssignment.driver_id == user.id,
					DriverAssignment.unassigned_at.is_(None),
					Vehicle.is_active.is_(True),
				)
				.order_by(Vehicle.id)
			)

		page = request.args.get("page", 1, type=int)
		per_page = request.args.get("per_page", 20, type=int)
		page = max(1, page)
		per_page = max(1, min(per_page, 100))

		total = query.count()
		vehicles = query.limit(per_page).offset((page - 1) * per_page).all()

		return {"vehicles": vehicles_schema.dump(vehicles)}, 200

	@jwt_required()
	def post(self):
		user = _current_user()
		if user is None:
			return {"message": "User not found"}, 404
		if user.role != "owner":
			return {"message": "Only owners can add vehicles"}, 403

		try:
			data = vehicle_create_schema.load(
				request.get_json(silent=True) or {}
			)
		except ValidationError as error:
			return {
				"message": "Invalid vehicle data",
				"errors": error.messages,
			}, 400

		data["plate_number"] = data["plate_number"].strip().upper()
		if Vehicle.query.filter_by(
			plate_number=data["plate_number"]
		).first():
			return {"message": "plate_number is already registered"}, 409

		vehicle = Vehicle(
			plate_number=data["plate_number"],
			vehicle_type=data["vehicle_type"],
			fleet_owner_id=user.fleet_owner_id,
			daily_expected_amount=data["daily_expected_amount"],
			is_active=True,
		)
		db.session.add(vehicle)
		db.session.commit()
		return {"vehicle": vehicle_schema.dump(vehicle)}, 201


class VehicleDetail(Resource):
	@jwt_required()
	def get(self, vehicle_id):
		vehicle = db.session.get(Vehicle, vehicle_id)
		if vehicle is None:
			return {"message": "Vehicle not found"}, 404
		if not _can_access_vehicle(_current_user(), vehicle):
			return {"message": "You do not have access to this vehicle"}, 403
		return {"vehicle": vehicle_schema.dump(vehicle)}, 200

	@jwt_required()
	def patch(self, vehicle_id):
		user = _current_user()
		if user is None:
			return {"message": "User not found"}, 404
		vehicle = db.session.get(Vehicle, vehicle_id)
		if vehicle is None:
			return {"message": "Vehicle not found"}, 404
		if vehicle.fleet_owner_id != user.fleet_owner_id or user.role != "admin":
			return {
				"message": "Only the owning fleet owner can update this vehicle"
			}, 403

		try:
			data = vehicle_update_schema.load(
				request.get_json(silent=True) or {}
			)
		except ValidationError as error:
			return {
				"message": "Invalid vehicle data",
				"errors": error.messages,
			}, 400
		if not data:
			return {"message": "At least one vehicle field is required"}, 400

		if "plate_number" in data:
			data["plate_number"] = data["plate_number"].strip().upper()
			existing = Vehicle.query.filter(
				Vehicle.plate_number == data["plate_number"],
				Vehicle.id != vehicle_id,
			).first()
			if existing:
				return {"message": "plate_number is already registered"}, 409

		for field, value in data.items():
			setattr(vehicle, field, value)
		db.session.commit()
		return {"vehicle": vehicle_schema.dump(vehicle)}, 200

	@jwt_required()
	def delete(self, vehicle_id):
		user = _current_user()
		if user is None:
			return {"message": "User not found"}, 404
		vehicle = db.session.get(Vehicle, vehicle_id)
		if vehicle is None:
			return {"message": "Vehicle not found"}, 404
		if vehicle.fleet_owner_id != user.fleet_owner_id or user.role != "owner":
			return {
				"message": "Only the owning fleet owner can remove this vehicle"
			}, 403

		vehicle.is_active = False
		db.session.commit()
		return {"vehicle": vehicle_schema.dump(vehicle)}, 200