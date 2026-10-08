window.SPEC_SECTIONS.push({
  id: "ledger",
  title: "Hypotheses",
  render(spec) {
    const items = Array.isArray(spec.hypotheses) ? spec.hypotheses : [];
    if (!items.length) return null;
    const rows = items
      .map((item) => `<tr><td>${esc(item.statement)}</td><td>${esc(item.metric)}</td></tr>`)
      .join("");
    return `<p class="sub">Three or four things that must be true, each with the metric that proves it. Gate 1 writes the learning-ledger record when that user option is on.</p><table><tr><th>Must be true</th><th>Metric</th></tr>${rows}</table>`;
  },
});
