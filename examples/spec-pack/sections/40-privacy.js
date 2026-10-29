window.SPEC_SECTIONS.push({
  id: "legal-preflight",
  title: "Legal preflight",
  render(spec) {
    const cell = (value) => esc(value ?? "");
    const inventory = Array.isArray(spec.privacy?.inventory) ? spec.privacy.inventory : [];
    const labelRows = inventory
      .map(
        (row) =>
          `<tr><td>${cell(row.data)}</td><td>${cell(row.app_privacy_label)}</td><td>${cell(row.processor)}</td><td>${cell(row.retention)}</td><td>${row.used_for_tracking ? "Yes" : "No"}</td></tr>`,
      )
      .join("");
    const labelMap = `<div class="flowlabel">Privacy label map</div><table><tr><th>Data</th><th>App Privacy label</th><th>Processor</th><th>Retention</th><th>Tracking</th></tr>${labelRows}</table>`;
    const privacyPage = document.getElementById("w-privacy");
    const privacyBody = privacyPage ? privacyPage.querySelector(".pg") : null;
    if (privacyBody) {
      const host = document.createElement("div");
      host.innerHTML = labelMap;
      privacyBody.appendChild(host);
    }
    const items = Array.isArray(spec.legal_preflight) ? spec.legal_preflight : [];
    const rows = items
      .map(
        (item) =>
          `<tr><td><code>${cell(item.id)}</code></td><td>${cell(item.status)}</td><td>${cell(item.where)}</td><td>${cell(item.reason) || "—"}</td><td>${cell(item.human_steps) || "—"}</td></tr>`,
      )
      .join("");
    const mapNote = privacyBody ? "" : labelMap;
    const prompts = Array.isArray(spec.privacy?.store_required_prompts) ? spec.privacy.store_required_prompts : [];
    const promptRows = prompts.length
      ? prompts
          .map(
            (row) =>
              `<tr><td>${cell(row.id)}</td><td>${cell(row.kind)}</td><td>${cell(row.reachable)}</td><td>${cell(row.remote_flag)}</td><td>${cell(row.review_build_override)}</td><td>${cell(row.reviewer_path)}</td></tr>`,
          )
          .join("")
      : `<tr><td colspan="6">No store-required ATT or permission surface.</td></tr>`;
    const promptTable = `<div class="flowlabel">Store-required prompts</div><p class="sub">Each store-required ATT or permission surface is reachable on the default review build with no remote feature flag, on first launch or from the exact path in the review notes. A remote flag needs an explicit review-build override.</p><table><tr><th>Id</th><th>Kind</th><th>Reachable</th><th>Remote flag</th><th>Review-build override</th><th>Reviewer path</th></tr>${promptRows}</table>`;
    return `<p class="sub">Read-only status for the six pre-ship checks. This table is not legal advice.</p>${mapNote}<table><tr><th>Check</th><th>Status</th><th>Where</th><th>Reason</th><th>Human steps</th></tr>${rows}</table>${promptTable}`;
  },
});
