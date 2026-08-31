

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a5423a0b87b9"
down_revision = "5e1802c7fdd7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("fare_payments", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "customer_phone",
                sa.String(length=15),
                nullable=False,
            )
        )

        batch_op.add_column(
            sa.Column(
                "mpesa_reference",
                sa.String(length=100),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "mpesa_transaction_code",
                sa.String(length=100),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "payment_status",
                sa.String(length=20),
                nullable=False,
            )
        )

        batch_op.add_column(
            sa.Column(
                "requested_at",
                sa.DateTime(),
                nullable=False,
            )
        )

        batch_op.create_unique_constraint(
            "uq_fare_payments_mpesa_reference",
            ["mpesa_reference"],
        )

        batch_op.drop_column("status")
        batch_op.drop_column("driver_id")
        batch_op.drop_column("payment_method")
        batch_op.drop_column("paid_at")
        batch_op.drop_column("transaction_reference")


def downgrade():
    with op.batch_alter_table("fare_payments", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "transaction_reference",
                sa.String(length=100),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "paid_at",
                sa.DateTime(),
                nullable=False,
            )
        )

        batch_op.add_column(
            sa.Column(
                "payment_method",
                sa.String(length=20),
                nullable=False,
            )
        )

        batch_op.add_column(
            sa.Column(
                "driver_id",
                sa.Integer(),
                nullable=False,
            )
        )

        batch_op.add_column(
            sa.Column(
                "status",
                sa.String(length=20),
                nullable=False,
            )
        )

        batch_op.create_foreign_key(
            "fk_fare_payments_driver_id_users",
            "users",
            ["driver_id"],
            ["id"],
        )

        batch_op.drop_constraint(
            "uq_fare_payments_mpesa_reference",
            type_="unique",
        )

        batch_op.drop_column("requested_at")
        batch_op.drop_column("payment_status")
        batch_op.drop_column("mpesa_transaction_code")
        batch_op.drop_column("mpesa_reference")
        batch_op.drop_column("customer_phone")
