from datetime import datetime, timezone
from extensions import db

class DriverAssignment(db.Model):
    __tablename__ = "driver_assignments"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    vehicle_id = db.Column(
        db.Integer,
        db.ForeignKey("vehicles.id"),
        nullable=False,
        index=True,
    )

    driver_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    assigned_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=db.func.now(),
    )

    unassigned_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
    )

    driver = db.relationship( "User", back_populates="driver_assignments",)

    vehicle = db.relationship( "Vehicle",back_populates="driver_assignments", )

    def __repr__(self):
     return(f"<DriverAssignment"
            f"{self.id}"
            f"drivers={self.driver_id}"
            f"vehicle={self.vehicle_id}>")