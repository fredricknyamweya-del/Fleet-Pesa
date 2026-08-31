from datetime import datetime, timezone

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required,get_jwt_identity
from datetime import timezone,datetime
from extensions import db
from models.driver_assignment import DriverAssignment
from models.user import User, UserRole
from models.vehicle import Vehicle
from schemas.driver_assignment_schema import (
    driver_assignment_schema,
    driver_assignments_schema,
)

class DriverAssignments(Resource):
    @jwt_required()
    def post(self):
        try:
            data = driver_assignment_schema.load(
                request.get_json()
            )
        except ValidationError as error:
            return {
                "errors": error.messages
            }, 400

        driver_id = data["driver_id"]
        vehicle_id = data["vehicle_id"]
        current_user_id = int(get_jwt_identity())
        current_user = db.session.get(User, current_user_id)

        if current_user is None:
           return {
               "error": "Authenticated user not found."
    }, 401

        driver = db.session.get(User, driver_id)

        if driver is None:
            return {
                "error": "Driver not found."
            }, 404
        if driver.role != UserRole.DRIVER:
            return {
                "error": "Selected user is not a driver."
            }, 400
        if driver.fleet_owner_id != current_user.fleet_owner_id:
            return {
                "error": "Driver does not belong to your fleet."
    }, 403

        vehicle = db.session.get(Vehicle, vehicle_id)

        if vehicle is None:
            return {
                "error": "Vehicle not found."
            }, 404

        if vehicle.fleet_owner_id != current_user.fleet_owner_id:
          return {
                "error": "Vehicle does not belong to your fleet."
    }, 403
        existing_vehicle_assignment = (
            DriverAssignment.query
            .filter_by(
                vehicle_id=vehicle_id,
                unassigned_at=None,
            )
            .first()
        )
        if existing_vehicle_assignment:
            return {
                "error": "Vehicle already has an assigned driver."
            }, 409

        existing_driver_assignment = (
            DriverAssignment.query
            .filter_by(
                driver_id=driver_id,
                unassigned_at=None,
            )
            .first()
        )
        if existing_driver_assignment:
            return {
                "error": "Driver is already assigned to a vehicle."
            }, 409

        assignment = DriverAssignment(
            driver_id=driver_id,
            vehicle_id=vehicle_id,
        )

        db.session.add(assignment)
        db.session.commit()
        return (
            driver_assignment_schema.dump(assignment),
            201,
        )
    @jwt_required()
    def get(self):
      current_user_id = int(get_jwt_identity())
      current_user = db.session.get(User, current_user_id)

      if current_user is None:
        return {
               "error": "Authenticated user not found."
        }, 401

      assignments = (
        DriverAssignment.query
        .join(Vehicle)
        .filter(
            Vehicle.fleet_owner_id == current_user.fleet_owner_id
        )
        .all()
    )

      return (
        driver_assignments_schema.dump(assignments),
       ), 200

def _current_user():
    return db.session.get(User, int(get_jwt_identity()))


def _owns_vehicle(user, vehicle):
    return (
        user is not None
        and user.role == "admin"
        and user.fleet_owner_id == vehicle.fleet_owner_id
    )


class VehicleDriverAssignment(Resource):
    @jwt_required()
    def post(self, vehicle_id):
        user = _current_user()
        if user is None:
            return {"error": "User not found."}, 404

        vehicle = db.session.get(Vehicle, vehicle_id)
        if vehicle is None:
            return {"error": "Vehicle not found."}, 404
        if not _owns_vehicle(user, vehicle):
            return {"error": "Only the fleet owner can assign drivers."}, 403

        payload = request.get_json(silent=True) or {}
        try:
            data = driver_assignment_schema.load({
                "vehicle_id": vehicle_id,
                "driver_id": payload.get("driver_id"),
            })
        except ValidationError as error:
            return {"errors": error.messages}, 400

        driver = db.session.get(User, data["driver_id"])
        if driver is None:
            return {"error": "Driver not found."}, 404
        if driver.role != UserRole.DRIVER.value:
            return {"error": "Selected user is not a driver."}, 400

        current_assignment = DriverAssignment.query.filter_by(
            vehicle_id=vehicle_id,
            unassigned_at=None,
        ).first()
        driver_assignment = DriverAssignment.query.filter_by(
            driver_id=driver.id,
            unassigned_at=None,
        ).first()
        if driver_assignment is not None:
            return {"error": "Driver is already assigned to a vehicle."}, 409

        try:
            now = datetime.now(timezone.utc)
            if current_assignment is not None:
                current_assignment.unassigned_at = now

            assignment = DriverAssignment(
                vehicle_id=vehicle_id,
                driver_id=driver.id,
                assigned_at=now,
            )
            db.session.add(assignment)
            db.session.commit()
        except Exception:
            db.session.rollback()
            return {"error": "Unable to assign driver."}, 500

        return driver_assignment_schema.dump(assignment), 201


class VehicleDriverHistory(Resource):
    @jwt_required()
    def get(self, vehicle_id):
        user = _current_user()
        if user is None:
            return {"error": "User not found."}, 404

        vehicle = db.session.get(Vehicle, vehicle_id)
        if vehicle is None:
            return {"error": "Vehicle not found."}, 404
        if not _owns_vehicle(user, vehicle):
            return {"error": "Only the fleet owner can view driver history."}, 403

        assignments = DriverAssignment.query.filter_by(
            vehicle_id=vehicle_id,
        ).order_by(DriverAssignment.assigned_at.asc()).all()
        return driver_assignments_schema.dump(assignments), 200


class DriverAssignments(Resource):
    @jwt_required()
    def get(self):
        user = _current_user()
        if user is None:
            return {"error": "User not found."}, 404
        if user.role != "admin":
            return {"error": "Only fleet owners can list assignments."}, 403

        assignments = (
            DriverAssignment.query
            .join(Vehicle)
            .filter(Vehicle.fleet_owner_id == user.fleet_owner_id)
            .all()
        )
        return driver_assignments_schema.dump(assignments), 200


class DriverAssignmentById(Resource):
     @jwt_required()
     def get(self, id):
      assignment = db.session.get(
        DriverAssignment,
        id,
    )
      if assignment is None:
        return {
              "error": "Driver assignment not found."
        }, 404

      current_user_id = int(get_jwt_identity())
      current_user = db.session.get(User, current_user_id)

      if current_user is None:
        return {
               "error": "Authenticated user not found."
        }, 401

      if assignment.vehicle.fleet_owner_id != current_user.fleet_owner_id:
        return {
              "error": "You are not allowed to access this assignment."
        }, 403

      return (
          driver_assignment_schema.dump(assignment),
        200,
    )
class UnassignDriver(Resource):
    @jwt_required()
    def patch(self, id):
        assignment = db.session.get(DriverAssignment, id)
        if assignment is None:
            return {
                "error": "Driver assignment not found."
            }, 404
        current_user_id = int(get_jwt_identity())
        current_user = db.session.get(User, current_user_id)

        if current_user is None:
           return {
              "error": "Authenticated user not found."
    }, 401

        if assignment.vehicle.fleet_owner_id != current_user.fleet_owner_id:
           return {
                "error": "You are not allowed to modify this assignment."
    }, 403
        if assignment.unassigned_at is not None:
            return {"error": "Driver is already unassigned."}, 409

        assignment.unassigned_at = datetime.now(timezone.utc)
        db.session.commit()
        return driver_assignment_schema.dump(assignment), 200
