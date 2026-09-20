/**
 * #573 — AC→evidence map for the active Jev-directed build loop after
 * next-work ranking.
 *
 * Consumes #524+#523+#571. Does not rewrite #524, does not recreate #571,
 * does not replace proposed #574 architecture as product code, and does not
 * auto-close epic 511 (epic 511 remains open).
 *
 * Paper / synthetic fixtures only; live assessment not performed.
 */
export const JEV_LOOP_MAP_PATH = "catalog/providers/jev-active-build-loop-map.ts" as const;
export const JEV_LOOP_SERVICE_MODULE = "kernel/services/jev-active-build-loop.ts" as const;
export const JEV_LOOP_RECIPE_MODULE = "catalog/workflows/jev-active-build-loop.ts" as const;
export const JEV_LOOP_FIXTURE = "checks/verification/fixtures/jev-active-build-loop.fixtures.ts" as const;
export const JEV_LOOP_DOC = "docs/upstreams/jev-active-build-loop.md" as const;
export const JEV_QUALIFICATION_SERVICE = "kernel/services/jev-active-routing-qualification.ts" as const;
export const EVIDENCE_GAP_RANKING_OWNER = "kernel/services/evidence-gap-ranking.ts" as const;
export const SEMANTIC_RUNTIME_SAFETY_OWNER = "kernel/services/semantic-runtime-safety.ts" as const;
export const SEMANTIC_BATCH_OWNER = "kernel/session/semantic-batch.ts" as const;
export const TYPESAFE_SEMANTIC_SURFACE = "adapters/providers/typesafe-semantic.ts" as const;

export const JEV_LOOP_ISSUE = "#573" as const;
export const JEV_LOOP_EPIC = "#511" as const;
export const JEV_LOOP_PLANNING_ID = "U5-ACTIVE-JEV-BUILD-LOOP" as const;
export const JEV_LOOP_CONSUMES = ["#524", "#523", "#571"] as const;
export const JEV_LOOP_STAMP = "0.221.52" as const;
export const JEV_LOOP_BASE_MAIN_SHA = "6b38320824ec90ed152e8e3ea8c86c7267a9c892" as const;
export const JEV_LOOP_ARCHITECTURE_DOC_ISSUE = "#574" as const;
export const JEV_LOOP_LIVE_NOT_PERFORMED = true as const;
export const JEV_LOOP_NO_NETWORK = true as const;
export const JEV_LOOP_NO_DUPLICATE_RUNTIME = true as const;
export const JEV_LOOP_NO_JEV_IN_BUSINESS_POLICY = true as const;
export const JEV_LOOP_PROVIDER_IS_SWAPPABLE = true as const;
export const JEV_LOOP_NO_DETERMINISTIC_THROUGH_MODEL = true as const;
export const JEV_LOOP_NO_FRONTIER_REINTERPRET_WRAPPER = true as const;
export const JEV_LOOP_NO_524_REWRITE = true as const;
export const JEV_LOOP_NO_571_RECREATE = true as const;
export const JEV_LOOP_NO_NESTED_SUPERVISORY = true as const;
export const JEV_LOOP_NO_SELF_EDIT_LIVE_POLICY = true as const;
export const JEV_LOOP_NO_511_AUTOCLOSE = true as const;
export const JEV_LOOP_NO_573_IMPL = false as const;
export const JEV_LOOP_NEXT_AFTER_CLOSE = "#574" as const;
export const JEV_LOOP_ACTIVE_LOOP_IMPLEMENTED = true as const;

export const JEV_LOOP_AC = [
  {
    id: "ac1-changed-observation-changes-executed-action",
    acceptance: "A changed observation changes the next executed action, not just a displayed rank.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-shared-ownership-receipts-across-checkpoints",
    acceptance: "Build-level and within-task checkpoints share existing ownership and receipts.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-admitted-policy-continues-without-frontier-reapproval",
    acceptance: "An admitted active policy can continue reversible work without a frontier agent re-approving each Jev answer.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-unknown-reaches-bounded-generation-or-evidence",
    acceptance: "New/unknown problems reach bounded generation or evidence gathering without arbitrary effects.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-passive-zero-inference-stale-refuses-dispatch",
    acceptance: "Passive reads issue zero inference requests; stale selections refuse dispatch.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC5`,
    covered: true as const,
  },
  {
    id: "ac6-real-async-independent-dependent-limits-cancel-late-partial",
    acceptance: "Real async tests cover independent/dependent rounds, limits, cancellation, late results and partial failures.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC6`,
    covered: true as const,
  },
  {
    id: "ac7-explicit-no-match-wrong-binding-paths",
    acceptance: "Wrong binding, unsupported modality, missing grant, contradictory evidence and no-match cases stay explicit.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC7`,
    covered: true as const,
  },
  {
    id: "ac8-loop-no-progress-fairness-bounds",
    acceptance: "Loop/no-progress/fairness cases terminate or progress within declared bounds.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC8`,
    covered: true as const,
  },
  {
    id: "ac9-independent-review-mandatory",
    acceptance: "Independent review and required provider/device evidence remain mandatory.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC9`,
    covered: true as const,
  },
  {
    id: "ac10-fresh-agents-find-supported-path",
    acceptance: "Fresh installed agents find and use the supported path without a pasted architecture prompt.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC10`,
    covered: true as const,
  },
  {
    id: "ac11-frozen-baseline-outcomes-cost",
    acceptance: "Frozen baseline comparison reports completed product outcomes, actual/estimated/unknown total cost, correction effort and limitations.",
    evidence: `${JEV_LOOP_FIXTURE} :: AC11`,
    covered: true as const,
  },
] as const;

export function jevLoopAcEvidence(): readonly { readonly id: string; readonly covered: boolean }[] {
  return JEV_LOOP_AC.map((row) => ({ id: row.id, covered: row.covered }));
}
