import os
import base64
from dotenv import load_dotenv
from datetime import datetime
import requests

load_dotenv()

class MpesaService:

    BASE_URL = "https://sandbox.safaricom.co.ke"
    def __init__(self):
        self.consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        self.consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        self.shortcode = os.getenv("MPESA_SHORTCODE")
        self.passkey = os.getenv("MPESA_PASSKEY")
        self.callback_url = os.getenv("MPESA_CALLBACK_URL")

    def get_access_token(self):
        url = f"{self.BASE_URL}/oauth/v1/generate"
        response = requests.get(url, params={"grant_type": "client_credentials"}, 
                                auth=(
                                    self.consumer_key,
                                    self.consumer_secret),
                                    timeout=30
                                )
        response.raise_for_status()

        return response.json() ['access_token']

    def stk_push(self, sender_phone_number, receiver_phone_number, amount, account_reference):
        access_token = self.get_access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_string = (
            f"{self.shortcode}"
            f"{self.passkey}"
            f"{timestamp}"
        )
        password = base64.b64encode(password_string.encode()).decode()

        url = f"{self.BASE_URL}/mpesa/stkpush/v1/processrequest"

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": sender_phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": receiver_phone_number,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": "Payment"
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30
        )

        return response.json()
