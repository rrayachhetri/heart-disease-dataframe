"""Add doctor appointment slots and patient bookings.

Revision ID: 0002_appointments
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_appointments"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "appointment_slots",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("doctor_id", sa.String(), sa.ForeignKey("doctors.id"), nullable=False),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime()),
        sa.UniqueConstraint("doctor_id", "starts_at", name="uq_doctor_slot_start"),
    )
    op.create_index("ix_appointment_slots_doctor_id", "appointment_slots", ["doctor_id"])
    op.create_index("ix_appointment_slots_starts_at", "appointment_slots", ["starts_at"])
    op.create_table(
        "appointment_bookings",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("slot_id", sa.String(), sa.ForeignKey("appointment_slots.id"), nullable=False, unique=True),
        sa.Column("patient_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("insurance_plan", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="confirmed"),
        sa.Column("created_at", sa.DateTime()),
    )
    op.create_index("ix_appointment_bookings_patient_id", "appointment_bookings", ["patient_id"])


def downgrade() -> None:
    op.drop_table("appointment_bookings")
    op.drop_table("appointment_slots")