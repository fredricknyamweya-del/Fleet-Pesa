import os


class Config:
	SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///fleetpesa.db")
	SQLALCHEMY_TRACK_MODIFICATIONS = False
	JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-only-secret")
	MPESA_CALLBACK_SECRET = os.getenv("MPESA_CALLBACK_SECRET", "")
