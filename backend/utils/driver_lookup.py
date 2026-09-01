from sqlalchemy import and_, or_

from extensions import db
from models.driver_assignment import DriverAssignment


def get_driver_assignment_at(vehicle_id, timestamp, session=None):
    """Return the assignment active for a vehicle at a transaction time."""
    session = session or db.session
    return (
        session.query(DriverAssignment)
        .filter(
            DriverAssignment.vehicle_id == vehicle_id,
            DriverAssignment.assigned_at <= timestamp,
            or_(
                DriverAssignment.unassigned_at.is_(None),
                timestamp <= DriverAssignment.unassigned_at,
            ),
        )
        .order_by(DriverAssignment.assigned_at.desc(), DriverAssignment.id.desc())
        .first()
    )


def get_driver_id_at(vehicle_id, timestamp, session=None):
    assignment = get_driver_assignment_at(vehicle_id, timestamp, session=session)
    return assignment.driver_id if assignment is not None else None


def lookup_driver_for_transaction(transaction, timestamp_field=None, session=None):
    if timestamp_field is None:
        timestamp_field = (
            transaction.submitted_at
            if hasattr(transaction, "submitted_at")
            else transaction.requested_at
        )
    return get_driver_id_at(
        transaction.vehicle_id,
        timestamp_field,
        session=session,
    )
