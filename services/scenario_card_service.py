from datetime import datetime


def _to_dict(card):
    return {
        "id": card.id,
        "title": card.title,
        "plain_english_answer": card.plain_english_answer or "",
        "what_to_do": card.what_to_do or "",
        "best_references": card.best_references or "",
        "escalate_when": card.escalate_when or "",
        "trigger_phrases": card.trigger_phrases or "",
        "tags": card.tags or "",
        "source_reference": card.source_reference or "",
        "source_date": card.source_date or "",
        "status": card.status,
        "approved_by": card.approved_by or "",
        "updated_at": card.updated_at.isoformat() if card.updated_at else "",
    }


def search_approved(query):
    from models.scenario_card import ScenarioCard

    base = ScenarioCard.query.filter_by(status="approved")

    if not query or not query.strip():
        return [_to_dict(c) for c in base.order_by(ScenarioCard.title).all()]

    terms = query.strip().lower().split()
    results = []

    for card in base.all():
        haystack = " ".join([
            card.title or "",
            card.plain_english_answer or "",
            card.what_to_do or "",
            card.trigger_phrases or "",
            card.tags or "",
        ]).lower()

        if all(term in haystack for term in terms):
            results.append(card)

    results.sort(key=lambda c: c.title)
    return [_to_dict(c) for c in results]


def get_all_cards(status=None, query=None):
    from models.scenario_card import ScenarioCard

    qs = ScenarioCard.query
    if status and status != "all":
        qs = qs.filter_by(status=status)
    rows = qs.order_by(ScenarioCard.updated_at.desc()).all()

    if query and query.strip():
        terms = query.strip().lower().split()
        rows = [
            c for c in rows
            if all(
                t in " ".join([
                    c.title or "",
                    c.plain_english_answer or "",
                    c.what_to_do or "",
                    c.trigger_phrases or "",
                    c.tags or "",
                    c.source_reference or "",
                ]).lower()
                for t in terms
            )
        ]

    return [_to_dict(c) for c in rows]


def create_card(data):
    from extensions import db
    from models.scenario_card import ScenarioCard

    card = ScenarioCard(
        title=(data.get("title") or "").strip(),
        plain_english_answer=data.get("plain_english_answer") or None,
        what_to_do=data.get("what_to_do") or None,
        best_references=data.get("best_references") or None,
        escalate_when=data.get("escalate_when") or None,
        trigger_phrases=data.get("trigger_phrases") or None,
        tags=data.get("tags") or None,
        source_reference=data.get("source_reference") or None,
        source_date=data.get("source_date") or None,
        status=data.get("status", "draft"),
        approved_by=data.get("approved_by") or None,
        updated_at=datetime.utcnow(),
    )
    db.session.add(card)
    db.session.commit()
    return _to_dict(card)


_EDITABLE_FIELDS = [
    "title", "plain_english_answer", "what_to_do", "best_references",
    "escalate_when", "trigger_phrases", "tags", "source_reference",
    "source_date", "status", "approved_by",
]


def update_card(card_id, data):
    from extensions import db
    from models.scenario_card import ScenarioCard

    card = ScenarioCard.query.get_or_404(card_id)
    for field in _EDITABLE_FIELDS:
        if field not in data:
            continue
        val = (data[field] or "").strip() or None
        if field == "title":
            val = (data[field] or "").strip()
            if not val:
                continue
        setattr(card, field, val)
    card.updated_at = datetime.utcnow()
    db.session.commit()
    return _to_dict(card)


def approve_card(card_id, approved_by=None):
    from extensions import db
    from models.scenario_card import ScenarioCard

    card = ScenarioCard.query.get_or_404(card_id)
    card.status = "approved"
    card.approved_by = (approved_by or "").strip() or None
    card.updated_at = datetime.utcnow()
    db.session.commit()
    return _to_dict(card)


def mark_needs_review_card(card_id):
    from extensions import db
    from models.scenario_card import ScenarioCard

    card = ScenarioCard.query.get_or_404(card_id)
    card.status = "needs_review"
    card.updated_at = datetime.utcnow()
    db.session.commit()
    return _to_dict(card)


def delete_card(card_id):
    from extensions import db
    from models.scenario_card import ScenarioCard

    card = ScenarioCard.query.get_or_404(card_id)
    cid = card.id
    db.session.delete(card)
    db.session.commit()
    return {"deleted": True, "id": cid}
