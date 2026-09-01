from alembic import op
import sqlalchemy as sa


revision = "1b48b3e4fc0a"
down_revision = "001_add_notification_preference"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "fleet_owners",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("account_name", sa.String(length=150), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
        ),
    )

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("fleet_owner_id", sa.Integer(), nullable=True)
        )

        batch_op.create_index(
            "ix_users_fleet_owner_id",
            ["fleet_owner_id"],
            unique=False,
        )

        batch_op.create_foreign_key(
            "fk_users_fleet_owner_id",
            "fleet_owners",
            ["fleet_owner_id"],
            ["id"],
        )


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_constraint(
            "fk_users_fleet_owner_id",
            type_="foreignkey",
        )
        batch_op.drop_index("ix_users_fleet_owner_id")
        batch_op.drop_column("fleet_owner_id")

    op.drop_table("fleet_owners")
