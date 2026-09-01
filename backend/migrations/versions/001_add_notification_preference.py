from alembic import op
import sqlalchemy as sa


revision = "001_add_notification_preference"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "notification_preference",
                sa.String(length=5),
                nullable=False,
                server_default="none",
            )
        )


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("notification_preference")
