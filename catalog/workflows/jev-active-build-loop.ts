/**
 * #573 — Recipe-owned policy for the active Jev-directed build loop after
 * next-work ranking.
 *
 * An admitted build uses qualified semantic decisions (#571) to choose and
 * **execute** the next useful work, context, worker/tool route, observation or
 * repair. A meaningful result requests the next decision. This is active build
 * routing, not only ranking (#524) or final validation.
 *
 * Consumes #524 ranking slice (do not rewrite), #523 staged safety/rollout, and
 * #571 Jev qualification handoff. Coordinates with proposed #574 docs (not a
 * shipped public API). Paper / synthetic. No network, no live provider call,
 * no spend. Jev remains swappable; never business policy or authority owner.
 *
 * NO_573_IMPL cleared by #573. NEXT_AFTER_CLOSE=#574 (docs coord).
 * epic 511 remains open — this unit does not auto-close the epic.
 */
export const JEV_LOOP_RECIPE_ISSUE = "#573" as const;
export const JEV_LOOP_RECIPE_EPIC = "#511" as const;
export const JEV_LOOP_RECIPE_PLANNING_ID = "U5-ACTIVE-JEV-BUILD-LOOP" as const;
export const JEV_LOOP_RECIPE_STAMP = "0.221.52" as const;
export const JEV_LOOP_RECIPE_CONSUMES = ["#524", "#523", "#571"] as const;
export const JEV_LOOP_RECIPE_NO_NETWORK = true as const;
export const JEV_LOOP_RECIPE_LIVE_NOT_PERFORMED = true as const;
export const JEV_LOOP_RECIPE_NO_DUPLICATE_RUNTIME = true as const;
export const JEV_LOOP_RECIPE_NO_JEV_IN_BUSINESS_POLICY = true as const;
export const JEV_LOOP_RECIPE_PROVIDER_IS_SWAPPABLE = true as const;
export const JEV_LOOP_RECIPE_NO_DETERMINISTIC_THROUGH_MODEL = true as const;
export const JEV_LOOP_RECIPE_NO_FRONTIER_REINTERPRET_WRAPPER = true as const;
export const JEV_LOOP_RECIPE_NO_524_REWRITE = true as const;
export const JEV_LOOP_RECIPE_NO_571_RECREATE = true as const;
export const JEV_LOOP_RECIPE_NO_NESTED_SUPERVISORY = true as const;
export const JEV_LOOP_RECIPE_NO_SELF_EDIT_LIVE_POLICY = true as const;
export const JEV_LOOP_RECIPE_NO_511_AUTOCLOSE = true as const;
export const JEV_LOOP_RECIPE_NO_573_IMPL = false as const;
export const JEV_LOOP_RECIPE_NEXT_AFTER_CLOSE = "#574" as const;
export const JEV_LOOP_RECIPE_ACTIVE_LOOP_IMPLEMENTED = true as const;
export const JEV_LOOP_RECIPE_ARCHITECTURE_DOC_ISSUE = "#574" as const;

/** Existing owners this loop composes over — none replaced. */
export const JEV_LOOP_OWNER_MODULES = [
  "contracts/semantic/questions.ts",
  "contracts/semantic/receipts.ts",
  "kernel/session/semantic-batch.ts",
  "kernel/services/semantic-runtime-safety.ts",
  "kernel/services/evidence-gap-ranking.ts",
  "kernel/services/jev-active-routing-qualification.ts",
  "adapters/providers/typesafe-semantic.ts",
] as const;

export const CHECKPOINT_PURPOSES = ["build-level", "within-task"] as const;
export type CheckpointPurpose = (typeof CHECKPOINT_PURPOSES)[number];

export const CHECKPOINT_EXPLICIT_OUTCOMES = [
  "selected",
  "no_match",
  "insufficient_evidence",
  "wrong_binding",
  "unsupported_modality",
  "missing_grant",
  "contradictory_evidence",
  "stale_refused",
  "hold_no_route",
] as const;
export type CheckpointExplicitOutcome = (typeof CHECKPOINT_EXPLICIT_OUTCOMES)[number];

export const ROUTE_KINDS = ["deterministic", "semantic", "generative", "independent-reviewer"] as const;
export type RouteKind = (typeof ROUTE_KINDS)[number];

export const LOOP_DIAGNOSES = ["model_error", "candidate_omission", "insufficient_evidence", "wrong_policy", "executor_failure"] as const;
export type LoopDiagnosis = (typeof LOOP_DIAGNOSES)[number];

export const LOOP_PASSIVE_READ_SURFACES = ["status", "plan", "discovery", "profile-query", "knowledge-query"] as const;
export type LoopPassiveReadSurface = (typeof LOOP_PASSIVE_READ_SURFACES)[number];

export interface JevLoopBounds {
  readonly maxLoopIterations: number;
  readonly maxNoProgressRounds: number;
  readonly maxConcurrency: number;
  readonly minIntervalMs: number;
  readonly deadlineMs: number;
  readonly maxAttemptsPerItem: number;
  readonly maxRequests: number;
  /** Fairness: mandatory work must be scheduled within this many discretionary steps. */
  readonly mandatoryFairnessWindow: number;
}

export const JEV_LOOP_BOUNDS: JevLoopBounds = Object.freeze({
  maxLoopIterations: 12,
  maxNoProgressRounds: 3,
  maxConcurrency: 3,
  minIntervalMs: 4,
  deadlineMs: 600,
  maxAttemptsPerItem: 2,
  maxRequests: 16,
  mandatoryFairnessWindow: 4,
});

