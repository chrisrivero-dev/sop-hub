from flask import Blueprint, jsonify, request
from services.topic_summary_service import summarize_topic

topic_summary_bp = Blueprint("topic_summary", __name__)


@topic_summary_bp.post("/topic-summary")
def topic_summary():
    body = request.get_json(silent=True)

    if not body:
        return jsonify({"ok": False, "error": "Request body must be JSON."}), 400

    query = body.get("query", "").strip()
    paths = body.get("paths", [])

    if not query:
        return jsonify({"ok": False, "error": "Missing query parameter."}), 400

    if not isinstance(paths, list) or not paths:
        return jsonify({"ok": False, "error": "Missing or empty paths list."}), 400

    result = summarize_topic(query, paths)

    if not result.get("ok"):
        return jsonify(result), 500

    return jsonify(result), 200