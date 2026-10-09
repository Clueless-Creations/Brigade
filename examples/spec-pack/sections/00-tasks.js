window.SPEC_SECTIONS.push({
  id: "tasks",
  title: "Tasks",
  render(_spec, report) {
    const tasks = report.tasks ?? [];
    if (!tasks.length) return null;
    const cell = (value) => esc(value ?? "");
    const list = (items) => (Array.isArray(items) && items.length ? items.map(cell).join(", ") : "—");
    const context = (task) =>
      `<details><summary>Sources and conditional context</summary><p>${list(task.source_refs)}</p>${(task.context ?? [])
        .map((entry) => `<p><code>${cell(entry.source_ref)}</code>: ${cell(entry.when)}</p><pre>${cell(JSON.stringify(entry.value, null, 2))}</pre>`)
        .join("")}</details>`;
    const rows = tasks
      .map(
        (task) =>
          `<tr><td><code>${cell(task.id)}</code></td><td>${cell(task.title)}</td><td>${cell(task.area)}</td><td>${list(task.depends_on)}</td><td>${list(task.acceptance)}${context(task)}</td></tr>`,
      )
      .join("");
    return `<p class="sub">Generated from screens, web pages, declared creative assets, and the tasks list. Source: ${cell(report.source?.file)}, version ${cell(report.source?.spec_version)}, SHA-256 ${cell(report.source?.sha256)}. Drafts do not grant execution authority or prove completion.</p><table><tr><th>Id</th><th>Title</th><th>Area</th><th>Depends on</th><th>Acceptance</th></tr>${rows}</table>`;
  },
});
