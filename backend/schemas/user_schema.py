from marshmallow import (
    fields,
    validate,
    validates_schema,
    ValidationError,
)

from extensions import ma


class UserSchema(ma.Schema):

    id = fields.Int(dump_only=True)

    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    phone = fields.Str(required=True, validate=validate.Length(min=10, max=20))
    password = fields.Str(required=True,load_only=True, validate=validate.Length(min=8, max=10))
    confirm_password = fields.Str( required=True, load_only=True)
    role = fields.Str(required=True, validate=validate.OneOf(["owner", "driver"]))
    created_at = fields.DateTime(dump_only=True)

    @validates_schema
    def validate_passwords(self, data, **kwargs):
        if data.get("password") != data.get("confirm_password"):
            raise ValidationError({"confirm_password": ["Passwords do not match."]})


user_schema = UserSchema()
users_schema = UserSchema(many=True)