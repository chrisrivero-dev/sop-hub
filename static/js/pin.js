console.log("🌟 pin.js loaded globally");

document.addEventListener("click", async (e) => {
  // Only run on pin-star clicks
  if (!e.target.classList.contains("pin-star")) return;

  e.preventDefault();
  e.stopPropagation();

  // Do NOT run on Search Hub — search_assistant.js handles it there
  if (window.location.pathname === "/search-hub") {
    return;
  }

  const star = e.target;

  const name = star.dataset.name;
  const path = star.dataset.path;
  const folder = star.dataset.folder;

  console.log("⭐ Toggling pin for:", name);

  const resp = await fetch("/toggle-pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_name: name,
      file_path: path,
      folder: folder,
    }),
  });

  let data;
  try {
    data = await resp.json();
  } catch (err) {
    console.error("❌ toggle-pin: invalid JSON response", err);
    return;
  }

  if (!data.success) {
    console.error("❌ toggle-pin failed:", data.error);
    return;
  }

  if (data.pinned) {
    star.textContent = "✓";
    star.style.color = "#16a34a";
  } else {
    star.textContent = "+";
    star.style.color = "#6B7280";
  }

  const autoOpen = document.getElementById("autoOpenToggle");

  if (autoOpen && autoOpen.checked && data.pinned) {
    console.log("🚀 AUTO-OPEN TRIGGERED for:", path);
    await fetch(`/open-file?path=${encodeURIComponent(path)}`);
  }
});
