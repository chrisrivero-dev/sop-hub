from extensions import db
from datetime import datetime


class Question(db.Model):
    __tablename__ = "qa_question"

    id        = db.Column(db.Integer, primary_key=True)
    title     = db.Column(db.String(300), nullable=False)
    body      = db.Column(db.Text)
    asked_by  = db.Column(db.String(100))
    asked_at  = db.Column(db.DateTime, default=datetime.utcnow)
    status    = db.Column(db.String(20), nullable=False, default="open")
    category  = db.Column(db.String(100))
    tags      = db.Column(db.Text)

    answers = db.relationship(
        "Answer",
        backref="question",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="Answer.answered_at",
    )