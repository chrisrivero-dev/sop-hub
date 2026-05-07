(function () {
  let selectedFilePath = null;
  let lastSummaryText = "";

  function initSearchFileSummary() {
    const summarizeBtn = document.getElementById("searchSummarizeFileBtn");
    const extractBtn = document.getElementById("searchExtractDetailsBtn");
    const copyBtn = document.getElementById("searchCopySummaryBtn");

    if (!summarizeBtn || !extractBtn || !copyBtn) {
      return;
    }

    document.addEventListener("click", function (event) {
      const fileItem = event.target.closest("[data-file-path]");

      if (!fileItem) {
        return;
      }

      selectedFilePath = fileItem.getAttribute("data-file-path");
      showSelectedFile(selectedFilePath);
    });

    summarizeBtn.addEventListener("click", function () {
      requestFileSummary("summary");
    });

    extractBtn.addEventListener("click", function () {
      requestFileSummary("details");
    });

    copyBtn.addEventListener("click", copySummaryToClipboard);
  }

  function showSelectedFile(filePath) {
    const empty = document.getElementById("searchSummaryEmpty");
    const panel = document.getElementById("searchSummaryPanel");
    const selectedLabel = document.getElementById("searchSummarySelectedFile");
    const output = document.getElementById("searchSummaryOutput");

    if (empty) {
      empty.style.display = "none";
    }

    if (panel) {
      panel.style.display = "block";
    }

    if (selectedLabel) {
      selectedLabel.textContent = filePath || "No file selected";
    }

    if (output) {
      output.textContent = "File selected. Click Summarize File.";
    }
  }

  async function requestFileSummary(mode) {
    const output = document.getElementById("searchSummaryOutput");

    if (!output) {
      return;
    }

    if (!selectedFilePath) {
      output.textContent = "Select a file first.";
      return;
    }

    output.textContent = "Extracting local file information...";

    try {
      const response = await fetch(
        `/file-summary?path=${encodeURIComponent(selectedFilePath)}`,
      );
      const data = await response.json();

      if (!response.ok || !data.ok) {
        output.textContent = data.error || "Unable to summarize this file.";
        return;
      }

      lastSummaryText =
        mode === "details"
          ? formatExtractedDetails(data)
          : formatFullSummary(data);

      output.textContent = lastSummaryText;
    } catch (error) {
      output.textContent = `Unable to summarize file locally: ${error}`;
    }
  }

  function formatFullSummary(data) {
    const lines = [];

    lines.push("Selected File Summary");
    lines.push("=====================");
    lines.push(`File: ${data.file_name || ""}`);
    lines.push(`Type: ${data.file_type || ""}`);
    lines.push(`Source: ${data.source_path || ""}`);
    lines.push("");

    lines.push("What this appears to be:");
    lines.push(data.what_this_appears_to_be || "No classification available.");
    lines.push("");

    lines.push("Summary:");
    lines.push(data.summary || "No summary available.");

    appendList(
      lines,
      "Detected Sheets / Pages / Sections",
      data.detected_sections,
    );
    appendList(lines, "Possible APNs", data.possible_apns);
    appendList(lines, "Possible DRNs", data.possible_drns);
    appendList(lines, "Possible Dates", data.possible_dates);

    if (data.possible_keywords && data.possible_keywords.length) {
      lines.push("");
      lines.push("Possible Mapping Keywords:");
      lines.push(data.possible_keywords.join(", "));
    }

    appendList(lines, "Extracted Preview", data.preview_lines);

    lines.push("");
    lines.push("Review note:");
    lines.push(
      "This was generated locally from extracted text. Verify against the original file before using it for parceling, APN, DRN, or legal description work.",
    );

    return lines.join("\n");
  }

  function formatExtractedDetails(data) {
    const lines = [];

    lines.push("Extracted Key Details");
    lines.push("=====================");
    lines.push(`File: ${data.file_name || ""}`);
    lines.push("");

    appendList(lines, "Possible APNs", data.possible_apns);
    appendList(lines, "Possible DRNs", data.possible_drns);
    appendList(lines, "Possible Dates", data.possible_dates);

    if (data.possible_keywords && data.possible_keywords.length) {
      lines.push("");
      lines.push("Possible Mapping Keywords:");
      lines.push(data.possible_keywords.join(", "));
    }

    return lines.join("\n");
  }

  function appendList(lines, title, items) {
    if (!items || !items.length) {
      return;
    }

    lines.push("");
    lines.push(`${title}:`);
    items.forEach(function (item) {
      lines.push(`- ${item}`);
    });
  }

  function copySummaryToClipboard() {
    if (!lastSummaryText) {
      return;
    }

    navigator.clipboard.writeText(lastSummaryText);
  }

  document.addEventListener("DOMContentLoaded", initSearchFileSummary);
})();
