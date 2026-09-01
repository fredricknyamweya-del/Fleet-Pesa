from models.user import User


def test_seeded_user_ownership_rules(seeded_app):
    with seeded_app.app_context():
        assert User.query.filter_by(role="admin", fleet_owner_id=None).count() == 0
        assert User.query.filter_by(role="driver").filter(
            User.fleet_owner_id.is_not(None)
        ).count() == 0
        assert User.query.count() == 6
