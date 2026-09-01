from alembic import op
import sqlalchemy as sa


revision = "9d0bb5326ed5"
down_revision = "1b48b3e4fc0a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "fare_payments",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("payment_method", sa.String(length=20), nullable=False),
        sa.Column(
            "transaction_reference",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["users.id"],
        ),
        sa.UniqueConstraint("transaction_reference"),
    )


def downgrade():
    op.drop_table("fare_payments")
