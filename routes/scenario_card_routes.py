from flask import Blueprint, jsonify, request, render_template
from services.scenario_card_service import search_approved

scenario_card_bp = Blueprint("scenario_cards", __name__)


@scenario_card_bp.get("/ask-mapping-question")
def ask_mapping_question():
    return render_template("ask_mapping_question.html")


@scenario_card_bp.get("/scenario-cards/search")
def search_scenario_cards():
    q = request.args.get("q", "").strip()
    results = search_approved(q)
    return jsonify({"ok": True, "results": results, "count": len(results)}), 200