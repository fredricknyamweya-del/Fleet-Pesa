from datetime import datetime, time, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from extensions import db
from models.remittance import Remittance
from models.user import User
from models.vehicle import Vehicle
from schemas.remittance_schema import (
    remittance_create_schema,
    remittance_schema,
    remittance_update_schema,
)

remittance_bp = Blueprint("remittances", __name__, url_prefix="/api")

VALID_STATUSES = ("paid", "short")


def _parse_date_bound(raw_value, *, end_of_day=False):
    """Parse a YYYY-MM-DD (or full ISO) string into a naive UTC datetime bound."""
    parsed = datetime.fromisoformat(raw_value)

    # Normalize any timezone-aware value to UTC before dropping tzinfo,
    # instead of just truncating the offset.
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)

    if end_of_day:
        parsed = datetime.combine(parsed.date(), time.max)

    return parsed


@remittance_bp.get("/vehicles/<int:vehicle_id>/remittances")
@jwt_required()
def vehicle_remittance_history(vehicle_id):
    user_id = int(get_jwt_identity())

    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        return jsonify(message="Vehicle not found"), 404

    is_owner = vehicle.fleet_owner_id == user_id
    has_remitted = (
        Remittance.query.filter_by(vehicle_id=vehicle_id, driver_id=user_id).first()
        is not None
    )
    if not is_owner and not has_remitted:
        return jsonify(message="You do not have access to this vehicle"), 403

    query = Remittance.query.filter_by(vehicle_id=vehicle_id)

    status = request.args.get("status")
    if status and status != "all":
        if status not in VALID_STATUSES:
            return jsonify(message="status must be paid, short or all"), 400
        query = query.filter_by(status=status)

    try:
        from_raw = request.args.get("from")
        to_raw = request.args.get("to")

        from_bound = _parse_date_bound(from_raw) if from_raw else None
        to_bound = _parse_date_bound(to_raw, end_of_day=True) if to_raw else None
    except ValueError:
        return jsonify(message="from and to must use YYYY-MM-DD format"), 400

    if from_bound and to_bound and from_bound > to_bound:
        return jsonify(message="from must not be after to"), 400

    if from_bound:
        query = query.filter(Remittance.submitted_at >= from_bound)
    if to_bound:
        query = query.filter(Remittance.submitted_at <= to_bound)

    remittances = query.order_by(Remittance.submitted_at.desc()).all()

    return jsonify(
        vehicle={
            "id": vehicle.id,
            "plate_number": vehicle.plate_number,
            "vehicle_type": vehicle.vehicle_type,
        },
        remittances=[item.to_dict() for item in remittances],
    )


@remittance_bp.post("/remittances")
@jwt_required()
def create_remittance():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify(message="User not found"), 404
    if user.role != "driver":
        return jsonify(message="Only drivers can submit remittances"), 403

    try:
        data = remittance_create_schema.load(request.get_json(silent=True) or {})
    except ValidationError as error:
        return jsonify(message="Invalid remittance data", errors=error.messages), 400

    vehicle = db.session.get(Vehicle, data["vehicle_id"])
    if vehicle is None:
        return jsonify(message="Vehicle not found"), 404
    if not vehicle.is_active:
        return jsonify(message="Cannot submit a remittance for an inactive vehicle"), 400

    # driver_id always comes from the token, never trust the request body,
    # so a driver can't submit a remittance on someone else's behalf.
    status = data.get("status")
    if not status:
        status = "paid" if data["actual_amount"] >= data["expected_amount"] else "short"

    remittance = Remittance(
        vehicle_id=vehicle.id,
        driver_id=user_id,
        expected_amount=data["expected_amount"],
        actual_amount=data["actual_amount"],
        status=status,
        payment_status=data.get("payment_status", "pending"),
        mpesa_reference=data.get("mpesa_reference"),
        mpesa_transaction_code=data.get("mpesa_transaction_code"),
        flagged_for_followup=data.get("flagged_for_followup", False),
    )
    db.session.add(remittance)
    db.session.commit()
    return jsonify(remittance=remittance_schema.dump(remittance)), 201


@remittance_bp.patch("/remittances/<int:remittance_id>")
@jwt_required()
def update_remittance(remittance_id):
    user_id = int(get_jwt_identity())

    remittance = db.session.get(Remittance, remittance_id)
    if remittance is None:
        return jsonify(message="Remittance not found"), 404

    vehicle = db.session.get(Vehicle, remittance.vehicle_id)
    if vehicle is None or vehicle.fleet_owner_id != user_id:
        return jsonify(message="Only the owning fleet owner can update this remittance"), 403

    try:
        data = remittance_update_schema.load(request.get_json(silent=True) or {})
    except ValidationError as error:
        return jsonify(message="Invalid remittance data", errors=error.messages), 400
    if not data:
        return jsonify(message="At least one remittance field is required"), 400

    for field, value in data.items():
        setattr(remittance, field, value)
    db.session.commit()
    return jsonify(remittance=remittance_schema.dump(remittance))