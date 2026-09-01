from models.driver_assignment import DriverAssignment
from models.fare_payment import FarePayment
from models.fleet_owner import FleetOwner
from models.remittance import Remittance
from models.user import User
from models.vehicle import Vehicle


def test_seed_creates_expected_rows(seeded_app):
    with seeded_app.app_context():
        assert FleetOwner.query.count() == 2
        assert User.query.count() == 6
        assert Vehicle.query.count() == 4
        assert DriverAssignment.query.count() == 4
        assert Remittance.query.count() == 3
        assert FarePayment.query.count() == 3
