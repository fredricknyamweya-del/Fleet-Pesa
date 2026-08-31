from models.fare_payment import FarePayment


def login(client, username, password="fleetpesa123"):
    response = client.post(
        "/api/auth/login",
        json={
            "username": username,
            "password": password,
        },
    )
    assert response.status_code == 200
    return response.get_json()["access_token"]


def test_owner_can_create_fare_payment(api_app):
    client = api_app.test_client()

    token = login(client, "owner_moses")

    response = client.post(
        "/api/fare-payments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "vehicle_id": 1,
            "customer_phone": "+254798765999",
            "amount": 120,
        },
    )

    assert response.status_code == 201

    data = response.get_json()["fare_payment"]

    assert data["vehicle_id"] == 1
    assert data["customer_phone"] == "+254798765999"
    assert data["amount"] == "120.00"
    assert data["payment_status"] == "pending"
    assert data["mpesa_reference"].startswith("FP-")
    assert len(data["mpesa_reference"]) == 27
    assert data["mpesa_transaction_code"] is None


def test_create_fare_payment_requires_authentication(api_app):
    client = api_app.test_client()

    response = client.post(
        "/api/fare-payments",
        json={
            "vehicle_id": 1,
            "customer_phone": "+254798765999",
            "amount": 120,
        },
    )

    assert response.status_code == 401


def test_owner_cannot_create_payment_for_another_fleet(api_app):
    client = api_app.test_client()

    token = login(client, "owner_peter")

    response = client.post(
        "/api/fare-payments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "vehicle_id": 1,
            "customer_phone": "+254798765999",
            "amount": 120,
        },
    )

    assert response.status_code == 403


def test_create_fare_payment_with_unknown_vehicle(api_app):
    client = api_app.test_client()

    token = login(client, "owner_moses")

    response = client.post(
        "/api/fare-payments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "vehicle_id": 99999,
            "customer_phone": "+254798765999",
            "amount": 120,
        },
    )

    assert response.status_code == 404


def test_get_fare_payment_as_owner(api_app):
    client = api_app.test_client()

    token = login(client, "owner_moses")

    response = client.get(
        "/api/fare-payments/1",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.get_json()["fare_payment"]

    assert data["id"] == 1
    assert data["vehicle_id"] == 1
    assert data["mpesa_reference"] == "FARE-2001"
    assert data["payment_status"] == "confirmed"


def test_get_fare_payment_as_current_driver(api_app):
    client = api_app.test_client()

    token = login(client, "driver_james")

    response = client.get(
        "/api/fare-payments/1",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200


def test_former_driver_can_read_historical_payment(api_app):
    client = api_app.test_client()

    token = login(client, "driver_alex")

    response = client.get(
        "/api/fare-payments/1",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_get_unknown_fare_payment(api_app):
    client = api_app.test_client()

    token = login(client, "owner_moses")

    response = client.get(
        "/api/fare-payments/99999",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404


def test_mpesa_callback_requires_valid_secret(api_app):
    client = api_app.test_client()

    response = client.post(
        "/api/fare-payments/mpesa-callback",
        json={
            "mpesa_reference": "FARE-2002",
            "mpesa_transaction_code": "SFC2TEST123",
        },
        headers={
            "X-MPESA-CALLBACK-SECRET": "wrong-secret",
        },
    )

    assert response.status_code == 401


def test_mpesa_callback_confirms_payment(api_app):
    client = api_app.test_client()

    response = client.post(
        "/api/fare-payments/mpesa-callback",
        json={
            "mpesa_reference": "FARE-2002",
            "mpesa_transaction_code": "SFC2TEST123",
            "payment_status": "confirmed",
        },
        headers={
            "X-MPESA-CALLBACK-SECRET": "test-mpesa-secret",
        },
    )

    assert response.status_code == 200

    data = response.get_json()["fare_payment"]

    assert data["mpesa_reference"] == "FARE-2002"
    assert data["mpesa_transaction_code"] == "SFC2TEST123"
    assert data["payment_status"] == "confirmed"

    payment = api_app.extensions["sqlalchemy"].session.get(
        FarePayment,
        2,
    )

    assert payment.mpesa_transaction_code == "SFC2TEST123"
    assert payment.payment_status == "confirmed"


def test_mpesa_callback_unknown_reference(api_app):
    client = api_app.test_client()

    response = client.post(
        "/api/fare-payments/mpesa-callback",
        json={
            "mpesa_reference": "DOES-NOT-EXIST",
            "mpesa_transaction_code": "SFC2UNKNOWN",
        },
        headers={
            "X-MPESA-CALLBACK-SECRET": "test-mpesa-secret",
        },
    )

    assert response.status_code == 404


def test_mpesa_callback_rejects_invalid_payload(api_app):
    client = api_app.test_client()

    response = client.post(
        "/api/fare-payments/mpesa-callback",
        json={
            "mpesa_reference": "FARE-2002",
        },
        headers={
            "X-MPESA-CALLBACK-SECRET": "test-mpesa-secret",
        },
    )

    assert response.status_code == 400


def test_created_payment_is_persisted(api_app):
    client = api_app.test_client()

    token = login(client, "owner_moses")

    response = client.post(
        "/api/fare-payments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "vehicle_id": 2,
            "customer_phone": "+254798765888",
            "amount": 75.50,
        },
    )

    assert response.status_code == 201

    payment_id = response.get_json()["fare_payment"]["id"]

    payment = api_app.extensions["sqlalchemy"].session.get(
        FarePayment,
        payment_id,
    )

    assert payment is not None
    assert payment.vehicle_id == 2
    assert payment.amount == 75.50
