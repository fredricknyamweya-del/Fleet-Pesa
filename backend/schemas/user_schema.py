from marshmallow import fields, validate, validates, ValidationError
from extensions import ma

import re


class UserSchema(ma.Schema):
    id = fields.Integer(dump_only=True)
    username = fields.String(required=True,validate=validate.Length(min=3, max=80))
    name = fields.String(required=True,validate=validate.Length(min=1, max=120))
    phone = fields.String(required=True)
    password = fields.String(load_only=True,required=True,validate=validate.Length(min=8))
    role = fields.String(load_default="driver", validate=validate.OneOf(["owner", "driver"]))
    created_at = fields.DateTime(dump_only=True)

    @validates("username")
    def validate_username(self, value, **kwargs):
        value = value.strip().lower()
        if len(value) < 3:
            raise ValidationError("Username must be at least 3 characters long.")
        return value

    @validates("phone")
    def validate_phone(self, value, **kwargs):
        value = value.strip()
        value = re.sub(r"[\s\-()]", "", value)
        if not (
            re.fullmatch(r"07\d{8}", value)
            or re.fullmatch(r"01\d{8}", value)
        ):
            raise ValidationError("Phone number must start with 07 or 01 and contain 10 digits.")
        return value


user_schema = UserSchema()
users_schema = UserSchema(many=True)


class ProfileUpdateSchema(ma.Schema):
    name = fields.String(validate=validate.Length(min=1, max=120))
    phone = fields.String()
    notification_preference = fields.String(
        validate=validate.OneOf(["none", "sms", "email"])
    )


class PasswordChangeSchema(ma.Schema):
    current_password = fields.String(required=True, load_only=True)
    new_password = fields.String(
        required=True, load_only=True, validate=validate.Length(min=8)
    )


profile_schema = ProfileUpdateSchema()
password_change_schema = PasswordChangeSchema()
