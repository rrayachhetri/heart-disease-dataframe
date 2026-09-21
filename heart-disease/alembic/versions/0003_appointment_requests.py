"""Add appointment_requests table for external (NPI registry) doctor request-to-book flow.

Revision ID: 0003_appointment_requests
Revises: 0002_appointments
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_appointment_requests"
down_revision = "0002_appointments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "appointment_requests",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("patient_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider_npi", sa.String(), nullable=False),
        sa.Column("provider_name", sa.String(), nullable=False),
        sa.Column("provider_phone", sa.String()),
        sa.Column("specialty", sa.String()),
        sa.Column("insurance", sa.String(), nullable=False),
        sa.Column("preferred_time", sa.DateTime()),
        sa.Column("notes", sa.Text()),
        sa.Column("status", sa.String(), nullable=False, server_default="pending_contact"),
        sa.Column("created_at", sa.DateTime()),
    )
    op.create_index("ix_appointment_requests_patient_id", "appointment_requests", ["patient_id"])
    op.create_index("ix_appointment_requests_provider_npi", "appointment_requests", ["provider_npi"])


def downgrade() -> None:
    op.drop_table("appointment_requests")
