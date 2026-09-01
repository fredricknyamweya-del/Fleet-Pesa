from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from config import Config
from extensions import api, bcrypt, db, jwt, migrate, ma
from models.user import User

# Auth resources
from routes.auth_routes import LoginResource, SignupResource

# Blueprints
from routes.fleet_owner_routes import fleet_owner_bp

# Fare payment resources
from routes.fare_payment_routes import (
    FarePaymentCallback,
    FarePaymentCreate,
    FarePaymentDetail,
)

# Driver assignment resources
from routes.driver_assignment_routes import (
    DriverAssignmentById,
    DriverAssignments,
    UnassignDriver,
    VehicleDriverHistory,
)

# Remittance resources
from routes.remittance_routes import (
    RemittanceDetail,
    RemittanceList,
    RemittancePrompt,
    VehicleRemittanceHistory,
)

# Vehicle resources
from routes.vehicle_routes import VehicleDetail, VehicleList

# System resources
from routes.system_routes import Health

# Schemas for user endpoints
from schemas.user_schema import password_change_schema, profile_schema


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Register auth resources
    api.add_resource(SignupResource, "/auth/signup")
    api.add_resource(LoginResource, "/auth/login")

    # Register driver assignment resources
    api.add_resource(DriverAssignments, "/driver-assignments")
    api.add_resource(DriverAssignmentById, "/driver-assignments/<int:id>")
    api.add_resource(UnassignDriver, "/driver-assignments/<int:id>/unassign")
    api.add_resource(
        VehicleDriverHistory,
        "/vehicles/<int:vehicle_id>/driver-history",
    )

    # Register vehicle resources
    api.add_resource(VehicleList, "/vehicles")
    api.add_resource(VehicleDetail, "/vehicles/<int:vehicle_id>")

    # Register remittance resources
    api.add_resource(
        VehicleRemittanceHistory,
        "/vehicles/<int:vehicle_id>/remittances",
    )
    api.add_resource(RemittanceList, "/remittances")
    api.add_resource(RemittanceDetail, "/remittances/<int:remittance_id>")
    api.add_resource(RemittancePrompt, "/remittances/<int:remittance_id>/prompt")

    # Register fare payment resources
    api.add_resource(FarePaymentCreate, "/fare-payments")
    api.add_resource(FarePaymentDetail, "/fare-payments/<int:payment_id>")
    api.add_resource(FarePaymentCallback, "/fare-payments/mpesa-callback")

    # Register system resources
    api.add_resource(Health, "/")

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    api.init_app(app)

    # Register blueprints
    app.register_blueprint(fleet_owner_bp)

    # Update user profile
    @app.patch("/api/users/me")
    @jwt_required()
    def update_profile():
        try:
            data = profile_schema.load(
                request.get_json(silent=True) or {}
            )
        except ValidationError as error:
            return jsonify(
                message="Invalid profile data",
                errors=error.messages
            ), 400

        if not data:
            return jsonify(
                message="At least one profile field is required"
            ), 400

        user = db.session.get(
            User,
            int(get_jwt_identity())
        )

        if user is None:
            return jsonify(
                message="User not found"
            ), 404

        if (
            "notification_preference" in data
            and user.role != "owner"
        ):
            return jsonify(
                message="Only owners can update notification preferences"
            ), 403

        if (
            "phone" in data
            and User.query.filter(
                User.phone == data["phone"],
                User.id != user.id
            ).first()
        ):
            return jsonify(
                message="phone is already registered"
            ), 409

        for field, value in data.items():
            setattr(user, field, value)

        db.session.commit()

        return jsonify(
            user=user.to_dict()
        )

    # Change password
    @app.patch("/api/users/me/password")
    @jwt_required()
    def change_password():
        try:
            data = password_change_schema.load(
                request.get_json(silent=True) or {}
            )
        except ValidationError as error:
            return jsonify(
                message="Invalid password data",
                errors=error.messages
            ), 400

        user = db.session.get(
            User,
            int(get_jwt_identity())
        )

        if user is None:
            return jsonify(
                message="User not found"
            ), 404

        if not user.check_password(
            data["current_password"]
        ):
            return jsonify(
                message="Current password is incorrect"
            ), 401

        if (
            data["current_password"]
            == data["new_password"]
        ):
            return jsonify(
                message="New password must be different from current password"
            ), 400

        user.set_password(
            data["new_password"]
        )

        db.session.commit()

        return jsonify(
            message="Password updated successfully"
        )

    return app


app = create_app()


# if __name__ == "__main__":
#     app.run(debug=True)

if __name__ == "__main__":
    app.run(port=5555,debug=True)
