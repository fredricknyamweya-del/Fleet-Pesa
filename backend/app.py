from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Api, Resource
from marshmallow import ValidationError

from config import Config
from extensions import db, bcrypt, jwt, migrate
from models.user import User
from routes.auth_routes import Login, Me, Refresh, Signup
from routes.fare_payment_routes import (
    FarePaymentCallback,
    FarePaymentCreate,
    FarePaymentDetail,
)
from routes.driver_assignment_routes import (
    DriverAssignmentById,
    DriverAssignments,
    UnassignDriver,
    VehicleDriverAssignment,
    VehicleDriverHistory,
)
from routes.remittance_routes import (
    RemittanceDetail,
    RemittanceList,
    RemittancePrompt,
    VehicleRemittanceHistory,
)
from routes.vehicle_routes import VehicleDetail, VehicleList
from schemas.user_schema import password_change_schema, profile_schema


class Health(Resource):
    def get(self):
        return {"message": "Fleet-Pesa API is running"}, 200


class UpdateProfile(Resource):
    @jwt_required()
    def patch(self):
        try:
            data = profile_schema.load(request.get_json(silent=True) or {})
        except ValidationError as error:
            return {
                "message": "Invalid profile data",
                "errors": error.messages,
            }, 400

        if not data:
            return {"message": "At least one profile field is required"}, 400

        user = db.session.get(User, int(get_jwt_identity()))
        if user is None:
            return {"message": "User not found"}, 404
        if "notification_preference" in data and user.role != "admin":
            return {
                "message": "Only owners can update notification preferences"
            }, 403
        if "phone" in data and User.query.filter(
            User.phone == data["phone"], User.id != user.id
        ).first():
            return {"message": "phone is already registered"}, 409

        for field, value in data.items():
            setattr(user, field, value)
        db.session.commit()
        return {"user": user.to_dict()}, 200


class ChangePassword(Resource):
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

        user = db.session.get(User, int(get_jwt_identity()))
        if user is None:
            return {"message": "User not found"}, 404
        if not user.check_password(data["current_password"]):
            return {"message": "Current password is incorrect"}, 401
        if data["current_password"] == data["new_password"]:
            return {
                "message": "New password must be different from current password"
            }, 400

        user.set_password(data["new_password"])
        db.session.commit()
        return {"message": "Password updated successfully"}, 200


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    api = Api(app)

    api.add_resource(Signup, "/api/auth/signup")
    api.add_resource(Login, "/api/auth/login")
    api.add_resource(Refresh, "/api/auth/refresh")
    api.add_resource(Me, "/api/auth/me")
    api.add_resource(DriverAssignments, "/api/driver-assignments")
    api.add_resource(DriverAssignmentById, "/api/driver-assignments/<int:id>")
    api.add_resource(UnassignDriver, "/api/driver-assignments/<int:id>/unassign")
    api.add_resource(
        VehicleDriverAssignment,
        "/api/vehicles/<int:vehicle_id>/assign-driver",
    )
    api.add_resource(
        VehicleDriverHistory,
        "/api/vehicles/<int:vehicle_id>/driver-history",
    )
    api.add_resource(VehicleList, "/api/vehicles")
    api.add_resource(VehicleDetail, "/api/vehicles/<int:vehicle_id>")
    api.add_resource(
        VehicleRemittanceHistory,
        "/api/vehicles/<int:vehicle_id>/remittances",
    )
    api.add_resource(RemittanceList, "/api/remittances")
    api.add_resource(RemittanceDetail, "/api/remittances/<int:remittance_id>")
    api.add_resource(RemittancePrompt, "/api/remittances/<int:remittance_id>/prompt")
    api.add_resource(FarePaymentCreate, "/api/fare-payments")
    api.add_resource(FarePaymentDetail, "/api/fare-payments/<int:payment_id>")
    api.add_resource(FarePaymentCallback, "/api/fare-payments/mpesa-callback")

    api.add_resource(Health, "/")
    api.add_resource(UpdateProfile, "/api/users/me")
    api.add_resource(ChangePassword, "/api/users/me/password")

    CORS(app)
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
