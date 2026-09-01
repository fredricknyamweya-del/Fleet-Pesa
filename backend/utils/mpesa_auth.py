import base64
from datetime import datetime, timedelta, timezone

import requests
from flask import current_app


def get_mpesa_base_url():
    environment = current_app.config.get("MPESA_ENV", "sandbox").lower()

    if environment == "production":
        return "https://api.safaricom.co.ke"
    return "https://sandbox.safaricom.co.ke"


def get_mpesa_access_token():
    consumer_key = current_app.config.get("MPESA_CONSUMER_KEY")
    consumer_secret = current_app.config.get("MPESA_CONSUMER_SECRET")

    if not consumer_key or not consumer_secret:
        raise RuntimeError(
            "M-Pesa Consumer Key and Consumer Secret are not configured"
        )

    credentials = f"{consumer_key}:{consumer_secret}".encode("utf-8")
    encoded_credentials = base64.b64encode(credentials).decode("utf-8")

    url = f"{get_mpesa_base_url()}/oauth/v1/generate?grant_type=client_credentials"

    response = requests.get(
        url,
        headers={
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/json",
        },
        timeout=15,
    )

    response.raise_for_status()

    data = response.json()

    access_token = data.get("access_token")

    if not access_token:
        raise RuntimeError("M-Pesa OAuth response did not contain an access token")

    return access_token
