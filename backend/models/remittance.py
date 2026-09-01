from datetime import datetime, timezone
from extensions import db


class Remittance(db.Model):
    __tablename__ = "remittances"

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)
    expected_amount = db.Column(db.Numeric(10, 2), nullable=False)
    actual_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(10), nullable=False)
    payment_status = db.Column(db.String(15), nullable=False, default="pending")
    mpesa_reference = db.Column(db.String(50))
    mpesa_transaction_code = db.Column(db.String(20))
    flagged_for_followup = db.Column(db.Boolean, nullable=False, default=False)
    submitted_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    vehicle = db.relationship("Vehicle", back_populates="remittances")

    @property
    def driver_id(self):
        from models.driver_assignment import DriverAssignment
        return DriverAssignment.driver_id_for_vehicle_at(self.vehicle_id, self.submitted_at)

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "driver_id": self.driver_id,
            "expected_amount": float(self.expected_amount),
            "actual_amount": float(self.actual_amount),
            "status": self.status,
            "payment_status": self.payment_status,
            "mpesa_reference": self.mpesa_reference,
            "mpesa_transaction_code": self.mpesa_transaction_code,
            "flagged_for_followup": self.flagged_for_followup,
            "submitted_at": self.submitted_at.isoformat(),
        }
