from datetime import datetime, time, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models.remittance import Remittance
from models.vehicle import Vehicle

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