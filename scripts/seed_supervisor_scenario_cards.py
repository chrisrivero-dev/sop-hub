"""
Seed supervisor/procedure-based Scenario Cards for the Ask a Mapping Question tab.

Run from project root:
    python scripts\seed_supervisor_scenario_cards.py

Safe to run multiple times — skips cards that already exist by title.
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from app import app
from extensions import db
from models.scenario_card import ScenarioCard


SCENARIO_CARDS = [
    {
        "title": "Unpaid Taxes Before a Cut",
        "plain_english_answer": (
            "If a cut has unpaid taxes, do not wait until the last minute. "
            "Notify the appropriate senior/front office contact as soon as delinquent "
            "or unpaid taxes are found so the taxpayer can be sent a letter."
        ),
        "what_to_do": (
            "1. Check taxes before continuing the cut.\n"
            "2. If unpaid first installment taxes exist, confirm whether a letter was already sent.\n"
            "3. Check whether the taxes have since been paid.\n"
            "4. If still unpaid, notify the appropriate contact as soon as possible.\n"
            "5. Provide a physical ATS screen print showing the document number and APNs involved.\n"
            "6. Provide a tax collector screen print showing the unpaid taxes.\n"
            "7. Do not wait until the last minute before the second installment deadline."
        ),
        "best_references": (
            "Supervisor reminder regarding unpaid taxes, taxpayer letters, ATS screen prints, "
            "tax collector screen prints, and cut eligibility."
        ),
        "escalate_when": (
            "- Taxes remain unpaid after the first letter.\n"
            "- The second installment deadline is approaching.\n"
            "- You are unsure whether the cut can proceed.\n"
            "- The taxpayer has not paid and the cut may need to roll to the next year."
        ),
        "trigger_phrases": (
            "unpaid taxes, delinquent taxes, first installment, second installment, "
            "tax letter, cannot do the cut, roll to next year, ATS screen print, "
            "tax collector screen print"
        ),
        "tags": "taxes, delinquent-taxes, cut, letter, ATS, tax-collector, roll-year",
        "source_reference": "Supervisor email reminder regarding unpaid taxes before cuts",
        "source_date": "",
        "status": "approved",
        "approved_by": "Christopher Rivero",
    },
    {
        "title": "Deleted Documents Must Have Remarks",
        "plain_english_answer": (
            "Any document sent to the delete queue must include a remark. "
            "Documents deleted without a remark may be sent back to the technician's queue."
        ),
        "what_to_do": (
            "1. Before deleting or routing a document to the delete queue, add a clear remark.\n"
            "2. Explain why the document is being deleted or routed that way.\n"
            "3. Do not send documents to the delete queue without remarks.\n"
            "4. Keep remarks clear enough for another technician or supervisor to understand later."
        ),
        "best_references": (
            "Supervisor reminder that any and all deleted documents must include a remark."
        ),
        "escalate_when": (
            "- You are unsure what remark is appropriate.\n"
            "- The reason for deletion is unclear.\n"
            "- The document may need routing instead of deletion."
        ),
        "trigger_phrases": (
            "delete queue, deleted document, document remarks, no remark, sent back to E queue"
        ),
        "tags": "delete-queue, remarks, document-routing, E-queue",
        "source_reference": "Supervisor email reminder regarding delete queue remarks",
        "source_date": "",
        "status": "approved",
        "approved_by": "Christopher Rivero",
    },
    {
        "title": "Tract Complete and Approved — Notify Front Office",
        "plain_english_answer": (
            "When a Tract has been completed and approved, provide the approved Tract number "
            "to the appropriate front office/senior contact so it is known that the Tract is ready to go."
        ),
        "what_to_do": (
            "1. Confirm the Tract is complete and approved.\n"
            "2. Identify the Tract number.\n"
            "3. Provide the Tract number to the appropriate contact.\n"
            "4. Do not assume the front office knows the Tract is ready unless you notify them."
        ),
        "best_references": (
            "Supervisor reminder regarding approved/completed Tracts and notifying the front office."
        ),
        "escalate_when": (
            "- You are unsure whether the Tract is fully approved.\n"
            "- The Tract number or approval status is unclear.\n"
            "- There are outstanding issues before release/routing."
        ),
        "trigger_phrases": (
            "tract complete, approved tract, tract ready, provide tract number, tract approved"
        ),
        "tags": "tract, approved, routing, notification, front-office",
        "source_reference": "Supervisor email reminder regarding completed and approved Tracts",
        "source_date": "",
        "status": "approved",
        "approved_by": "Christopher Rivero",
    },
    {
        "title": "Condo Documents — Standard Parceling and Routing",
        "plain_english_answer": (
            "For condo documents, search for the condominium plan by DRN or Official Record Book/Page, "
            "or use the Condo Project group to check the Condo Plan drawers. Match the unit information "
            "and a valid primary/secondary legal in ATS before creating transfer."
        ),
        "what_to_do": (
            "1. Search for the condominium plan by DRN or OR Book/Page in OnBase.\n"
            "2. If needed, use the Condo Project group to check the Condo Plan drawers in the Map Room.\n"
            "3. Confirm the primary/secondary legal.\n"
            "4. Match the unit information in ATS.\n"
            "5. Add Global Utility permanent remarks.\n"
            "6. Attach the keywords/APNs described before creating transfer.\n"
            "7. Use the standard remark: Parceled per Condo Plan."
        ),
        "best_references": (
            "CONDO DOCUMENTS – PARCELING AND ROUTING PROCEDURES, approved 2/20/26 by D. Snapperman."
        ),
        "escalate_when": (
            "- The Condo Plan cannot be found.\n"
            "- The unit information does not match ATS.\n"
            "- The legal references more than one condo plan or amendment.\n"
            "- The document references an unworked condo plan."
        ),
        "trigger_phrases": (
            "condo document, condo plan, condominium plan, DRN, official record, "
            "unit match, Parceled per Condo Plan, create transfer condo"
        ),
        "tags": "condo, condo-plan, DRN, OnBase, ATS, unit-match, create-transfer",
        "source_reference": "CONDO DOCUMENTS – PARCELING AND ROUTING PROCEDURES",
        "source_date": "2026-02-20",
        "status": "approved",
        "approved_by": "D. Snapperman / Christopher Rivero",
    },
    {
        "title": "Condo Unit Match Not Found or HOLD APN",
        "plain_english_answer": (
            "If a condo document uses a primary/secondary legal but the unit information does not match in ATS, "
            "or if the document parcels to a Condo Project HOLD APN, more research is needed before final routing."
        ),
        "what_to_do": (
            "1. Check whether the unit information matches ATS.\n"
            "2. If the unit match is not found, add permanent Global Utility remarks.\n"
            "3. If the document parcels to a HOLD APN, attach all APNs described, including the HOLD.\n"
            "4. Add a clear research-needed remark.\n"
            "5. Route to ES with permanent remarks as required."
        ),
        "best_references": (
            "CONDO DOCUMENTS – PARCELING AND ROUTING PROCEDURES, approved 2/20/26 by D. Snapperman."
        ),
        "escalate_when": (
            "- Unit match is not found.\n"
            "- The legal parcels to a HOLD APN.\n"
            "- The legal appears old or obsolete.\n"
            "- You are unsure whether the document should go to ES or back to ID."
        ),
        "trigger_phrases": (
            "unit match not found, HOLD APN, condo HOLD, research needed, legal parcels to HOLD, ES routing"
        ),
        "tags": "condo, HOLD, unit-match, research-needed, ES, routing",
        "source_reference": "CONDO DOCUMENTS – PARCELING AND ROUTING PROCEDURES",
        "source_date": "2026-02-20",
        "status": "approved",
        "approved_by": "D. Snapperman / Christopher Rivero",
    },
    {
        "title": "Condo Plan Not Found",
        "plain_english_answer": (
            "If the condo plan or plat map cannot be found, request the document with the OC Clerk Recorder "
            "and coordinate with the appropriate senior assessment technician for DSAR/document handling."
        ),
        "what_to_do": (
            "1. Search OnBase by DRN or OR Book/Page.\n"
            "2. Check the Condo Plan drawers using the Condo Project group if needed.\n"
            "3. If the condo plan or plat map cannot be found, request the document with the OC Clerk Recorder.\n"
            "4. Follow the referenced OC Clerk Recorder Deeds procedure.\n"
            "5. Coordinate with Jennifer, Senior Assessment Technician, for DSAR/document handling.\n"
            "6. If the unit cannot be found in the Condo Plan or Plat Map, ask Jennifer for details."
        ),
        "best_references": (
            "CONDO DOCUMENTS – PARCELING AND ROUTING PROCEDURES; Q:\\Mario\\OC Clerk Recorder Deeds."
        ),
        "escalate_when": (
            "- Condo Plan or Plat Map cannot be located.\n"
            "- The unit cannot be found in the Condo Plan or Plat Map.\n"
            "- The document must be requested or recorded for DSAR."
        ),
        "trigger_phrases": (
            "condo plan not found, plat map not found, OC Clerk Recorder, DSAR, condo drawers, unit cannot be found"
        ),
        "tags": "condo, condo-plan, plat-map, OC-Clerk-Recorder, DSAR, research",
        "source_reference": "CONDO DOCUMENTS – PARCELING AND ROUTING PROCEDURES",
        "source_date": "2026-02-20",
        "status": "approved",
        "approved_by": "D. Snapperman / Christopher Rivero",
    },
    {
        "title": "Condo Incorrect or Incomplete Legal",
        "plain_english_answer": (
            "If a condo document has a missing or incorrect legal, wrong unit information, or wrong condo reference number, "
            "follow the Plan B instructions instead of forcing the parceling workflow."
        ),
        "what_to_do": (
            "1. Review the condo legal description and unit information.\n"
            "2. Confirm whether the condo reference number is correct.\n"
            "3. If the legal is missing, incorrect, or incomplete, do not force the parceling workflow.\n"
            "4. Follow the Plan B criteria instructions.\n"
            "5. Escalate if the legal or routing path is unclear."
        ),
        "best_references": (
            "CONDO DOCUMENTS – PARCELING AND ROUTING PROCEDURES; Q:\\Jennifer's Files\\Plan B CRITERIA.docx."
        ),
        "escalate_when": (
            "- Legal is missing or incomplete.\n"
            "- Unit information is wrong.\n"
            "- Condo reference number is wrong or unclear.\n"
            "- You are unsure whether Plan B applies."
        ),
        "trigger_phrases": (
            "condo incorrect legal, incomplete legal, wrong unit info, wrong condo reference, Plan B, letter condo"
        ),
        "tags": "condo, legal-description, Plan-B, incomplete-legal, wrong-unit",
        "source_reference": "CONDO DOCUMENTS – PARCELING AND ROUTING PROCEDURES",
        "source_date": "2026-02-20",
        "status": "approved",
        "approved_by": "D. Snapperman / Christopher Rivero",
    },
]


with app.app_context():
    created = 0
    skipped = 0

    for item in SCENARIO_CARDS:
        existing = ScenarioCard.query.filter_by(title=item["title"]).first()

        if existing:
            print(f"Already exists: {item['title']} (id={existing.id}). Skipping.")
            skipped += 1
            continue

        card = ScenarioCard(
            title=item["title"],
            plain_english_answer=item["plain_english_answer"],
            what_to_do=item["what_to_do"],
            best_references=item["best_references"],
            escalate_when=item["escalate_when"],
            trigger_phrases=item["trigger_phrases"],
            tags=item["tags"],
            source_reference=item.get("source_reference", ""),
            source_date=item.get("source_date", ""),
            status=item.get("status", "draft"),
            approved_by=item.get("approved_by", ""),
            updated_at=datetime.utcnow(),
        )

        db.session.add(card)
        created += 1

    db.session.commit()

    print(f"Supervisor scenario card seed complete. Created: {created}. Skipped: {skipped}.")