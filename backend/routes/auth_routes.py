from flask import request
from flask_restful import Resource
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError

from extensions import db
from models.user import User
from schemas.user_schema import user_schema


class SignupResource(Resource):
    """
    POST /api/auth/signup

    Creates a new FleetPesa user using username, phone number,
    name, password, and role.
    """
    def post(self):
        data = request.get_json(silent=True)

        if not data:
            return {"error": "Request body must contain JSON data."}, 400

        try:
            # ---------------------------------------------------------
            # Validate and deserialize request data
            # ---------------------------------------------------------
            validated_data = user_schema.load(data)

            username = validated_data["username"]
            name = validated_data["name"]
            phone = validated_data["phone"]
            password = validated_data["password"]
            role = validated_data.get("role", "driver")

            # ---------------------------------------------------------
            # Check for existing username
            # ---------------------------------------------------------
            existing_username = User.query.filter_by(username=username).first()

            if existing_username:
                return {"error": "Username already exists."}, 409

            # ---------------------------------------------------------
            # Check for existing phone number
            # ---------------------------------------------------------
            existing_phone = User.query.filter_by(phone=phone).first()

            if existing_phone:
                return {"error": "Phone number already exists."}, 409

            
            # Create user
            
            user = User(
                username=username,
                name=name,
                phone=phone,
                role=role
            )

            # Never store plain-text passwords
            user.set_password(password)

            db.session.add(user)
            db.session.commit()

            return {"message": "Account created successfully.","user": user.to_dict(),}, 201

        except ValueError as exc:
            db.session.rollback()

            return {"error": str(exc)}, 400

        except IntegrityError:
            db.session.rollback()

            return {"error": "Username or phone number already exists."}, 409

        except Exception as exc:
            db.session.rollback()

            print("Signup error:", exc)

            return {"error": "Unable to create account. Please try again."}, 500




class LoginResource(Resource):
    """
    POST /api/auth/login

    Authenticates an owner or driver using phone number and password.
    """

    def post(self):
        data = request.get_json(silent=True)

        if not data:
            return {"error": "Request body must contain JSON data."}, 400

        phone = str(data.get("phone", "")).strip()
        password = data.get("password")
        role = str(data.get("role", "")).strip().lower()

        # -------------------------------------------------------------
        # Validate required fields
        # -------------------------------------------------------------
        if not phone:
            return {"error": "Phone number is required."}, 400

        if not password:
            return {"error": "Password is required."}, 400

        if role not in ("owner", "driver"):
            return {"error": "Role must be either owner or driver."}, 400

        # -------------------------------------------------------------
        # Find user
        # -------------------------------------------------------------
        user = User.query.filter_by(
            phone=phone,
            role=role
        ).first()

        # Do not reveal whether phone or password was incorrect
        if not user or not user.check_password(password):
            return {
                "error": "Invalid phone number, password, or account type."
            }, 401

        # -------------------------------------------------------------
        # Create JWT
        # -------------------------------------------------------------
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role,
                "phone": user.phone,
            },
        )

        # -------------------------------------------------------------
        # Response
        # -------------------------------------------------------------
        return {
            "message": "Login successful.",
            "user": user.to_dict(),
        }, 200



