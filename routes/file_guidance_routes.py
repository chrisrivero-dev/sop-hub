from flask import Blueprint, jsonify, request
from services.file_guidance_service import (
    get_by_path,
    save_guidance,
    set_status,
    batch_lookup,
    import_drafts,
)

file_guidance_bp = Blueprint("file_guidance", __name__, url_prefix="/file-guidance")


@file_guidance_bp.get("")
def get_guidance():
    path = request.args.get("path", "").strip()
    if not path:
        return jsonify({"ok": False, "error": "Missing path parameter."}), 400

    result = get_by_path(path)
    if result is None:
        return jsonify({"ok": False, "error": "No guidance found for this path."}), 404

    return jsonify({"ok": True, "guidance": result}), 200


@file_guidance_bp.post("")
def upsert_guidance():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ok": False, "error": "Request body must be JSON."}), 400

    result, created = save_guidance(data)
    if result is None:
        return jsonify({"ok": False, "error": "Missing file_path or file_name."}), 400

    return jsonify({"ok": True, "guidance": result, "created": created}), 201 if created else 200


@file_guidance_bp.post("/approve")
def approve_guidance():
    data = request.get_json(silent=True) or {}
    path = data.get("file_path", "").strip()
    approved_by = data.get("approved_by", "").strip() or None

    if not path:
        return jsonify({"ok": False, "error": "Missing file_path."}), 400

    result = set_status(path, "approved", approved_by=approved_by)
    if result is None:
        return jsonify({"ok": False, "error": "Guidance record not found."}), 404

    return jsonify({"ok": True, "guidance": result}), 200


@file_guidance_bp.post("/needs-review")
def flag_needs_review():
    data = request.get_json(silent=True) or {}
    path = data.get("file_path", "").strip()

    if not path:
        return jsonify({"ok": False, "error": "Missing file_path."}), 400

    result = set_status(path, "needs_review")
    if result is None:
        return jsonify({"ok": False, "error": "Guidance record not found."}), 404

    return jsonify({"ok": True, "guidance": result}), 200


@file_guidance_bp.post("/lookup")
def lookup_approved():
    data = request.get_json(silent=True) or {}
    paths = data.get("paths", [])

    if not isinstance(paths, list) or not paths:
        return jsonify({"ok": False, "error": "paths must be a non-empty list."}), 400

    results = batch_lookup(paths)
    return jsonify({"ok": True, "guidance": results}), 200


@file_guidance_bp.post("/import")
def import_guidance_drafts():
    data = request.get_json(silent=True)
    if not isinstance(data, list):
        return jsonify({"ok": False, "error": "Request body must be a JSON array."}), 400

    summary = import_drafts(data)
    return jsonify(summary), 200