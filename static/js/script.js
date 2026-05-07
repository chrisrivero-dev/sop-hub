function submitAI() {
  const mode = document.querySelector('input[name="aiMode"]:checked').value;
  const input = document.getElementById('aiInput').value;
  const output = document.getElementById('aiOutput');

  fetch("/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: input, mode })
  })
  .then(res => res.json())
  .then(data => {
    if (mode === "search") {
      if (data.results.length === 0) {
        output.innerHTML = "<p>No matches found.</p>";
      } else {
        output.innerHTML = data.results.map(
          sop => `<p><a href="/sop/${sop.id}">${sop.title}</a> [${sop.tags}]</p>`
        ).join("");
      }
    } else if (mode === "draft") {
      output.innerHTML = `<pre>${data.draft}</pre>`;
    }
  });
}
