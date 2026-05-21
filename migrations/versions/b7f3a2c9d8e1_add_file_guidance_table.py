"""add file_guidance table

Revision ID: b7f3a2c9d8e1
Revises: 26802fcaa0dc
Create Date: 2026-05-21
"""

from alembic import op
import sqlalchemy as sa


revision = "b7f3a2c9d8e1"
down_revision = "26802fcaa0dc"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "file_guidance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("file_path", sa.String(length=600), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=255), nullable=True),
        sa.Column("what_this_file_is_for", sa.Text(), nullable=True),
        sa.Column("when_to_use", sa.Text(), nullable=True),
        sa.Column("do_not_use_when", sa.Text(), nullable=True),
        sa.Column("helps_with", sa.Text(), nullable=True),
        sa.Column("cautions", sa.Text(), nullable=True),
        sa.Column("related_files", sa.Text(), nullable=True),
        sa.Column("tags", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("approved_by", sa.String(length=100), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("file_path"),
    )


def downgrade():
    op.drop_table("file_guidance")