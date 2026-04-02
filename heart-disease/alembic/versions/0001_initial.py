"""Initial schema: users, patients, doctors, predictions

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-01
"""
from alembic import op
import sqlalchemy as sa

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='patient'),
        sa.Column('is_active', sa.Boolean(), server_default='1'),
        sa.Column('is_verified', sa.Boolean(), server_default='0'),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table(
        'patients',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), unique=True, nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.String()),
        sa.Column('insurance_id', sa.String()),
        sa.Column('insurance_provider', sa.String()),
        sa.Column('phone', sa.String()),
        sa.Column('created_at', sa.DateTime()),
    )

    op.create_table(
        'doctors',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), unique=True, nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('npi_number', sa.String()),
        sa.Column('specialty', sa.String()),
        sa.Column('bio', sa.Text()),
        sa.Column('phone', sa.String()),
        sa.Column('consultation_fee', sa.Float(), server_default='75.0'),
        sa.Column('accepted_insurance', sa.Text(), server_default='[]'),
        sa.Column('is_npi_verified', sa.Boolean(), server_default='0'),
        sa.Column('is_accepting_patients', sa.Boolean(), server_default='1'),
        sa.Column('rating', sa.Float(), server_default='0.0'),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_index('ix_doctors_npi_number', 'doctors', ['npi_number'])

    op.create_table(
        'predictions',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(), nullable=False),
        sa.Column('prediction', sa.Integer(), nullable=False),
        sa.Column('features_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime()),
    )


def downgrade() -> None:
    op.drop_table('predictions')
    op.drop_table('doctors')
    op.drop_table('patients')
    op.drop_table('users')
