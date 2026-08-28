from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Api
from marshmallow import ValidationError

from resources.health_resource import HealthResource
from routes.vehicle_routes import vehicle_bp, VehicleResource
from resources.vehicle_resource import VehicleListResource

from config import Config
from extensions import bcrypt, db, jwt, migrate
from models.fleet_owner import FleetOwner
from models.user import User

from routes.auth_routes import (
    auth_bp,
    RegisterResource,
    LoginResource,
)
from routes.remittance_routes import (
    remittance_bp,
    VehicleRemittanceHistoryResource,
    PaymentPromptResource,
)

from schemas.user_schema import password_change_schema, profile_schema


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    api = Api(app)

    api.add_resource(HealthResource, "/")

    api.add_resource(
        RegisterResource,
        "/api/auth/register",
    )

    api.add_resource(
        LoginResource,
        "/api/auth/login",
    )

    api.add_resource(
        VehicleRemittanceHistoryResource,
        "/api/vehicles/<int:vehicle_id>/remittances",
    )

    api.add_resource(
        PaymentPromptResource,
        "/api/remittances/<int:remittance_id>/prompt",
    )

    api.add_resource(
        VehicleListResource,
        "/api/vehicles",
    )

    api.add_resource(
        VehicleResource,
        "/api/vehicles/<int:vehicle_id>",
    )

    CORS(app)
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(remittance_bp)
    app.register_blueprint(vehicle_bp)


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


if __name__ == "__main__":
    app.run(debug=True)
