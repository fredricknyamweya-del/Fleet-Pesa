from flask import Blueprint , request 
from flask_jwt_extended import (create_access_token , jwt_required , get_jwt_identity)

from app.extensions import db 
from app.models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()

        if not data:
            return {"error" : "JSON body is required"}, 400

        username = data.get("username")
        fullname = data.get("fullname")
        phone_number = data.get("phone_number")
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if not username or not fullname or not phone_number or not password or not confirm_password:
            return {"error" : "username, fullname , phone_number , password and confirm_password are required"}, 400

        if len(password) < 8:
            return {"error" : "password must be at least 8 characters"}, 400

        if password != confirm_password:
            return {"error" : "password do not match"} , 400

        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            return {"error" : "username already exists"}, 409

        existing_phone = User.query.filter_by(phone_number=phone_number).first()

        if existing_phone:
            return {"error"  : "phone number already registered"}, 409

        user = User(username=username, fullname=fullname , phone_number=phone_number)

        user.password_hash = password

        db.session.add(user)
        db.session.commit()

        return {
            "message" : "User register successfully",
            "user" : {
                "id" : user.id,
                "username" : user.username,
                "fullname" : user.fullname,
                "phone_number" : user.phone_number,
                "role" : user.role
            }
        }, 201

    except Exception as e:
        db.session.rollback()

        return {
            "error" : "An error occurred during signup",
            "details" : str(e)
        }, 500



@auth_bp.route("/signin", methods=["POST"])
def signin():
    try:
        data = request.get_json()

        if not data:
            return {
                "error" : "JSON body is required"
            }, 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return {
                "error" : "username and password are required"
            }, 400

        user = User.query.filter_by(username=username).first()

        if not user:
            return {
                "error" : "Invalid username or password"
            }, 401

        access_token = create_access_token(identity=str(user.id))

        return {
            "message" : "signin successful",
            "access_token" : access_token,
            "user" : {
                "id" : user.id,
                "username" : user.username,
                "fullname" : user.fullname,
                "phone_number" : user.phone_number,
                "role" : user.role
            }
        }, 200
    except Exception as e:
        return {
            "error" : "An error occurred during signin",
            "details" : str(e)
        }, 500




@auth_bp.route("/profile", methods=["GET"])  
@jwt_required() 
def profile():
    try:
        user_id = get_jwt_identity()

        user = db.session.get(User, int(user_id))

        if not user:
            return {
                "error" : "user not found"
            }, 404

        return {
            "user": {
                "id": user.id,
                "username" : user.username,
                "fullname" : user.fullname,
                "phone_number" : user.phone_number,
                "role" : user.role
            }
        }, 200

    except Exception as e:
        return {
            "error" : "An error occoured while fetching profile",
            "details" : str(e)
        }, 500
