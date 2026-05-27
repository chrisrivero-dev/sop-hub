/* =====================================================
   MAPPING Q&A BOARD — QUESTIONS & ANSWERS
   Owns: real Q&A (not Scenario Cards).
   No AI. No LLM. No cloud. Local only.
===================================================== */

(function () {
  "use strict";

  const qaResults = document.getElementById("qaResults");
  const qaCount = document.getElementById("qaCount");
  const qaSection = document.getElementById("qaSection");
  const askBtn = document.getElementById("qaAskBtn");
  const askForm = document.getElementById("qaAskForm");
  const askCancel = document.getElementById("qaAskCancel");
  const askSubmit = document.getElementById("qaAskSubmit");

  if (!qaResults) return;

  let questions = [];
  let activeFilter = "all";

  // ---- ESCAPE ----
  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return "";
    }
  }

  // ---- FILTER SYNC with scenario_cards.js ----
  document.getElementById("scFilters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".sc-filter-btn");
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    render(questions);
    if (qaSection) {
      qaSection.style.display = activeFilter === "answered" ? "" : "";
    }
  });

  // ---- RENDER ANSWER ----
  function renderAnswer(a) {
    const bestBadge = a.is_best_answer
      ? `<span class="qa-best-badge">✓ Best</span>`
      : "";
    const approvedBadge = a.approved_by
      ? `<span class="qa-approved-badge">Approved by ${esc(a.approved_by)}</span>`
      : "";
    const markBestBtn = !a.is_best_answer
      ? `<button class="qa-mark-best text-xs text-gray-400 hover:text-green-700 whitespace-nowrap mt-1"
                 data-aid="${a.id}">Mark Best</button>`
      : "";
    return `
      <div class="qa-answer ${a.is_best_answer ? "qa-answer-best" : ""}" data-aid="${a.id}">
        <div class="flex items-start gap-2">
          <div class="flex-1">
            <div class="qa-answer-body">${esc(a.body)}</div>
            <div class="qa-meta">
            ${esc(a.answered_by || "Mapping Technician")} · ${fmtDate(a.answered_at)}${bestBadge}${approvedBadge}
            </div>
          </div>
          <div class="flex-shrink-0">${markBestBtn}</div>
        </div>
      </div>`;
  }

  // ---- RENDER QUESTION ----
  function renderQuestion(q) {
    const statusBadge =
      q.status === "open"
        ? `<span class="qa-badge-open">Open</span>`
        : `<span class="qa-badge-answered">Answered</span>`;

    const tags = (q.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => `<span class="sc-tag">${esc(t)}</span>`)
      .join("");
    const tagsHtml = tags ? `<div class="sc-tags mt-1">${tags}</div>` : "";

    const catHtml = q.category
      ? `<span class="qa-category">${esc(q.category)}</span>`
      : "";

    const answersHtml =
      q.answers && q.answers.length
        ? q.answers.map(renderAnswer).join("")
        : `<div class="qa-no-answers">No answers yet. Be the first to answer.</div>`;

    return `
      <div class="qa-question-card" data-qid="${q.id}">
        <div class="flex items-start gap-2 flex-wrap">
          ${statusBadge}${catHtml}
          <span class="qa-question-title flex-1">${esc(q.title)}</span>
        </div>
        ${q.body ? `<div class="qa-question-body">${esc(q.body)}</div>` : ""}
        <div class="qa-meta">
        Asked by ${esc(q.asked_by || "Mapping Technician")} · ${fmtDate(q.asked_at)}
          · ${q.answer_count} answer${q.answer_count !== 1 ? "s" : ""}
        </div>
        ${tagsHtml}

        <div class="qa-answers-list mt-3">${answersHtml}</div>

        <div id="qaAnswerForm-${q.id}" class="qa-inline-form" style="display:none;">
          <textarea class="qa-answer-body-input border rounded w-full text-sm p-2 resize-none"
                    rows="3" placeholder="Write your answer..."></textarea>
          <div class="flex gap-2 mt-2 items-center flex-wrap">
            <input type="text" class="qa-answer-by-input border rounded text-sm p-1.5 w-40"
                   placeholder="Your name (optional)">
            <button class="qa-submit-answer bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                    data-qid="${q.id}">Submit Answer</button>
            <button class="qa-cancel-answer text-sm text-gray-400 hover:text-gray-600"
                    data-qid="${q.id}">Cancel</button>
          </div>
        </div>

        <div class="qa-actions">
          <button class="qa-toggle-answer text-sm text-blue-600 hover:text-blue-800"
                  data-qid="${q.id}">+ Add Answer</button>
        </div>
      </div>`;
  }

  // ---- RENDER BOARD ----
  function render(qs) {
    let filtered = qs;
    if (activeFilter === "open")
      filtered = qs.filter((q) => q.status === "open");
    if (activeFilter === "answered")
      filtered = qs.filter((q) => q.status !== "open");

    if (qaCount)
      qaCount.textContent = filtered.length ? `(${filtered.length})` : "";

    if (!filtered.length) {
      const msg =
        activeFilter === "open"
          ? "No open questions yet. Click <strong>+ Ask a Question</strong> to start."
          : "No questions match this filter.";
      qaResults.innerHTML = `<div class="text-sm text-gray-400 py-2">${msg}</div>`;
      return;
    }

    qaResults.innerHTML = filtered.map(renderQuestion).join("");
    bindEvents();
  }

  // ---- BIND EVENTS (called after each render) ----
  function bindEvents() {
    // Toggle answer form
    document.querySelectorAll(".qa-toggle-answer").forEach((btn) => {
      btn.addEventListener("click", () => {
        const form = document.getElementById(`qaAnswerForm-${btn.dataset.qid}`);
        if (!form) return;
        const open = form.style.display !== "none";
        form.style.display = open ? "none" : "";
        btn.textContent = open ? "+ Add Answer" : "− Add Answer";
      });
    });

    // Cancel answer
    document.querySelectorAll(".qa-cancel-answer").forEach((btn) => {
      btn.addEventListener("click", () => {
        const form = document.getElementById(`qaAnswerForm-${btn.dataset.qid}`);
        if (form) form.style.display = "none";
        const toggle = document.querySelector(
          `.qa-toggle-answer[data-qid="${btn.dataset.qid}"]`,
        );
        if (toggle) toggle.textContent = "+ Add Answer";
      });
    });

    // Submit answer
    document.querySelectorAll(".qa-submit-answer").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const form = document.getElementById(`qaAnswerForm-${btn.dataset.qid}`);
        const body = form.querySelector(".qa-answer-body-input").value.trim();
        const by = form.querySelector(".qa-answer-by-input").value.trim();
        if (!body) {
          form.querySelector(".qa-answer-body-input").focus();
          return;
        }

        btn.disabled = true;
        btn.textContent = "Submitting…";
        try {
          const resp = await fetch(`/qa/questions/${btn.dataset.qid}/answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body, answered_by: by }),
          });
          const data = await resp.json();
          if (data.ok) {
            await load(currentQuery());
          } else {
            alert(data.error || "Failed.");
            btn.disabled = false;
            btn.textContent = "Submit Answer";
          }
        } catch (err) {
          console.error("ANSWER ERROR:", err);
          btn.disabled = false;
          btn.textContent = "Submit Answer";
        }
      });
    });

    // Mark best
    document.querySelectorAll(".qa-mark-best").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const resp = await fetch(`/qa/answers/${btn.dataset.aid}/best`, {
            method: "POST",
          });
          const data = await resp.json();
          if (data.ok) await load(currentQuery());
        } catch (err) {
          console.error("BEST ERROR:", err);
        }
      });
    });
  }

  // ---- LOAD ----
  async function load(q = "") {
    try {
      const url = `/qa/questions?status=all${q ? "&q=" + encodeURIComponent(q) : ""}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.ok) {
        questions = data.questions;
        render(questions);
      }
    } catch (err) {
      qaResults.innerHTML = `<div class="text-sm text-red-400">Could not load questions.</div>`;
      console.error("QA LOAD ERROR:", err);
    }
  }

  function currentQuery() {
    return document.getElementById("scSearch")?.value.trim() || "";
  }

  // ---- ASK FORM ----
  askBtn?.addEventListener("click", () => {
    const open = askForm.style.display !== "none";
    askForm.style.display = open ? "none" : "";
    askBtn.textContent = open ? "+ Ask a Question" : "− Ask a Question";
  });

  askCancel?.addEventListener("click", () => {
    askForm.style.display = "none";
    askBtn.textContent = "+ Ask a Question";
  });

  askSubmit?.addEventListener("click", async () => {
    const titleEl = document.getElementById("qaAskTitle");
    const title = titleEl?.value.trim();
    if (!title) {
      titleEl?.focus();
      return;
    }

    askSubmit.disabled = true;
    askSubmit.textContent = "Submitting…";
    try {
      const resp = await fetch("/qa/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body: document.getElementById("qaAskBody")?.value.trim() || "",
          asked_by: document.getElementById("qaAskBy")?.value.trim() || "",
          category:
            document.getElementById("qaAskCategory")?.value.trim() || "",
          tags: document.getElementById("qaAskTags")?.value.trim() || "",
        }),
      });
      const data = await resp.json();
      if (data.ok) {
        [
          "qaAskTitle",
          "qaAskBody",
          "qaAskBy",
          "qaAskCategory",
          "qaAskTags",
        ].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        });
        askForm.style.display = "none";
        askBtn.textContent = "+ Ask a Question";
        await load();
      } else {
        alert(data.error || "Failed to submit question.");
      }
    } catch (err) {
      console.error("ASK ERROR:", err);
    }
    askSubmit.disabled = false;
    askSubmit.textContent = "Submit Question";
  });

  // ---- SEARCH INTEGRATION (shares #scSearch with scenario_cards.js) ----
  document.getElementById("scSearch")?.addEventListener("input", () => {
    const q = document.getElementById("scSearch").value.trim();
    clearTimeout(window._qaBoardTimer);
    window._qaBoardTimer = setTimeout(() => load(q), 300);
  });

  // ---- INIT ----
  load();
})();
