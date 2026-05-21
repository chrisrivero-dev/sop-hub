/* =====================================================
   SCENARIO CARDS — UI
   Owns: search input, autocomplete suggestions,
         result rendering on /ask-mapping-question.
   No AI. No LLM. No cloud. Local suggestions only.
===================================================== */

(function () {
  "use strict";

  const searchInput = document.getElementById("scSearch");
  const resultsEl = document.getElementById("scResults");
  const suggestionsEl = document.getElementById("scSuggestions");

  if (!searchInput || !resultsEl) return;

  // ---- STATIC LOCAL SUGGESTION LIST ----
  const SUGGESTIONS = [
    "bad legal",
    "wrong legal",
    "do not create transfer",
    "parcel per APN",
    "attach APN only",
    "no abbreviations",
    "detailed remarks",
    "tract multiple owners",
    "engineer file before tract",
    "ownership names do not match",
    "LLA formatting",
    "rejected street dedication",
    "final order of condemnation",
  ];

  let debounceTimer = null;

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---- HELP STATE ----
  function showHelpState() {
    resultsEl.innerHTML = `
      <div class="text-sm text-gray-400">
        Type a Mapping question or keyword to search approved guidance.
      </div>`;
  }

  // ---- AUTOCOMPLETE ----
  function showSuggestions(query) {
    if (!suggestionsEl) return;
    if (!query || !query.trim()) {
      hideSuggestions();
      return;
    }
    const q = query.toLowerCase();
    const matches = SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(q),
    ).slice(0, 8);
    if (!matches.length) {
      hideSuggestions();
      return;
    }
    suggestionsEl.innerHTML = matches
      .map(
        (s) =>
          `<div class="sc-suggestion-item" data-value="${esc(s)}">${esc(s)}</div>`,
      )
      .join("");
    suggestionsEl.classList.remove("hidden");
  }

  function hideSuggestions() {
    if (!suggestionsEl) return;
    suggestionsEl.classList.add("hidden");
    suggestionsEl.innerHTML = "";
  }

  if (suggestionsEl) {
    // mousedown fires before blur so preventDefault keeps focus long enough
    suggestionsEl.addEventListener("mousedown", (e) => {
      const item = e.target.closest(".sc-suggestion-item");
      if (!item) return;
      e.preventDefault();
      searchInput.value = item.dataset.value;
      hideSuggestions();
      search(item.dataset.value);
    });
  }

  searchInput.addEventListener("blur", () => {
    setTimeout(hideSuggestions, 150);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideSuggestions();
      searchInput.blur();
    }
  });

  // ---- RENDER HELPERS ----
  function renderTags(tagStr) {
    if (!tagStr || !tagStr.trim()) return "";
    const tags = tagStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => `<span class="sc-tag">${esc(t)}</span>`)
      .join("");
    return `<div class="sc-tags">${tags}</div>`;
  }

  function renderField(label, value, extraClass) {
    if (!value || !value.trim()) return "";
    return `
      <div class="sc-section">
        <div class="sc-section-label">${label}</div>
        <div class="sc-section-body${extraClass ? " " + extraClass : ""}">${esc(value)}</div>
      </div>`;
  }

  function renderCard(c) {
    const sourceLine =
      c.source_reference || c.source_date
        ? `<div class="sc-meta">Source: ${esc(c.source_reference)}${c.source_date ? " (" + esc(c.source_date) + ")" : ""}</div>`
        : "";
    return `
      <div class="sc-card">
        <div class="sc-card-header">
          <span class="sc-title">${esc(c.title)}</span>
          <span class="sc-approved-badge">Approved</span>
        </div>
        ${renderField("Answer", c.plain_english_answer, "")}
        ${renderField("What to do", c.what_to_do, "sc-pre")}
        ${renderField("Escalate when", c.escalate_when, "sc-pre sc-escalate")}
        ${renderField("Best references", c.best_references, "")}
        ${sourceLine}
        ${renderTags(c.tags)}
      </div>`;
  }

  function renderCards(cards) {
    if (!cards.length) {
      resultsEl.innerHTML = `
        <div class="text-sm text-gray-400">
          No approved Scenario Card found. Try different keywords or ask a senior technician.
        </div>`;
      return;
    }
    resultsEl.innerHTML = cards.map(renderCard).join("");
  }

  // ---- SEARCH ----
  async function search(q) {
    try {
      const resp = await fetch(
        `/scenario-cards/search?q=${encodeURIComponent(q)}`,
      );
      const data = await resp.json();
      if (data.ok) renderCards(data.results);
    } catch (err) {
      resultsEl.innerHTML = `<div class="text-sm text-red-400">Could not load results.</div>`;
      console.error("SC SEARCH ERROR:", err);
    }
  }

  // ---- INPUT HANDLER ----
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim();
    showSuggestions(q);
    clearTimeout(debounceTimer);
    if (q.length < 2) {
      showHelpState();
      return;
    }
    debounceTimer = setTimeout(() => search(q), 250);
  });

  // On page load: show help state only, no automatic search
  showHelpState();
})();
