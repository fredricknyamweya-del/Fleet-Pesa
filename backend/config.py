import os


class Config:
	SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///fleetpesa.db")
	SQLALCHEMY_TRACK_MODIFICATIONS = False
	JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-only-secret")
	MPESA_CALLBACK_SECRET = os.getenv("MPESA_CALLBACK_SECRET", "")
	JWT_TOKEN_LOCATION = ['cookies']
	JWT_ACCESS_COOKIE_NAME = 'access_token_cookie'
	JWT_COOKIE_CSRF_PROTECT = False
	# JWT_COOKIE_HTTPONLY = True

