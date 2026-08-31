from extensions import db


class Vehicle(db.Model):
	__tablename__ = "vehicles"

	id = db.Column(db.Integer, primary_key=True)
	plate_number = db.Column(db.String(20), unique=True, nullable=False)
	vehicle_type = db.Column(db.String(20), nullable=False)
	fleet_owner_id = db.Column(
		db.Integer,
		db.ForeignKey("fleet_owners.id"),
		nullable=False,
	)
	daily_expected_amount = db.Column(db.Numeric(10, 2), nullable=False)
	is_active = db.Column(db.Boolean, nullable=False, default=True)

	remittances = db.relationship("Remittance", back_populates="vehicle", lazy=True)
	driver_assignments = db.relationship(
		"DriverAssignment",
		back_populates="vehicle",
	)