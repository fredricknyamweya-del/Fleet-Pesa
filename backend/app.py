from flask import Flask , jsonify

from config import config
from models.user import User
from extensions import (db , bcrypt , jwt , ma , migrate)

from routes.auth_routes import auth_bp


def create_app (config_class = config):
    app = Flask(__name__)

    app.config.from_object(config_class)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    migrate.init_app(app,db)






    app.register_blueprint(auth_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({"status" : "healthy" , "service" : "Fleetpesa Backed"}), 200


    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error" : "Authorization token is required."}), 401


    @jwt.expired_token_loader
    def expired_token_callback(jwt_header , jwt_payload):
        return jsonify({"error" : "session token has expired"}), 401


    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error" : "Invalid authorization token"}) , 401

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5555 ,debug=True)