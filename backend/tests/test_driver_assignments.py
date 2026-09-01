from models.driver_assignment import DriverAssignment
from models.user import User
from models.vehicle import Vehicle


def test_kaa_assignment_history_has_closed_and_open_rows(seeded_app):
    with seeded_app.app_context():
        vehicle = Vehicle.query.filter_by(plate_number="KAA 123X").one()
        history = DriverAssignment.query.filter_by(
            vehicle_id=vehicle.id
        ).order_by(DriverAssignment.assigned_at).all()
        assert len(history) == 2
        assert history[0].unassigned_at is not None
        assert history[1].unassigned_at is None


def test_reassignment_closes_old_assignment_and_opens_new_one(seeded_app):
    with seeded_app.app_context():
        vehicle = Vehicle.query.filter_by(plate_number="KAA 123X").one()
        driver = User.query.filter_by(username="driver_alex").one()
        assignment = DriverAssignment.query.filter_by(
            vehicle_id=vehicle.id,
            unassigned_at=None,
        ).one()

        assignment.unassigned_at = assignment.assigned_at
        replacement = DriverAssignment(
            vehicle_id=vehicle.id,
            driver_id=driver.id,
            assigned_at=assignment.assigned_at,
        )
        from extensions import db
        db.session.add(replacement)
        db.session.commit()

        history = DriverAssignment.query.filter_by(
            vehicle_id=vehicle.id
        ).order_by(DriverAssignment.id).all()
        assert history[-2].unassigned_at is not None
        assert history[-1].driver_id == driver.id
        assert history[-1].unassigned_at is None
