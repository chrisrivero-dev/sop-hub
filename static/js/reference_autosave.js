/* =====================================================
   REFERENCE LIBRARY — AUTOSAVE FIELDS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  console.log("REFERENCE_AUTOSAVE_JS_LOADED_V1");

  function showSaveState(el, status) {
    if (!el) return;

    if (status === "saving") {
      el.classList.add("bg-yellow-50");
      el.classList.remove("bg-green-50", "bg-red-50");
    }

    if (status === "saved") {
      el.classList.add("bg-green-50");
      el.classList.remove("bg-yellow-50", "bg-red-50");

      setTimeout(() => {
        el.classList.remove("bg-green-50");
      }, 700);
    }

    if (status === "error") {
      el.classList.add("bg-red-50");
      el.classList.remove("bg-yellow-50", "bg-green-50");
    }
  }

  async function saveReferenceField(el, field, value) {
    const refId = el.dataset.id;

    if (!refId) {
      console.error("Missing reference ID for autosave.");
      return;
    }

    showSaveState(el, "saving");

    try {
      const resp = await fetch(`/reference/update/${refId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field: field,
          value: value,
        }),
      });

      const data = await resp.json();

      if (!data.success) {
        console.error("Autosave failed:", data);
        showSaveState(el, "error");
        return;
      }

      showSaveState(el, "saved");
    } catch (err) {
      console.error("Autosave error:", err);
      showSaveState(el, "error");
    }
  }

  function debounce(fn, delay = 600) {
    let timer = null;

    return (...args) => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  }

  const debouncedTextSave = debounce((el, field) => {
    saveReferenceField(el, field, el.value);
  }, 600);

  document.querySelectorAll(".display-input").forEach((input) => {
    input.addEventListener("input", () => {
      debouncedTextSave(input, "display_name");
    });

    input.addEventListener("blur", () => {
      saveReferenceField(input, "display_name", input.value);
    });
  });

  document.querySelectorAll(".note-input").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      debouncedTextSave(textarea, "notes");
    });

    textarea.addEventListener("blur", () => {
      saveReferenceField(textarea, "notes", textarea.value);
    });
  });

  document.querySelectorAll(".group-select").forEach((select) => {
    select.addEventListener("change", () => {
      saveReferenceField(select, "group", select.value);
    });
  });
});
