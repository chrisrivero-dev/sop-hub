/* =====================================================
   FILE GUIDANCE — UI
   Owns: status pills in collapsed rows,
         guidance section in Details panels.
   No autosave. No AI/LLM. No cloud.
===================================================== */

(function () {
  "use strict";

  const STATUS_LABELS = {
    draft: "Draft",
    approved: "Approved",
    needs_review: "Needs Review",
  };

  const STATUS_CLASSES = {
    draft: "fg-pill-draft",
    approved: "fg-pill-approved",
    needs_review: "fg-pill-needs-review",
  };

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findSection(filePath) {
    return Array.from(document.querySelectorAll(".fg-section")).find(
      (el) => el.dataset.fgPath === filePath,
    );
  }

  function findPill(filePath) {
    return Array.from(document.querySelectorAll(".fg-status-pill")).find(
      (el) => el.dataset.fgPath === filePath,
    );
  }

  // ---- UPDATE PILL IN COLLAPSED ROW ----
  function updatePill(filePath, status) {
    const pill = findPill(filePath);
    if (!pill) return;

    if (!status) {
      pill.style.display = "none";
      pill.textContent = "";
      pill.className = "fg-status-pill";
      return;
    }

    pill.textContent = STATUS_LABELS[status] || status;
    pill.className = `fg-status-pill ${STATUS_CLASSES[status] || ""}`;
    pill.style.display = "";
  }

  // ---- RENDER GUIDANCE SECTION ----
  function renderSection(sectionEl, guidance) {
    const filePath = sectionEl.dataset.fgPath;

    // No guidance exists yet
    if (!guidance) {
      sectionEl.innerHTML = `
        <div class="fg-header">
          File Guidance
          <span class="fg-shared-label">Shared · Curated</span>
        </div>
        <p class="fg-empty-msg">No guidance added for this file yet.</p>
        <button class="fg-create-btn ref-details-btn"
                data-fg-path="${esc(filePath)}">+ Create Guidance</button>
      `;
      return;
    }

    const status = guidance.status || "draft";
    const pillCls = STATUS_CLASSES[status] || "";

    // ---- COMPACT CARD blocks (read-only, only non-empty fields) ----
    const compactBlocks = [];

    if (guidance.when_to_use) {
      compactBlocks.push(`
        <div class="fg-compact-block">
          <div class="fg-compact-label">Use this file when</div>
          <div class="fg-compact-text">${esc(guidance.when_to_use)}</div>
        </div>`);
    }
    if (guidance.cautions) {
      compactBlocks.push(`
        <div class="fg-compact-block">
          <div class="fg-compact-label">Key caution</div>
          <div class="fg-compact-text fg-caution-text">${esc(guidance.cautions)}</div>
        </div>`);
    }
    if (guidance.role) {
      compactBlocks.push(`
        <div class="fg-compact-block">
          <div class="fg-compact-label">Role</div>
          <div class="fg-compact-text">${esc(guidance.role)}</div>
        </div>`);
    }

    const compactContent = compactBlocks.length
      ? compactBlocks.join("")
      : `<div class="fg-empty-compact">No details added yet. Click Edit Guidance to add.</div>`;

    // ---- FULL READ-ONLY panel (all non-empty fields) ----
    const fullRows = [];
    const addRow = (label, val) => {
      if (!val || (Array.isArray(val) && !val.length)) return;
      const text = Array.isArray(val) ? val.join(", ") : val;
      fullRows.push(`
        <div class="fg-full-field">
          <div class="fg-full-label">${label}</div>
          <div class="fg-full-value">${esc(text)}</div>
        </div>`);
    };
    addRow("Role", guidance.role);
    addRow("Purpose", guidance.what_this_file_is_for);
    addRow("When to use", guidance.when_to_use);
    addRow("Avoid when", guidance.do_not_use_when);
    addRow("Helps with", guidance.helps_with);
    addRow("Cautions", guidance.cautions);
    addRow("Related files", guidance.related_files);
    addRow("Tags", guidance.tags);
    if (status === "approved" && guidance.approved_by) {
      addRow("Approved by", guidance.approved_by);
    }

    const fullContent = fullRows.length
      ? fullRows.join("")
      : `<div class="fg-empty-compact">No details added yet.</div>`;

    // ---- EDIT FORM field helpers ----
    const textField = (label, key, val, rows) => `
      <div class="fg-field-row">
        <label class="fg-label pt-1">${label}</label>
        <textarea class="fg-input border rounded text-sm p-1 flex-1 resize-none"
                  data-fg-key="${key}" rows="${rows || 2}">${esc(val || "")}</textarea>
      </div>`;

    const shortField = (label, key, val) => `
      <div class="fg-field-row">
        <label class="fg-label">${label}</label>
        <input type="text" class="fg-input border rounded text-sm p-1 flex-1"
               data-fg-key="${key}" value="${esc(val || "")}">
      </div>`;

    const listField = (label, key, arr) => `
      <div class="fg-field-row">
        <label class="fg-label">${label}</label>
        <input type="text" class="fg-list-input fg-input border rounded text-sm p-1 flex-1"
               data-fg-key="${key}"
               value="${esc(Array.isArray(arr) ? arr.join(", ") : arr || "")}"
               placeholder="comma-separated">
      </div>`;

    const approvedByRow =
      status === "approved"
        ? shortField("Approved by", "approved_by", guidance.approved_by)
        : "";

    const statusBtn =
      status === "draft" || status === "needs_review"
        ? `<button class="fg-approve-btn ref-details-btn fg-approve-action"
                 data-fg-path="${esc(filePath)}">✓ Mark Approved</button>`
        : `<button class="fg-needs-review-btn ref-details-btn"
                 data-fg-path="${esc(filePath)}">⚑ Mark Needs Review</button>`;

    sectionEl.innerHTML = `
      <div class="fg-header">
        File Guidance
        <span class="fg-shared-label">Shared · Curated</span>
        <span class="fg-status-badge ${pillCls}">${STATUS_LABELS[status] || status}</span>
      </div>

      <!-- COMPACT CARD (always visible) -->
      <div class="fg-compact">
        ${compactContent}
        <div class="fg-compact-btns">
          <button class="fg-toggle-full ref-details-btn"
                  data-fg-path="${esc(filePath)}">Show Full Guidance</button>
          <button class="fg-toggle-edit ref-details-btn"
                  data-fg-path="${esc(filePath)}">Edit Guidance</button>
        </div>
      </div>

      <!-- FULL READ-ONLY (collapsed by default) -->
      <div class="fg-full hidden">
        ${fullContent}
        <p class="fg-helper-text">Curated file guidance. Drafts should be reviewed before approval.</p>
      </div>

      <!-- EDIT FORM (collapsed by default) -->
      <div class="fg-edit-form hidden">
        <p class="fg-helper-text">Curated file guidance. Drafts should be reviewed before approval.</p>
        <div class="fg-fields space-y-2">
          ${shortField("Role", "role", guidance.role)}
          ${textField("Purpose", "what_this_file_is_for", guidance.what_this_file_is_for)}
          ${textField("When to use", "when_to_use", guidance.when_to_use)}
          ${textField("Avoid when", "do_not_use_when", guidance.do_not_use_when)}
          ${listField("Helps with", "helps_with", guidance.helps_with)}
          ${textField("Cautions", "cautions", guidance.cautions)}
          ${listField("Related files", "related_files", guidance.related_files)}
          ${listField("Tags", "tags", guidance.tags)}
          ${approvedByRow}
        </div>
        <div class="fg-actions">
          <button class="fg-save-btn bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  data-fg-path="${esc(filePath)}">Save Draft</button>
          ${statusBtn}
        </div>
      </div>
    `;
  }

  // ---- LOAD GUIDANCE FOR ROW ----
  async function loadGuidanceForRow(rowEl) {
    const sectionEl = rowEl.querySelector(".fg-section");
    if (!sectionEl || sectionEl.dataset.fgLoaded === "true") return;

    const filePath = sectionEl.dataset.fgPath;
    if (!filePath) return;

    sectionEl.innerHTML = `<div class="fg-loading-msg">Loading guidance…</div>`;

    try {
      const resp = await fetch(
        `/file-guidance?path=${encodeURIComponent(filePath)}`,
      );
      if (resp.status === 404) {
        renderSection(sectionEl, null);
      } else {
        const data = await resp.json();
        if (data.ok) {
          renderSection(sectionEl, data.guidance);
          updatePill(filePath, data.guidance.status);
        } else {
          renderSection(sectionEl, null);
        }
      }
    } catch (err) {
      console.error("FG LOAD ERROR:", err);
      sectionEl.innerHTML = `<div class="fg-error-msg">Could not load guidance.</div>`;
    }

    sectionEl.dataset.fgLoaded = "true";
  }

  // ---- COLLECT FORM DATA ----
  function collectFormData(sectionEl) {
    const filePath = sectionEl.dataset.fgPath;
    const rowEl = sectionEl.closest(".ref-row");
    const fileName = rowEl?.dataset.file || "";
    const payload = { file_path: filePath, file_name: fileName };

    sectionEl.querySelectorAll(".fg-input[data-fg-key]").forEach((input) => {
      const key = input.dataset.fgKey;
      if (input.classList.contains("fg-list-input")) {
        payload[key] = input.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        payload[key] = input.value.trim();
      }
    });

    return payload;
  }

  // ---- SAVE ----
  async function saveGuidance(sectionEl) {
    const saveBtn = sectionEl.querySelector(".fg-save-btn");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";
    }

    try {
      const payload = collectFormData(sectionEl);
      const resp = await fetch("/file-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();

      if (data.ok) {
        renderSection(sectionEl, data.guidance);
        sectionEl.dataset.fgLoaded = "true";
        updatePill(payload.file_path, data.guidance.status);

        const freshBtn = sectionEl.querySelector(".fg-save-btn");
        if (freshBtn) {
          freshBtn.textContent = "Saved ✓";
          freshBtn.disabled = true;
          setTimeout(() => {
            freshBtn.textContent = "Save Draft";
            freshBtn.disabled = false;
          }, 1500);
        }
        return;
      }

      alert(data.error || "Save failed.");
    } catch (err) {
      console.error("FG SAVE ERROR:", err);
      alert("Save failed.");
    }

    if (saveBtn) {
      saveBtn.textContent = "Save Draft";
      saveBtn.disabled = false;
    }
  }

  // ---- APPROVE ----
  async function approveGuidance(filePath, sectionEl) {
    const approvedBy = (
      prompt("Approved by (leave blank to skip):") ?? ""
    ).trim();
    try {
      const resp = await fetch("/file-guidance/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: filePath, approved_by: approvedBy }),
      });
      const data = await resp.json();
      if (data.ok) {
        renderSection(sectionEl, data.guidance);
        sectionEl.dataset.fgLoaded = "true";
        updatePill(filePath, data.guidance.status);
      } else {
        alert(data.error || "Approve failed.");
      }
    } catch (err) {
      console.error("FG APPROVE ERROR:", err);
    }
  }

  // ---- NEEDS REVIEW ----
  async function flagNeedsReview(filePath, sectionEl) {
    try {
      const resp = await fetch("/file-guidance/needs-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: filePath }),
      });
      const data = await resp.json();
      if (data.ok) {
        renderSection(sectionEl, data.guidance);
        sectionEl.dataset.fgLoaded = "true";
        updatePill(filePath, data.guidance.status);
      } else {
        alert(data.error || "Failed.");
      }
    } catch (err) {
      console.error("FG NEEDS REVIEW ERROR:", err);
    }
  }

  // ---- EVENT DELEGATION ----
  document.addEventListener("click", async (e) => {
    // Hook into details toggle — setTimeout(0) lets reference.js toggle first
    const detailsBtn = e.target.closest(".details-toggle");
    if (detailsBtn) {
      setTimeout(() => {
        const rowEl = detailsBtn.closest(".ref-row");
        const detail = rowEl?.querySelector(".ref-row-detail");
        if (detail && !detail.classList.contains("hidden")) {
          loadGuidanceForRow(rowEl);
        }
      }, 0);
      // Do not return — reference.js must also handle this click
    }

    // Show / Hide Full Guidance
    const fullBtn = e.target.closest(".fg-toggle-full");
    if (fullBtn) {
      const sectionEl = findSection(fullBtn.dataset.fgPath);
      if (!sectionEl) return;
      const fullPanel = sectionEl.querySelector(".fg-full");
      const editForm = sectionEl.querySelector(".fg-edit-form");
      const editBtn = sectionEl.querySelector(".fg-toggle-edit");
      const isOpen = !fullPanel.classList.contains("hidden");
      if (isOpen) {
        fullPanel.classList.add("hidden");
        fullBtn.textContent = "Show Full Guidance";
      } else {
        fullPanel.classList.remove("hidden");
        fullBtn.textContent = "Hide Full Guidance";
        editForm.classList.add("hidden");
        if (editBtn) editBtn.textContent = "Edit Guidance";
      }
      return;
    }

    // Show / Hide Edit Guidance
    const editBtn = e.target.closest(".fg-toggle-edit");
    if (editBtn) {
      const sectionEl = findSection(editBtn.dataset.fgPath);
      if (!sectionEl) return;
      const editForm = sectionEl.querySelector(".fg-edit-form");
      const fullPanel = sectionEl.querySelector(".fg-full");
      const fullBtn = sectionEl.querySelector(".fg-toggle-full");
      const isOpen = !editForm.classList.contains("hidden");
      if (isOpen) {
        editForm.classList.add("hidden");
        editBtn.textContent = "Edit Guidance";
      } else {
        editForm.classList.remove("hidden");
        editBtn.textContent = "Close Editor";
        fullPanel.classList.add("hidden");
        if (fullBtn) fullBtn.textContent = "Show Full Guidance";
      }
      return;
    }

    // Create Guidance — render blank record and auto-open edit form
    const createBtn = e.target.closest(".fg-create-btn");
    if (createBtn) {
      const filePath = createBtn.dataset.fgPath;
      const sectionEl = findSection(filePath);
      if (!sectionEl) return;
      renderSection(sectionEl, {
        file_path: filePath,
        file_name: sectionEl.closest(".ref-row")?.dataset.file || "",
        status: "draft",
        role: "",
        what_this_file_is_for: "",
        when_to_use: "",
        do_not_use_when: "",
        helps_with: [],
        cautions: "",
        related_files: [],
        tags: [],
        approved_by: "",
      });
      sectionEl.dataset.fgLoaded = "true";
      const editForm = sectionEl.querySelector(".fg-edit-form");
      const toggleEdit = sectionEl.querySelector(".fg-toggle-edit");
      if (editForm) editForm.classList.remove("hidden");
      if (toggleEdit) toggleEdit.textContent = "Close Editor";
      return;
    }

    // Save Draft
    const saveBtn = e.target.closest(".fg-save-btn");
    if (saveBtn) {
      const sectionEl = findSection(saveBtn.dataset.fgPath);
      if (sectionEl) await saveGuidance(sectionEl);
      return;
    }

    // Mark Approved
    const approveBtn = e.target.closest(".fg-approve-btn");
    if (approveBtn) {
      const filePath = approveBtn.dataset.fgPath;
      const sectionEl = findSection(filePath);
      if (sectionEl) await approveGuidance(filePath, sectionEl);
      return;
    }

    // Mark Needs Review
    const nrBtn = e.target.closest(".fg-needs-review-btn");
    if (nrBtn) {
      const filePath = nrBtn.dataset.fgPath;
      const sectionEl = findSection(filePath);
      if (sectionEl) await flagNeedsReview(filePath, sectionEl);
      return;
    }
  });

  // ---- BATCH INIT: PAINT APPROVED PILLS ON PAGE LOAD ----
  (async function () {
    const paths = Array.from(document.querySelectorAll(".fg-status-pill"))
      .map((el) => el.dataset.fgPath)
      .filter(Boolean);

    if (!paths.length) return;

    try {
      const resp = await fetch("/file-guidance/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });
      const data = await resp.json();
      if (data.ok) {
        Object.values(data.guidance).forEach((g) =>
          updatePill(g.file_path, g.status),
        );
      }
    } catch (err) {
      console.warn("FG batch pill init failed:", err);
    }
  })();
})();
