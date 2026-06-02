from flask import Blueprint, jsonify, request, render_template, abort, current_app
from services.scenario_card_service import (
    search_approved,
    get_approved_tags,
    get_all_cards,
    submit_question,
    create_card,
    update_card,
    approve_card,
    mark_needs_review_card,
    delete_card,
)

scenario_card_bp = Blueprint("scenario_cards", __name__)


def _require_editor():
    if not current_app.config.get("QA_EDITOR_MODE", False):
        abort(403, description="Editor mode is not enabled.")


# ── PUBLIC ──────────────────────────────────────────────

@scenario_card_bp.get("/ask-mapping-question")
def ask_mapping_question():
    return render_template("ask_mapping_question.html")


@scenario_card_bp.get("/scenario-cards/tags")
def scenario_card_tags():
    return jsonify({"ok": True, "tags": get_approved_tags()}), 200


@scenario_card_bp.get("/scenario-cards/search")
def search_scenario_cards():
    q   = request.args.get("q",   "").strip()
    tag = request.args.get("tag", "").strip() or None
    results = search_approved(q, tag=tag)
    return jsonify({"ok": True, "results": results, "count": len(results)}), 200


@scenario_card_bp.post("/scenario-cards/submit")
def submit_scenario_question():
    data = request.get_json(force=True) or {}
    result = submit_question(data)
    if result is None:
        return jsonify({"ok": False, "error": "Question title is required."}), 400
    return jsonify({"ok": True}), 201


# ── ADMIN (editor only) ──────────────────────────────────

@scenario_card_bp.get("/scenario-cards/admin")
def scenario_card_admin():
    _require_editor()
    return render_template("scenario_card_admin.html")


@scenario_card_bp.get("/scenario-cards/admin/data")
def scenario_card_admin_data():
    _require_editor()
    status = request.args.get("status", "all").strip()
    q      = request.args.get("q", "").strip()
    cards  = get_all_cards(status=status, query=q)
    counts = {
        "all":          len(get_all_cards()),
        "approved":     len(get_all_cards(status="approved")),
        "draft":        len(get_all_cards(status="draft")),
        "needs_review": len(get_all_cards(status="needs_review")),
    }
    return jsonify({"ok": True, "cards": cards, "counts": counts})


@scenario_card_bp.post("/scenario-cards")
def create_scenario_card():
    _require_editor()
    data = request.get_json(force=True) or {}
    if not (data.get("title") or "").strip():
        return jsonify({"ok": False, "error": "Title is required."}), 400
    return jsonify({"ok": True, "card": create_card(data)}), 201


@scenario_card_bp.route("/scenario-cards/<int:card_id>", methods=["PATCH"])
def update_scenario_card(card_id):
    _require_editor()
    data = request.get_json(force=True) or {}
    if not (data.get("title") or "").strip():
        return jsonify({"ok": False, "error": "Title is required."}), 400
    return jsonify({"ok": True, "card": update_card(card_id, data)})


@scenario_card_bp.post("/scenario-cards/<int:card_id>/approve")
def approve_scenario_card(card_id):
    _require_editor()
    data = request.get_json(force=True) or {}
    return jsonify({"ok": True, "card": approve_card(card_id, data.get("approved_by"))})


@scenario_card_bp.post("/scenario-cards/<int:card_id>/needs-review")
def needs_review_scenario_card(card_id):
    _require_editor()
    return jsonify({"ok": True, "card": mark_needs_review_card(card_id)})


@scenario_card_bp.route("/scenario-cards/<int:card_id>", methods=["DELETE"])
def delete_scenario_card(card_id):
    _require_editor()
    return jsonify({"ok": True, **delete_card(card_id)})