export const JEV_LOOP_LIMITATIONS = [
  "Paper / synthetic active loop: no authenticated Jev request, no key provisioned, no spend on this path.",
  "Live paid Jev qualification remains separately authorized (#571); this unit does not perform it.",
  "#574 decision-router architecture docs are proposed until review — not a shipped public API; no imaginary commands.",
  "A qualified #571 decision is not a grant: freshness and authority are rechecked immediately before every dispatch.",
  "Choice winner is not proof any candidate applies; no_match and insufficient_evidence stay first-class.",
  "PATH credentials or tools do not activate a route; only supported, bound, authorized routes may dispatch.",
  "Generated commands, paths, credentials or authority never pass directly to execution.",
  "No nested supervisory sessions and no calling the whole headless runner from inside a running agent.",
  "No self-editing of live policy; no cross-workspace private-data pooling.",
  "Latency and cost remain provider-dependent; unknown is reported as unknown, never as zero.",
  "epic 511 remains open after this unit; NEXT_AFTER is #574 docs coord only.",
] as const;

export interface JevActiveBuildLoopPolicy {
  readonly mode: "paper";
  readonly checkpointPurposes: typeof CHECKPOINT_PURPOSES;
  readonly explicitOutcomes: typeof CHECKPOINT_EXPLICIT_OUTCOMES;
  readonly routeKinds: typeof ROUTE_KINDS;
  readonly diagnoses: typeof LOOP_DIAGNOSES;
  readonly passiveReadSurfaces: typeof LOOP_PASSIVE_READ_SURFACES;
  readonly bounds: JevLoopBounds;
  readonly limitations: typeof JEV_LOOP_LIMITATIONS;
  readonly defaultAdmissionStage: "admitted-execution";
  /** Families this paper loop admits for reversible execution only. */
  readonly admittedReversibleFamilies: readonly string[];
  readonly duplicateRuntimeInfrastructure: false;
  readonly jevHardCodedIntoBusinessPolicy: false;
  readonly deterministicWorkRoutedThroughModel: false;
  readonly frontierAgentReinterpretationRequired: false;
  readonly rankingUnitRewritten: false;
  readonly qualificationRecreated: false;
  readonly nestedSupervisorySession: false;
  readonly selfEditingLivePolicy: false;
  readonly passiveReadRunsInference: false;
  readonly staleSelectionMayDispatch: false;
  readonly pathCredentialActivatesRoute: false;
  readonly generatedAuthorityPassedToExecution: false;
  readonly choiceWinnerProvesApplicability: false;
  readonly activeLoopImplemented: true;
  readonly providerSwappable: true;
  readonly selectionIsHostExplicit: true;
  readonly noMatchPreserved: true;
  readonly insufficientEvidencePreserved: true;
  readonly independentReviewRequired: true;
  readonly sharedOwnershipAcrossCheckpoints: true;
  readonly ownerModules: readonly (typeof JEV_LOOP_OWNER_MODULES)[number][];
}

export const JEV_ACTIVE_BUILD_LOOP_POLICY: JevActiveBuildLoopPolicy = {
  mode: "paper",
  checkpointPurposes: CHECKPOINT_PURPOSES,
  explicitOutcomes: CHECKPOINT_EXPLICIT_OUTCOMES,
  routeKinds: ROUTE_KINDS,
  diagnoses: LOOP_DIAGNOSES,
  passiveReadSurfaces: LOOP_PASSIVE_READ_SURFACES,
  bounds: JEV_LOOP_BOUNDS,
  limitations: JEV_LOOP_LIMITATIONS,
  defaultAdmissionStage: "admitted-execution",
  admittedReversibleFamilies: ["next-useful-action", "within-task-continue-probe-repair-escalate", "context-knowledge-skill-selection"],
  duplicateRuntimeInfrastructure: false,
  jevHardCodedIntoBusinessPolicy: false,
  deterministicWorkRoutedThroughModel: false,
  frontierAgentReinterpretationRequired: false,
  rankingUnitRewritten: false,
  qualificationRecreated: false,
  nestedSupervisorySession: false,
  selfEditingLivePolicy: false,
  passiveReadRunsInference: false,
  staleSelectionMayDispatch: false,
  pathCredentialActivatesRoute: false,
  generatedAuthorityPassedToExecution: false,
  choiceWinnerProvesApplicability: false,
  activeLoopImplemented: true,
  providerSwappable: true,
  selectionIsHostExplicit: true,
  noMatchPreserved: true,
  insufficientEvidencePreserved: true,
  independentReviewRequired: true,
  sharedOwnershipAcrossCheckpoints: true,
  ownerModules: [...JEV_LOOP_OWNER_MODULES],
};

/** True only if someone wrongly wired this loop into the default workflows export. */
export function jevLoopTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("jev-active-build-loop") && /export const workflows\s*=/.test(indexSource);
}

/** True if a source redefines the #524 ranking unit instead of consuming it. */
export function redefinesEvidenceGapRanking(source: string): boolean {
  return /export\s+function\s+rankEligibleWork\s*\(/.test(source);
}

/** True if a source recreates #571 qualification instead of importing the handoff. */
export function recreatesJevQualification(source: string): boolean {
  return /function\s+describeJevSupportedTuple\s*\(/.test(source) && !source.includes("jev-active-routing-qualification");
}
