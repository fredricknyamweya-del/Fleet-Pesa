from flask import request
from flask_restful import Resource
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from sqlalchemy.exc import IntegrityError
from marshmallow import ValidationError

from extensions import db
from models.user import (
    User,
    UserRole,
)
from models.fleet_owner import FleetOwner
from schemas.user_schema import user_schema


class Signup(Resource):
    """
    POST /auth/signup
    Creates a new driver or admin account.
    """

    def post(self):
        json_data = request.get_json(silent=True)

        if not json_data:
            return {
                "error": "Request body is required."
            }, 400

        try:
            data = user_schema.load(json_data)

        except ValidationError as error:
            return {
                "errors": error.messages
            }, 400

        username = data["username"]
        phone = data["phone"]

        # Check username
        existing_username = (
            User.query
            .filter_by(username=username)
            .first()
        )

        if existing_username:
            return {
                "error": "Username already exists."
            }, 409

        # Check phone
        existing_phone = (
            User.query
            .filter_by(phone=phone)
            .first()
        )

        if existing_phone:
            return {
                "error": "Phone number already exists."
            }, 409

        role = data.get("role", UserRole.DRIVER.value)
        fleet_owner = None
        if role == UserRole.ADMIN.value:
            account_name = data.get("account_name")
            if not account_name:
                return {
                    "error": "account_name is required for admin signup."
                }, 400
            fleet_owner = FleetOwner(account_name=account_name)
            db.session.add(fleet_owner)
            db.session.flush()

        user = User(
            username=username,
            name=data["name"],
            phone=phone,
            role=role,
            notification_preference=data.get(
                "notification_preference",
                "none",
            ),
            fleet_owner_id=(
                fleet_owner.id
                if fleet_owner is not None
                else data.get("fleet_owner_id")
            ),
        )

        # Hash password
        try:
            user.set_password(
                data["password"]
            )

        except ValueError as error:
            return {
                "error": str(error)
            }, 400

        try:
            db.session.add(user)
            db.session.commit()

        except IntegrityError:
            db.session.rollback()

            return {
                "error": (
                    "Username or phone number "
                    "already exists."
                )
            }, 409

        except Exception:
            db.session.rollback()

            return {
                "error": "Unable to create account."
            }, 500

        return {
            "message": "Account created successfully.",
            "user": user_schema.dump(user),
        }, 201


class Login(Resource):
    """
    POST /auth/login

    Logs a user in and returns:
        access_token
        refresh_token
    """

    def post(self):
        json_data = request.get_json(silent=True)

        if not json_data:
            return {
                "error": "Request body is required."
            }, 400

        username = json_data.get("username")
        phone = json_data.get("phone")
        password = json_data.get("password")

        if username is None and phone is None:
            return {
                "error": "Username or phone is required."
            }, 400

        if password is None:
            return {
                "error": "Password is required."
            }, 400

        if username is not None:
            username = str(username).strip().lower()

        if phone is not None:
            phone = str(phone).strip()

            # Convert 07XXXXXXXX to +2547XXXXXXXX
            if phone.startswith("07") and len(phone) == 10:
                phone = "+254" + phone[1:]

        if username:
            user = User.query.filter_by(username=username).first()
        else:
            user = User.query.filter_by(phone=phone).first()


        # Do not reveal whether the username exists.
        if user is None:
            return {
                "error": "Invalid username or password."
            }, 401

        # Prevent deactivated users from logging in.
        if not user.is_active:
            return {
                "error": "Account is inactive."
            }, 403

        # Check password
        if not user.check_password(password):
            return {
                "error": "Invalid username or password."
            }, 401

        # Access token
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role,
                "fleet_owner_id": user.fleet_owner_id,
            },
        )

        # Refresh token
        refresh_token = create_refresh_token(
            identity=str(user.id),
        )

        return {
            "message": "Login successful.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user_schema.dump(user),
        }, 200


class Refresh(Resource):
    """
    POST /auth/refresh

    Uses a valid refresh token to generate
    a new access token.
    """

    @jwt_required(refresh=True)
    def post(self):

        user_id = get_jwt_identity()

        try:
            user_id = int(user_id)

        except (TypeError, ValueError):
            return {
                "error": "Invalid user identity."
            }, 401

        user = db.session.get(
            User,
            user_id,
        )

        if user is None:
            return {
                "error": "User not found."
            }, 404

        # Do not issue new access tokens to
        # deactivated users.
        if not user.is_active:
            return {
                "error": "Account is inactive."
            }, 403

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role,
                "fleet_owner_id": user.fleet_owner_id,
            },
        )

        return {
            "access_token": access_token,
        }, 200


class Me(Resource):
    """
    GET /auth/me

    Returns the currently authenticated user.
    """

    @jwt_required()
    def get(self):

        user_id = get_jwt_identity()

        try:
            user_id = int(user_id)

        except (TypeError, ValueError):
            return {
                "error": "Invalid user identity."
            }, 401

        user = db.session.get(
            User,
            user_id,
        )

        if user is None:
            return {
                "error": "User not found."
            }, 404

        if not user.is_active:
            return {
                "error": "Account is inactive."
            }, 403

        return {
            "user": user_schema.dump(user)
        }, 200
