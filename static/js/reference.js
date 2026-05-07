/* =====================================================
   REFERENCE LIBRARY — CLEAN SYSTEM
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  console.log("REFERENCE_JS_LOADED_V20010");

  // =========================
  // HTML ESCAPE HELPER
  // =========================
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================
  // PREVIEW LOADER
  // =========================
  function loadReferencePreview(path) {
    const panel = document.getElementById("referencePreview");

    if (!panel || !path) return;

    const lowerPath = path.toLowerCase();
    const previewUrl = `/preview?path=${encodeURIComponent(path)}`;

    if (lowerPath.endsWith(".xls") || lowerPath.endsWith(".xlsx")) {
      loadExcelPreview(path);
      return;
    }

    if (lowerPath.endsWith(".doc") || lowerPath.endsWith(".docx")) {
      loadWordPreview(path);
      return;
    }

    let previewHtml = "";

    if (lowerPath.endsWith(".pdf")) {
      previewHtml = `
        <iframe
          src="${previewUrl}"
          class="w-full h-[650px] border rounded bg-white">
        </iframe>
      `;
    } else if (
      lowerPath.endsWith(".png") ||
      lowerPath.endsWith(".jpg") ||
      lowerPath.endsWith(".jpeg") ||
      lowerPath.endsWith(".gif") ||
      lowerPath.endsWith(".webp")
    ) {
      previewHtml = `
        <img
          src="${previewUrl}"
          class="max-w-full border rounded bg-white"
          alt="Reference preview">
      `;
    } else {
      previewHtml = `
        <div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Preview image may not reflect the latest file changes. Open the original file for the current version.
        </div>

        <button type="button"
                class="open-original-from-preview bg-blue-600 text-white px-3 py-2 rounded mb-3"
                data-path="${escapeHtml(path)}">
          Open Original File
        </button>

        <div class="preview-image-wrap">
          <img
            src="${previewUrl}"
            class="max-w-full border rounded bg-white"
            alt="Reference preview"
            onerror="this.style.display='none'; const err=this.parentElement.querySelector('.preview-error'); if (err) err.style.display='block';">
          <div class="preview-error text-gray-400" style="display:none;">
            No preview image available. Open the original file instead.
          </div>
        </div>
      `;
    }

    panel.innerHTML = `
      <div class="text-sm text-gray-500 mb-2">DOCUMENT PREVIEW</div>
      ${previewHtml}
    `;
  }

  // =========================
  // EXCEL PREVIEW
  // =========================
  async function loadExcelPreview(path) {
    const panel = document.getElementById("referencePreview");

    if (!panel || !path) return;

    panel.innerHTML = `
      <div class="text-sm text-gray-500 mb-2">EXCEL PREVIEW</div>
      <div class="text-gray-400 text-sm">Loading first rows...</div>
    `;

    try {
      const resp = await fetch(
        `/excel-preview?path=${encodeURIComponent(path)}`,
      );
      const data = await resp.json();

      if (!data.success) {
        panel.innerHTML = `
          <div class="text-sm text-gray-500 mb-2">EXCEL PREVIEW</div>
          <div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ${escapeHtml(data.message || "No Excel preview available.")}
          </div>
          <button type="button"
                  class="open-original-from-preview bg-blue-600 text-white px-3 py-2 rounded"
                  data-path="${escapeHtml(path)}">
            Open Original File
          </button>
        `;
        return;
      }

      let tableHtml = `
        <div class="text-sm text-gray-500 mb-2">EXCEL PREVIEW</div>

        <div class="mb-2 text-xs text-gray-500 break-all">
          ${escapeHtml(data.file_name)} — Sheet: ${escapeHtml(data.sheet_name)}
        </div>

        <div class="overflow-auto border rounded bg-white max-h-[560px]">
          <table class="text-xs border-collapse w-full">
            <thead>
              <tr class="bg-gray-100">
      `;

      data.columns.forEach((col) => {
        tableHtml += `
          <th class="border p-1 text-left whitespace-nowrap">
            ${escapeHtml(col)}
          </th>
        `;
      });

      tableHtml += `
              </tr>
            </thead>
            <tbody>
      `;

      data.rows.forEach((row) => {
        tableHtml += "<tr>";

        row.forEach((cell) => {
          tableHtml += `
            <td class="border p-1 whitespace-nowrap">
              ${escapeHtml(cell)}
            </td>
          `;
        });

        tableHtml += "</tr>";
      });

      tableHtml += `
            </tbody>
          </table>
        </div>

        <div class="mt-3">
          <button type="button"
                  class="open-original-from-preview bg-blue-600 text-white px-3 py-2 rounded"
                  data-path="${escapeHtml(path)}">
            Open Original File
          </button>
        </div>
      `;

      panel.innerHTML = tableHtml;
    } catch (err) {
      console.error("EXCEL PREVIEW ERROR:", err);

      panel.innerHTML = `
        <div class="text-sm text-gray-500 mb-2">EXCEL PREVIEW</div>
        <div class="text-red-500 text-sm">Excel preview failed.</div>
        <button type="button"
                class="open-original-from-preview bg-blue-600 text-white px-3 py-2 rounded mt-3"
                data-path="${escapeHtml(path)}">
          Open Original File
        </button>
      `;
    }
  }

  // =========================
  // WORD PREVIEW
  // =========================
  async function loadWordPreview(path) {
    const panel = document.getElementById("referencePreview");

    if (!panel || !path) return;

    panel.innerHTML = `
      <div class="text-sm text-gray-500 mb-2">WORD PREVIEW</div>
      <div class="text-gray-400 text-sm">Loading document text...</div>
    `;

    try {
      const resp = await fetch(
        `/word-preview?path=${encodeURIComponent(path)}`,
      );
      const data = await resp.json();

      if (!data.success) {
        panel.innerHTML = `
          <div class="text-sm text-gray-500 mb-2">WORD PREVIEW</div>
          <div class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ${escapeHtml(data.message || "No Word preview available.")}
          </div>
          <button type="button"
                  class="open-original-from-preview bg-blue-600 text-white px-3 py-2 rounded"
                  data-path="${escapeHtml(path)}">
            Open Original File
          </button>
        `;
        return;
      }

      let previewHtml = `
        <div class="text-sm text-gray-500 mb-2">WORD PREVIEW</div>

        <div class="mb-2 text-xs text-gray-500 break-all">
          ${escapeHtml(data.file_name)}
        </div>

        <div class="border rounded bg-white p-3 max-h-[560px] overflow-auto text-sm">
      `;

      if (data.paragraphs.length === 0 && data.tables.length === 0) {
        previewHtml += `
          <div class="text-gray-400">
            No readable text found in this Word document.
          </div>
        `;
      }

      data.paragraphs.forEach((paragraph) => {
        previewHtml += `
          <p class="mb-2 leading-relaxed">
            ${escapeHtml(paragraph)}
          </p>
        `;
      });

      data.tables.forEach((table) => {
        previewHtml += `
          <div class="overflow-auto mt-3 border rounded">
            <table class="text-xs border-collapse w-full">
              <tbody>
        `;

        table.forEach((row) => {
          previewHtml += "<tr>";

          row.forEach((cell) => {
            previewHtml += `
              <td class="border p-1 align-top">
                ${escapeHtml(cell)}
              </td>
            `;
          });

          previewHtml += "</tr>";
        });

        previewHtml += `
              </tbody>
            </table>
          </div>
        `;
      });

      previewHtml += `
        </div>

        <div class="mt-3">
          <button type="button"
                  class="open-original-from-preview bg-blue-600 text-white px-3 py-2 rounded"
                  data-path="${escapeHtml(path)}">
            Open Original File
          </button>
        </div>
      `;

      panel.innerHTML = previewHtml;
    } catch (err) {
      console.error("WORD PREVIEW ERROR:", err);

      panel.innerHTML = `
        <div class="text-sm text-gray-500 mb-2">WORD PREVIEW</div>
        <div class="text-red-500 text-sm">Word preview failed.</div>
        <button type="button"
                class="open-original-from-preview bg-blue-600 text-white px-3 py-2 rounded mt-3"
                data-path="${escapeHtml(path)}">
          Open Original File
        </button>
      `;
    }
  }

  // =========================
  // HOVER → PREVIEW
  // =========================
  document.querySelectorAll(".ref-row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      const path = row.querySelector(".open-file")?.dataset.path;

      if (path) {
        loadReferencePreview(path);
      }
    });
  });
  // =========================
  // GROUP COLLAPSE / EXPAND
  // =========================
  document.querySelectorAll(".group-header").forEach((header) => {
    header.addEventListener("click", (e) => {
      if (e.target.closest("button")) {
        return;
      }

      const groupName = header.dataset.group;
      const groupBody = document.querySelector(
        `.group-body[data-group="${CSS.escape(groupName)}"]`,
      );
      const arrow = header.querySelector(".group-arrow");

      if (!groupBody) {
        return;
      }

      const isHidden = groupBody.classList.contains("hidden");

      if (isHidden) {
        groupBody.classList.remove("hidden");

        if (arrow) {
          arrow.textContent = "▼";
        }
      } else {
        groupBody.classList.add("hidden");

        if (arrow) {
          arrow.textContent = "▶";
        }
      }
    });
  });
  // =========================
  // GLOBAL CLICK HANDLER
  // =========================
  document.addEventListener("click", async (e) => {
    // =========================
    // PIN / UNPIN
    // =========================
    const pinBtn = e.target.closest(".pin-star");

    if (pinBtn) {
      const fileName = pinBtn.dataset.name;
      const filePath = pinBtn.dataset.path;

      if (!filePath) return;

      try {
        const resp = await fetch("/toggle-pin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_name: fileName,
            file_path: filePath,
            folder: "",
          }),
        });

        const data = await resp.json();

        if (!data.success) {
          console.error("toggle-pin failed:", data);
          return;
        }

        if (data.pinned) {
          pinBtn.textContent = "★";
          pinBtn.classList.add("text-yellow-500");
        } else {
          pinBtn.textContent = "☆";
          pinBtn.classList.remove("text-yellow-500");

          const row = pinBtn.closest("tr");
          if (row) row.remove();
        }
      } catch (err) {
        console.error("PIN ERROR:", err);
      }

      return;
    }

    // =========================
    // COPY TO WORKSPACE
    // =========================
    const copyBtn = e.target.closest(".copy-workspace");

    if (copyBtn) {
      if (copyBtn.dataset.busy === "true") {
        return;
      }

      copyBtn.dataset.busy = "true";
      copyBtn.disabled = true;

      const filePath = copyBtn.dataset.path;
      const groupName = copyBtn.dataset.group || "Ungrouped";

      if (!filePath) {
        console.error("COPY ERROR: missing file path");
        copyBtn.dataset.busy = "false";
        copyBtn.disabled = false;
        return;
      }

      const originalText = copyBtn.textContent;

      try {
        copyBtn.textContent = "⏳";

        const resp = await fetch("/copy-to-workspace", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_path: filePath,
            group: groupName,
          }),
        });

        const data = await resp.json();

        console.log("COPY TO WORKSPACE RESPONSE:", data);

        if (!data.success) {
          copyBtn.textContent = "⚠";
          copyBtn.title = data.message || "Copy failed";
          copyBtn.dataset.busy = "false";
          copyBtn.disabled = false;
          return;
        }

        if (data.copied) {
          copyBtn.textContent = "✅";
          copyBtn.title = "Copied to workspace";
        } else {
          copyBtn.textContent = "✔";
          copyBtn.title = "Already exists in workspace";
        }

        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.dataset.busy = "false";
          copyBtn.disabled = false;
        }, 2000);
      } catch (err) {
        console.error("COPY TO WORKSPACE ERROR:", err);
        copyBtn.textContent = "⚠";
        copyBtn.dataset.busy = "false";
        copyBtn.disabled = false;
      }

      return;
    }

    // =========================
    // OPEN ORIGINAL FROM PREVIEW PANEL
    // =========================
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

    // =========================
    // OPEN FILE + PREVIEW
    // =========================
    const openBtn = e.target.closest(".open-file");

    if (openBtn) {
      const path = openBtn.dataset.path;

      if (!path) return;

      try {
        await fetch(`/open-file?path=${encodeURIComponent(path)}`);
        loadReferencePreview(path);
      } catch (err) {
        console.error("OPEN ERROR:", err);
      }

      return;
    }

    // =========================
    // ROW CLICK → PREVIEW
    // =========================
    const row = e.target.closest(".ref-row");

    if (row) {
      const path = row.querySelector(".open-file")?.dataset.path;

      if (path) {
        loadReferencePreview(path);
      }
    }
  });
});
