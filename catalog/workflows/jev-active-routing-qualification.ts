/**
 * #571 — Recipe-owned policy for qualifying Jev as a *selected provider* for
 * decisions throughout a Brigade build, not only UI testing or post-hoc
 * validation.
 *
 * The policy declares what a qualification has to establish: the supported
 * provider tuple dimensions (model identity, endpoint/gateway, SDK/API version,
 * adapter revision), which decision families may be routed at all, which
 * operations must never reach a model, how official-source conformance evidence
 * differs from fake wiring evidence, the frozen routing-corpus case kinds, the
 * aggregate fanout bounds, and the handoff shape #573 may later consume.
 *
 * Jev is selected through the existing provider-neutral semantic contract and
 * stays swappable: nothing here names Jev as business policy, and no decision
 * family is admitted for execution by this unit. Jev is neither the authority
 * owner nor the source of product truth.
 *
 * Paper / synthetic. No network, no live provider call, no spend.
 * Consumes #513+#514+#515+#518+#523+#524. NO_571_IMPL cleared by #571.
 * Does not implement #573's active loop and does not close #511.
 */
export const JEV_ROUTING_RECIPE_ISSUE = "#571" as const;
export const JEV_ROUTING_RECIPE_EPIC = "#511" as const;
export const JEV_ROUTING_RECIPE_PLANNING_ID = "U5-JEV-ACTIVE-ROUTING-QUALIFICATION" as const;
export const JEV_ROUTING_RECIPE_STAMP = "0.221.51" as const;
export const JEV_ROUTING_RECIPE_CONSUMES = ["#513", "#514", "#515", "#518", "#523", "#524"] as const;
export const JEV_ROUTING_RECIPE_NO_NETWORK = true as const;
export const JEV_ROUTING_RECIPE_LIVE_NOT_PERFORMED = true as const;
export const JEV_ROUTING_RECIPE_NO_DUPLICATE_RUNTIME = true as const;
export const JEV_ROUTING_RECIPE_NO_JEV_IN_BUSINESS_POLICY = true as const;
export const JEV_ROUTING_RECIPE_PROVIDER_IS_SWAPPABLE = true as const;
export const JEV_ROUTING_RECIPE_NO_DETERMINISTIC_THROUGH_MODEL = true as const;
export const JEV_ROUTING_RECIPE_NO_FRONTIER_REINTERPRET_WRAPPER = true as const;
export const JEV_ROUTING_RECIPE_NO_524_REWRITE = true as const;
export const JEV_ROUTING_RECIPE_NO_573_IMPL = true as const;
export const JEV_ROUTING_RECIPE_NO_511_AUTOCLOSE = true as const;
export const JEV_ROUTING_RECIPE_MARKETING_IS_NOT_PROOF = true as const;
export const JEV_ROUTING_RECIPE_SOURCE_PRESENCE_IS_NOT_LIVE_QUALIFICATION = true as const;
export const JEV_ROUTING_RECIPE_CONFIDENCE_IS_NOT_CALIBRATION = true as const;
export const JEV_ROUTING_RECIPE_STRICT_SHAPE_IS_NOT_TRUTH = true as const;
export const JEV_ROUTING_RECIPE_GATEWAY_EQUIVALENCE_NOT_ASSUMED = true as const;
export const JEV_ROUTING_RECIPE_NO_571_IMPL = false as const;
export const JEV_ROUTING_RECIPE_NEXT_AFTER_CLOSE = "#573" as const;

/**
 * Existing contracts / owners this qualification composes over. Every one of
 * these is consumed; none is replaced, and no Jev-specific compiler, scheduler,
 * journal, cache, graph or policy store is introduced.
 */
export const JEV_ROUTING_OWNER_MODULES = [
  "contracts/semantic/questions.ts",
  "contracts/semantic/question-pack.ts",
  "contracts/semantic/receipts.ts",
  "catalog/providers/typesafe-qualify-map.ts",
  "adapters/providers/typesafe/binding.ts",
  "adapters/providers/typesafe/decode.ts",
  "kernel/session/semantic-batch.ts",
  "kernel/services/semantic-runtime-safety.ts",
  "kernel/services/evidence-gap-ranking.ts",
  "kernel/services/feedback-to-work-shadow.ts",
] as const;

/**
 * The four tuple dimensions a qualification must state separately. Collapsing
 * any two of them ("the endpoint is the model") is how a gateway swap silently
 * changes envelopes, limits and billing semantics.
 */
export const JEV_TUPLE_DIMENSIONS = ["model-identity", "endpoint-gateway", "sdk-api-version", "adapter-revision"] as const;
export type JevTupleDimension = (typeof JEV_TUPLE_DIMENSIONS)[number];

/**
 * Decision families this unit qualifies. A family being listed means it has a
 * frozen evaluation and a documented outcome vocabulary — not that it is
 * admitted for execution.
 */
export const JEV_DECISION_FAMILIES = [
  "next-useful-action",
  "context-knowledge-skill-selection",
  "bound-tool-or-worker-route",
  "within-task-continue-probe-repair-escalate",
  "product-profile-assessment",
  "acceptance-evidence-and-triage",
] as const;
export type JevDecisionFamily = (typeof JEV_DECISION_FAMILIES)[number];

