from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class SOP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    content = db.Column(db.Text)
    tags = db.Column(db.String(255))
    editor = db.Column(db.String(100))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<SOP {self.title}>"

class Recent(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(600), nullable=False)

    opened_at = db.Column(db.DateTime, default=datetime.utcnow)

    notes = db.Column(db.Text, default="")
    file_type = db.Column(db.String(20))     # pdf, docx, txt
    folder = db.Column(db.String(255))
class Reference(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(600), nullable=False)
    folder = db.Column(db.String(255))  # Folder path relative to Q:\WORD
    notes = db.Column(db.Text, default="")  # User notes per document
    pinned = db.Column(db.Boolean, default=False)  # Whether the document is pinned to the library
    added_at = db.Column(db.DateTime, default=datetime.utcnow)  # When the reference was added

    def __repr__(self):
        return f"<Reference {self.file_name}>"
