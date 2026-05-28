from flask import Blueprint, jsonify, request, current_app, abort
from services.qa_service import (
    list_questions, create_question,
    add_answer, mark_best_answer, approve_answer,
)

qa_bp = Blueprint("qa", __name__, url_prefix="/qa")


def _require_editor():
    if not current_app.config.get("QA_EDITOR_MODE", False):
        abort(403, description="Editor mode is not enabled.")


@qa_bp.get("/questions")
def get_questions():
    status = request.args.get("status", "all")
    query  = request.args.get("q", "").strip()
    return jsonify({"ok": True, "questions": list_questions(status, query)})


@qa_bp.post("/questions")
def post_question():
    data = request.get_json(force=True) or {}
    if not (data.get("title") or "").strip():
        return jsonify({"ok": False, "error": "Title is required."}), 400
    return jsonify({"ok": True, "question": create_question(data)}), 201


@qa_bp.post("/questions/<int:qid>/answers")
def post_answer(qid):
    _require_editor()
    data = request.get_json(force=True) or {}
    if not (data.get("body") or "").strip():
        return jsonify({"ok": False, "error": "Answer body is required."}), 400
    return jsonify({"ok": True, "answer": add_answer(qid, data)}), 201


@qa_bp.post("/answers/<int:aid>/best")
def set_best(aid):
    _require_editor()
    return jsonify({"ok": True, "answer": mark_best_answer(aid)})


@qa_bp.post("/answers/<int:aid>/approve")
def approve(aid):
    _require_editor()
    data = request.get_json(force=True) or {}
    return jsonify({"ok": True, "answer": approve_answer(aid, data.get("approved_by"))})