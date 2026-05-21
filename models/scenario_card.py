from extensions import db
from datetime import datetime


class ScenarioCard(db.Model):
    __tablename__ = "scenario_card"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    plain_english_answer = db.Column(db.Text)
    what_to_do = db.Column(db.Text)
    best_references = db.Column(db.Text)
    escalate_when = db.Column(db.Text)
    trigger_phrases = db.Column(db.Text)
    tags = db.Column(db.Text)
    source_reference = db.Column(db.String(255))
    source_date = db.Column(db.String(50))
    status = db.Column(db.String(20), nullable=False, default="draft")
    approved_by = db.Column(db.String(100))
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )