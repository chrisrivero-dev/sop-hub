"""
Temporarily approve selected Scenario Cards for local testing.

Run from project root:
    python approve_test_scenario_cards.py

Purpose:
This lets the Ask a Mapping Question page show more than one approved card
so search behavior can be tested with multiple Mapping scenarios.

After testing, this script can be deleted.
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import app
from extensions import db
from models.scenario_card import ScenarioCard


CARDS_TO_APPROVE = [
    "First Checks Before Any Mapping Action",
    "Tract Map with Multiple Owners",
    "Engineer File Before a Tract Map",
    "LLA DRN Formatting After May 2002",
    "Rejected Street Dedication on a Tract or Parcel Map",
]


with app.app_context():
    updated = 0
    missing = 0

    for title in CARDS_TO_APPROVE:
        card = ScenarioCard.query.filter_by(title=title).first()

        if not card:
            print(f"Missing: {title}")
            missing += 1
            continue

        card.status = "approved"
        card.approved_by = "Christopher Rivero"
        card.updated_at = datetime.utcnow()

        print(f"Approved: {card.title} (id={card.id})")
        updated += 1

    db.session.commit()

    print("")
    print(f"Approval complete. Updated: {updated}. Missing: {missing}.")