/**
 * Operations that never reach a model, however cheap the call looks. Each one
 * has an exact deterministic answer, so a probability over it is noise wearing
 * a decision's clothes.
 */
export const DETERMINISTIC_ONLY_OPERATIONS = ["exact-identity", "arithmetic", "authorization", "hash-verification", "deterministic-schema-check"] as const;
export type DeterministicOnlyOperation = (typeof DETERMINISTIC_ONLY_OPERATIONS)[number];

/**
 * Routing outcome vocabulary. `no_match` and `insufficient_context` are first
 * class: a highest-probability Choice does not prove any candidate applies.
 */
export const ROUTING_OUTCOMES = ["selected", "no_match", "insufficient_context", "abstain_low_separation", "escalate"] as const;
export type RoutingOutcome = (typeof ROUTING_OUTCOMES)[number];

/** Build actions a qualified decision may point at. The executor still rechecks every one. */
export const ROUTABLE_BUILD_ACTIONS = ["observe", "edit", "run-bound-tool", "generative-worker", "repair", "review", "escalate", "verify-completion"] as const;
export type RoutableBuildAction = (typeof ROUTABLE_BUILD_ACTIONS)[number];

/**
 * Evidence classes are kept apart on purpose: a fake transport proves our wiring,
 * an official-source envelope proves the provider's shape. Neither substitutes
 * for the other, and neither is a live qualification.
 */
export const JEV_EVIDENCE_CLASSES = ["official-public-docs", "fake-wiring", "authorized-live-provider-proof"] as const;
export type JevEvidenceClass = (typeof JEV_EVIDENCE_CLASSES)[number];

/** Conformance failure classes that must fail clearly rather than degrade quietly. */
export const CONFORMANCE_FAILURE_CLASSES = ["malformed", "missing", "duplicate", "unsupported", "question-id-vocabulary-mismatch"] as const;
export type ConformanceFailureClass = (typeof CONFORMANCE_FAILURE_CLASSES)[number];

/**
 * Frozen routing-corpus case kinds. The corpus is frozen before any threshold is
 * tuned; its digest is recorded here so a later edit is visible rather than
 * convenient.
 */
export const ROUTING_CASE_KINDS = [
  "changed_evidence_next_action",
  "candidate_omitted",
  "true_no_match",
  "contradictory_input",
  "stale_evidence",
  "malicious_instruction",
  "confidently_wrong",
  "appropriate_escalation",
] as const;
export type RoutingCaseKind = (typeof ROUTING_CASE_KINDS)[number];

/** Read surfaces that execute zero inference requests, in every runtime mode. */
export const PASSIVE_READ_SURFACES = ["status", "plan", "discovery", "profile-query", "knowledge-query"] as const;
export type PassiveReadSurface = (typeof PASSIVE_READ_SURFACES)[number];

/** Aggregate fanout bounds. Code enforces these; the recipe only declares them. */
export interface JevFanoutLimits {
  readonly maxRequests: number;
  readonly maxConcurrency: number;
  readonly minIntervalMs: number;
  readonly deadlineMs: number;
  readonly maxAttemptsPerItem: number;
}

export const JEV_FANOUT_LIMITS: JevFanoutLimits = Object.freeze({
  maxRequests: 12,
  maxConcurrency: 3,
  minIntervalMs: 4,
  deadlineMs: 500,
  maxAttemptsPerItem: 2,
});

/**
 * What this qualification does and does not establish, recorded with the policy
 * so a reader never has to infer it from a passing fixture.
 */
export const JEV_ROUTING_QUALIFICATION_LIMITATIONS = [
  "Paper qualification: no authenticated Jev request is made, no key is provisioned, and no spend occurs on this path.",
  "Adapter source presence (fake and live HTTP transports from #515) is not a live qualification of the provider.",
  "A TypeSafe System One endpoint is not assumed to share envelopes, types, limits or billing semantics with any other gateway.",
  "Model alias resolution (`jev-latest`) is unconfirmed; no immutable model pin is claimed.",
  "Provider-derived confidence is a derived statistic, not a calibrated probability that a proposed action is correct.",
  "Strict response validation proves shape, not truth; a decoded answer is still only an assessment.",
  "No decision family is admitted for execution by this unit; shadow is the qualification stage, not a permanent ceiling.",
  "Latency and cost remain provider-dependent and unmeasured here; unknown is reported as unknown, never as zero.",
  "The routing corpus is small and synthetic: no universal accuracy, speedup, savings or rare-failure reliability claim follows from it.",
] as const;

