from models.fare_payment import FarePayment
from utils.driver_lookup import lookup_driver_for_transaction


def test_seeded_fare_payments_have_no_direct_driver_reference(seeded_app):
    with seeded_app.app_context():
        assert FarePayment.query.count() == 3
        assert not hasattr(FarePayment, "driver_id")
        assert all(item.vehicle_id is not None for item in FarePayment.query.all())


def test_fare_payment_driver_is_resolved_by_vehicle_and_timestamp(seeded_app):
    with seeded_app.app_context():
        payment = FarePayment.query.filter_by(mpesa_reference="FARE-2001").one()
        assert lookup_driver_for_transaction(payment) is not None
