/* =====================================================
   SCENARIO CARD ADMIN — UI  v1
   Requires QA_EDITOR_MODE=1 (enforced server-side).
   No AI. No LLM. No cloud.
===================================================== */

(function () {
  "use strict";

  const listEl    = document.getElementById("scaList");
  const statsEl   = document.getElementById("scaStats");
  const searchEl  = document.getElementById("scaSearch");
  const filtersEl = document.getElementById("scaFilters");

  if (!listEl) return;

  let activeFilter  = "all";
  let debounceTimer = null;

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(); } catch { return ""; }
  }

  // ── STATUS BADGE ────────────────────────────────────

  function statusBadge(status) {
    const map = {
      approved:     ["sca-approved",     "Approved"],
      draft:        ["sca-draft",        "Draft"],
      needs_review: ["sca-needs-review", "Needs Review"],
    };
    const [cls, label] = map[status] || ["sca-draft", status];
    return `<span class="sca-badge ${cls}">${label}</span>`;
  }

  // ── EDIT FORM ────────────────────────────────────────

  function editFormHtml(c) {
    const tf = (label, key, val, rows) => `
      <div class="sca-field-row">
        <label class="sca-label">${label}</label>
        <textarea class="sca-textarea" data-key="${key}" rows="${rows || 2}">${esc(val || "")}</textarea>
      </div>`;
    const sf = (label, key, val) => `
      <div class="sca-field-row">
        <label class="sca-label">${label}</label>
        <input type="text" class="sca-input" data-key="${key}" value="${esc(val || "")}">
      </div>`;
    const statusOpts = ["draft", "approved", "needs_review"]
      .map(s => `<option value="${s}" ${c.status === s ? "selected" : ""}>${s}</option>`)
      .join("");

    return `
      <div class="sca-edit-panel" id="editPanel-${c.id}">
        ${sf("Title", "title", c.title)}
        ${tf("Answer", "plain_english_answer", c.plain_english_answer, 3)}
        ${tf("What to do", "what_to_do", c.what_to_do, 3)}
        ${tf("Best references", "best_references", c.best_references, 2)}
        ${tf("Escalate when", "escalate_when", c.escalate_when, 2)}
        ${tf("Trigger phrases", "trigger_phrases", c.trigger_phrases, 2)}
        ${sf("Tags", "tags", c.tags)}
        ${sf("Source reference", "source_reference", c.source_reference)}
        ${sf("Source date", "source_date", c.source_date)}
        <div class="sca-field-row">
          <label class="sca-label">Status</label>
          <select class="sca-input" data-key="status">${statusOpts}</select>
        </div>
        ${sf("Approved by", "approved_by", c.approved_by)}
        <div class="sca-save-row">
          <button class="sca-save-btn bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
                  data-id="${c.id}">Save Changes</button>
          <button class="sca-cancel-edit text-sm text-gray-400 hover:text-gray-600"
                  data-id="${c.id}">Cancel</button>
        </div>
      </div>`;
  }

  // ── RENDER CARD ──────────────────────────────────────

  function renderCard(c) {
    const tags = (c.tags || "").split(",").map(t => t.trim()).filter(Boolean)
      .map(t => `<span class="sc-tag">${esc(t)}</span>`).join("");
    const tagsHtml = tags ? `<div class="sc-tags mt-1">${tags}</div>` : "";

    return `
      <div class="sca-card" id="scaCard-${c.id}">
        <div class="sca-card-head">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              ${statusBadge(c.status)}
              <span class="sca-title">${esc(c.title)}</span>
            </div>
            <div class="sca-meta">
              ${c.source_reference ? "Source: " + esc(c.source_reference) + " · " : ""}Updated ${fmtDate(c.updated_at)}${c.approved_by ? " · Approved by " + esc(c.approved_by) : ""}
            </div>
            ${tagsHtml}
          </div>
          <div class="sca-actions">
            <button class="sca-btn sca-btn-blue  sca-edit-btn"
                    data-id="${c.id}">Edit</button>
            <button class="sca-btn sca-btn-green sca-approve-btn"
                    data-id="${c.id}" data-title="${esc(c.title)}">Mark Approved</button>
            <button class="sca-btn sca-btn-yellow sca-nr-btn"
                    data-id="${c.id}">Needs Review</button>
            <button class="sca-btn sca-btn-red   sca-delete-btn"
                    data-id="${c.id}" data-title="${esc(c.title)}">Delete</button>
          </div>
        </div>
        ${editFormHtml(c)}
      </div>`;
  }

  // ── RENDER LIST ──────────────────────────────────────

  function renderList(cards, counts) {
    if (statsEl && counts) {
      statsEl.innerHTML = [
        `<span>Total <strong>${counts.all}</strong></span>`,
        `<span class="text-green-600">Approved <strong>${counts.approved}</strong></span>`,
        `<span class="text-blue-600">Draft <strong>${counts.draft}</strong></span>`,
        `<span class="text-yellow-600">Needs Review <strong>${counts.needs_review}</strong></span>`,
      ].join("");
    }

    if (!cards.length) {
      listEl.innerHTML = `<div class="text-sm text-gray-400 py-3">No cards match this filter.</div>`;
      return;
    }

    listEl.innerHTML = cards.map(renderCard).join("");
    bindEvents();
  }

  // ── EVENT BINDING ────────────────────────────────────

  function bindEvents() {
    // Toggle edit panel
    listEl.querySelectorAll(".sca-edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const panel = document.getElementById(`editPanel-${btn.dataset.id}`);
        if (!panel) return;
        const open = panel.style.display === "block";
        panel.style.display = open ? "none" : "block";
        btn.textContent = open ? "Edit" : "Close";
      });
    });

    // Cancel edit
    listEl.querySelectorAll(".sca-cancel-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const panel = document.getElementById(`editPanel-${btn.dataset.id}`);
        if (panel) panel.style.display = "none";
        const editBtn = document.querySelector(`#scaCard-${btn.dataset.id} .sca-edit-btn`);
        if (editBtn) editBtn.textContent = "Edit";
      });
    });

    // Save
    listEl.querySelectorAll(".sca-save-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id    = btn.dataset.id;
        const panel = document.getElementById(`editPanel-${id}`);
        const data  = {};
        panel.querySelectorAll("[data-key]").forEach(el => { data[el.dataset.key] = el.value; });

        if (!(data.title || "").trim()) {
          panel.querySelector("[data-key='title']").focus();
          return;
        }

        btn.disabled = true; btn.textContent = "Saving…";
        try {
          const resp = await fetch(`/scenario-cards/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await resp.json();
          if (result.ok) {
            await load();
          } else {
            alert(result.error || "Save failed.");
            btn.disabled = false; btn.textContent = "Save Changes";
          }
        } catch (err) {
          console.error("SAVE ERROR:", err);
          btn.disabled = false; btn.textContent = "Save Changes";
        }
      });
    });

    // Mark Approved
    listEl.querySelectorAll(".sca-approve-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const approvedBy = (prompt("Approved by (leave blank to skip):") ?? "").trim();
        btn.disabled = true; btn.textContent = "Approving…";
        try {
          const resp = await fetch(`/scenario-cards/${btn.dataset.id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ approved_by: approvedBy }),
          });
          const data = await resp.json();
          if (data.ok) {
            await load();
          } else {
            alert(data.error || "Failed.");
            btn.disabled = false; btn.textContent = "Mark Approved";
          }
        } catch (err) {
          console.error("APPROVE ERROR:", err);
          btn.disabled = false; btn.textContent = "Mark Approved";
        }
      });
    });

    // Needs Review
    listEl.querySelectorAll(".sca-nr-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "Updating…";
        try {
          const resp = await fetch(`/scenario-cards/${btn.dataset.id}/needs-review`, {
            method: "POST",
          });
          const data = await resp.json();
          if (data.ok) {
            await load();
          } else {
            alert(data.error || "Failed.");
            btn.disabled = false; btn.textContent = "Needs Review";
          }
        } catch (err) {
          console.error("NR ERROR:", err);
          btn.disabled = false; btn.textContent = "Needs Review";
        }
      });
    });

    // Delete
    listEl.querySelectorAll(".sca-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const title = btn.dataset.title || "this card";
        if (!confirm(`Delete this Scenario Card? This cannot be undone.\n\n"${title}"`)) return;
        btn.disabled = true; btn.textContent = "Deleting…";
        try {
          const resp = await fetch(`/scenario-cards/${btn.dataset.id}`, {
            method: "DELETE",
          });
          const data = await resp.json();
          if (data.ok) {
            await load();
          } else {
            alert(data.error || "Delete failed.");
            btn.disabled = false; btn.textContent = "Delete";
          }
        } catch (err) {
          console.error("DELETE ERROR:", err);
          btn.disabled = false; btn.textContent = "Delete";
        }
      });
    });
  }

  // ── LOAD ─────────────────────────────────────────────

  async function load() {
    const q   = searchEl?.value.trim() || "";
    const url = `/scenario-cards/admin/data?status=${activeFilter}${q ? "&q=" + encodeURIComponent(q) : ""}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.ok) {
        renderList(data.cards, data.counts);
      } else {
        listEl.innerHTML = `<div class="text-sm text-red-400">Could not load cards.</div>`;
      }
    } catch (err) {
      listEl.innerHTML = `<div class="text-sm text-red-400">Could not load cards.</div>`;
      console.error("SCA LOAD ERROR:", err);
    }
  }

  // ── FILTER ───────────────────────────────────────────

  filtersEl?.addEventListener("click", (e) => {
    const btn = e.target.closest(".sc-filter-btn");
    if (!btn) return;
    filtersEl.querySelectorAll(".sc-filter-btn").forEach(b => b.classList.remove("sc-filter-active"));
    btn.classList.add("sc-filter-active");
    activeFilter = btn.dataset.filter;
    load();
  });

  // ── SEARCH ───────────────────────────────────────────

  searchEl?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(load, 280);
  });

  // ── INIT ─────────────────────────────────────────────

  load();
})();
