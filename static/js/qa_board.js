/* =====================================================
   MAPPING Q&A BOARD — QUESTIONS & ANSWERS  v2
   No AI. No LLM. No cloud. Local only.
   Editor actions gated by window.QA_EDITOR_MODE.
===================================================== */

(function () {
  "use strict";

  const qaResults = document.getElementById("qaResults");
  const qaCount = document.getElementById("qaCount");
  const askBtn = document.getElementById("qaAskBtn");
  const askForm = document.getElementById("qaAskForm");
  const askCancel = document.getElementById("qaAskCancel");
  const askSubmit = document.getElementById("qaAskSubmit");

  if (!qaResults) return;

  let questions = [];
  let activeFilter = "all";

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

  // ---- FILTER ----
  document.getElementById("scFilters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".sc-filter-btn");
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    render(questions);
  });

  // ---- RENDER ANSWER ----
  function renderAnswer(a) {
    const bestBadge = a.is_best_answer
      ? `<span class="qa-best-badge">✓ Best</span>`
      : "";
    const approvedBadge = a.approved_by
      ? `<span class="qa-approved-badge">Approved by ${esc(a.approved_by)}</span>`
      : "";
    const markBestBtn =
      window.QA_EDITOR_MODE && !a.is_best_answer
        ? `<button class="qa-mark-best text-xs text-gray-400 hover:text-green-700 whitespace-nowrap"
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
    const isArchived = q.status === "archived";

    const statusBadge =
      q.status === "open"
        ? `<span class="qa-badge-open">Open</span>`
        : q.status === "answered"
          ? `<span class="qa-badge-answered">Answered</span>`
          : `<span class="qa-badge-archived">Archived</span>`;

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

    const noAnswerMsg = window.QA_EDITOR_MODE
      ? "No answers yet."
      : "Awaiting senior/supervisor answer.";

    const answersHtml =
      q.answers && q.answers.length
        ? q.answers.map(renderAnswer).join("")
        : `<div class="qa-no-answers">${noAnswerMsg}</div>`;

    // Add Answer form — editor only, not shown on archived questions
    const answerFormHtml =
      window.QA_EDITOR_MODE && !isArchived
        ? `
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
      </div>`
        : "";

    // Editor action bar
    const editorActions = window.QA_EDITOR_MODE
      ? `
      ${
        !isArchived
          ? `
        <button class="qa-toggle-answer text-sm text-blue-600 hover:text-blue-800"
                data-qid="${q.id}">+ Add Answer</button>
        <button class="qa-archive-btn text-xs text-gray-400 hover:text-yellow-700 border border-gray-200 rounded px-2 py-0.5"
                data-qid="${q.id}">Archive</button>`
          : ""
      }
      <button class="qa-delete-btn text-xs text-gray-400 hover:text-red-600 border border-gray-200 rounded px-2 py-0.5"
              data-qid="${q.id}" data-title="${esc(q.title)}">Delete Test Question</button>
    `
      : "";

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
        ${answerFormHtml}
        ${editorActions ? `<div class="qa-actions">${editorActions}</div>` : ""}
      </div>`;
  }

  // ---- RENDER BOARD ----
  function render(qs) {
    let filtered;
    switch (activeFilter) {
      case "open":
        filtered = qs.filter((q) => q.status === "open");
        break;
      case "answered":
        filtered = qs.filter((q) => q.status === "answered");
        break;
      case "archived":
        filtered = qs.filter((q) => q.status === "archived");
        break;
      default:
        filtered = qs.filter((q) => q.status !== "archived");
        break; // "all"
    }

    if (qaCount)
      qaCount.textContent = filtered.length ? `(${filtered.length})` : "";

    if (!filtered.length) {
      const messages = {
        open: "No open questions yet. Click <strong>+ Ask a Question</strong> to submit one.",
        answered: "No answered questions yet.",
        archived: "No archived questions.",
        all: "No questions yet.",
      };
      qaResults.innerHTML = `<div class="text-sm text-gray-400 py-2">${messages[activeFilter] || messages.all}</div>`;
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

    // Cancel answer form
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

    // Archive question
    document.querySelectorAll(".qa-archive-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "Archiving…";
        try {
          const resp = await fetch(`/qa/questions/${btn.dataset.qid}/archive`, {
            method: "POST",
          });
          const data = await resp.json();
          if (data.ok) {
            await load(currentQuery());
          } else {
            alert(data.error || "Archive failed.");
            btn.disabled = false;
            btn.textContent = "Archive";
          }
        } catch (err) {
          console.error("ARCHIVE ERROR:", err);
          btn.disabled = false;
          btn.textContent = "Archive";
        }
      });
    });

    // Delete question
    document.querySelectorAll(".qa-delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const title = btn.dataset.title || "this question";
        if (
          !confirm(
            `Delete this question and all answers? This cannot be undone.\n\n"${title}"`,
          )
        )
          return;
        btn.disabled = true;
        btn.textContent = "Deleting…";
        try {
          const resp = await fetch(`/qa/questions/${btn.dataset.qid}/delete`, {
            method: "POST",
          });
          const data = await resp.json();
          if (data.ok) {
            await load(currentQuery());
          } else {
            alert(data.error || "Delete failed.");
            btn.disabled = false;
            btn.textContent = "Delete Test Question";
          }
        } catch (err) {
          console.error("DELETE ERROR:", err);
          btn.disabled = false;
          btn.textContent = "Delete Test Question";
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
        // fetch archived separately so local filter can switch without re-fetching
        const archResp = await fetch("/qa/questions?status=archived");
        const archData = await archResp.json();
        questions = [
          ...(data.questions || []),
          ...(archData.ok ? archData.questions : []),
        ];
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

  // ---- SEARCH INTEGRATION ----
  document.getElementById("scSearch")?.addEventListener("input", () => {
    clearTimeout(window._qaBoardTimer);
    window._qaBoardTimer = setTimeout(() => load(currentQuery()), 300);
  });

  // ---- INIT ----
  load();
})();
