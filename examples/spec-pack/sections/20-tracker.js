window.SPEC_SECTIONS.push({
  id: "tracker",
  title: "Tracker draft",
  render(_spec, report) {
    const tasks = report.tasks ?? [];
    if (!tasks.length) return null;
    const milestones = ["Build", "Dogfood", "Gate 2", "Launch", "Run"];
    const byMilestone = Object.fromEntries(milestones.map((name) => [name, 0]));
    const byArea = {};
    const byCapability = {};
    for (const task of tasks) {
      const milestone = milestones.includes(task.milestone) ? task.milestone : "Build";
      byMilestone[milestone] += 1;
      const area = task.area || "—";
      byArea[area] = (byArea[area] ?? 0) + 1;
      for (const cap of task.capabilities ?? []) byCapability[cap] = (byCapability[cap] ?? 0) + 1;
    }
    const rows = (entries) => entries.map(([name, count]) => `<tr><td>${esc(name)}</td><td>${count}</td></tr>`).join("");
    const capabilityTable = Object.keys(byCapability).length
      ? `<div class="flowlabel">By capability</div><table><tr><th>Label</th><th>Issues</th></tr>${rows(Object.entries(byCapability))}</table>`
      : "";
    return `<p class="sub">${tasks.length} drafted issues. Create them only after approval.</p><div class="grid2"><div><div class="flowlabel">By milestone</div><table><tr><th>Milestone</th><th>Issues</th></tr>${rows(milestones.map((name) => [name, byMilestone[name]]))}</table></div><div><div class="flowlabel">By label</div><table><tr><th>Label</th><th>Issues</th></tr>${rows(Object.entries(byArea))}</table>${capabilityTable}</div></div>`;
  },
});
