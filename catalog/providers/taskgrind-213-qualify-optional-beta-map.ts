/**
 * #213 — AC→evidence map for TaskGrind qualification + optional managed beta.
 *
 * Phase-1 qualification hold (authoritative access unavailable). Lightest verified
 * mode = provider-neutral operator-assisted handoff + attributable import/resume.
 * No speculative TaskGrind adapter. No live recruit/spend/account. APP_QUALITY
 * remains quality summary owner. NEXT_AFTER=#6 on HoE order only.
 */
export const TASKGRIND_213_MAP_PATH = "catalog/providers/taskgrind-213-qualify-optional-beta-map.ts" as const;
export const TASKGRIND_213_QUALIFY_DOC = "docs/upstreams/taskgrind-qualification.md" as const;
export const TASKGRIND_213_UPSTREAM = "catalog/upstreams/taskgrind.yaml" as const;
export const TASKGRIND_213_OBSERVATION = "catalog/upstreams/observations/taskgrind.json" as const;
export const TASKGRIND_213_SERVICE = "kernel/services/human-beta-recruitment.ts" as const;
export const TASKGRIND_213_GUIDANCE = "knowledge/engineering/human-beta-recruitment.md" as const;
export const TASKGRIND_213_FIXTURE = "checks/verification/fixtures/taskgrind-213-qualify-optional-beta.fixtures.ts" as const;
export const TASKGRIND_213_AUDIT_DOC = "checks/verification/rehearsal/taskgrind-213-qualify-optional-beta-closeout.md" as const;
export const TASKGRIND_213_REVIEW_DOC = "docs/research/taskgrind-213-independent-implementation-review.md" as const;
export const TASKGRIND_213_APP_QUALITY = "knowledge/engineering/app-quality.md" as const;
export const TASKGRIND_213_ADR = "docs/decisions/0013-provider-integration-boundary.md" as const;
export const TASKGRIND_213_PROVIDER_GUIDE = "docs/guides/provider-integrations.md" as const;

export const TASKGRIND_213_ISSUE = "#213" as const;
export const TASKGRIND_213_PROGRAM = "U6-Skills-Astra" as const;
export const TASKGRIND_213_STAMP = "0.221.61" as const;
export const TASKGRIND_213_BASE_MAIN_SHA = "ee1e358ffa6a1f3cb38b4407735cb7078181b2f1" as const;
export const TASKGRIND_213_CONSUMES = ["#395", "#117", "ADR-0013", "APP_QUALITY"] as const;
export const TASKGRIND_213_COORDINATES = ["#117", "#378"] as const;
export const TASKGRIND_213_HOLD_ID = "taskgrind.qualification-authoritative-access-unavailable" as const;
export const TASKGRIND_213_MODE = "operator-assisted" as const;
export const TASKGRIND_213_QUALIFICATION_STATUS = "hold" as const;
export const TASKGRIND_213_LIVE_NOT_PERFORMED = true as const;
export const TASKGRIND_213_NO_NETWORK = true as const;
export const TASKGRIND_213_NO_NPM_PUBLISH = true as const;
export const TASKGRIND_213_NO_PROFILE_STEAL = true as const;
export const TASKGRIND_213_NO_SPECULATIVE_ADAPTER = true as const;
export const TASKGRIND_213_NO_VENDOR_GLOBAL_FLAG = true as const;
export const TASKGRIND_213_NO_LIVE_RECRUIT = true as const;
export const TASKGRIND_213_NEXT_AFTER_CLOSE = "#6" as const;

export const TASKGRIND_213_PHASE1_QUESTIONS = [
  "interaction-modes",
  "supported-operations",
  "identifiers-readback",
  "tester-constraints",
  "pricing-incentives",
  "privacy-retention-automation",
  "canonical-mapping",
] as const;

export const TASKGRIND_213_EVIDENCE_CLASSES = ["source", "fixture", "assisted", "live"] as const;

export const TASKGRIND_213_AC = [
  {
    id: "ac1-qualification-or-hold",
    acceptance:
      "Dated TaskGrind qualification record exists answering Phase-1 questions, or an explicit qualification hold is recorded when authoritative access is unavailable (no speculative adapter).",
    evidence: `${TASKGRIND_213_QUALIFY_DOC} + ${TASKGRIND_213_UPSTREAM} deferred review`,
    covered: true as const,
  },
  {
    id: "ac2-lightest-verified-mode",
    acceptance:
      "Lightest verified interaction mode is chosen and implemented end-to-end on existing operation/evidence owners (operator-assisted handoff+import under hold).",
    evidence: `${TASKGRIND_213_SERVICE} + ${TASKGRIND_213_FIXTURE}`,
    covered: true as const,
  },
  {
    id: "ac3-optional-selection-binding",
    acceptance: "Managed recruitment remains optional; TaskGrind is selected only through existing product/recipe/binding mechanisms (no vendor-global flag).",
    evidence: `${TASKGRIND_213_SERVICE} selection + ${TASKGRIND_213_FIXTURE} :: selection negatives`,
    covered: true as const,
  },
  {
    id: "ac4-app-quality-owner",
    acceptance:
      "engineering/APP_QUALITY.md remains the quality summary owner; recruitment does not authorize distribution or substitute for release acceptance.",
    evidence: `${TASKGRIND_213_APP_QUALITY} + ${TASKGRIND_213_GUIDANCE} + ${TASKGRIND_213_FIXTURE}`,
    covered: true as const,
  },
  {
    id: "ac5-privacy-failure-cases",
    acceptance:
      "Required privacy/safety and failure cases pass (no-beta, other-provider, qualification-unknown hold, stale approval invalidation, untrusted tester input, bound imports, isolation).",
    evidence: `${TASKGRIND_213_FIXTURE} :: privacy/failure suite`,
    covered: true as const,
  },
  {
    id: "ac6-evidence-classes-separate",
    acceptance: "Source/fixture/assisted/live evidence are reported separately; live human-beta proof is not claimed without a separately authorized campaign.",
    evidence: `${TASKGRIND_213_AUDIT_DOC} + ${TASKGRIND_213_QUALIFY_DOC} §2 + LIVE_NOT_PERFORMED`,
    covered: true as const,
  },
  {
    id: "ac7-independent-review-one-pr",
    acceptance: "Independent review confirms architecture/provenance; one PR; no npm publish / live recruit / spend / account creation under this issue.",
    evidence: `${TASKGRIND_213_REVIEW_DOC} + holds constants`,
    covered: true as const,
  },
] as const;

export function taskgrind213AcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return TASKGRIND_213_AC;
}

export function taskgrind213AllAcceptanceDone(): boolean {
  return TASKGRIND_213_AC.every((row) => row.covered);
}

export function taskgrind213HoldsObserved(): readonly string[] {
  return [
    TASKGRIND_213_HOLD_ID,
    "no-speculative-adapter",
    "no-vendor-global-flag",
    "no-live-recruit-spend-account",
    "no-npm-publish",
    "no-profile-steal",
    "live-human-beta-proof-separate-authorization",
    "next-after-close-is-6-hoe-order-only",
  ] as const;
}
