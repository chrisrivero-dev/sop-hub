"""add scenario_card table

Revision ID: e4d7c9f2b0a5
Revises: b7f3a2c9d8e1
Create Date: 2026-05-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e4d7c9f2b0a5'
down_revision = 'b7f3a2c9d8e1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'scenario_card',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('plain_english_answer', sa.Text(), nullable=True),
        sa.Column('what_to_do', sa.Text(), nullable=True),
        sa.Column('best_references', sa.Text(), nullable=True),
        sa.Column('escalate_when', sa.Text(), nullable=True),
        sa.Column('trigger_phrases', sa.Text(), nullable=True),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('source_reference', sa.String(length=255), nullable=True),
        sa.Column('source_date', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False,
                  server_default='draft'),
        sa.Column('approved_by', sa.String(length=100), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('scenario_card')