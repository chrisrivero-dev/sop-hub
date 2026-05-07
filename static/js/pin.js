console.log("🌟 pin.js loaded globally");

document.addEventListener("click", async (e) => {

    // Only run on pin-star clicks
    if (!e.target.classList.contains("pin-star")) return;

    // 🛑 FIX: Prevent the star click from triggering parent .open-file click
    e.stopPropagation();

    // 🚫 IMPORTANT: Do NOT run pin.js on Search Hub (search.js handles it)
    if (window.location.pathname === "/search-hub") {
        return;
    }

    const star = e.target;

    const refId  = star.dataset.id;
    const name   = star.dataset.name;
    const path   = star.dataset.path;
    const folder = star.dataset.folder;

    console.log("⭐ Toggling pin for:", name);

    // Send toggle to Flask
    const resp = await fetch(`/toggle-pin/${refId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            file_name: name,
            file_path: path,
            folder: folder
        })
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

    // Flip the star icon and update ID
    star.textContent = data.pinned ? "★" : "☆";
    star.dataset.id = data.ref_id;

    // Auto-open — ONLY for pages that use pin.js (NOT search-hub)
    const autoOpen = document.getElementById("autoOpenToggle");

    if (autoOpen && autoOpen.checked && data.pinned) {
        console.log("🚀 AUTO-OPEN TRIGGERED for:", path);
        await fetch(`/open-file?path=${encodeURIComponent(path)}`);
    }
});
