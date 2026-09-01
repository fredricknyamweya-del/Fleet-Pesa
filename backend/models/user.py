
import enum
import re

from datetime import datetime, timezone

from sqlalchemy.orm import validates

from extensions import db, bcrypt


class UserRole(enum.Enum):
    OWNER = "owner"
    DRIVER = "driver"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True,)


    username = db.Column(db.String(80),unique=True,nullable=False,index=True,)

    name = db.Column(db.String(120),nullable=False,)

    phone = db.Column(db.String(15), unique=True, nullable=False,)

    password_hash = db.Column(db.String(255),nullable=False,)

    role = db.Column( db.String(10),nullable=False,default=UserRole.DRIVER.value,server_default=UserRole.DRIVER.value,)
    fleet_owner_id = db.Column( db.Integer, db.ForeignKey("fleet_owners.id"), nullable=True, index=True,)

    fleet_owner = db.relationship("FleetOwner",back_populates="users",)
    driver_assignments = db.relationship("DriverAssignment",back_populates="driver",)

    

    created_at = db.Column(db.DateTime(timezone=True),nullable=False,default=lambda: datetime.now(timezone.utc),server_default=db.func.now(),)
    
    def set_password(self, password):
        if not password:
            raise ValueError("Password is required.")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        if not password or not self.password_hash:
            return False
        return bcrypt.check_password_hash(self.password_hash,password,)

    @validates("username")
    def validate_username(self, key, value):
        if value is None:
            raise ValueError("Username is required.")
        value = str(value).strip().lower()
        if not value:
            raise ValueError("Username is required.")
        if len(value) < 3:
            raise ValueError(
                "Username must be at least 3 characters long.")
        if len(value) > 80:
            raise ValueError("Username must not exceed 80 characters.")
        return value

    @validates("name")
    def validate_name(self, key, value):
        if value is None:
            raise ValueError("Name is required.")

        value = str(value).strip()

        if not value:
            raise ValueError("Name is required.")

        if len(value) > 120:
            raise ValueError(
                "Name must not exceed 120 characters."
            )

        return value

    @validates("phone")
    def validate_phone(self, key, value):
        if value is None:
            raise ValueError("Phone number is required.")

        value = str(value).strip()

        if not value:
            raise ValueError("Phone number is required.")


        value = re.sub(r"[\s\-()]", "", value)


        if not (
            re.fullmatch(r"07\d{8}", value)
            or re.fullmatch(r"01\d{8}", value)
        ):
            raise ValueError(
                "Phone number must start with 07 or 011."
            )


        return value

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "phone": self.phone,
            "role": self.role,
            "fleet_owner_id": self.fleet_owner_id,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
    }


    def __repr__(self):
        return f"<User {self.id} {self.username}>"




