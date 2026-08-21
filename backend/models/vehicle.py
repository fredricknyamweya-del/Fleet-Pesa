"""Vehicle model for FleetPesa.
Represents a single vehicle owned by an Owner (User with role='owner')
and optionally assigned to a Driver (User with role='driver'). Tracks
the daily remittance target used to flag shortfalls on the owner dashboard.
"""
from datetime import datetime, timezone
from extensions import db

class VehicleStatus:
    """
    Plain enum-like class holding the allowed values for Vehicle.status.
    Using constants instead of raw strings avoids typos like "Active" vs
    "active" scattered across models/routes/frontend.
    """
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"

    # Tuple of all valid statuses, used by routes to validate incoming values
    # (e.g. `if status not in VehicleStatus.ALL: reject`).
    ALL = (ACTIVE, MAINTENANCE, INACTIVE)


class Vehicle(db.Model):
    __tablename__ = "vehicles"
    id = db.Column(db.Integer, primary_key=True)
    plate_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    make = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)

    year = db.Column(db.Integer, nullable=True)
    color = db.Column(db.String(30), nullable=True)

    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    status = db.Column(
        db.String(20),
        nullable=False,
        default=VehicleStatus.ACTIVE,
        server_default=VehicleStatus.ACTIVE,
    )

    daily_target = db.Column(db.Numeric(10, 2), nullable=False, default=0)

    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner = db.relationship(
        "User",
        foreign_keys=[owner_id],
        backref=db.backref("owned_vehicles", lazy="dynamic"),
    )
    driver = db.relationship(
        "User",
        foreign_keys=[driver_id],
        backref=db.backref("assigned_vehicle", uselist=False),
    )
    remittances = db.relationship(
        "Remittance",
        backref="vehicle",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Vehicle {self.plate_number}>"

    def to_dict(self, include_relations=True):
        """Convert this model instance into a plain dict for JSON responses."""
        data = {
            "id": self.id,
            "plate_number": self.plate_number,
            "make": self.make,
            "model": self.model,
            "year": self.year,
            "color": self.color,
            "status": self.status,
            
            "daily_target": float(self.daily_target) if self.daily_target is not None else 0,
            "owner_id": self.owner_id,
            "driver_id": self.driver_id,
            
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_relations:
            data["owner_name"] = self.owner.name if self.owner else None
            data["driver_name"] = self.driver.name if self.driver else None
        return data