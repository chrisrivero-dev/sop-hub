"""
Seed Scenario Cards for testing the Ask a Mapping Question tab.

Run from project root:
    python seed_scenario_cards.py

Safe to run multiple times — skips cards that already exist by title.

Important:
- Most cards are seeded as draft.
- Only the supervisor reminder card is approved for testing.
- Review with senior Mapping staff before approving additional cards.
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import app
from extensions import db
from models.scenario_card import ScenarioCard


SCENARIO_CARDS = [
    {
        "title": "Bad Legal or Letter Required — Do Not Create Transfer",
        "plain_english_answer": (
            "Do not parcel a document just because an APN is listed. "
            "Review the full document and legal description. If the legal is wrong "
            "or unclear, set the document up for a letter instead of parceling it."
        ),
        "what_to_do": (
            "1. Review the full document and legal description.\n"
            "2. Do not parcel per APN only.\n"
            "3. If the legal is wrong or unclear, set it up for a letter.\n"
            "4. Do not create transfer.\n"
            "5. Attach the APN only.\n"
            "6. Add a detailed remark explaining the issue.\n"
            "7. Do not use abbreviations in remarks."
        ),
        "best_references": (
            "Mapping supervisor email reminder regarding parceling documents, "
            "letters, create transfer, APN attachment, and remarks."
        ),
        "escalate_when": (
            "- The legal description does not support the mapping action.\n"
            "- You are unsure whether to parcel the document or set it up for a letter.\n"
            "- The APN, ownership, or legal description does not match the document.\n"
            "- The remark may affect future interpretation."
        ),
        "trigger_phrases": (
            "bad legal, wrong legal, set up for letter, do not create transfer, "
            "attach APN only, parcel per APN, detailed remarks, no abbreviations, "
            "ID returned"
        ),
        "tags": "legal, letter, create-transfer, APN, remarks, document-review, ID",
        "source_reference": "Mapping supervisor email reminder",
        "source_date": "",
        "status": "approved",
        "approved_by": "Christopher Rivero",
    },
    {
        "title": "First Checks Before Any Mapping Action",
        "plain_english_answer": (
            "Before starting a mapping action, perform due diligence on ownership, "
            "taxes, and TRA. These checks determine whether the mapping action can "
            "proceed or needs review first."
        ),
        "what_to_do": (
            "1. Confirm ownership is exactly the same for all APNs involved.\n"
            "2. Check for prior-year delinquent taxes.\n"
            "3. Check whether current installments are past the COB deadlines.\n"
            "4. Confirm all parcels are in the same Tax Rate Area.\n"
            "5. Consult the correct lead or senior if ownership, taxes, or TRA do not clear."
        ),
        "best_references": "Source guidance on due diligence checks for Ownership, Taxes, and TRA.",
        "escalate_when": (
            "- Ownership is not exactly the same.\n"
            "- There are delinquent taxes or deadline issues.\n"
            "- Parcels are in different TRAs.\n"
            "- You are unsure whether the mapping action is allowed to proceed."
        ),
        "trigger_phrases": (
            "first checks, before mapping, ownership taxes TRA, due diligence, "
            "delinquent taxes, tax rate area, TRA mismatch"
        ),
        "tags": "ownership, taxes, TRA, due-diligence, pre-check",
        "source_reference": "Draft Mapping guidance",
        "source_date": "",
        "status": "draft",
        "approved_by": "",
    },
    {
        "title": "Tract Map with Multiple Owners",
        "plain_english_answer": (
            "A Tract Map with multiple owners may proceed only when the ownership "
            "lines coincide with the proposed lot lines. Do not work the Tract if "
            "a single lot would need to be split by ownership."
        ),
        "what_to_do": (
            "1. Review ownership for all APNs involved in the Tract.\n"
            "2. Compare ownership lines to the proposed Tract lot lines.\n"
            "3. Proceed only if each ownership area lines up with complete proposed lots.\n"
            "4. Do not cut a single lot along an ownership line just to make the Tract work."
        ),
        "best_references": (
            "Source guidance on Tract Maps with multiple owners and ownership line exceptions."
        ),
        "escalate_when": (
            "- Ownership lines do not match proposed lot lines.\n"
            "- A single lot would be split by ownership.\n"
            "- Ownership is unclear or inconsistent across the involved APNs."
        ),
        "trigger_phrases": (
            "tract multiple owners, ownership lines, lot lines, ownership mismatch tract, "
            "single lot split, different owners tract"
        ),
        "tags": "tract, ownership, lot-lines, multiple-owners",
        "source_reference": "Draft Mapping guidance",
        "source_date": "",
        "status": "draft",
        "approved_by": "",
    },
    {
        "title": "Engineer File Before a Tract Map",
        "plain_english_answer": (
            "Use an ATS-generated Engineer File to combine parcels before working "
            "the actual Tract cut when required by current procedure. The EF should "
            "be completed before proceeding with the Tract cut."
        ),
        "what_to_do": (
            "1. Create or use the ATS-generated Engineer File for the pre-Tract parcel combination when required.\n"
            "2. Use the effective date specified by procedure, commonly three days before the Tract recording date for the combination.\n"
            "3. Wait until the Engineer File reaches the required status before working the Tract cut.\n"
            "4. Proceed with the Tract cut using the proper recording/effective date after the EF is complete."
        ),
        "best_references": "Source guidance on Engineer File requirements before Tract Map cuts.",
        "escalate_when": (
            "- Ownership does not match.\n"
            "- Taxes or TRA checks are not clear.\n"
            "- The effective date is unclear.\n"
            "- The EF status has not reached the required point."
        ),
        "trigger_phrases": (
            "Engineer File before tract, EF before tract, tract combination, "
            "status 90, three days prior, combine parcels before tract"
        ),
        "tags": "tract, engineer-file, EF, combination, effective-date",
        "source_reference": "Draft Mapping guidance",
        "source_date": "",
        "status": "draft",
        "approved_by": "",
    },
    {
        "title": "LLA DRN Formatting After May 2002",
        "plain_english_answer": (
            "LLA DRN formatting depends on the recording date. LLAs recorded in 2002 "
            "and later use the nine-digit format; older LLAs use the earlier eight-digit format."
        ),
        "what_to_do": (
            "1. Confirm the LLA recording date.\n"
            "2. For LLAs recorded in 2002 or later, use the nine-digit DRN format.\n"
            "3. For LLAs recorded in 2001 or earlier, use the eight-digit DRN format.\n"
            "4. Verify the final ATS II formatting against the source procedure before finalizing."
        ),
        "best_references": (
            "Legal Descriptions - Relation to One Another.docx; LLA legal formatting guidance."
        ),
        "escalate_when": (
            "- The recording date or DRN is unclear.\n"
            "- The LLA formatting does not match the source document.\n"
            "- The LLA affects multiple APNs or extended legal descriptions."
        ),
        "trigger_phrases": (
            "LLA DRN, nine digit DRN, eight digit DRN, LLA formatting, "
            "formatted legal, extended legal, May 2002"
        ),
        "tags": "LLA, DRN, legal-description, ATS-II, formatted-legal",
        "source_reference": "Legal Descriptions - Relation to One Another.docx",
        "source_date": "",
        "status": "draft",
        "approved_by": "",
    },
    {
        "title": "Rejected Street Dedication on a Tract or Parcel Map",
        "plain_english_answer": (
            "Rejected street dedications are handled differently depending on whether "
            "the dedication was fee or easement, and whether the area is part of a lot "
            "or an interior street."
        ),
        "what_to_do": (
            "1. Determine whether the dedication was made in fee or as an easement.\n"
            "2. If a fee dedication is rejected, assign a parcel number to the unaccepted street portion.\n"
            "3. If an easement dedication is rejected and is part of a lot, do not assign a parcel number; show it as an easement line on the parent parcel.\n"
            "4. If it is an interior street or dedicated portion not part of a lot, assign a parcel number regardless of fee/easement status."
        ),
        "best_references": "Source guidance on rejected street dedications for Tract and Parcel Maps.",
        "escalate_when": (
            "- You cannot determine whether the dedication is fee or easement.\n"
            "- It is unclear whether the area is part of a lot or an interior street.\n"
            "- The map/document language is ambiguous."
        ),
        "trigger_phrases": (
            "rejected street dedication, fee dedication, easement dedication, "
            "interior street, unaccepted street, assign parcel number"
        ),
        "tags": "dedication, street, tract, parcel-map, easement, fee",
        "source_reference": "Draft Mapping guidance",
        "source_date": "",
        "status": "draft",
        "approved_by": "",
    },
    {
        "title": "Final Order of Condemnation Handling",
        "plain_english_answer": (
            "Final Orders of Condemnation must be read carefully to determine intent, "
            "effective date, tax cancellation date, and whether any transfers need senior "
            "review before the mapping action proceeds."
        ),
        "what_to_do": (
            "1. Read the FOC carefully to determine the intent.\n"
            "2. Use the date the judge orders taxes to be cancelled as the effective date when stated.\n"
            "3. If no date is specified, use the recording date.\n"
            "4. If the effective date is in a prior year, contact the Grid Leader.\n"
            "5. Check whether any transfers posted after the FOC effective date.\n"
            "6. If later transfers changed the parcel number, discuss with a Supervisor before proceeding."
        ),
        "best_references": "Source guidance on Final Order of Condemnation handling.",
        "escalate_when": (
            "- The FOC intent is unclear.\n"
            "- The effective date is prior year.\n"
            "- Transfers posted after the effective date.\n"
            "- Parcel numbers changed after the FOC effective date."
        ),
        "trigger_phrases": (
            "FOC, Final Order of Condemnation, condemnation, tax cancellation date, "
            "prior year effective date, unwork transfer, rework transfer"
        ),
        "tags": "FOC, condemnation, effective-date, tax-cancellation, transfers",
        "source_reference": "Draft Mapping guidance",
        "source_date": "",
        "status": "draft",
        "approved_by": "",
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

    print(f"Scenario card seed complete. Created: {created}. Skipped: {skipped}.")