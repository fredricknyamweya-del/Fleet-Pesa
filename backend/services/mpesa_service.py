import base64
from datetime import datetime

import requests
from flask import current_app

from utils.mpesa_auth import get_mpesa_access_token, get_mpesa_base_url


def normalize_phone(phone):
    """
    Convert Kenyan phone formats to the format expected by Daraja.

    Accepted examples:
        0712345678
        0112345678
        254712345678
        +254712345678

    Returns:
        254XXXXXXXXX
    """
    digits = "".join(ch for ch in str(phone) if ch.isdigit())

    if digits.startswith("0") and len(digits) == 10:
        return f"254{digits[1:]}"

    if digits.startswith("254") and len(digits) == 12:
        return digits

    raise ValueError("Invalid Kenyan phone number")


def generate_password(timestamp):
    shortcode = current_app.config.get("MPESA_SHORTCODE")
    passkey = current_app.config.get("MPESA_PASSKEY")

    if not shortcode or not passkey:
        raise RuntimeError(
            "M-Pesa shortcode and passkey are not configured"
        )

    raw = f"{shortcode}{passkey}{timestamp}".encode("utf-8")

    return base64.b64encode(raw).decode("utf-8")


def initiate_stk_push(
    phone,
    amount,
    account_reference,
    transaction_desc="FleetPesa Fare Payment",
):
    """
    Initiate an M-Pesa STK Push using Safaricom Daraja.

    Returns the decoded Daraja response.
    """

    shortcode = current_app.config.get("MPESA_SHORTCODE")
    callback_url = current_app.config.get("MPESA_CALLBACK_URL")

    if current_app.config.get("MPESA_TEST_MODE"):
        return {
            "MerchantRequestID": "TEST-MERCHANT-REQUEST",
            "CheckoutRequestID": f"ws_CO_TEST_{account_reference}",
            "ResponseCode": "0",
            "ResponseDescription": "Success. Test mode request accepted",
            "CustomerMessage": "Success. Test mode request accepted",
        }

    if not shortcode:
        raise RuntimeError("M-Pesa shortcode is not configured")

    if not callback_url:
        raise RuntimeError("M-Pesa callback URL is not configured")

    normalized_phone = normalize_phone(phone)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = generate_password(timestamp)
    access_token = get_mpesa_access_token()

    url = (
        f"{get_mpesa_base_url()}"
        "/mpesa/stkpush/v1/processrequest"
    )

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": normalized_phone,
        "PartyB": shortcode,
        "PhoneNumber": normalized_phone,
        "CallBackURL": callback_url,
        "AccountReference": account_reference,
        "TransactionDesc": transaction_desc,
    }

    response = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        timeout=30,
    )

    response.raise_for_status()

    return response.json()
