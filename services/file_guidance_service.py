import os
import json
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError


# ======================================================
# HELPERS
# ======================================================

def _normalize(path):
    return os.path.normcase(os.path.normpath(path.strip()))


def _to_json(value):
    if isinstance(value, list):
        return json.dumps(value)
    if value is None:
        return "[]"
    return value


def _from_json(value):
    if not value:
        return []
    try:
        result = json.loads(value)
        return result if isinstance(result, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def _to_dict(record):
    return {
        "id": record.id,
        "file_path": record.file_path,
        "file_name": record.file_name,
        "role": record.role or "",
        "what_this_file_is_for": record.what_this_file_is_for or "",
        "when_to_use": record.when_to_use or "",
        "do_not_use_when": record.do_not_use_when or "",
        "helps_with": _from_json(record.helps_with),
        "cautions": record.cautions or "",
        "related_files": _from_json(record.related_files),
        "tags": _from_json(record.tags),
        "status": record.status,
        "approved_by": record.approved_by or "",
        "updated_at": record.updated_at.isoformat() if record.updated_at else "",
    }


def _apply_fields(record, data):
    record.role = data.get("role") or None
    record.what_this_file_is_for = data.get("what_this_file_is_for") or None
    record.when_to_use = data.get("when_to_use") or None
    record.do_not_use_when = data.get("do_not_use_when") or None
    record.helps_with = _to_json(data.get("helps_with") or [])
    record.cautions = data.get("cautions") or None
    record.related_files = _to_json(data.get("related_files") or [])
    record.tags = _to_json(data.get("tags") or [])
    record.updated_at = datetime.utcnow()


# ======================================================
# PUBLIC API
# ======================================================

def get_by_path(file_path):
    """Return guidance dict for a path, or None if not found."""
    from extensions import db
    from models.file_guidance import FileGuidance

    record = FileGuidance.query.filter_by(file_path=_normalize(file_path)).first()
    return _to_dict(record) if record else None


def save_guidance(data):
    """
    Upsert guidance for a file_path.
    Status is preserved on update; new records always start as draft.
    Returns (dict, created: bool) or (None, False) on validation failure.
    """
    from extensions import db
    from models.file_guidance import FileGuidance

    file_path = (data.get("file_path") or "").strip()
    file_name = (data.get("file_name") or "").strip()

    if not file_path or not file_name:
        return None, False

    norm = _normalize(file_path)
    record = FileGuidance.query.filter_by(file_path=norm).first()
    created = False

    if not record:
        record = FileGuidance(file_path=norm, file_name=file_name, status="draft")
        db.session.add(record)
        created = True
    else:
        record.file_name = file_name

    _apply_fields(record, data)
    db.session.commit()
    return _to_dict(record), created


def set_status(file_path, status, approved_by=None):
    """
    Set status on an existing guidance record.
    Returns updated dict, or None if record not found.
    """
    from extensions import db
    from models.file_guidance import FileGuidance

    record = FileGuidance.query.filter_by(file_path=_normalize(file_path)).first()
    if not record:
        return None

    record.status = status
    record.updated_at = datetime.utcnow()

    if status == "approved" and approved_by:
        record.approved_by = approved_by

    db.session.commit()
    return _to_dict(record)


def batch_lookup(paths):
    """
    Return approved guidance for a list of paths.
    Only approved records are returned — draft and needs_review are excluded.
    Returns: { normalized_path: guidance_dict, ... }
    """
    from models.file_guidance import FileGuidance

    if not paths:
        return {}

    norm_paths = [_normalize(p) for p in paths if p]
    records = FileGuidance.query.filter(
        FileGuidance.file_path.in_(norm_paths),
        FileGuidance.status == "approved",
    ).all()

    return {r.file_path: _to_dict(r) for r in records}


def import_drafts(records):
    """
    Import a list of guidance dicts as drafts.
    - New records: inserted with status='draft'.
    - Existing records: fields updated, status set to 'needs_review'.
    - Status from input is always ignored.
    Returns summary dict.
    """
    from extensions import db
    from models.file_guidance import FileGuidance

    imported = 0
    updated = 0
    skipped = 0
    errors = []

    for item in records:
        file_path = (item.get("file_path") or "").strip()
        file_name = (item.get("file_name") or "").strip()

        if not file_path or not file_name:
            skipped += 1
            errors.append(f"Missing file_path or file_name: {item}")
            continue

        try:
            norm = _normalize(file_path)
            record = FileGuidance.query.filter_by(file_path=norm).first()

            if record:
                record.file_name = file_name
                _apply_fields(record, item)
                record.status = "needs_review"
                updated += 1
            else:
                record = FileGuidance(
                    file_path=norm,
                    file_name=file_name,
                    status="draft",
                )
                _apply_fields(record, item)
                db.session.add(record)
                imported += 1

            db.session.commit()

        except SQLAlchemyError as exc:
            db.session.rollback()
            skipped += 1
            errors.append(f"DB error on {file_path}: {exc}")

    return {
        "ok": True,
        "imported": imported,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
    }