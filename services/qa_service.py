from datetime import datetime
from extensions import db
from models.qa_question import Question
from models.qa_answer import Answer


def _answer_dict(a):
    return {
        "id": a.id,
        "question_id": a.question_id,
        "body": a.body,
        "answered_by": a.answered_by or "",
        "answered_at": a.answered_at.isoformat() if a.answered_at else "",
        "is_best_answer": a.is_best_answer,
        "approved_by": a.approved_by or "",
        "approved_at": a.approved_at.isoformat() if a.approved_at else "",
    }


def _question_dict(q, include_answers=True):
    return {
        "id": q.id,
        "title": q.title,
        "body": q.body or "",
        "asked_by": q.asked_by or "",
        "asked_at": q.asked_at.isoformat() if q.asked_at else "",
        "status": q.status,
        "category": q.category or "",
        "tags": q.tags or "",
        "answer_count": len(q.answers),
        "answers": [_answer_dict(a) for a in q.answers] if include_answers else [],
    }


def list_questions(status=None, query=None):
    qs = Question.query
    if status and status != "all":
        qs = qs.filter_by(status=status)
    rows = qs.order_by(Question.asked_at.desc()).all()

    if query and query.strip():
        terms = query.strip().lower().split()
        filtered = []
        for q in rows:
            haystack = " ".join([
                q.title or "",
                q.body or "",
                q.tags or "",
                q.category or "",
                " ".join(a.body or "" for a in q.answers),
            ]).lower()
            if all(t in haystack for t in terms):
                filtered.append(q)
        rows = filtered

    return [_question_dict(q) for q in rows]


def create_question(data):
    q = Question(
        title=(data.get("title") or "").strip(),
        body=(data.get("body") or "").strip() or None,
        asked_by=(data.get("asked_by") or "").strip() or None,
        status="open",
        category=(data.get("category") or "").strip() or None,
        tags=(data.get("tags") or "").strip() or None,
    )
    db.session.add(q)
    db.session.commit()
    return _question_dict(q)


def add_answer(question_id, data):
    q = Question.query.get_or_404(question_id)
    a = Answer(
        question_id=q.id,
        body=(data.get("body") or "").strip(),
        answered_by=(data.get("answered_by") or "").strip() or None,
    )
    db.session.add(a)
    if q.status == "open":
        q.status = "answered"
    db.session.commit()
    return _answer_dict(a)


def mark_best_answer(answer_id):
    a = Answer.query.get_or_404(answer_id)
    Answer.query.filter_by(
        question_id=a.question_id, is_best_answer=True
    ).update({"is_best_answer": False})
    a.is_best_answer = True
    db.session.commit()
    return _answer_dict(a)


def approve_answer(answer_id, approved_by=None):
    a = Answer.query.get_or_404(answer_id)
    a.approved_by = approved_by or None
    a.approved_at = datetime.utcnow()
    db.session.commit()
    return _answer_dict(a)