/**
 * #397 — AC→evidence map for research field diagnostics + contract explain.
 *
 * Consumes prior #397 increments (field-aware narrative, waiver diagnostics,
 * row locations, hostile sanitization, `b2c check research --explain`).
 * Coordinates #66/#71/#74/#73/#75/#395. Does not steal #395 state/authoring
 * or rewrite #74 proof semantics. Paper/synthetic fixtures only. No npm.
 * NEXT_AFTER=#395 on HoE order only.
 */
export const RESEARCH_397_MAP_PATH = "catalog/providers/research-397-field-diagnostics-closeout-map.ts" as const;
export const RESEARCH_397_FIXTURE = "checks/verification/fixtures/research-397-field-diagnostics.fixtures.ts" as const;
export const RESEARCH_397_AUDIT_DOC = "checks/verification/rehearsal/research-397-field-diagnostics-closeout.md" as const;
export const RESEARCH_397_REVIEW_DOC = "docs/research/research-397-independent-implementation-review.md" as const;
export const RESEARCH_397_VALIDATOR = "checks/validation/business/research/check-research-evidence.ts" as const;
export const RESEARCH_397_OFFER = "checks/validation/business/research/offer-evidence.ts" as const;
export const RESEARCH_397_CONTRACT = "contracts/public-api/research-contract.ts" as const;
export const RESEARCH_397_CORE_FIXTURES = "checks/validation/repository/fixtures/core-artifacts.fixtures.ts" as const;
export const RESEARCH_397_ARTIFACT_CONTRACTS = "knowledge/process/artifact-contracts.md" as const;

export const RESEARCH_397_ISSUE = "#397" as const;
export const RESEARCH_397_PROGRAM = "U6-Skills-Astra" as const;
export const RESEARCH_397_STAMP = "0.221.59" as const;
export const RESEARCH_397_BASE_MAIN_SHA = "7ce0a61bb6f5c4ca8c1a05ea0b31f46ec09b3d8c" as const;
export const RESEARCH_397_CONSUMES = [
  "#398",
  "#399",
  "#401",
  "#412",
  "#417",
  "#428",
  "#438",
  "#442",
  "#443",
  "#454",
  "#458",
  "#465",
  "#469",
  "#475",
  "#478",
  "#486",
  "#495",
] as const;
export const RESEARCH_397_COORDINATES = ["#66", "#71", "#74", "#73", "#75", "#395"] as const;
export const RESEARCH_397_NO_NPM_PUBLISH = true as const;
export const RESEARCH_397_NO_PROFILE_STEAL = true as const;
export const RESEARCH_397_NO_395_STEAL = true as const;
export const RESEARCH_397_NO_74_REWRITE = true as const;
export const RESEARCH_397_NO_SECOND_PARSER = true as const;
export const RESEARCH_397_NEXT_AFTER_CLOSE = "#395" as const;

export const RESEARCH_397_AC = [
  {
    id: "ac1-actionable-diagnostics",
    acceptance: "Every fixed-corpus failure has an actionable field or parse diagnostic through the actual check surface.",
    evidence: `${RESEARCH_397_CORE_FIXTURES} + ${RESEARCH_397_VALIDATOR}`,
    covered: true as const,
  },
  {
    id: "ac2-narrative-preserved",
    acceptance: "Legitimate narrative is preserved; unresolved data and invalid references remain rejected at the appropriate layer.",
    evidence: `${RESEARCH_397_CORE_FIXTURES} narrative pending / TBD-only / quoted TBD / confidence nuance cases`,
    covered: true as const,
  },
  {
    id: "ac3-waiver-separators",
    acceptance: "Waiver binding and valid separator/format compatibility survive.",
    evidence: `${RESEARCH_397_OFFER} + plus-separated SIG lists + waiver date/actor binding fixtures`,
    covered: true as const,
  },
  {
    id: "ac4-explain-examples",
    acceptance: "Check explanation and authored examples agree with the enforced contract and are available in supported packages.",
    evidence: `${RESEARCH_397_CONTRACT} + b2c check research --explain + templates/examples`,
    covered: true as const,
  },
  {
    id: "ac5-bounded-sanitized",
    acceptance: "Diagnostic output is bounded, sanitized, read-only, and compatible.",
    evidence: `${RESEARCH_397_CORE_FIXTURES} hostile/secret diagnostics + early --explain path`,
    covered: true as const,
  },
  {
    id: "ac6-ownership",
    acceptance: "#395 owns state/authoring changes; #74 retains proof semantics and its original onboarding scope.",
    evidence: `${RESEARCH_397_AUDIT_DOC} ownership holds + checkpoint vocab coord only`,
    covered: true as const,
  },
  {
    id: "ac7-review-corpus-handoff",
    acceptance: "Independent review, exact tests/revisions, and evidence limits are recorded; #73/#75 receive the regression corpus.",
    evidence: `${RESEARCH_397_REVIEW_DOC} + ${RESEARCH_397_AUDIT_DOC}`,
    covered: true as const,
  },
] as const;

export const RESEARCH_397_CORPUS = [
  { id: "narrative-pending", result: "structurally valid" },
  { id: "tbd-only-finding", result: "reject at field" },
  { id: "quoted-tbd", result: "preserve quotation" },
  { id: "confidence-nuance", result: "enum reject + narrative keep" },
  { id: "plus-separated-ids", result: "retain parsing" },
  { id: "range-mixed-undeclared-ineligible", result: "distinct actionable reasons" },
  { id: "waiver-variants", result: "distinguishable diagnostics" },
  { id: "table-edges", result: "rendered-table contract" },
  { id: "secret-path-cells", result: "sanitized bounded" },
  { id: "many-invalid-rows", result: "bounded findings" },
  { id: "pivot-hold", result: "held checkpoint; #395 owns authoring" },
  { id: "packed-mcp-readonly", result: "explain compatible; no side effects" },
] as const;

export function research397AllAcceptanceDone(): boolean {
  return RESEARCH_397_AC.every((item) => item.covered);
}

export function research397AcEvidence(id: (typeof RESEARCH_397_AC)[number]["id"]): string {
  const row = RESEARCH_397_AC.find((item) => item.id === id);
  if (!row) throw new Error(`research_397.unknown_ac:${id}`);
  return row.evidence;
}
