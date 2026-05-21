from extensions import db
from datetime import datetime


class FileGuidance(db.Model):
    __tablename__ = "file_guidance"

    id = db.Column(db.Integer, primary_key=True)
    file_path = db.Column(db.String(600), nullable=False, unique=True)
    file_name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255))
    what_this_file_is_for = db.Column(db.Text)
    when_to_use = db.Column(db.Text)
    do_not_use_when = db.Column(db.Text)
    helps_with = db.Column(db.Text)       # JSON array
    cautions = db.Column(db.Text)
    related_files = db.Column(db.Text)    # JSON array of file_path strings
    tags = db.Column(db.Text)             # JSON array
    status = db.Column(db.String(20), nullable=False, default="draft")
    approved_by = db.Column(db.String(100))
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )