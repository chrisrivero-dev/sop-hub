console.log("SEARCH_ASSISTANT_JS_LOADED");

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const resultsContainer = document.getElementById("resultsContainer");

  let selectedItems = [];

  if (!searchInput || !searchBtn || !resultsContainer) {
    console.error("Missing search DOM elements");
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (char) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      }[char];
    });
  }

  function buildPreviewMarkup(path) {
    const lowerPath = String(path || "").toLowerCase();
    const isPdf = lowerPath.endsWith(".pdf");

    if (isPdf) {
      return `
        <iframe
          src="/preview?path=${encodeURIComponent(path)}"
          class="w-full h-[650px] border rounded bg-white">
        </iframe>
      `;
    }

    return `
      <img
        src="/preview?path=${encodeURIComponent(path)}"
        class="w-full border rounded shadow-sm bg-white"
        alt="Document preview"
        onerror="
          this.onerror=null;
          this.outerHTML='<div class=&quot;text-gray-500 text-sm&quot;>No preview available</div>';
        ">
    `;
  }

  function loadPreview(path) {
    const previewPanel = document.getElementById("previewPanel");
    if (!previewPanel || !path) {
      return;
    }

    previewPanel.innerHTML = `
      <div class="text-sm text-gray-500 mb-2">DOCUMENT PREVIEW</div>
      ${buildPreviewMarkup(path)}
      <div class="text-xs text-gray-400 mt-2 break-all">${escapeHtml(path)}</div>
    `;
  }

  function renderExamplesTable(examples) {
    if (!examples.length) {
      return "";
    }

    let html = `
      <div class="p-4 border rounded bg-white shadow-sm mb-4">
        <div class="text-sm text-gray-500 mb-3">EXAMPLES (Parceling Log)</div>

        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-100 text-left">
              <th class="p-2 border">DRN</th>
              <th class="p-2 border">Action</th>
              <th class="p-2 border">Remarks</th>
            </tr>
          </thead>
          <tbody>
    `;

    examples.slice(0, 10).forEach((example) => {
      html += `
        <tr class="example-row">
          <td class="p-2 border">${escapeHtml(example.drn)}</td>
          <td class="p-2 border font-bold text-red-600">${escapeHtml(example.action)}</td>
          <td class="p-2 border">${escapeHtml(example.remarks)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  }

  function renderRecommendedAction(examples) {
    if (!examples.length) {
      return `
        <div class="p-4 border rounded bg-white shadow-sm">
          <div class="text-sm text-gray-500 mb-2">RECOMMENDED ACTION</div>
          <div class="text-gray-700">No matching examples found.</div>
        </div>
      `;
    }

    const actions = [
      ...new Set(examples.map((example) => example.action).filter(Boolean)),
    ];

    return `
      <div class="p-4 border rounded bg-white shadow-sm">
        <div class="text-sm text-gray-500 mb-2">RECOMMENDED ACTION</div>
        <div class="text-2xl font-bold text-red-600">
          ${escapeHtml(actions.join(", "))}
        </div>
        <div class="mt-3 text-xs bg-yellow-100 px-3 py-2 rounded text-yellow-800">
          Based on ${examples.length} prior processed documents
        </div>
      </div>
    `;
  }

  function renderRelatedFiles(files) {
    let html = `
      <div class="p-4 border rounded bg-white shadow-sm">
        <div class="text-sm text-gray-500 mb-2">RELATED FILES</div>
    `;

    if (!files.length) {
      html += `<div class="text-sm text-gray-500">No related files found.</div>`;
      html += `</div>`;
      return html;
    }

    files.slice(0, 5).forEach((file) => {
      html += `
        <div class="flex justify-between items-center border-b py-2 gap-3">
          <a href="#"
             class="open-file text-blue-700 font-semibold flex-1"
             data-path="${escapeHtml(file.full_path)}">
            ${escapeHtml(file.name)}
          </a>

          <button
            type="button"
            class="pin-btn text-lg leading-none"
            data-name="${escapeHtml(file.name)}"
            data-path="${escapeHtml(file.full_path)}"
            data-selected="false"
            title="Add to Reference Library"
            style="color:#9CA3AF;">
            ☆
          </button>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  function renderPreviewPanel() {
    return `
      <div id="previewPanel" class="p-4 border rounded bg-white shadow-sm">
        <div class="text-sm text-gray-500 mb-2">DOCUMENT PREVIEW</div>
        <div class="text-gray-400 text-sm">Hover or select a file to preview</div>
      </div>
    `;
  }

  async function togglePin(buttonEl) {
    const fileName = buttonEl.dataset.name;
    const filePath = buttonEl.dataset.path;

    if (!fileName || !filePath) {
      console.error("PIN ERROR: missing file name or path", {
        fileName,
        filePath,
      });
      return;
    }

    try {
      const response = await fetch("/toggle-pin", {
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

      const data = await response.json();

      console.log("PIN RESPONSE:", data);

      if (!data.success) {
        console.warn("Pin ignored or failed:", data);
        return;
      }

      if (data.pinned) {
        buttonEl.dataset.selected = "true";
        buttonEl.style.color = "#facc15";
        buttonEl.textContent = "★";

        if (!selectedItems.find((item) => item.path === filePath)) {
          selectedItems.push({ name: fileName, path: filePath });
        }

        if (localStorage.getItem("autoOpen") === "1") {
          await fetch(`/open-file?path=${encodeURIComponent(filePath)}`);
        }

        loadPreview(filePath);

        setTimeout(() => {
          window.location.href = "/reference";
        }, 300);

        return;
      }

      buttonEl.dataset.selected = "false";
      buttonEl.style.color = "#9CA3AF";
      buttonEl.textContent = "☆";
      selectedItems = selectedItems.filter((item) => item.path !== filePath);
    } catch (error) {
      console.error("PIN ERROR:", error);
    }
  }
  function bindEvents() {
    selectedItems = [];

    document.querySelectorAll(".open-file").forEach((link) => {
      const path = link.dataset.path;

      link.addEventListener("click", async (event) => {
        event.preventDefault();
        await fetch(`/open-file?path=${encodeURIComponent(path)}`);
        loadPreview(path);
      });

      link.addEventListener("mouseenter", () => {
        loadPreview(path);
      });
    });

    document.querySelectorAll(".pin-btn").forEach((button) => {
      button.dataset.selected = "false";
      button.style.color = "#9CA3AF";
      button.textContent = "☆";

      button.addEventListener("click", async () => {
        await togglePin(button);
      });
    });
  }

  async function runSearch() {
    const query = searchInput.value.trim();

    if (!query) {
      resultsContainer.innerHTML = `<p class="text-gray-500">Enter a search term.</p>`;
      return;
    }

    resultsContainer.innerHTML = `<p class="text-gray-500">Searching...</p>`;

    try {
      const response = await fetch("/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          mode: "filename",
        }),
      });

      const data = await response.json();

      const files = Array.isArray(data.results) ? data.results : [];
      const examples = Array.isArray(data.examples) ? data.examples : [];

      let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">`;
      html += renderRecommendedAction(examples);
      html += renderRelatedFiles(files);
      html += `</div>`;
      html += renderExamplesTable(examples);
      html += renderPreviewPanel();

      resultsContainer.innerHTML = html;
      bindEvents();
    } catch (error) {
      console.error(error);
      resultsContainer.innerHTML = `<p class="text-red-500">Search failed.</p>`;
    }
  }

  searchBtn.addEventListener("click", runSearch);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      runSearch();
    }
  });
});
