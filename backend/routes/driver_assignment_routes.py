from datetime import datetime, timezone

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource
from marshmallow import ValidationError

from extensions import db
from models.driver_assignment import DriverAssignment
from models.user import User, UserRole
from models.vehicle import Vehicle
from schemas.driver_assignment_schema import (
    driver_assignment_schema,
    driver_assignments_schema,
)

def _current_user():
    return db.session.get(User, int(get_jwt_identity()))

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
        current_user = _current_user()

        if current_user is None:
           return {
               "error": "Authenticated user not found."
    }, 401
        
        driver = db.session.get(User, driver_id)

        if driver is None:
            return {
                "error": "Driver not found."
            }, 404
        if driver.role != UserRole.DRIVER.value:
            return {
                "error": "Selected user is not a driver."
            }, 400

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
        try:
            assignment = DriverAssignment(
                driver_id=driver_id,
                vehicle_id=vehicle_id,
            )

            db.session.add(assignment)
            db.session.commit()
        except Exception:
          db.session.rollback()
          return {"error":"Unable to create driver Assignment"},500
        
        return (
            driver_assignment_schema.dump(assignment),
            201,
        )
    @jwt_required()
    def get(self):
      current_user = _current_user()

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
        200,
    )


def _owns_vehicle(user, vehicle):
    return (
        user is not None
        and user.role == UserRole.OWNER.value
        and user.fleet_owner_id == vehicle.fleet_owner_id
    )


class VehicleDriverHistory(Resource):
    @jwt_required()
    def get(self, vehicle_id):
        user = _current_user()
        if user is None:
            return {"error": "Authenticated user not found."}, 401

        vehicle = db.session.get(Vehicle, vehicle_id)
        if vehicle is None:
            return {"error": "Vehicle not found."}, 404
        if not _owns_vehicle(user, vehicle):
            return {"error": "Only the fleet owner can view driver history."}, 403

        assignments = DriverAssignment.query.filter_by(
            vehicle_id=vehicle_id,
        ).order_by(DriverAssignment.assigned_at.asc()).all()
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

      current_user = _current_user()

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
        current_user = _current_user()

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
        try:
            assignment.unassigned_at = datetime.now(timezone.utc)
            db.session.commit()
        except Exception:
            db.session.rollback()
            return{"error":"unable to unassign a driver"},500
        
        return driver_assignment_schema.dump(assignment), 200
