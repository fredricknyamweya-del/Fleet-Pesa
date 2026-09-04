
import os
from datetime import timedelta


class Config:

   

    SQLALCHEMY_DATABASE_URI = os.getenv( "DATABASE_URL", "sqlite:///fleetpesa.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY","fleetpesa-development-secret-key-32-bytes-minimum")
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=10)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_COOKIE_HTTPONLY = True
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_SAMESITE = "Lax"
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_ACCESS_CSRF_HEADER_NAME = "X-CSRF-TOKEN"
    JWT_REFRESH_CSRF_HEADER_NAME = "X-CSRF-TOKEN"


    MPESA_CALLBACK_SECRET = os.getenv("MPESA_CALLBACK_SECRET","")
