/* =====================================================
   SEARCH HUB — TOPIC SUMMARY
   Owns: Summarize Topic button, POST /topic-summary,
         topic result panel rendering.
   Does NOT modify search_assistant.js or search_file_summary.js.
   Reads result paths from DOM: [data-file-path] elements.
===================================================== */

(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================
  // COLLECT CURRENT PATHS
  // =========================
  function getCurrentPaths() {
    const seen = new Set();
    const paths = [];
    document
      .querySelectorAll("#resultsContainer [data-file-path]")
      .forEach((el) => {
        const p = el.dataset.filePath;
        if (p && !seen.has(p)) {
          seen.add(p);
          paths.push(p);
        }
      });
    return paths;
  }

  // =========================
  // RENDER TOPIC RESULT
  // =========================
  function renderTopicSummary(data) {
    const panel = document.getElementById("topicSummaryPanel");
    if (!panel) return;

    if (!data.ok) {
      panel.innerHTML = `
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          Topic summary failed: ${escapeHtml(data.error || "Unknown error.")}
        </div>
      `;
      return;
    }

    const lines = [];

    lines.push(`TOPIC SUMMARY \u2014 "${escapeHtml(data.query)}"`);
    lines.push("\u2500".repeat(52));
    lines.push(`Files reviewed:  ${data.files_reviewed}`);
    lines.push(`Files matched:   ${data.files_matched}`);

    if (data.files_skipped && data.files_skipped.length) {
      lines.push(`Files skipped:   ${data.files_skipped.length}`);
      data.files_skipped.forEach((s) => {
        lines.push(
          `  \u2022 ${escapeHtml(s.file)} \u2014 ${escapeHtml(s.reason)}`,
        );
      });
    }

    lines.push("");

    const matched = (data.file_results || []).filter((r) => r.had_match);

    if (matched.length) {
      lines.push("MATCHING SNIPPETS");
      matched.forEach((r) => {
        lines.push(`  [${escapeHtml(r.file_name)}]`);
        r.snippets.forEach((s) => {
          lines.push(`    \u201c${escapeHtml(s)}\u201d`);
        });
      });
      lines.push("");
    } else {
      lines.push("MATCHING SNIPPETS");
      lines.push("  No direct text matches found for this term.");
      lines.push("");
    }

    if (data.all_classifications && data.all_classifications.length) {
      lines.push("LIKELY TOPICS");
      lines.push(
        "  " + data.all_classifications.map(escapeHtml).join(" \u00b7 "),
      );
      lines.push("");
    }

    if (data.all_apns && data.all_apns.length) {
      lines.push("POSSIBLE APNS FOUND");
      lines.push("  " + data.all_apns.map(escapeHtml).join(" \u00b7 "));
      lines.push("");
    }

    if (data.all_drns && data.all_drns.length) {
      lines.push("POSSIBLE DRNS FOUND");
      lines.push("  " + data.all_drns.map(escapeHtml).join(" \u00b7 "));
      lines.push("");
    }

    if (data.all_dates && data.all_dates.length) {
      lines.push("DATES FOUND");
      lines.push("  " + data.all_dates.map(escapeHtml).join(" \u00b7 "));
      lines.push("");
    }

    if (data.all_keywords && data.all_keywords.length) {
      lines.push("MAPPING KEYWORDS");
      lines.push(
        "  " + data.all_keywords.slice(0, 20).map(escapeHtml).join(" \u00b7 "),
      );
      lines.push("");
    }

    lines.push("\u2500".repeat(52));
    lines.push(
      "\u26a0 Verify all findings against original files before use in production work.",
    );

    panel.innerHTML = `
      <div class="mt-4 p-4 border rounded bg-white shadow-sm">
        <div class="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">
          Topic Summary
        </div>
        <pre class="summary-output" style="max-height: 520px; overflow: auto;">${lines.join("\n")}</pre>
      </div>
    `;
  }

  // =========================
  // INJECT BUTTON
  // =========================
  function injectSummarizeButton() {
    const resultsContainer = document.getElementById("resultsContainer");
    if (!resultsContainer) return;

    // Remove any previously injected button wrapper
    const existingBtn = document.getElementById("summarizeTopicBtn");
    if (existingBtn) {
      existingBtn.closest(".topic-summary-btn-wrapper")?.remove();
    }

    // Clear old result panel
    const panel = document.getElementById("topicSummaryPanel");
    if (panel) panel.innerHTML = "";

    // Only show button if there are result paths
    const paths = getCurrentPaths();
    if (!paths.length) return;

    const wrapper = document.createElement("div");
    wrapper.className = "topic-summary-btn-wrapper mt-4";
    wrapper.innerHTML = `
      <button id="summarizeTopicBtn" type="button"
              class="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-semibold"
              style="cursor: pointer;">
        Summarize Topic
      </button>
    `;

    resultsContainer.appendChild(wrapper);

    document
      .getElementById("summarizeTopicBtn")
      .addEventListener("click", async () => {
        const btn = document.getElementById("summarizeTopicBtn");
        const query = document.getElementById("searchInput")?.value?.trim();

        if (!query) return;

        const currentPaths = getCurrentPaths();
        if (!currentPaths.length) return;

        const originalText = btn.textContent;
        btn.textContent = "Summarizing\u2026";
        btn.disabled = true;

        try {
          const resp = await fetch("/topic-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, paths: currentPaths }),
          });

          const data = await resp.json();
          renderTopicSummary(data);
        } catch (err) {
          console.error("TOPIC SUMMARY ERROR:", err);
          const p = document.getElementById("topicSummaryPanel");
          if (p) {
            p.innerHTML = `
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              Request failed. Check the console for details.
            </div>
          `;
          }
        } finally {
          btn.textContent = originalText;
          btn.disabled = false;
        }
      });
  }

  // =========================
  // OBSERVE RESULTS CONTAINER
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    const resultsContainer = document.getElementById("resultsContainer");
    if (!resultsContainer) return;

    // Create the topic panel as a sibling after resultsContainer
    // so it is not destroyed when resultsContainer.innerHTML changes
    let panel = document.getElementById("topicSummaryPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "topicSummaryPanel";
      resultsContainer.insertAdjacentElement("afterend", panel);
    }

    const observer = new MutationObserver(() => {
      injectSummarizeButton();
    });

    observer.observe(resultsContainer, { childList: true, subtree: false });
  });
})();
