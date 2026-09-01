from models.fleet_owner import FleetOwner


def test_seeded_fleet_owner_accounts(seeded_app):
    with seeded_app.app_context():
        owners = FleetOwner.query.order_by(FleetOwner.id).all()
        assert [owner.account_name for owner in owners] == [
            "Tomashi Circle",
            "Rainbow Shuttle Sacco",
        ]
