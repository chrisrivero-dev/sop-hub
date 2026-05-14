/* =====================================================
   REFERENCE LIBRARY — PREVIEW PANEL
   Owns: loadReferencePreview, loadExcelPreview, loadWordPreview
   Exposes: window.loadReferencePreview for reference.js
===================================================== */

(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================
  // PREVIEW LOADER (router)
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
  // EXPOSE + HOVER BINDING
  // =========================
  window.loadReferencePreview = loadReferencePreview;

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".ref-row").forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        const path = row.querySelector(".open-file")?.dataset.path;
        if (path) {
          loadReferencePreview(path);
        }
      });
    });
  });
})();
