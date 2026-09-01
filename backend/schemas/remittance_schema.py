from marshmallow import Schema, fields, validate


class RemittanceCreateSchema(Schema):
	vehicle_id = fields.Int(required=True, validate=validate.Range(min=1))
	expected_amount = fields.Decimal(required=True, places=2, as_string=False, validate=validate.Range(min=0))
	actual_amount = fields.Decimal(required=True, places=2, as_string=False, validate=validate.Range(min=0))
	status = fields.Str(required=False, validate=validate.OneOf(("paid", "short")))
	payment_status = fields.Str(required=False, load_default="pending", validate=validate.OneOf(("pending", "confirmed", "failed")))
	mpesa_reference = fields.Str(required=False, allow_none=True, validate=validate.Length(max=50))
	mpesa_transaction_code = fields.Str(required=False, allow_none=True, validate=validate.Length(max=20))
	flagged_for_followup = fields.Bool(required=False, load_default=False)


remittance_create_schema = RemittanceCreateSchema()


class RemittanceUpdateSchema(Schema):
	actual_amount = fields.Decimal(required=False, places=2, as_string=False, validate=validate.Range(min=0))
	status = fields.Str(required=False, validate=validate.OneOf(("paid", "short")))
	payment_status = fields.Str(required=False, validate=validate.OneOf(("pending", "confirmed", "failed")))
	mpesa_reference = fields.Str(required=False, allow_none=True, validate=validate.Length(max=50))
	mpesa_transaction_code = fields.Str(required=False, allow_none=True, validate=validate.Length(max=20))
	flagged_for_followup = fields.Bool(required=False)


remittance_update_schema = RemittanceUpdateSchema()


class RemittanceFilterSchema(Schema):
	status = fields.Str(required=False, validate=validate.OneOf(("paid", "short", "all")))
	vehicle_id = fields.Int(required=False, validate=validate.Range(min=1))
	date_from = fields.Date(required=False, data_key="from")
	date_to = fields.Date(required=False, data_key="to")


remittance_filter_schema = RemittanceFilterSchema()


class RemittanceSchema(Schema):
	id = fields.Int(dump_only=True)
	vehicle_id = fields.Int()
	expected_amount = fields.Decimal(as_string=True)
	actual_amount = fields.Decimal(as_string=True)
	status = fields.Str()
	payment_status = fields.Str()
	mpesa_reference = fields.Str(allow_none=True)
	mpesa_transaction_code = fields.Str(allow_none=True)
	flagged_for_followup = fields.Bool()
	submitted_at = fields.DateTime()


remittance_schema = RemittanceSchema()
remittances_schema = RemittanceSchema(many=True)