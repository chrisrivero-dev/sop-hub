"""
Import Scenario Cards from a JSON file into the SOP Hub database.

Run from project root:
    python scripts/import_scenario_cards.py data/scenario_cards_import.json

To update existing cards with the same title:
    python scripts/import_scenario_cards.py data/scenario_cards_import.json --update
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app import app
from extensions import db
from models.scenario_card import ScenarioCard


ALLOWED_STATUSES = {"draft", "approved", "needs_review"}

IMPORTABLE_FIELDS = [
    "title",
    "plain_english_answer",
    "what_to_do",
    "best_references",
    "escalate_when",
    "trigger_phrases",
    "tags",
    "source_reference",
    "source_date",
    "status",
    "approved_by",
]


def utc_now_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def validate(item, index):
    errors = []

    if not isinstance(item, dict):
        return [f"Item {index}: must be a JSON object."]

    title = str(item.get("title", "")).strip()
    answer = str(item.get("plain_english_answer", "")).strip()
    status = str(item.get("status", "draft")).strip() or "draft"

    if not title:
        errors.append(f"Item {index}: title is required.")

    if not answer:
        errors.append(f"Item {index}: plain_english_answer is required.")

    if status not in ALLOWED_STATUSES:
        errors.append(
            f"Item {index}: status must be one of: "
            f"{', '.join(sorted(ALLOWED_STATUSES))}."
        )

    return errors


def apply_fields(card, item):
    for field in IMPORTABLE_FIELDS:
        if field == "status":
            value = str(item.get("status", "draft")).strip() or "draft"
        else:
            value = item.get(field, "")

        if value is None:
            value = ""

        setattr(card, field, value)

    card.updated_at = utc_now_naive()


def load_cards(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Import file must contain a JSON list of Scenario Card objects.")

    return data


def main():
    parser = argparse.ArgumentParser(description="Import Scenario Cards from JSON.")
    parser.add_argument("json_path", help="Path to Scenario Card JSON import file.")
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update existing cards when title already exists.",
    )
    args = parser.parse_args()

    cards = load_cards(args.json_path)

    created = 0
    updated = 0
    skipped = 0
    errors = 0

    with app.app_context():
        for index, item in enumerate(cards, start=1):
            validation_errors = validate(item, index)

            if validation_errors:
                for error in validation_errors:
                    print(f"[ERROR] {error}")
                errors += 1
                continue

            title = str(item["title"]).strip()
            existing = ScenarioCard.query.filter_by(title=title).first()

            if existing and not args.update:
                print(f"[SKIPPED] Existing card: {title}")
                skipped += 1
                continue

            try:
                if existing:
                    apply_fields(existing, item)
                    print(f"[UPDATED] {title}")
                    updated += 1
                else:
                    card = ScenarioCard()
                    apply_fields(card, item)
                    db.session.add(card)
                    print(f"[CREATED] {title}")
                    created += 1

            except Exception as exc:
                db.session.rollback()
                print(f"[ERROR] {title}: {exc}")
                errors += 1

        try:
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            print(f"[ERROR] Database commit failed: {exc}")
            sys.exit(1)

    print("")
    print("Import complete.")
    print(f"Created: {created}")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")
    print(f"Errors: {errors}")

    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()