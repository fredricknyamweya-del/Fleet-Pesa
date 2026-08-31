from datetime import datetime, timezone

from extensions import db


class FarePayment(db.Model):
    __tablename__ = "fare_payments"

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(
        db.Integer,
        db.ForeignKey("vehicles.id"),
        nullable=False
    )
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    customer_phone = db.Column(db.String(15), nullable=False)
    mpesa_reference = db.Column(db.String(100), unique=True)
    mpesa_transaction_code = db.Column(db.String(100))
    payment_status = db.Column(db.String(20), nullable=False, default="pending")
    requested_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    vehicle = db.relationship("Vehicle", backref="fare_payments")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "amount": float(self.amount),
            "customer_phone": self.customer_phone,
            "mpesa_reference": self.mpesa_reference,
            "mpesa_transaction_code": self.mpesa_transaction_code,
            "payment_status": self.payment_status,
            "requested_at": self.requested_at.isoformat(),
        }