export interface JevRoutingQualificationPolicy {
  readonly mode: "paper";
  readonly tupleDimensions: typeof JEV_TUPLE_DIMENSIONS;
  readonly decisionFamilies: typeof JEV_DECISION_FAMILIES;
  readonly deterministicOnlyOperations: typeof DETERMINISTIC_ONLY_OPERATIONS;
  readonly routingOutcomes: typeof ROUTING_OUTCOMES;
  readonly routableBuildActions: typeof ROUTABLE_BUILD_ACTIONS;
  readonly evidenceClasses: typeof JEV_EVIDENCE_CLASSES;
  readonly conformanceFailureClasses: typeof CONFORMANCE_FAILURE_CLASSES;
  readonly routingCaseKinds: typeof ROUTING_CASE_KINDS;
  readonly passiveReadSurfaces: typeof PASSIVE_READ_SURFACES;
  readonly fanoutLimits: JevFanoutLimits;
  readonly limitations: typeof JEV_ROUTING_QUALIFICATION_LIMITATIONS;
  /** The qualification stage every family starts in, per #523. */
  readonly defaultQualificationStage: "shadow";
  /** Families admitted for execution by *this* unit. Deliberately empty. */
  readonly admittedForExecution: readonly JevDecisionFamily[];
  /** Hard bans — all false, asserted by fixtures. */
  readonly duplicateRuntimeInfrastructure: false;
  readonly jevHardCodedIntoBusinessPolicy: false;
  readonly deterministicWorkRoutedThroughModel: false;
  readonly frontierAgentReinterpretationRequired: false;
  readonly gatewayEnvelopeEquivalenceAssumed: false;
  readonly marketingClaimAcceptedAsProof: false;
  readonly confidenceTreatedAsCalibrated: false;
  readonly fabricatedConfidenceForNoul: false;
  readonly passiveReadRunsInference: false;
  readonly jevOwnsReleaseOrAcceptanceAuthority: false;
  readonly jevIsSourceOfProductTruth: false;
  readonly rankingUnitRewritten: false;
  readonly activeLoopImplemented: false;
  /** Required affordances — all true. */
  readonly providerSwappable: true;
  readonly selectionIsHostExplicit: true;
  readonly noMatchPreserved: true;
  readonly insufficientContextPreserved: true;
  readonly independentReviewRequired: true;
  readonly sourceProofInvalidationHonored: true;
  readonly corpusFrozenBeforeTuning: true;
  readonly ownerModules: readonly (typeof JEV_ROUTING_OWNER_MODULES)[number][];
}

export const JEV_ROUTING_QUALIFICATION_POLICY: JevRoutingQualificationPolicy = {
  mode: "paper",
  tupleDimensions: JEV_TUPLE_DIMENSIONS,
  decisionFamilies: JEV_DECISION_FAMILIES,
  deterministicOnlyOperations: DETERMINISTIC_ONLY_OPERATIONS,
  routingOutcomes: ROUTING_OUTCOMES,
  routableBuildActions: ROUTABLE_BUILD_ACTIONS,
  evidenceClasses: JEV_EVIDENCE_CLASSES,
  conformanceFailureClasses: CONFORMANCE_FAILURE_CLASSES,
  routingCaseKinds: ROUTING_CASE_KINDS,
  passiveReadSurfaces: PASSIVE_READ_SURFACES,
  fanoutLimits: JEV_FANOUT_LIMITS,
  limitations: JEV_ROUTING_QUALIFICATION_LIMITATIONS,
  defaultQualificationStage: "shadow",
  admittedForExecution: [],
  duplicateRuntimeInfrastructure: false,
  jevHardCodedIntoBusinessPolicy: false,
  deterministicWorkRoutedThroughModel: false,
  frontierAgentReinterpretationRequired: false,
  gatewayEnvelopeEquivalenceAssumed: false,
  marketingClaimAcceptedAsProof: false,
  confidenceTreatedAsCalibrated: false,
  fabricatedConfidenceForNoul: false,
  passiveReadRunsInference: false,
  jevOwnsReleaseOrAcceptanceAuthority: false,
  jevIsSourceOfProductTruth: false,
  rankingUnitRewritten: false,
  activeLoopImplemented: false,
  providerSwappable: true,
  selectionIsHostExplicit: true,
  noMatchPreserved: true,
  insufficientContextPreserved: true,
  independentReviewRequired: true,
  sourceProofInvalidationHonored: true,
  corpusFrozenBeforeTuning: true,
  ownerModules: [...JEV_ROUTING_OWNER_MODULES],
};

/** True only if someone wrongly wired this qualification into the default workflows export. */
export function jevRoutingTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("jev-active-routing-qualification") && /export const workflows\s*=/.test(indexSource);
}

/**
 * True if a source names Jev or TypeSafe as business policy rather than reaching
 * it through the provider-neutral binding. Business/recipe policy speaks in
 * decision families and bindings; only the adapter layer knows the vendor.
 */
export function namesProviderAsBusinessPolicy(source: string): boolean {
  return /\b(?:jev|typesafe)\b/iu.test(source);
}

/**
 * True if a source redefines the #524 ranking unit instead of consuming it.
 * #524's slice stays in flight; this unit must not grow a second ranker.
 */
export function redefinesEvidenceGapRanking(source: string): boolean {
  return /export\s+(?:async\s+)?function\s+rankEligibleWork\b/u.test(source) || /export\s+(?:async\s+)?function\s+orderReadyByEvidenceGaps\b/u.test(source);
}
