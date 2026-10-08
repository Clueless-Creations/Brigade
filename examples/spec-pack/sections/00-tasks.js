window.SPEC_SECTIONS.push({
  id: "tasks",
  title: "Tasks",
  render(_spec, report) {
    const tasks = report.tasks ?? [];
    if (!tasks.length) return null;
    const cell = (value) => esc(value ?? "");
    const list = (items) => (Array.isArray(items) && items.length ? items.map(cell).join(", ") : "—");
    const rows = tasks
      .map(
        (task) =>
          `<tr><td><code>${cell(task.id)}</code></td><td>${cell(task.title)}</td><td>${cell(task.area)}</td><td>${list(task.depends_on)}</td><td>${list(task.acceptance)}</td></tr>`,
      )
      .join("");
    return `<p class="sub">Generated from screens, web pages, and the tasks list.</p><table><tr><th>Id</th><th>Title</th><th>Area</th><th>Depends on</th><th>Acceptance</th></tr>${rows}</table>`;
  },
});
