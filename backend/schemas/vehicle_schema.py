from marshmallow import Schema, fields, validate

PLATE_NUMBER_REGEX = r"^[A-Z]{2,3}\s?\d{3}[A-Z]$"


class VehicleCreateSchema(Schema):
	plate_number = fields.Str(required=True, validate=validate.Regexp(PLATE_NUMBER_REGEX, error="plate_number must look like KDA 001A"))
	vehicle_type = fields.Str(required=True, validate=validate.OneOf(("matatu", "minibus", "bus")))
	daily_expected_amount = fields.Decimal(required=True, places=2, as_string=False, validate=validate.Range(min=0))


vehicle_create_schema = VehicleCreateSchema()


class VehicleUpdateSchema(Schema):
	plate_number = fields.Str(required=False, validate=validate.Regexp(PLATE_NUMBER_REGEX, error="plate_number must look like KDA 001A"))
	vehicle_type = fields.Str(required=False, validate=validate.OneOf(("matatu", "minibus", "bus")))
	daily_expected_amount = fields.Decimal(required=False, places=2, as_string=False, validate=validate.Range(min=0))
	is_active = fields.Bool(required=False)


vehicle_update_schema = VehicleUpdateSchema()


class VehicleSchema(Schema):
	id = fields.Int(dump_only=True)
	plate_number = fields.Str(required=True)
	vehicle_type = fields.Str(required=True)
	fleet_owner_id = fields.Int(required=True)
	daily_expected_amount = fields.Decimal(as_string=True, required=True)
	is_active = fields.Bool()


vehicle_schema = VehicleSchema()
vehicles_schema = VehicleSchema(many=True)