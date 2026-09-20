/**
 * #395 — AC→evidence map for Pivot/hold + post-audit continuation closeout.
 *
 * Consumes prior #395 increments (ADR-0014, guarded research-decision authoring,
 * finding binding, stale/ambiguous/recovery/Kill/journal slices, not_run negative).
 * Coordinates #66/#71/#74/#73/#75/#126/#397. Does not redo #397 diagnostics or
 * rewrite #74 proof semantics. Paper/synthetic fixtures only. No npm.
 * NEXT_AFTER=#213 on HoE order only.
 */
export const RESEARCH_395_MAP_PATH = "catalog/providers/research-395-pivot-hold-closeout-map.ts" as const;
export const RESEARCH_395_FIXTURE = "checks/verification/fixtures/research-395-pivot-hold.fixtures.ts" as const;
export const RESEARCH_395_AUDIT_DOC = "checks/verification/rehearsal/research-395-pivot-hold-closeout.md" as const;
export const RESEARCH_395_REVIEW_DOC = "docs/research/research-395-independent-implementation-review.md" as const;
export const RESEARCH_395_ADR = "docs/decisions/0014-research-checkpoints-and-initialization-eligibility.md" as const;
export const RESEARCH_395_AUTHORING = "kernel/services/research-decision.ts" as const;
export const RESEARCH_395_CHECKPOINT = "kernel/session/research-checkpoint-projection.ts" as const;
export const RESEARCH_395_PROOF = "kernel/session/research-proof-projection.ts" as const;
export const RESEARCH_395_PLANNING = "kernel/session/planning-context.ts" as const;
export const RESEARCH_395_PUBLIC_TEST = "checks/verification/public-api/research-decision.test.ts" as const;
export const RESEARCH_395_CORE_FIXTURES = "checks/validation/repository/fixtures/core-artifacts.fixtures.ts" as const;
export const RESEARCH_395_ARTIFACT_CONTRACTS = "knowledge/process/artifact-contracts.md" as const;

export const RESEARCH_395_ISSUE = "#395" as const;
export const RESEARCH_395_PROGRAM = "U6-Skills-Astra" as const;
export const RESEARCH_395_STAMP = "0.221.60" as const;
export const RESEARCH_395_BASE_MAIN_SHA = "b85f26fce8aaf4f42ed60db6382a6dff6de64d8e" as const;
export const RESEARCH_395_CONSUMES = ["#400", "#406", "#407", "#427", "#453", "#459", "#468", "#476", "#483", "#488", "#492", "#145", "#173", "#180"] as const;
export const RESEARCH_395_COORDINATES = ["#66", "#71", "#74", "#73", "#75", "#126", "#397"] as const;
export const RESEARCH_395_NO_NPM_PUBLISH = true as const;
export const RESEARCH_395_NO_PROFILE_STEAL = true as const;
export const RESEARCH_395_NO_397_REDO = true as const;
export const RESEARCH_395_NO_74_REWRITE = true as const;
export const RESEARCH_395_NO_SECOND_PLANNER = true as const;
export const RESEARCH_395_NEXT_AFTER_CLOSE = "#213" as const;

export const RESEARCH_395_AC = [
  {
    id: "ac1-r0-mapping",
    acceptance: "R0 decision and compatibility mapping are recorded.",
    evidence: `${RESEARCH_395_ADR} before/after table + not_run settlement`,
    covered: true as const,
  },
  {
    id: "ac2-distinct-facts",
    acceptance: "Pivot, Kill, unrun experiments, founder decisions, proof strength, and initialization eligibility remain distinct.",
    evidence: `${RESEARCH_395_CHECKPOINT} + ${RESEARCH_395_PROOF} + offer run/waived/incomplete`,
    covered: true as const,
  },
  {
    id: "ac3-guarded-authoring",
    acceptance: "One guarded authoring path replaces the supported multi-file hand-edit loop without creating another authority owner.",
    evidence: `${RESEARCH_395_AUTHORING} + business.research.decision CLI`,
    covered: true as const,
  },
  {
    id: "ac4-interruption-matrix",
    acceptance: "Interruption, replay, stale inputs, duplicate YAML keys, untrusted input, and protected-effect cases pass.",
    evidence: `${RESEARCH_395_PUBLIC_TEST}`,
    covered: true as const,
  },
  {
    id: "ac5-surfaces-agree",
    acceptance: "CLI/MCP/status/guidance agree, and existing supported records retain their meaning.",
    evidence: `${RESEARCH_395_ARTIFACT_CONTRACTS} + public schemas + ADR compatibility`,
    covered: true as const,
  },
  {
    id: "ac6-review-revision",
    acceptance: "Independent implementation/conformance review and exact tested revision are recorded.",
    evidence: `${RESEARCH_395_REVIEW_DOC} + ${RESEARCH_395_AUDIT_DOC}`,
    covered: true as const,
  },
  {
    id: "ac7-handoffs",
    acceptance: "#71/#74 receive the implementation handoff; #73/#75 receive the synthetic scenario and measurement points.",
    evidence: `${RESEARCH_395_AUDIT_DOC} handoff section`,
    covered: true as const,
  },
] as const;

export const RESEARCH_395_SCENARIOS = [
  { id: "pivot-no-continuation", result: "held checkpoint; init refused" },
  { id: "confirmed-unrun-offer", result: "not_run incomplete; no fabricated waiver" },
  { id: "explicit-kill", result: "held; no silent Go" },
  { id: "founder-specified-risks-only", result: "unresolvedObligations remain; no authority grant" },
  { id: "local-work-protected-unresolved", result: "preview continues; init/authority still false" },
  { id: "stale-preview-refuse", result: "stale_revision before write" },
  { id: "malformed-duplicate-fail", result: "fail before write" },
  { id: "interruption-recovery", result: "journal recovery; no partial accepted" },
  { id: "replay-concurrent", result: "idempotent replay; lock refuse" },
  { id: "forged-path-refused", result: "symlink/unsafe path refused" },
  { id: "old-run-waived-preserved", result: "no additive not_run; no migration" },
  { id: "e2e-init-only-when-ready", result: "Go + accepted product required" },
] as const;

export function research395AcEvidence(id: string): string {
  const row = RESEARCH_395_AC.find((entry) => entry.id === id);
  return row?.evidence ?? "";
}

export function research395AllAcceptanceDone(): boolean {
  return RESEARCH_395_AC.every((row) => row.covered);
}
