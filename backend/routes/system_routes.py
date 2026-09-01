from flask_restful import Resource
class Health(Resource):
    def get(self):
        return {"message": "Fleet-Pesa API is running"}, 200
