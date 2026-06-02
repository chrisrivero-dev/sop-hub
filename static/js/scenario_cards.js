/* =====================================================
   SCENARIO CARDS — UI  v3
   Owns: search, tag filter, result rendering on /ask-mapping-question.
   No AI. No LLM. No cloud.
===================================================== */

(function () {
  "use strict";

  const searchInput   = document.getElementById("scSearch");
  const resultsEl     = document.getElementById("scResults");
  const suggestionsEl = document.getElementById("scSuggestions");
  const clearAllBtn   = document.getElementById("scClearAll");
  const tagPillsEl    = document.getElementById("scTagPills");
  const askNewBtn     = document.getElementById("scAskNewBtn");
  const askPanel      = document.getElementById("scAskPanel");
  const cancelAskBtn  = document.getElementById("scCancelAsk");

  if (!searchInput || !resultsEl) return;

  let activeTag     = null;
  let allTags       = [];
  let debounceTimer = null;

  // ── STATIC SUGGESTION LIST ────────────────────────────
  const SUGGESTIONS = [
    "bad legal", "wrong legal", "do not create transfer", "parcel per APN",
    "attach APN only", "no abbreviations", "detailed remarks",
    "tract multiple owners", "engineer file before tract",
    "ownership names do not match", "LLA formatting",
    "rejected street dedication", "final order of condemnation",
  ];

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ── RELATIVE TIME ────────────────────────────────────
  function relativeTime(iso) {
    if (!iso) return null;
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / 86400000);
    if (days === 0) return "Updated today";
    if (days === 1) return "Updated yesterday";
    if (days <= 7) return `Updated ${days} days ago`;
    return null;
  }

  function isRecent(iso) {
    if (!iso) return false;
    return (Date.now() - new Date(iso).getTime()) < 7 * 86400000;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(); } catch { return ""; }
  }

  // ── AUTOCOMPLETE ─────────────────────────────────────
  function showSuggestions(query) {
    if (!suggestionsEl) return;
    if (!query || !query.trim()) { hideSuggestions(); return; }
    const q = query.toLowerCase();
    const matches = SUGGESTIONS.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
    if (!matches.length) { hideSuggestions(); return; }
    suggestionsEl.innerHTML = matches
      .map(s => `<div class="sc-suggestion-item" data-value="${esc(s)}">${esc(s)}</div>`)
      .join("");
    suggestionsEl.classList.remove("hidden");
  }

  function hideSuggestions() {
    if (!suggestionsEl) return;
    suggestionsEl.classList.add("hidden");
    suggestionsEl.innerHTML = "";
  }

  if (suggestionsEl) {
    suggestionsEl.addEventListener("mousedown", (e) => {
      const item = e.target.closest(".sc-suggestion-item");
      if (!item) return;
      e.preventDefault();
      searchInput.value = item.dataset.value;
      hideSuggestions();
      search(item.dataset.value, activeTag);
    });
  }

  searchInput.addEventListener("blur", () => setTimeout(hideSuggestions, 150));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { hideSuggestions(); searchInput.blur(); }
  });

  // ── TAG PILLS ─────────────────────────────────────────
  const TAG_PRIORITY = [
    "legal", "tract", "LLA", "taxes", "ownership", "ATS", "MicroStation",
    "engineer-file", "ROW", "condo", "parcel-map", "FOC", "transfer",
    "remarks", "roll-year", "dedication", "APN", "title-review",
    "senior-review", "mapping-standards",
  ];
  const TAG_VISIBLE_LIMIT = 20;
  let tagsExpanded = false;

  function sortedTags(tags) {
    const priorityLower = TAG_PRIORITY.map(t => t.toLowerCase());
    const prioritized = [];
    const rest = [];
    tags.forEach(t => {
      const idx = priorityLower.indexOf(t.toLowerCase());
      if (idx !== -1) prioritized[idx] = t;
      else rest.push(t);
    });
    return [...prioritized.filter(Boolean), ...rest.sort((a, b) => a.localeCompare(b))];
  }

  function renderTagPills() {
    if (!tagPillsEl) return;
    if (!allTags.length) { tagPillsEl.innerHTML = ""; return; }

    const sorted   = sortedTags(allTags);
    const visible  = sorted.slice(0, TAG_VISIBLE_LIMIT);
    const hidden   = sorted.slice(TAG_VISIBLE_LIMIT);

    // If active tag is in the hidden set, force it into visible while selected
    const activeInHidden = activeTag && hidden.includes(activeTag);

    function pill(t) {
      return `<button class="sc-tag-pill${activeTag === t ? " sc-tag-active" : ""}"
                       data-tag="${esc(t)}">${esc(t)}</button>`;
    }

    let html = `<button class="sc-tag-pill${!activeTag ? " sc-tag-active" : ""}" data-tag="">All</button>`;
    html += visible.map(pill).join("");

    if (activeInHidden) {
      html += pill(activeTag);
    }

    if (hidden.length) {
      if (tagsExpanded) {
        const toShow = hidden.filter(t => t !== activeTag || !activeInHidden);
        html += toShow.map(pill).join("");
        html += `<button class="sc-tag-pill sc-tag-more" data-action="toggle-tags">Hide Tags</button>`;
      } else {
        html += `<button class="sc-tag-pill sc-tag-more" data-action="toggle-tags">More Tags (${hidden.length})</button>`;
      }
    }

    tagPillsEl.innerHTML = html;
  }

  async function loadTagPills() {
    try {
      const resp = await fetch("/scenario-cards/tags");
      const data = await resp.json();
      if (data.ok) {
        allTags = data.tags || [];
        renderTagPills();
      }
    } catch (err) {
      console.error("SC TAGS ERROR:", err);
    }
  }

  if (tagPillsEl) {
    tagPillsEl.addEventListener("click", (e) => {
      const pill = e.target.closest("[data-action='toggle-tags']");
      if (pill) {
        tagsExpanded = !tagsExpanded;
        renderTagPills();
        return;
      }
      const tagPill = e.target.closest(".sc-tag-pill");
      if (!tagPill) return;
      activeTag = tagPill.dataset.tag || null;
      renderTagPills();
      search(searchInput.value.trim(), activeTag);
    });
  }

  // ── CLEAR ALL ─────────────────────────────────────────
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      searchInput.value = "";
      activeTag = null;
      hideSuggestions();
      renderTagPills();
      search("", null);
    });
  }

  // ── RENDER HELPERS ───────────────────────────────────
  function renderTags(tagStr) {
    if (!tagStr || !tagStr.trim()) return "";
    const tags = tagStr.split(",").map(t => t.trim()).filter(Boolean)
      .map(t => `<span class="sc-tag sc-tag-clickable" data-tag="${esc(t)}">${esc(t)}</span>`)
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
    const recent  = isRecent(c.updated_at);
    const relTime = relativeTime(c.updated_at);
    const timeBadge = relTime
      ? `<span class="sc-recent-badge">${esc(relTime)}</span>`
      : `<span class="sc-meta-date">${fmtDate(c.updated_at)}</span>`;
    const sourceLine = (c.source_reference || c.source_date)
      ? `<div class="sc-meta">Source: ${esc(c.source_reference)}${c.source_date ? " (" + esc(c.source_date) + ")" : ""}</div>`
      : "";
    return `
      <div class="sc-card${recent ? " sc-card-recent" : ""}">
        <div class="sc-card-header">
          <span class="sc-title">${esc(c.title)}</span>
          <div class="flex items-center gap-2">
            ${timeBadge}
            <span class="sc-approved-badge">✓ Approved</span>
          </div>
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

    // Make inline card tags clickable
    resultsEl.querySelectorAll(".sc-tag-clickable").forEach(tagEl => {
      tagEl.style.cursor = "pointer";
      tagEl.addEventListener("click", () => {
        const tag = tagEl.dataset.tag;
        if (!tag) return;
        activeTag = tag;
        renderTagPills();
        search(searchInput.value.trim(), activeTag);
      });
    });
  }

  // ── SEARCH ───────────────────────────────────────────
  async function search(q, tag) {
    try {
      let url = `/scenario-cards/search?q=${encodeURIComponent(q || "")}`;
      if (tag) url += `&tag=${encodeURIComponent(tag)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.ok) renderCards(data.results);
    } catch (err) {
      resultsEl.innerHTML = `<div class="text-sm text-red-400">Could not load results.</div>`;
      console.error("SC SEARCH ERROR:", err);
    }
  }

  // ── INPUT HANDLER ────────────────────────────────────
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim();
    showSuggestions(q);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(q, activeTag), 250);
  });

  // ── ASK PANEL TOGGLE ─────────────────────────────────
  function openAskPanel() {
    if (!askPanel) return;
    askPanel.style.display = "block";
    if (askNewBtn) { askNewBtn.textContent = "✕ Close"; }
    document.getElementById("scQTitle")?.focus();
  }

  function closeAskPanel() {
    if (!askPanel) return;
    askPanel.style.display = "none";
    if (askNewBtn) { askNewBtn.textContent = "Ask New Question"; }
  }

  if (askNewBtn) {
    askNewBtn.addEventListener("click", () => {
      const open = askPanel?.style.display === "block";
      open ? closeAskPanel() : openAskPanel();
    });
  }

  if (cancelAskBtn) {
    cancelAskBtn.addEventListener("click", closeAskPanel);
  }

  // ── QUESTION SUBMISSION ───────────────────────────────
  const submitForm = document.getElementById("scSubmitForm");
  const submitMsg  = document.getElementById("scSubmitMsg");

  if (submitForm) {
    submitForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const titleEl = submitForm.querySelector("[name='title']");
      const title   = (titleEl?.value || "").trim();
      if (!title) { titleEl?.focus(); return; }

      const notes       = (submitForm.querySelector("[name='notes']")?.value || "").trim();
      const submittedBy = (submitForm.querySelector("[name='submitted_by']")?.value || "").trim();
      const submitBtn   = submitForm.querySelector("[type='submit']");

      submitBtn.disabled    = true;
      submitBtn.textContent = "Submitting…";
      if (submitMsg) { submitMsg.textContent = ""; submitMsg.className = "text-sm"; }

      try {
        const resp = await fetch("/scenario-cards/submit", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ title, notes, submitted_by: submittedBy }),
        });

        // Success: backend returns 201 { ok: true } — no card object needed
        if (resp.status === 201) {
          submitForm.reset();
          closeAskPanel();
          if (askNewBtn) {
            askNewBtn.textContent = "✓ Submitted";
            askNewBtn.style.background = "#16a34a";  // green-600 inline avoids Tailwind scan
            setTimeout(() => {
              askNewBtn.textContent = "Ask New Question";
              askNewBtn.style.background = "";
            }, 4000);
          }
          return;
        }

        // Non-201: try to read error message from JSON body
        let errMsg = "Submission failed.";
        try {
          const errData = await resp.json();
          if (errData.error) errMsg = errData.error;
        } catch { /* response body not JSON — use default */ }

        if (submitMsg) {
          submitMsg.className  = "text-sm text-red-500";
          submitMsg.textContent = errMsg;
        }

      } catch (err) {
        // Network-level failure
        console.error("SC SUBMIT ERROR:", err);
        if (submitMsg) {
          submitMsg.className  = "text-sm text-red-500";
          submitMsg.textContent = "Network error. Please check your connection and try again.";
        }
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = "Submit Question";
      }
    });
  }

  // ── INIT ─────────────────────────────────────────────
  loadTagPills();
  search("", null); // Load all approved cards on page load

})();
