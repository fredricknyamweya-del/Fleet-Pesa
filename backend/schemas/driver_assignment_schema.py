from marshmallow import Schema, fields


class DriverAssignmentSchema(Schema):
    id = fields.Integer(dump_only=True)

    vehicle_id = fields.Integer(
        required=True,
    )

    driver_id = fields.Integer(
        required=True,
    )

    assigned_at = fields.DateTime(
        dump_only=True,
    )

    unassigned_at = fields.DateTime(
        allow_none=True,
        dump_only=True,
    )


driver_assignment_schema = DriverAssignmentSchema()
driver_assignments_schema = DriverAssignmentSchema(many=True)