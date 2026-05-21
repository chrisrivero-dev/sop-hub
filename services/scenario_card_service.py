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
    """Return approved cards matching all query terms across key fields."""
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


def create_card(data):
    """Insert a new ScenarioCard. Returns the saved dict."""
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