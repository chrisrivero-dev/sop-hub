from flask import Blueprint, jsonify, request
from services.file_summary_service import summarize_file

file_summary_bp = Blueprint("file_summary", __name__)


@file_summary_bp.get("/file-summary")
def file_summary():
    path = request.args.get("path", "").strip()

    if not path:
        return jsonify({"ok": False, "error": "Missing path parameter."}), 400

    result = summarize_file(path)

    # Service returned a hard failure (ok: False)
    if not result.get("ok"):
        error = result.get("error", "")
        error_lower = error.lower()

        if "outside approved" in error_lower:
            return jsonify(result), 403

        if "not found" in error_lower or "missing" in error_lower:
            return jsonify(result), 404

        if "not a file" in error_lower:
            return jsonify(result), 400

        return jsonify(result), 500

    # Service returned ok: True — includes both supported and unsupported files.
    # Unsupported file types (ok true, supported false) are not route errors.
    return jsonify(result), 200