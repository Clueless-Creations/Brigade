/**
 * #571 — AC→evidence map for qualifying Jev for active build routing and
 * validation through the semantic runtime.
 *
 * Consumes #513+#514+#515+#518+#523+#524. Does not redo them, does not expand
 * the #524 ranking unit, does not implement #573's active loop, and does not
 * close #511.
 *
 * Paper / synthetic fixtures only; live assessment not performed. Official-source
 * conformance evidence is tracked separately from fake wiring evidence. Provider
 * selection stays host-explicit through the existing provider-neutral semantic
 * contract, so Jev remains swappable.
 */
export const JEV_ROUTING_MAP_PATH = "catalog/providers/jev-active-routing-qualification-map.ts" as const;
export const JEV_ROUTING_SERVICE_MODULE = "kernel/services/jev-active-routing-qualification.ts" as const;
export const JEV_ROUTING_RECIPE_MODULE = "catalog/workflows/jev-active-routing-qualification.ts" as const;
export const JEV_ROUTING_FIXTURE = "checks/verification/fixtures/jev-active-routing-qualification.fixtures.ts" as const;
export const JEV_ROUTING_DOC = "docs/upstreams/jev-active-routing-qualification.md" as const;
export const TYPESAFE_QUALIFY_MAP_MODULE = "catalog/providers/typesafe-qualify-map.ts" as const;
export const TYPESAFE_ADAPTER_DIR = "adapters/providers/typesafe" as const;
/** Flat shared surface kernel may import (ARCH-03/04); not the nested adapter tree. */
export const TYPESAFE_SEMANTIC_SURFACE = "adapters/providers/typesafe-semantic.ts" as const;
export const SEMANTIC_BATCH_OWNER = "kernel/session/semantic-batch.ts" as const;
export const SEMANTIC_RUNTIME_SAFETY_OWNER = "kernel/services/semantic-runtime-safety.ts" as const;
export const EVIDENCE_GAP_RANKING_OWNER = "kernel/services/evidence-gap-ranking.ts" as const;

export const JEV_ROUTING_ISSUE = "#571" as const;
export const JEV_ROUTING_EPIC = "#511" as const;
export const JEV_ROUTING_PLANNING_ID = "U5-JEV-ACTIVE-ROUTING-QUALIFICATION" as const;
export const JEV_ROUTING_CONSUMES = ["#513", "#514", "#515", "#518", "#523", "#524"] as const;
export const JEV_ROUTING_STAMP = "0.221.51" as const;
export const JEV_ROUTING_BASE_MAIN_SHA = "94121776f523a01cd427d43d15249da7181fc235" as const;
export const JEV_ROUTING_ARCHITECTURE_DOC_ISSUE = "#574" as const;
export const JEV_ROUTING_ACTIVE_LOOP_ISSUE = "#573" as const;
export const JEV_ROUTING_PROFILE_CONSUMER_ISSUES = ["#565", "#566"] as const;
export const JEV_ROUTING_LIVE_NOT_PERFORMED = true as const;
export const JEV_ROUTING_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const JEV_ROUTING_NO_NETWORK = true as const;
export const JEV_ROUTING_NO_DUPLICATE_RUNTIME = true as const;
export const JEV_ROUTING_NO_JEV_IN_BUSINESS_POLICY = true as const;
export const JEV_ROUTING_PROVIDER_IS_SWAPPABLE = true as const;
export const JEV_ROUTING_NO_DETERMINISTIC_THROUGH_MODEL = true as const;
export const JEV_ROUTING_NO_FRONTIER_REINTERPRET_WRAPPER = true as const;
export const JEV_ROUTING_NO_524_REWRITE = true as const;
export const JEV_ROUTING_NO_573_IMPL = true as const;
export const JEV_ROUTING_NO_511_AUTOCLOSE = true as const;
export const JEV_ROUTING_MARKETING_IS_NOT_PROOF = true as const;
export const JEV_ROUTING_SOURCE_PRESENCE_IS_NOT_LIVE_QUALIFICATION = true as const;
export const JEV_ROUTING_CONFIDENCE_IS_NOT_CALIBRATION = true as const;
export const JEV_ROUTING_STRICT_SHAPE_IS_NOT_TRUTH = true as const;
export const JEV_ROUTING_GATEWAY_EQUIVALENCE_NOT_ASSUMED = true as const;
export const JEV_ROUTING_NO_571_IMPL = false as const;
export const JEV_ROUTING_NEXT_AFTER_CLOSE = "#573" as const;

export const JEV_ROUTING_AC = [
  {
    id: "ac1-selected-through-provider-neutral-contract-with-documented-tuple",
    acceptance:
      "Jev is explicitly selected through the existing provider-neutral semantic contract, with a documented supported tuple and no duplicate runtime infrastructure.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-official-source-conformance-separate-from-fake-wiring",
    acceptance: "Official-source fixtures establish provider conformance separately from fake wiring tests.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-malformed-missing-duplicate-unsupported-fail-clearly",
    acceptance: "Malformed, missing, duplicate or unsupported responses fail clearly; unknown/unconfigured/unselected remain distinct.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-frozen-family-routing-eval-with-no-match-omission-confidently-wrong",
    acceptance: "A frozen family-specific routing evaluation includes true no-match/unknown outcomes, candidate omissions and confidently wrong answers.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-actual-async-fanout-admission-limits-outcomes-cancellation",
    acceptance: "Actual async fanout has aggregate admission, bounded concurrency/rate/deadline, complete outcomes and cancellation/recovery proof.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC5`,
    covered: true as const,
  },
  {
    id: "ac6-573-consumable-handoff-without-frontier-reinterpretation",
    acceptance:
      "#573 can consume qualified decisions to change the next executed build action under existing authority without a frontier-agent interpretation wrapper.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC6`,
    covered: true as const,
  },
  {
    id: "ac7-product-profile-validation-consumer-not-sole-definition",
    acceptance: "At least one Product Profile validation consumer is proved when its contract is ready; it does not become the only definition of Jev support.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC7`,
    covered: true as const,
  },
  {
    id: "ac8-passive-reads-inference-free-active-decisions-keep-receipts",
    acceptance: "Passive reads stay inference-free and active decisions retain complete provenance and policy receipts.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC8`,
    covered: true as const,
  },
  {
    id: "ac9-release-acceptance-authority-invalidation-review-intact",
    acceptance: "Release/acceptance authority, source-proof invalidation and required independent review remain intact.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC9`,
    covered: true as const,
  },
  {
    id: "ac10-docs-and-selected-provider-guidance-match-performed-proof",
    acceptance: "Documentation, supported public services and selected-provider guidance match performed proof rather than proposed capabilities.",
    evidence: `${JEV_ROUTING_FIXTURE} :: AC10`,
    covered: true as const,
  },
] as const;

export function jevRoutingAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return JEV_ROUTING_AC;
}
