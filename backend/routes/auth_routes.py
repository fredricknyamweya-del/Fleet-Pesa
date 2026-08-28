from flask import Blueprint, request, jsonify
from flask_restful import Resource

from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)

from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from extensions import db
from models.user import User, UserRole
from schemas.user_schema import (
    UserSchema,
    user_schema,
    profile_schema,
    password_change_schema,
)
from utils.phone import normalize_kenyan_phone
# from utils.phone import normalize_kenyan_phone


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth",
)


# ============================================================
# REGISTER
# ============================================================

class RegisterResource(Resource):

    def post(self):
        """Register a new user."""

        data = request.get_json(silent=True) or {}

        try:
            data = user_schema.load(data)

        except ValidationError as error:
            return {"error": error.messages}, 400

        username = data["username"]
        name = data["name"]
        password = data["password"]

        try:
            phone = normalize_kenyan_phone(data["phone"])

        except ValueError as error:
            return {"error": str(error)}, 400

        role_value = data.get("role", "driver")

        try:
            role = UserRole(role_value)

        except ValueError:
            return {"error": "Invalid user role."}, 400

        existing_username = User.query.filter_by(
            username=username
        ).first()

        if existing_username:
            return {
                "error": "That username already exists."
            }, 409

        existing_phone = User.query.filter_by(
            phone=phone
        ).first()

        if existing_phone:
            return {
                "error": "An account with that phone number already exists."
            }, 409

        try:
            new_user = User(
                username=username,
                name=name,
                phone=phone,
                role=role.value,
                fleet_owner_id=data.get("fleet_owner_id"),
            )

            new_user.set_password(password)

            db.session.add(new_user)
            db.session.commit()

            return {
                "message": "Account created successfully.",
                "user": new_user.to_dict(),
            }, 201

        except ValueError as error:
            db.session.rollback()
            return {"error": str(error)}, 400

        except IntegrityError as error:
            db.session.rollback()

            print("DATABASE INTEGRITY ERROR:", error)

            return {
                "error": "Username or phone number already exists."
            }, 409

        except Exception as error:
            db.session.rollback()

            print("REGISTRATION ERROR:", error)

            return {
                "error": "Unable to create account."
            }, 500


# ============================================================
# LOGIN
# ============================================================

class LoginResource(Resource):

    def post(self):
        """Authenticate a user and return JWT tokens."""

        data = request.get_json(silent=True) or {}

        phone = data.get("phone")
        password = data.get("password")

        if not isinstance(phone, str) or not phone.strip():
            return {"error": "Phone number is required."}, 400

        if not isinstance(password, str) or not password:
            return {"error": "Password is required."}, 400

        try:
            phone = normalize_kenyan_phone(phone)

        except ValueError:
            return {
                "error": "Invalid phone number or password."
            }, 401

        user = User.query.filter_by(phone=phone).first()

        if not user or not user.check_password(password):
            return {
                "error": "Invalid phone number or password."
            }, 401

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role
            },
        )

        refresh_token = create_refresh_token(
            identity=str(user.id)
        )

        return {
            "message": "Login successful.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict(),
        }, 200

class CurrentUserResource(Resource):

    @jwt_required()
    def get(self):
        """Return the currently authenticated user."""

        user_id = get_jwt_identity()

        try:
            user_id = int(user_id)

        except (TypeError, ValueError):
            return {
                "error": "Invalid authentication token."
            }, 401

        user = db.session.get(User, user_id)

        if not user:
            return {
                "error": "User account not found."
            }, 404

        return {
            "user": user.to_dict()
        }, 200

class RefreshTokenResource(Resource):

    @jwt_required(refresh=True)
    def post(self):
        """Generate a new access token from a refresh token."""

        user_id = get_jwt_identity()

        try:
            user_id = int(user_id)

        except (TypeError, ValueError):
            return {
                "error": "Invalid authentication token."
            }, 401

        user = db.session.get(User, user_id)

        if not user:
            return {
                "error": "User account not found."
            }, 404

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role
            },
        )

        return {
            "access_token": access_token
        }, 200

class UserProfileResource(Resource):

    @jwt_required()
    def patch(self):
        try:
            data = profile_schema.load(
                request.get_json(silent=True) or {}
            )
        except ValidationError as error:
            return {
                "message": "Invalid profile data",
                "errors": error.messages,
            }, 400

        if not data:
            return {
                "message": "At least one profile field is required"
            }, 400

        user = db.session.get(
            User,
            int(get_jwt_identity())
        )

        if user is None:
            return {
                "message": "User not found"
            }, 404

        if (
            "notification_preference" in data
            and user.role != "owner"
        ):
            return {
                "message": "Only owners can update notification preferences"
            }, 403

        if (
            "phone" in data
            and User.query.filter(
                User.phone == data["phone"],
                User.id != user.id
            ).first()
        ):
            return {
                "message": "phone is already registered"
            }, 409

        for field, value in data.items():
            setattr(user, field, value)

        db.session.commit()

        return {
            "user": user.to_dict()
        }, 200

class PasswordChangeResource(Resource):

    @jwt_required()
    def patch(self):
        try:
            data = password_change_schema.load(
                request.get_json(silent=True) or {}
            )
        except ValidationError as error:
            return {
                "message": "Invalid password data",
                "errors": error.messages,
            }, 400

        user = db.session.get(
            User,
            int(get_jwt_identity())
        )

        if user is None:
            return {
                "message": "User not found"
            }, 404

        if not user.check_password(
            data["current_password"]
        ):
            return {
                "message": "Current password is incorrect"
            }, 401

        if (
            data["current_password"]
            == data["new_password"]
        ):
            return {
                "message": "New password must be different from current password"
            }, 400

        user.set_password(
            data["new_password"]
        )

        db.session.commit()

        return {
            "message": "Password updated successfully"
        }, 200
