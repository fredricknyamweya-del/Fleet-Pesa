from models.vehicle import Vehicle


def test_seeded_vehicles_have_fleet_owners(seeded_app):
    with seeded_app.app_context():
        vehicles = Vehicle.query.order_by(Vehicle.plate_number).all()
        assert len(vehicles) == 4
        assert all(vehicle.fleet_owner_id is not None for vehicle in vehicles)
        assert all(not hasattr(vehicle, "owner_id") for vehicle in vehicles)
        assert all(not hasattr(vehicle, "driver_id") for vehicle in vehicles)
