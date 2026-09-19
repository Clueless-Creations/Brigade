/**
 * #517 SQ-06 — AC→evidence map + declared source selectors for scoped projections.
 *
 * Consumes #512–#516. Does not redo them. Does not implement #518–#529.
 * No live / network / secrets / embeddings engine. Paper fixtures only.
 */
import type { DeclaredSourceSelector } from "../../kernel/services/source-projection.js";

export const SEMANTIC_SOURCE_PROJECTION_MAP_PATH = "catalog/providers/semantic-source-projection-map.ts" as const;
export const SEMANTIC_SOURCE_PROJECTION_MODULE = "kernel/services/source-projection.ts" as const;
export const SEMANTIC_SOURCE_PROJECTION_HELPERS = "kernel/knowledge-service/projection-helpers.ts" as const;
export const SEMANTIC_SOURCE_PROJECTION_FIXTURE = "checks/verification/fixtures/semantic-source-projection.fixtures.ts" as const;
export const SEMANTIC_PLAN_LOWER_MODULE = "kernel/composition/semantic-plan-lower.ts" as const;
export const SEMANTIC_CONTRACTS_QUERY_IR = "contracts/semantic/query-ir.ts" as const;

export const SEMANTIC_SOURCE_PROJECTION_ISSUE = "#517" as const;
export const SEMANTIC_SOURCE_PROJECTION_EPIC = "#511" as const;
export const SEMANTIC_SOURCE_PROJECTION_CONSUMES = ["#512", "#513", "#514", "#515", "#516"] as const;
export const SEMANTIC_SOURCE_PROJECTION_STAMP = "0.221.37" as const;
export const SEMANTIC_SOURCE_PROJECTION_BASE_MAIN_SHA = "a15a93f83ce6e617045077cca6bbb6562174789a" as const;
export const SEMANTIC_SOURCE_PROJECTION_LIVE_NOT_PERFORMED = true as const;
export const SEMANTIC_SOURCE_PROJECTION_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const SEMANTIC_SOURCE_PROJECTION_IOS_SIM_OOS = true as const;
export const SEMANTIC_SOURCE_PROJECTION_NEXT_AFTER_CLOSE = "#518" as const;
export const SEMANTIC_SOURCE_PROJECTION_NO_EMBEDDINGS = true as const;
export const SEMANTIC_SOURCE_PROJECTION_NO_518 = true as const;

/** Declared selectors only — arbitrary paths are refused at the projection seam. */
export const DECLARED_SOURCE_SELECTORS: readonly DeclaredSourceSelector[] = [
  {
    selectorId: "sel.feedback.workspace-public",
    workspaceId: "ws.demo",
    productRevision: "rev-a15a93f",
    purpose: "semantic-feedback-assess",
    dataScope: ["observation", "journey"],
    allowedSourceIds: ["src.reports", "src.journey"],
    selectedProviderId: "typesafe/systemone",
    privacyClass: "workspace",
  },
  {
    selectorId: "sel.feedback.private-gated",
    workspaceId: "ws.demo",
    productRevision: "rev-a15a93f",
    purpose: "semantic-feedback-assess-private",
    dataScope: ["observation", "private-customer"],
    allowedSourceIds: ["src.reports", "src.private-customer"],
    selectedProviderId: "typesafe/systemone",
    privacyClass: "private",
  },
] as const;

export const SEMANTIC_SOURCE_PROJECTION_AC = [
  {
    id: "ac1-private-never-leaks",
    acceptance: "A private or out-of-scope source never reaches a projection, cache key payload, diagnostic or provider request.",
    evidence: `${SEMANTIC_SOURCE_PROJECTION_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-absent-insufficient-context",
    acceptance: "An absent required source yields insufficient_context, not a confident no-match answer.",
    evidence: `${SEMANTIC_SOURCE_PROJECTION_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-unicode-spans-omissions",
    acceptance: "Unicode spans and offsets recover the selected evidence without corruption; bounded omissions have a valid continuation or explicit hold.",
    evidence: `${SEMANTIC_SOURCE_PROJECTION_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-selected-provider-retained",
    acceptance: "Selected-provider knowledge is retained; similar unselected-provider guidance cannot replace it.",
    evidence: `${SEMANTIC_SOURCE_PROJECTION_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-bounded-stable-missed-reporting",
    acceptance: "Candidate volume is bounded and stable, with case-level missed-candidate reporting.",
    evidence: `${SEMANTIC_SOURCE_PROJECTION_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function semanticSourceProjectionAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return SEMANTIC_SOURCE_PROJECTION_AC;
}

export function getDeclaredSelector(selectorId: string): DeclaredSourceSelector | undefined {
  return DECLARED_SOURCE_SELECTORS.find((s) => s.selectorId === selectorId);
}
