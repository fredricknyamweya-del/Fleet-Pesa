from datetime import datetime, time

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource
from marshmallow import ValidationError

from extensions import db
from models.remittance import Remittance
from models.user import User
from models.vehicle import Vehicle
from utils.access_control import _can_access_vehicle, _can_read_transaction
from schemas.remittance_schema import (
    remittance_create_schema,
    remittance_schema,
    remittance_update_schema,
    remittances_schema,
)


def _current_user():
    return db.session.get(User, int(get_jwt_identity()))


def _visible_remittances(user, query):
    records = query.order_by(Remittance.submitted_at.desc()).all()
    if user.role == "owner":
        return [
            item for item in records
            if item.vehicle.fleet_owner_id == user.fleet_owner_id
        ]
    return [
        item for item in records
        if _can_read_transaction(user, item.vehicle, item.submitted_at)
    ]


class RemittanceList(Resource):
    @jwt_required()
    def get(self):
        user = _current_user()
        if user is None:
            return {"message": "User not found"}, 404
        query = Remittance.query
        vehicle_id = request.args.get("vehicle_id", type=int)
        if vehicle_id is not None:
            query = query.filter_by(vehicle_id=vehicle_id)
        status = request.args.get("status")
        if status and status != "all":
            if status not in ("paid", "short"):
                return {"message": "status must be paid, short or all"}, 400
            query = query.filter_by(status=status)
        visible = _visible_remittances(user, query)

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        page = max(1, page)
        per_page = max(1, min(per_page, 100))

        return {"remittances": remittances_schema.dump(visible)}, 200

    @jwt_required()
    def post(self):
        user = _current_user()
        if user is None:
            return {"message": "User not found"}, 404
        try:
            data = remittance_create_schema.load(
                request.get_json(silent=True) or {}
            )
        except ValidationError as error:
            return {"message": "Invalid remittance data", "errors": error.messages}, 400
        vehicle = db.session.get(Vehicle, data["vehicle_id"])
        if vehicle is None:
            return {"message": "Vehicle not found"}, 404
        if not _can_access_vehicle(user, vehicle):
            return {"message": "You do not have access to this vehicle"}, 403
        data.setdefault(
            "status",
            "paid" if data["actual_amount"] >= data["expected_amount"] else "short",
        )
        remittance = Remittance(**data)
        db.session.add(remittance)
        db.session.commit()
        return {"remittance": remittance_schema.dump(remittance)}, 201


class RemittanceDetail(Resource):
    @jwt_required()
    def get(self, remittance_id):
        user = _current_user()
        remittance = db.session.get(Remittance, remittance_id)
        if remittance is None:
            return {"message": "Remittance not found"}, 404
        if not _can_access_vehicle(user, remittance.vehicle):
            if user is None or not _can_read_transaction(
                user, remittance.vehicle, remittance.submitted_at
            ):
                return {"message": "You do not have access to this remittance"}, 403
        return {"remittance": remittance_schema.dump(remittance)}, 200

    @jwt_required()
    def patch(self, remittance_id):
        user = _current_user()
        remittance = db.session.get(Remittance, remittance_id)
        if remittance is None:
            return {"message": "Remittance not found"}, 404
        if not _can_access_vehicle(user, remittance.vehicle):
            return {"message": "Only an assigned user can update this remittance"}, 403
        try:
            data = remittance_update_schema.load(
                request.get_json(silent=True) or {}
            )
        except ValidationError as error:
            return {"message": "Invalid remittance data", "errors": error.messages}, 400
        if not data:
            return {"message": "At least one remittance field is required"}, 400
        for field, value in data.items():
            setattr(remittance, field, value)
        db.session.commit()
        return {"remittance": remittance_schema.dump(remittance)}, 200


class VehicleRemittanceHistory(Resource):
    @jwt_required()
    def get(self, vehicle_id):
        user = _current_user()
        vehicle = db.session.get(Vehicle, vehicle_id)
        if vehicle is None:
            return {"message": "Vehicle not found"}, 404
        if not _can_access_vehicle(user, vehicle):
            return {"message": "You do not have access to this vehicle"}, 403
        query = Remittance.query.filter_by(vehicle_id=vehicle_id)
        status = request.args.get("status")
        if status and status != "all":
            if status not in ("paid", "short"):
                return {"message": "status must be paid, short or all"}, 400
            query = query.filter_by(status=status)
        try:
            if request.args.get("from"):
                start = datetime.strptime(request.args["from"], "%Y-%m-%d")
                query = query.filter(Remittance.submitted_at >= start)
            if request.args.get("to"):
                end = datetime.strptime(request.args["to"], "%Y-%m-%d")
                query = query.filter(Remittance.submitted_at <= datetime.combine(end.date(), time.max))
        except ValueError:
            return {"message": "from and to must use YYYY-MM-DD format"}, 400
        records = query.order_by(Remittance.submitted_at.desc()).all()
        if user.role != "owner":
            records = [
                item for item in records
                if _can_read_transaction(user, vehicle, item.submitted_at)
            ]
        return {
            "vehicle": {
                "id": vehicle.id,
                "plate_number": vehicle.plate_number,
                "vehicle_type": vehicle.vehicle_type,
            },
            "remittances": remittances_schema.dump(records),
        }, 200


class RemittancePrompt(Resource):
    @jwt_required()
    def post(self, remittance_id):
        user = _current_user()
        remittance = db.session.get(Remittance, remittance_id)
        if user is None:
            return {"message": "User not found"}, 404
        if remittance is None:
            return {"message": "Remittance not found"}, 404
        if user.role != "owner" or not _can_access_vehicle(user, remittance.vehicle):
            return {"message": "Only the vehicle owner can flag a remittance"}, 403
        outstanding = remittance.expected_amount - remittance.actual_amount
        if outstanding <= 0:
            return {"message": "This remittance has no outstanding amount"}, 400
        remittance.flagged_for_followup = True
        db.session.commit()
        return {
            "message": "Remittance flagged for follow-up",
            "remittance": remittance_schema.dump(remittance),
            "outstanding_amount": float(outstanding),
        }, 200