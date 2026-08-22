import enum
from datetime import datetime

from sqlalchemy.orm import validates

from extensions import db, bcrypt


class UserRole(enum.Enum):
    OWNER = "owner"
    DRIVER = "driver"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column( db.String(50), unique=True, index=True, nullable=False)

    name = db.Column(db.String(150), nullable=False)

    phone = db.Column( db.String(20), unique=True, index=True, nullable=False)

    password_hash = db.Column( db.String(255), nullable=False)

    role = db.Column( db.Enum(UserRole), nullable=False, default=UserRole.DRIVER)

    created_at = db.Column( db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(
        self,
        username,
        name,
        phone,
        password,
        role=UserRole.DRIVER
    ):
        self.username = username.strip().lower()
        self.name = name.strip()
        self.phone = phone.strip()
        self.set_password(password)
        self.role = role

    def set_password(self, password):
        if not password:
            raise ValueError("Password is required.")

        if len(password) < 8:
            raise ValueError(
                "Password must be at least 8 characters long.")

        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash,password)

    @validates("username")
    def validate_username(self, key, value):
        value = value.strip().lower()

        if len(value) < 3:
            raise ValueError("Username must contain at least 3 characters.")
        return value

    @validates("full_name")
    def validate_full_name(self, key, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        return value

    @validates("phone")
    def validate_phone(self, key, value):
        value = value.strip()

        if not value.startswith("07") or len(value) != 10:
            raise ValueError("Phone number must be a valid Kenyan number, " "e.g. 0708419329.")
        return value

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "phone": self.phone,
            "role": self.role.value,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
        }