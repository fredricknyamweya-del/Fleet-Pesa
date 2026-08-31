import pytest
from flask import Flask

from extensions import db, bcrypt, jwt, migrate, api
import seed as seed_module
from app import create_app

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


@pytest.fixture
def app(monkeypatch):
    test_app = Flask(__name__)
    test_app.config.from_object(TestConfig)
    db.init_app(test_app)
    monkeypatch.setattr(seed_module, "app", test_app)
    with test_app.app_context():
        db.drop_all()
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def seeded_app(app):
    with app.app_context():
        seed_module.seed()
        yield app

class ApiTestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-secret"
    MPESA_CALLBACK_SECRET = "test-mpesa-secret"

@pytest.fixture
def api_app(monkeypatch):
    test_app = create_app(ApiTestConfig)

    monkeypatch.setattr(seed_module, "app", test_app)

    with test_app.app_context():
        db.drop_all()
        db.create_all()
        seed_module.seed()

        yield test_app

        db.session.remove()
        db.drop_all()
