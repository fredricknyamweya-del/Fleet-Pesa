
from marshmallow import Schema, fields, validate, validates, ValidationError


KENYAN_PHONE_REGEX = r"^(?:0[17]\d{8}|\+254[17]\d{8}|254[17]\d{8})$"


class UserSchema(Schema):
    id = fields.Integer(dump_only=True)

    account_name = fields.String(
        required=False,
        load_only=True,
        validate=validate.Length(min=1, max=150),
    )

    fleet_owner_id = fields.Integer(
        allow_none=True,
        load_default=None,
    )

    username = fields.String(
        required=True,
        validate=validate.Length(min=3, max=100),
    )

    name = fields.String(
        required=True,
        validate=validate.Length(min=2, max=150),
    )

    phone = fields.String(
        required=True,
        validate=validate.Regexp(
            KENYAN_PHONE_REGEX,
            error="Invalid Kenyan phone number.",
        ),
    )

    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=8),
    )

    role = fields.String(
        load_default="driver",
        validate=validate.OneOf(["admin", "driver"]),
    )

    created_at = fields.DateTime(dump_only=True)

    @validates("username")
    def validate_username(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Username is required.")

    @validates("name")
    def validate_name(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Name is required.")


class ProfileSchema(Schema):
    username = fields.String(
        validate=validate.Length(min=3, max=100),
    )

    name = fields.String(
        validate=validate.Length(min=2, max=150),
    )

    phone = fields.String(
        validate=validate.Regexp(
            KENYAN_PHONE_REGEX,
            error="Invalid Kenyan phone number.",
        ),
    )

    @validates("username")
    def validate_username(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Username is required.")

    @validates("name")
    def validate_name(self, value, **kwargs):
        if not value or not value.strip():
            raise ValidationError("Name is required.")


class PasswordChangeSchema(Schema):
    current_password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=8),
    )

    new_password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=8),
    )


user_schema = UserSchema()
users_schema = UserSchema(many=True)

profile_schema = ProfileSchema()
password_change_schema = PasswordChangeSchema()
