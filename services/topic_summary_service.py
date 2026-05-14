import os

from services.file_summary_service import (
    _is_allowed_source_path,
    _extract_docx,
    _extract_pdf,
    _extract_excel,
    _detect_apns,
    _detect_drns,
    _detect_dates,
    _detect_mapping_keywords,
    _classify_document,
)

# ======================================================
# CAPS
# ======================================================

MAX_FILES = 10
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_SNIPPETS_PER_FILE = 3
SNIPPET_MAX_CHARS = 160

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".docm", ".xlsx", ".xls"}


# ======================================================
# SNIPPET EXTRACTION
# ======================================================

def _find_snippets(text, query):
    query_lower = query.lower()
    snippets = []

    for line in text.splitlines():
        if query_lower not in line.lower():
            continue

        snippet = line.strip()

        if len(snippet) > SNIPPET_MAX_CHARS:
            idx = snippet.lower().find(query_lower)
            start = max(0, idx - 60)
            end = start + SNIPPET_MAX_CHARS
            prefix = "\u2026" if start > 0 else ""
            suffix = "\u2026" if end < len(snippet) else ""
            snippet = prefix + snippet[start:end].strip() + suffix

        if snippet:
            snippets.append(snippet)

        if len(snippets) >= MAX_SNIPPETS_PER_FILE:
            break

    return snippets


# ======================================================
# PUBLIC ENTRY POINT
# ======================================================

def summarize_topic(query, paths):
    """
    Aggregate local extraction results across multiple files for a search term.
    No AI, no cloud, no OCR, no Q:\\ traversal, no file copies, no source modification.
    """
    if not query or not query.strip():
        return {"ok": False, "error": "Missing query term."}

    if not paths or not isinstance(paths, list):
        return {"ok": False, "error": "Missing file paths."}

    query = query.strip()
    candidate_paths = [p for p in paths if isinstance(p, str) and p.strip()][:MAX_FILES]

    files_reviewed = 0
    files_matched = 0
    files_skipped = []
    file_results = []

    all_apns = []
    all_drns = []
    all_dates = []
    all_keywords = []
    all_classifications = []
    seen_apns = set()
    seen_drns = set()
    seen_dates = set()
    seen_keywords = set()
    seen_classifications = set()

    for raw_path in candidate_paths:
        path = os.path.normpath(raw_path)
        file_name = os.path.basename(path)
        ext = os.path.splitext(file_name)[1].lower()

        files_reviewed += 1

        # Path guard
        if not _is_allowed_source_path(path):
            files_skipped.append({
                "file": file_name,
                "reason": "outside approved folders",
            })
            continue

        # Existence
        if not os.path.exists(path) or not os.path.isfile(path):
            files_skipped.append({
                "file": file_name,
                "reason": "not found",
            })
            continue

        # Size cap
        try:
            size = os.path.getsize(path)
        except OSError:
            files_skipped.append({
                "file": file_name,
                "reason": "could not read file size",
            })
            continue

        if size > MAX_FILE_SIZE_BYTES:
            files_skipped.append({
                "file": file_name,
                "reason": f"file too large ({size // (1024 * 1024)} MB)",
            })
            continue

        # Extension
        if ext not in SUPPORTED_EXTENSIONS:
            files_skipped.append({
                "file": file_name,
                "reason": f"unsupported type ({ext if ext else 'no extension'})",
            })
            continue

        # Extraction
        try:
            if ext in {".xlsx", ".xls"}:
                raw_text, _, _ = _extract_excel(path)
            elif ext in {".docx", ".docm"}:
                raw_text, _, _ = _extract_docx(path)
            else:  # .pdf
                raw_text, _, _ = _extract_pdf(path)
        except Exception as exc:
            files_skipped.append({
                "file": file_name,
                "reason": f"extraction failed: {exc}",
            })
            continue

        if not raw_text.strip():
            files_skipped.append({
                "file": file_name,
                "reason": "no readable text extracted",
            })
            continue

        # Per-file findings
        snippets = _find_snippets(raw_text, query)
        apns = _detect_apns(raw_text)
        drns = _detect_drns(raw_text)
        dates = _detect_dates(raw_text)
        keywords = _detect_mapping_keywords(raw_text)
        classification = _classify_document(raw_text)

        # Deduplicated aggregation
        for apn in apns:
            if apn not in seen_apns:
                seen_apns.add(apn)
                all_apns.append(apn)

        for drn in drns:
            if drn not in seen_drns:
                seen_drns.add(drn)
                all_drns.append(drn)

        for d in dates:
            if d not in seen_dates:
                seen_dates.add(d)
                all_dates.append(d)

        for kw in keywords:
            if kw not in seen_keywords:
                seen_keywords.add(kw)
                all_keywords.append(kw)

        if classification and classification not in seen_classifications:
            seen_classifications.add(classification)
            all_classifications.append(classification)

        had_match = bool(snippets)
        if had_match:
            files_matched += 1

        file_results.append({
            "file_name": file_name,
            "file_path": path,
            "snippets": snippets,
            "apns": apns,
            "drns": drns,
            "dates": dates,
            "keywords": keywords,
            "classification": classification,
            "had_match": had_match,
        })

    return {
        "ok": True,
        "query": query,
        "files_reviewed": files_reviewed,
        "files_matched": files_matched,
        "files_skipped": files_skipped,
        "file_results": file_results,
        "all_apns": all_apns[:20],
        "all_drns": all_drns[:20],
        "all_dates": all_dates[:15],
        "all_keywords": all_keywords,
        "all_classifications": all_classifications,
    }