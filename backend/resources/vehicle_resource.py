from flask_restful import Resource
from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from extensions import db
from models.user import User
from models.vehicle import Vehicle
from schemas.vehicle_schema import (
    vehicle_create_schema,
    vehicle_schema,
    vehicles_schema,
)


class VehicleListResource(Resource):

    @jwt_required()
    def get(self):
        user_id = int(get_jwt_identity())

        user = db.session.get(User, user_id)

        if user is None:
            return {"message": "User not found"}, 404

        if user.role != "owner":
            return {
                "message": "Only owners can list fleet vehicles"
            }, 403

        vehicles = (
            Vehicle.query
            .filter_by(owner_id=user_id)
            .order_by(Vehicle.id)
            .all()
        )

        return {
            "vehicles": vehicles_schema.dump(vehicles)
        }, 200

    @jwt_required()
    def post(self):
        user_id = int(get_jwt_identity())

        user = db.session.get(User, user_id)

        if user is None:
            return {"message": "User not found"}, 404

        if user.role != "owner":
            return {
                "message": "Only owners can add vehicles"
            }, 403

        try:
            data = vehicle_create_schema.load(
                request.get_json(silent=True) or {}
            )
        except ValidationError as error:
            return {
                "message": "Invalid vehicle data",
                "errors": error.messages,
            }, 400

        if Vehicle.query.filter_by(
            plate_number=data["plate_number"]
        ).first():
            return {
                "message": "plate_number is already registered"
            }, 409

        driver_id = data.get("driver_id")

        if driver_id is not None:
            driver = db.session.get(User, driver_id)

            if driver is None or driver.role != "driver":
                return {
                    "message": (
                        "driver_id must reference an existing driver"
                    )
                }, 400

        vehicle = Vehicle(
            plate_number=data["plate_number"],
            vehicle_type=data["vehicle_type"],
            owner_id=user_id,
            driver_id=driver_id,
            is_active=data.get("is_active", True),
        )

        db.session.add(vehicle)
        db.session.commit()

        return {
            "vehicle": vehicle_schema.dump(vehicle)
        }, 201
