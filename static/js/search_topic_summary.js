/* =====================================================
   SEARCH HUB — TOPIC SUMMARY
   Owns: Summarize Topic button, POST /topic-summary,
         topic result panel rendering.

   DOM contract:
     #topicSummaryControls — button container, sibling after #resultsContainer
     #topicSummaryPanel    — result output, sibling after #topicSummaryControls

   The MutationObserver watches #resultsContainer but NEVER mutates it.
   All DOM writes go to #topicSummaryControls or #topicSummaryPanel only.
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
    lines.push(`Files reviewed:   ${data.files_reviewed}`);
    lines.push(`Strong matches:   ${data.strong_count ?? 0}`);
    lines.push(`Moderate matches: ${data.moderate_count ?? 0}`);
    lines.push(`Weak / indirect:  ${data.weak_count ?? 0}`);

    if (data.files_skipped && data.files_skipped.length) {
      lines.push(`Files skipped:    ${data.files_skipped.length}`);
      data.files_skipped.forEach((s) => {
        lines.push(
          `  \u2022 ${escapeHtml(s.file)} \u2014 ${escapeHtml(s.reason)}`,
        );
      });
    }

    // Strong and moderate files
    const primary = (data.file_results || []).filter(
      (r) => r.match_tier === "strong" || r.match_tier === "moderate",
    );

    if (primary.length) {
      lines.push("");
      lines.push("BEST FILES TO REVIEW FIRST");
      primary.forEach((r) => {
        const tierLabel =
          r.match_tier === "strong" ? "Strong match" : "Moderate match";
        lines.push(`  [${escapeHtml(r.file_name)}]`);
        lines.push(`    Match: ${tierLabel}`);
        lines.push(`    Reason: ${escapeHtml(r.match_reason || "")}`);
        if (r.snippets && r.snippets.length) {
          r.snippets.forEach((s) => {
            lines.push(`    \u201c${escapeHtml(s)}\u201d`);
          });
        }
      });
    } else {
      lines.push("");
      lines.push("BEST FILES TO REVIEW FIRST");
      lines.push("  No strong or moderate matches found for this term.");
      lines.push("  Consider broadening the search term.");
    }

    // Weak / indirect files
    const weak = (data.file_results || []).filter(
      (r) => r.match_tier === "weak",
    );

    if (weak.length) {
      lines.push("");
      lines.push("LOWER CONFIDENCE / INDIRECT MATCHES");
      weak.forEach((r) => {
        lines.push(`  [${escapeHtml(r.file_name)}]`);
        lines.push(
          `    Reason: ${escapeHtml(r.match_reason || "indirect or partial match only")}`,
        );
      });
    }

    // Aggregated entities
    if (data.all_classifications && data.all_classifications.length) {
      lines.push("");
      lines.push("LIKELY TOPICS DETECTED");
      lines.push(
        "  " + data.all_classifications.map(escapeHtml).join(" \u00b7 "),
      );
    }

    if (data.all_apns && data.all_apns.length) {
      lines.push("");
      lines.push("POSSIBLE APNS FOUND");
      lines.push("  " + data.all_apns.map(escapeHtml).join(" \u00b7 "));
    }

    if (data.all_drns && data.all_drns.length) {
      lines.push("");
      lines.push("POSSIBLE DRNS FOUND");
      lines.push("  " + data.all_drns.map(escapeHtml).join(" \u00b7 "));
    }

    if (data.all_dates && data.all_dates.length) {
      lines.push("");
      lines.push("DATES FOUND");
      lines.push("  " + data.all_dates.map(escapeHtml).join(" \u00b7 "));
    }

    if (data.all_keywords && data.all_keywords.length) {
      lines.push("");
      lines.push("MAPPING KEYWORDS");
      lines.push(
        "  " + data.all_keywords.slice(0, 20).map(escapeHtml).join(" \u00b7 "),
      );
    }

    lines.push("");
    lines.push("\u2500".repeat(52));
    lines.push(
      "\u26a0 Review source files to confirm. Verify all findings against originals before use in production work.",
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
  // BUTTON VISIBILITY
  // Only show/hide — never inject/remove repeatedly.
  // =========================
  function updateSummarizeButton() {
    const controls = document.getElementById("topicSummaryControls");
    const panel = document.getElementById("topicSummaryPanel");
    if (!controls) return;

    const paths = getCurrentPaths();

    if (!paths.length) {
      controls.style.display = "none";
      if (panel) panel.innerHTML = "";
      return;
    }

    controls.style.display = "";
  }

  // =========================
  // BUTTON CLICK HANDLER
  // =========================
  async function handleSummarizeClick() {
    const btn = document.getElementById("summarizeTopicBtn");
    const panel = document.getElementById("topicSummaryPanel");
    if (!btn || !panel) return;

    const query = document.getElementById("searchInput")?.value?.trim();
    if (!query) return;

    const paths = getCurrentPaths();
    if (!paths.length) return;

    const originalText = btn.textContent;
    btn.textContent = "Summarizing\u2026";
    btn.disabled = true;

    try {
      const resp = await fetch("/topic-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, paths }),
      });

      const data = await resp.json();
      renderTopicSummary(data);
    } catch (err) {
      console.error("TOPIC SUMMARY ERROR:", err);
      panel.innerHTML = `
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          Request failed. Check the console for details.
        </div>
      `;
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  // =========================
  // INIT
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    const resultsContainer = document.getElementById("resultsContainer");
    if (!resultsContainer) return;

    // Create #topicSummaryControls once, as a sibling after #resultsContainer.
    // Never placed inside #resultsContainer.
    let controls = document.getElementById("topicSummaryControls");
    if (!controls) {
      controls = document.createElement("div");
      controls.id = "topicSummaryControls";
      controls.style.display = "none";
      controls.innerHTML = `
        <div class="mt-4">
          <button id="summarizeTopicBtn" type="button"
                  class="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-semibold"
                  style="cursor: pointer;">
            Summarize Topic
          </button>
        </div>
      `;
      resultsContainer.insertAdjacentElement("afterend", controls);

      document
        .getElementById("summarizeTopicBtn")
        .addEventListener("click", handleSummarizeClick);
    }

    // Create #topicSummaryPanel once, as a sibling after #topicSummaryControls.
    let panel = document.getElementById("topicSummaryPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "topicSummaryPanel";
      controls.insertAdjacentElement("afterend", panel);
    }

    // Watch #resultsContainer for new search results.
    // Debounce with requestAnimationFrame — never mutates #resultsContainer.
    let rafPending = false;

    const observer = new MutationObserver(() => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        updateSummarizeButton();
      });
    });

    observer.observe(resultsContainer, { childList: true, subtree: false });
  });
})();
