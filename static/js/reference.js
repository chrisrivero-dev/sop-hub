/* =====================================================
   REFERENCE LIBRARY — BEHAVIOR
   Owns: group collapse, unpin, open-folder,
         row-click preview trigger, import/export
   Preview functions live in reference_preview.js
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  console.log("REFERENCE_JS_LOADED_V20013");

  // =========================
  // GROUP COLLAPSE / EXPAND
  // =========================
  document.querySelectorAll(".group-header").forEach((header) => {
    header.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;

      const groupName = header.dataset.group;
      const groupBody = document.querySelector(
        `.group-body[data-group="${CSS.escape(groupName)}"]`,
      );
      const arrow = header.querySelector(".group-arrow");

      if (!groupBody) return;

      const isHidden = groupBody.classList.contains("hidden");
      groupBody.classList.toggle("hidden");

      if (arrow) {
        arrow.textContent = isHidden ? "▼" : "▶";
      }
    });
  });

  // =========================
  // GLOBAL CLICK HANDLER
  // =========================
  document.addEventListener("click", async (e) => {
    // UNPIN
    const unpinBtn = e.target.closest(".unpin-btn");
    if (unpinBtn) {
      const name = unpinBtn.dataset.name || "this file";
      if (!confirm(`Remove "${name}" from Reference Library?`)) return;

      const filePath = unpinBtn.dataset.path;
      const fileName = unpinBtn.dataset.name;

      if (!filePath) return;

      try {
        const resp = await fetch("/toggle-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: fileName,
            file_path: filePath,
            folder: "",
          }),
        });

        const data = await resp.json();

        if (data.success) {
          const row = unpinBtn.closest(".ref-row");
          if (row) row.remove();
        } else {
          console.error("UNPIN FAILED:", data);
        }
      } catch (err) {
        console.error("UNPIN ERROR:", err);
      }

      return;
    }

    // OPEN ORIGINAL FROM PREVIEW PANEL
    const previewOpenBtn = e.target.closest(".open-original-from-preview");
    if (previewOpenBtn) {
      const path = previewOpenBtn.dataset.path;
      if (!path) return;

      try {
        await fetch(`/open-file?path=${encodeURIComponent(path)}`);
      } catch (err) {
        console.error("OPEN ORIGINAL FROM PREVIEW ERROR:", err);
      }

      return;
    }

    // OPEN FOLDER
    const folderBtn = e.target.closest(".open-folder");
    if (folderBtn) {
      const path = folderBtn.dataset.path;
      if (!path) return;

      try {
        await fetch(`/open-folder?path=${encodeURIComponent(path)}`);
      } catch (err) {
        console.error("OPEN FOLDER ERROR:", err);
      }

      return;
    }

    // DETAILS TOGGLE
    const detailsBtn = e.target.closest(".details-toggle");
    if (detailsBtn) {
      const rowEl = detailsBtn.closest(".ref-row");
      const detail = rowEl?.querySelector(".ref-row-detail");

      if (detail) {
        const opening = detail.classList.contains("hidden");
        detail.classList.toggle("hidden");
        detailsBtn.textContent = opening ? "Details ⌃" : "Details ⌄";
      }

      return;
    }

    // ROW CLICK → PREVIEW
    const row = e.target.closest(".ref-row");
    if (row) {
      const path = row.querySelector(".ref-display-name")?.dataset.path;

      if (path) {
        window.loadReferencePreview?.(path);
      }
    }

    // DELETE GROUP
    const deleteGroupBtn = e.target.closest(".delete-group");
    if (deleteGroupBtn) {
      const groupName = deleteGroupBtn.dataset.groupName;
      if (!groupName) return;

      if (
        !confirm(`Delete group "${groupName}"? Items will move to Ungrouped.`)
      )
        return;

      try {
        const resp = await fetch(
          `/delete-group/${encodeURIComponent(groupName)}`,
          {
            method: "POST",
          },
        );

        const data = await resp.json();

        if (!data.success) {
          alert(data.error || "Could not delete group.");
          return;
        }

        window.location.reload();
      } catch (err) {
        console.error("DELETE GROUP ERROR:", err);
        alert("Unexpected error deleting group.");
      }
    }
  });

  // =========================
  // SEARCH / FILTER
  // =========================
  const refSearch = document.getElementById("refSearch");
  if (refSearch) {
    refSearch.addEventListener("input", () => {
      const query = refSearch.value.toLowerCase();

      document.querySelectorAll(".ref-row").forEach((row) => {
        const name = (row.dataset.name || "").toLowerCase();
        const file = (row.dataset.file || "").toLowerCase();
        const visible = !query || name.includes(query) || file.includes(query);
        row.style.display = visible ? "" : "none";
      });
    });
  }

  // =========================
  // ADD NEW GROUP
  // =========================
  const addGroupBtn = document.getElementById("addGroupBtn");
  if (addGroupBtn) {
    addGroupBtn.addEventListener("click", async () => {
      const name = prompt("Enter new group name:");
      if (!name || !name.trim()) return;

      try {
        const resp = await fetch("/create-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });

        const data = await resp.json();

        if (!data.success) {
          alert(data.error || "Could not create group.");
          return;
        }

        window.location.reload();
      } catch (err) {
        console.error("ADD GROUP ERROR:", err);
        alert("Unexpected error creating group.");
      }
    });
  }

  // =========================
  // EXPORT
  // =========================
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        const resp = await fetch("/export-settings");
        const data = await resp.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sop_hub_reference.json";
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("EXPORT ERROR:", err);
        alert("Export failed.");
      }
    });
  }

  // =========================
  // IMPORT
  // =========================
  const importBtn = document.getElementById("importBtn");
  if (importBtn) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      let parsed;

      try {
        parsed = JSON.parse(await file.text());
      } catch {
        alert("Invalid JSON file.");
        return;
      }

      if (
        !confirm(
          "Import will replace all current Reference Library data. Continue?",
        )
      ) {
        return;
      }

      try {
        const resp = await fetch("/import-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });

        const data = await resp.json();

        if (!data.success) {
          alert(data.message || "Import failed.");
          return;
        }

        window.location.reload();
      } catch (err) {
        console.error("IMPORT ERROR:", err);
        alert("Import failed.");
      }
    });

    importBtn.addEventListener("click", () => {
      fileInput.value = "";
      fileInput.click();
    });
  }

  // =========================
  // GROUP BADGE SYNC
  // =========================
  document.querySelectorAll(".group-select").forEach((select) => {
    select.addEventListener("change", () => {
      const row = select.closest(".ref-row");
      const badge = row?.querySelector(".ref-group-badge");

      if (badge) {
        badge.textContent = select.value;
      }
    });
  });

  // =========================
  // NOTES PREVIEW SYNC
  // =========================
  document.querySelectorAll(".note-input").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const row = textarea.closest(".ref-row");
      const preview = row?.querySelector(".ref-notes-preview");

      if (preview) {
        const firstLine = textarea.value.split("\n")[0].slice(0, 80);
        preview.textContent = firstLine || "No notes yet.";
      }
    });
  });

  // =========================
  // FILENAME DBLCLICK → OPEN FILE
  // =========================
  document.addEventListener("dblclick", async (e) => {
    const nameSpan = e.target.closest(".ref-display-name");
    if (!nameSpan) return;

    const path = nameSpan.dataset.path;
    if (!path) return;

    try {
      await fetch(`/open-file?path=${encodeURIComponent(path)}`);
    } catch (err) {
      console.error("DBLCLICK OPEN ERROR:", err);
    }
  });
});
