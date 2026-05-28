from extensions import db
from datetime import datetime


class Answer(db.Model):
    __tablename__ = "qa_answer"

    id             = db.Column(db.Integer, primary_key=True)
    question_id    = db.Column(db.Integer, db.ForeignKey("qa_question.id"), nullable=False)
    body           = db.Column(db.Text, nullable=False)
    answered_by    = db.Column(db.String(100))
    answered_at    = db.Column(db.DateTime, default=datetime.utcnow)
    is_best_answer = db.Column(db.Boolean, default=False)
    approved_by    = db.Column(db.String(100))
    approved_at    = db.Column(db.DateTime)