from datetime import datetime, timezone

from models.driver_assignment import DriverAssignment


def _can_access_vehicle(user, vehicle, at_time=None):
    """Check fleet-owner access or driver assignment at a specific time."""
    if user is None or vehicle is None:
        return False
    if user.role == "owner" and user.fleet_owner_id == vehicle.fleet_owner_id:
        return True

    assignment_query = DriverAssignment.query.filter_by(
        vehicle_id=vehicle.id,
        driver_id=user.id,
    )
    if at_time is None:
        assignment_query = assignment_query.filter_by(unassigned_at=None)
    else:
        assignment_query = assignment_query.filter(
            DriverAssignment.assigned_at <= at_time,
            (DriverAssignment.unassigned_at.is_(None))
            | (at_time <= DriverAssignment.unassigned_at),
        )
    return assignment_query.first() is not None


def current_utc():
    return datetime.now(timezone.utc)


def _can_read_transaction(user, vehicle, transaction_time):
    return _can_access_vehicle(user, vehicle, at_time=transaction_time)
