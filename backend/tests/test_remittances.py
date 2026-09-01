from models.remittance import Remittance
from utils.driver_lookup import lookup_driver_for_transaction


def test_seeded_remittances_have_no_direct_driver_reference(seeded_app):
    with seeded_app.app_context():
        assert Remittance.query.count() == 3
        assert not hasattr(Remittance, "driver_id")
        assert all(item.vehicle_id is not None for item in Remittance.query.all())


def test_remittance_driver_is_resolved_by_vehicle_and_timestamp(seeded_app):
    with seeded_app.app_context():
        remittance = Remittance.query.filter_by(mpesa_reference="FP-1001").one()
        assert lookup_driver_for_transaction(remittance) is not None


def test_remittance_lookup_handles_reassignment_boundary(seeded_app):
    with seeded_app.app_context():
        remittance = Remittance.query.filter_by(mpesa_reference="FP-1002").one()
        assignment = lookup_driver_for_transaction(remittance)
        assert assignment is not None
