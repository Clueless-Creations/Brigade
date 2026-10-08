window.SPEC_SECTIONS.push({
  id: "onboarding",
  title: "Onboarding",
  render(spec) {
    const onboarding = spec.onboarding;
    const mascot = spec.mascot;
    if (!onboarding && !mascot) return null;
    const line = (label, value) => `<div class="kv"><b>${esc(label)}</b> ${esc(value || "—")}</div>`;
    const steps = Array.isArray(onboarding?.steps) ? onboarding.steps : [];
    const stepRows = steps
      .map((step) => `<li><code>${esc(step.id)}</code> ${esc(step.kind || "")} ${esc(step.screen || "")}</li>`)
      .join("");
    const unused = Array.isArray(onboarding?.steps_not_used) ? onboarding.steps_not_used : [];
    const unusedRows = unused.map((entry) => `<li><code>${esc(entry.id)}</code> ${esc(entry.reason)}</li>`).join("");
    return [
      line("Archetype", onboarding?.archetype),
      line("Reason", onboarding?.reason),
      line("First value target (seconds)", onboarding?.first_value_target_s),
      line("Paywall", onboarding?.paywall ? `${onboarding.paywall.type}, ${onboarding.paywall.placement}` : ""),
      line("Closing offer", onboarding?.paywall?.closing_offer),
      line("Review prompt", onboarding?.review_prompt?.type),
      line("Mascot", mascot ? `${mascot.use}. ${mascot.reason}` : ""),
      stepRows ? `<p class="sub">Steps</p><ol>${stepRows}</ol>` : "",
      unusedRows ? `<p class="sub">Steps not used</p><ul>${unusedRows}</ul>` : "",
    ].join("");
  },
});
