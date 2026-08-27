from datetime import datetime, timedelta, timezone

from app import create_app
from extensions import db
from models.remittance import Remittance
from models.user import User
from models.vehicle import Vehicle

app = create_app()

with app.app_context():
	db.drop_all()
	db.create_all()

	owner = User(username="mwangi_owner", name="Peter Mwangi", phone="+254712000001", role="owner")
	owner.set_password("password123")

	driver_one = User(username="kamau_driver", name="John Kamau", phone="+254712000002", role="driver")
	driver_one.set_password("password123")

	driver_two = User(username="atieno_driver", name="Brenda Atieno", phone="+254712000003", role="driver")
	driver_two.set_password("password123")

	db.session.add_all([owner, driver_one, driver_two])
	db.session.commit()

	vehicle_one = Vehicle(plate_number="KDA 001A", vehicle_type="matatu", fleet_owner_id=owner.id)
	vehicle_two = Vehicle(plate_number="KDB 002B", vehicle_type="matatu", fleet_owner_id=owner.id)
	vehicle_three = Vehicle(plate_number="KDC 003C", vehicle_type="minibus", fleet_owner_id=owner.id)

	db.session.add_all([vehicle_one, vehicle_two, vehicle_three])
	db.session.commit()

	now = datetime.now(timezone.utc)
	remittances = [
		Remittance(vehicle_id=vehicle_one.id, driver_id=driver_one.id, expected_amount=3000, actual_amount=3000, status="paid", payment_status="confirmed", submitted_at=now - timedelta(days=1)),
		Remittance(vehicle_id=vehicle_one.id, driver_id=driver_one.id, expected_amount=3000, actual_amount=2400, status="short", payment_status="confirmed", flagged_for_followup=True, submitted_at=now - timedelta(days=2)),
		Remittance(vehicle_id=vehicle_two.id, driver_id=driver_two.id, expected_amount=2800, actual_amount=2800, status="paid", payment_status="confirmed", submitted_at=now - timedelta(hours=6)),
		Remittance(vehicle_id=vehicle_two.id, driver_id=driver_two.id, expected_amount=2800, actual_amount=0, status="short", payment_status="pending", flagged_for_followup=True, submitted_at=now - timedelta(days=3)),
	]

	db.session.add_all(remittances)
	db.session.commit()

	print("Seeded", User.query.count(), "users,", Vehicle.query.count(), "vehicles,", Remittance.query.count(), "remittances")