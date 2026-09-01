from unittest.mock import patch

from models.fare_payment import FarePayment


MOCK_STK_RESPONSE = {
    "MerchantRequestID": "29115-34620561-1",
    "CheckoutRequestID": "ws_CO_TEST_123456789",
    "ResponseCode": "0",
    "ResponseDescription": "Success. Request accepted for processing",
    "CustomerMessage": "Success. Request accepted for processing",
}




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


@patch(
    "routes.fare_payment_routes.initiate_stk_push",
    return_value=MOCK_STK_RESPONSE,
)
def test_owner_can_create_fare_payment(mock_stk, api_app):
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

    mock_stk.assert_called_once()
    call_kwargs = mock_stk.call_args.kwargs

    assert call_kwargs["phone"] == "+254798765999"
    assert call_kwargs["amount"] == 120
    assert call_kwargs["account_reference"] == data["mpesa_reference"]


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


@patch(
    "routes.fare_payment_routes.initiate_stk_push",
    return_value=MOCK_STK_RESPONSE,
)
def test_created_payment_is_persisted(mock_stk, api_app):
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


@patch(
    "routes.fare_payment_routes.initiate_stk_push",
    return_value={
        "ResponseCode": "1",
        "ResponseDescription": "Request failed",
    },
)
def test_fare_payment_marks_failed_when_mpesa_rejects(mock_stk, api_app):
    client = api_app.test_client()

    token = login(client, "owner_moses")

    response = client.post(
        "/api/fare-payments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "vehicle_id": 1,
            "customer_phone": "+254798765777",
            "amount": 100,
        },
    )

    assert response.status_code == 502

    data = response.get_json()["fare_payment"]

    assert data["payment_status"] == "failed"

    mock_stk.assert_called_once()


@patch(
    "routes.fare_payment_routes.initiate_stk_push",
    side_effect=RuntimeError("M-Pesa credentials are not configured"),
)
def test_fare_payment_marks_failed_when_mpesa_service_errors(
    mock_stk,
    api_app,
):
    client = api_app.test_client()

    token = login(client, "owner_moses")

    response = client.post(
        "/api/fare-payments",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "vehicle_id": 1,
            "customer_phone": "+254798765666",
            "amount": 100,
        },
    )

    assert response.status_code == 502

    data = response.get_json()["fare_payment"]

    assert data["payment_status"] == "failed"

    mock_stk.assert_called_once()
