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
      return "";
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
    const count = files.length;
    let html = `
      <div class="p-4 border rounded bg-white shadow-sm">
        <div class="text-sm text-gray-500 mb-2">RELATED FILES
          ${count > 0 ? `<span class="text-xs font-normal text-gray-400">(${count} found)</span>` : ""}
        </div>
    `;

    if (!count) {
      html += `<div class="text-sm text-gray-500">No related files found.</div></div>`;
      return html;
    }

    html += `<div class="max-h-72 overflow-y-auto">`;

    files.forEach((file) => {
      html += `
        <div class="flex items-center border-b py-2 gap-2">
          <button
            type="button"
            class="pin-btn flex-shrink-0 font-bold text-white bg-green-600 hover:bg-green-700 rounded px-2 py-0.5 text-sm leading-none"
            data-name="${escapeHtml(file.name)}"
            data-path="${escapeHtml(file.full_path)}"
            data-selected="false"
            title="Add to Reference Library">
            +
          </button>

          <a href="#"
             class="preview-file text-blue-700 font-semibold flex-1 min-w-0 truncate"
             data-path="${escapeHtml(file.full_path)}"
             title="Click to open: ${escapeHtml(file.full_path)}">
            ${escapeHtml(file.name)}
          </a>
        </div>
      `;
    });

    html += `</div></div>`;
    return html;
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
        buttonEl.textContent = "✓";
        buttonEl.classList.remove("bg-green-600", "hover:bg-green-700");
        buttonEl.classList.add("bg-yellow-500");

        if (!selectedItems.find((item) => item.path === filePath)) {
          selectedItems.push({ name: fileName, path: filePath });
        }

        if (localStorage.getItem("autoOpen") === "1") {
          await fetch(`/open-file?path=${encodeURIComponent(filePath)}`);
        }

        setTimeout(() => {
          window.location.href = "/reference";
        }, 300);

        return;
      }

      buttonEl.dataset.selected = "false";
      buttonEl.textContent = "+";
      buttonEl.classList.remove("bg-yellow-500");
      buttonEl.classList.add("bg-green-600", "hover:bg-green-700");
      selectedItems = selectedItems.filter((item) => item.path !== filePath);
    } catch (error) {
      console.error("PIN ERROR:", error);
    }
  }
  function bindEvents() {
    selectedItems = [];

    document.querySelectorAll(".preview-file").forEach((link) => {
      const path = link.dataset.path;

      link.addEventListener("click", async (event) => {
        event.preventDefault();
        try { await fetch(`/open-file?path=${encodeURIComponent(path)}`); }
        catch (err) { console.error("OPEN ERROR:", err); }
        if (window.loadReferencePreview) window.loadReferencePreview(path);
      });

      link.addEventListener("mouseenter", () => {
        if (window.loadReferencePreview) window.loadReferencePreview(path);
      });
    });

    document.querySelectorAll(".pin-btn").forEach((button) => {
      button.dataset.selected = "false";
      button.textContent = "+";

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

      let html = "";
      html += renderRecommendedAction(examples);
      html += renderRelatedFiles(files);
      html += renderExamplesTable(examples);

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

  const previewPanel = document.getElementById("referencePreview");
  if (previewPanel) {
    previewPanel.addEventListener("click", async (event) => {
      const btn = event.target.closest(".open-original-from-preview");
      if (btn) {
        event.preventDefault();
        const path = btn.dataset.path;
        if (path) await fetch(`/open-file?path=${encodeURIComponent(path)}`);
      }
    });
  }
});
