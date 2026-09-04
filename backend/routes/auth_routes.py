from datetime import timedelta

from flask import request, make_response
from flask_restful import Resource
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    decode_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from sqlalchemy.exc import IntegrityError

from extensions import db
from models.user import User
from schemas.user_schema import user_schema



class SignupResource(Resource):
    def post(self):
        data = request.get_json(silent=True)
        if not data:
            return {"error": "Request body must contain JSON data."}, 400
        try:
            validated_data = user_schema.load(data)

            username = validated_data["username"]
            name = validated_data["name"]
            phone = validated_data["phone"]
            password = validated_data["password"]
            role = validated_data.get("role", "driver")
            existing_username = User.query.filter_by(username=username).first()
            if existing_username:
                return {"error": "Username already exists."}, 409
            existing_phone = User.query.filter_by(phone=phone).first()
            if existing_phone:
                return {"error": "Phone number already exists."}, 409
            user = User(
                username=username,
                name=name,
                phone=phone,
                role=role
            )
            user.set_password(password)
            db.session.add(user)
            db.session.commit()

            return {
                "message": "Account created successfully.",
                "user": user.to_dict(),
            }, 201

        except ValueError as exc:
            db.session.rollback()

            return {
                "error": str(exc)
            }, 400

        except IntegrityError:
            db.session.rollback()

            return {
                "error": "Username or phone number already exists."
            }, 409

        except Exception as exc:
            db.session.rollback()

            print("Signup error:", exc)

            return {
                "error": (
                    "Unable to create account. "
                    "Please try again."
                )
            }, 500


class LoginResource(Resource):
    def post(self):
        data = request.get_json(silent=True)
        if not data:
            return {"error": "Request body must contain JSON data."}, 400
        phone = str(data.get("phone", "")).strip()
        password = data.get("password")
        role = str(data.get("role", "")).strip().lower()
        if not phone:
            return {"error": "Phone number is required."}, 400
        if not password:
            return { "error": "Password is required."}, 400
        if role not in ("owner", "driver"):
            return {
                "error": "Role must be either owner or driver."
            }, 400
        user = User.query.filter_by(
            phone=phone,
            role=role
        ).first()
        if not user or not user.check_password(password):
            return {
                "error": (
                    "Invalid phone number, password, "
                    "or account type."
                )
            }, 401
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role,
                "phone": user.phone,
            },
            expires_delta=timedelta(hours=10)
        )
        refresh_token = create_refresh_token(identity=str(user.id), expires_delta=timedelta(days=30))
        response = make_response({
            "message": "Login successful.",
            "user": user.to_dict(),
        }, 200)
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)
        return response




class RefreshTokenResource(Resource):
    @jwt_required(refresh=True)
    def post(self):

        user_id = get_jwt_identity()

        if not user_id:
            return {"error": "Invalid refresh token."}, 401
        try:
            user = db.session.get(
                User,
                int(user_id)
            )

        except (ValueError, TypeError):
            return {"error": "Invalid refresh token."}, 401

        if not user:
            return {"error": "User account no longer exists."}, 401

        

        access_token = create_access_token(identity=str(user.id),additional_claims={
                "role": user.role,
                "phone": user.phone,
            },
            expires_delta=timedelta(hours=10)
        )
        response = make_response({"message": "Access token refreshed successfully."}, 200)
        set_access_cookies(response, access_token)
        return response




class LogoutResource(Resource):
    @jwt_required(optional=True)
    def post(self):
        response = make_response({"message": "Logged out successfully."}, 200)
        unset_jwt_cookies(response)
        return response




class ForgotPasswordResource(Resource):
    def post(self):
        data = request.get_json(silent=True)
        if not data:
            return {"error": "Request body must contain JSON data."}, 400
        phone = str(data.get("phone", "")).strip()
        if not phone:
            return {"error": "Phone number is required."}, 400
        user = User.query.filter_by(phone=phone).first()
        if not user:
            return {
                "message": (
                    "If an account exists with this phone number, "
                    "a password reset request has been created."
                )
            }, 200

        

        reset_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "token_type": "password_reset"
            },
            expires_delta=timedelta(minutes=10)
        )
        return {
            "message": "Password reset request created.",
            "reset_token": reset_token
        }, 200




class ResetPasswordResource(Resource):
    def post(self):
        data = request.get_json(silent=True)
        if not data:
            return {"error": "Request body must contain JSON data."}, 400
        reset_token = str(data.get("reset_token", "")).strip()
        new_password = data.get("new_password")
        if not reset_token:
            return {"error": "Reset token is required."}, 400
        if not new_password:
            return {"error": "New password is required."}, 400
        try:
            decoded_token = decode_token(reset_token)
            if decoded_token.get(
                "token_type"
            ) != "password_reset":
                return {"error": "Invalid password reset token."}, 400
            user_id = decoded_token.get("sub")
            if not user_id:
                return {"error": "Invalid password reset token."}, 400
            user = db.session.get(User,int(user_id))
            if not user:
                return {"error": "Invalid password reset token."}, 400
            user.set_password(new_password)
            db.session.commit()
            return {"message": "Password reset successfully."}, 200
        except ValueError as exc:
            db.session.rollback()
            return {"error": str(exc)}, 400
        except Exception as exc:
            db.session.rollback()
            print("Password reset error:",exc)
            return {
                "error": (
                    "Unable to reset password. "
                    "Please try again."
                )
            }, 500



class MeResource(Resource):
    @jwt_required()
    def get(self):

        user_id = get_jwt_identity()
        if not user_id:
            return {"error": "Invalid authentication."}, 401
        try:
            user = db.session.get(User,int(user_id))
        except (ValueError, TypeError):
            return {"error": "Invalid authentication."}, 401
        if not user:
            return {"error": "User account no longer exists."}, 401
        return {"user": user.to_dict()}, 200

