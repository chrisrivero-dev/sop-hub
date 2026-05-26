/* =====================================================
   MAPPING Q&A BOARD — UI
   Owns: search, filters, card rendering.
   No AI. No LLM. No cloud. Local only.
===================================================== */

(function () {
  "use strict";

  const searchInput = document.getElementById("scSearch");
  const resultsEl = document.getElementById("scResults");
  const suggestionsEl = document.getElementById("scSuggestions");
  const countEl = document.getElementById("scAnsweredCount");
  const answeredSec = document.getElementById("scAnsweredSection");
  const openSec = document.getElementById("scOpenSection");

  if (!searchInput || !resultsEl) return;

  // ---- STATE ----
  let allCards = [];
  let activeFilter = "all";
  let debounceTimer = null;

  // ---- LOCAL SUGGESTION LIST ----
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

  // ---- ESCAPE ----
  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---- FILTERS ----
  document.getElementById("scFilters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".sc-filter-btn");
    if (!btn) return;
    document
      .querySelectorAll(".sc-filter-btn")
      .forEach((b) => b.classList.remove("sc-filter-active"));
    btn.classList.add("sc-filter-active");
    activeFilter = btn.dataset.filter;
    applyFilter();
  });

  function applyFilter() {
    if (activeFilter === "all") {
      answeredSec.style.display = "";
      openSec.style.display = "";
    } else if (activeFilter === "answered") {
      answeredSec.style.display = "";
      openSec.style.display = "none";
    } else if (activeFilter === "open") {
      answeredSec.style.display = "none";
      openSec.style.display = "";
    }
  }

  // ---- RENDER HELPERS ----
  function renderTags(tagStr) {
    if (!tagStr || !tagStr.trim()) return "";
    const tags = tagStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => `<span class="sc-tag">${esc(t)}</span>`)
      .join("");
    return `<div class="sc-tags mt-2">${tags}</div>`;
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
        ? `<div class="sc-meta mt-2">Source: ${esc(c.source_reference)}${c.source_date ? " (" + esc(c.source_date) + ")" : ""}</div>`
        : "";
    return `
      <div class="sc-card">
        <div class="sc-card-header">
          <span class="sc-title">${esc(c.title)}</span>
          <span class="sc-approved-badge">✓ Answered</span>
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
    if (countEl) countEl.textContent = cards.length ? `(${cards.length})` : "";
    if (!cards.length) {
      resultsEl.innerHTML = `
        <div class="text-sm text-gray-400 py-3">
          No approved answers found. Try different keywords.
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
      if (data.ok) {
        if (!q) allCards = data.results;
        renderCards(data.results);
      }
    } catch (err) {
      resultsEl.innerHTML = `<div class="text-sm text-red-400">Could not load results.</div>`;
      console.error("SC SEARCH ERROR:", err);
    }
  }

  // ---- AUTOCOMPLETE ----
  function showSuggestions(query) {
    if (!suggestionsEl || !query.trim()) {
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

  suggestionsEl?.addEventListener("mousedown", (e) => {
    const item = e.target.closest(".sc-suggestion-item");
    if (!item) return;
    e.preventDefault();
    searchInput.value = item.dataset.value;
    hideSuggestions();
    search(item.dataset.value);
  });

  searchInput.addEventListener("blur", () => setTimeout(hideSuggestions, 150));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideSuggestions();
      searchInput.blur();
    }
  });

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim();
    showSuggestions(q);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(q), 250);
  });

  // ---- INIT: load all approved cards on page load ----
  search("");
})();
