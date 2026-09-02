from flask import request, make_response
from flask_restful import Resource
from services.mpesa import MpesaService


mpesa = MpesaService()


class Mpesa(Resource):

    def post(self):
        data = request.get_json()

        sender_phone_number = data["sender_phone_number"]
        receiver_phone_number = data["receiver_phone_number"]
        amount = data["amount"]
        account_reference = data["account_reference"]

        result = mpesa.stk_push(
            sender_phone_number=sender_phone_number,
            receiver_phone_number=receiver_phone_number,
            amount=amount,
            account_reference=account_reference
        )

        return result, 200

    # The idea below is to process requests sent to our callback URL sent from the Safaricom Mpesa API
    # def get(self):
    #     data = request.get_json()

    #     return make_response(data)


