/**
 * #529 SQ-17 — Recipe-owned policy for bounded AI-powered product components
 * with tested fallback behavior.
 *
 * A generated product component treats semantic understanding as an ordinary
 * bounded operation: a finite domain catalog, natural-language context compiled
 * into narrow predicates over *known* actions, a deterministic policy that owns
 * prerequisites / duration limits / action vocabulary / permissions, and a
 * tested fallback that stays useful when the semantic service is unavailable.
 * The model informs a tested action; it never emits executable code, privileged
 * tool calls, runtime UI, or a constraint nobody stated.
 *
 * Not a chatbot. No client-side credential. No on-device TypeSafe claim. No
 * distillation. No runtime TypeSafe call into TUCK or any existing offline
 * business without an explicit scope decision.
 *
 * Paper / synthetic. No network. Consumes #512+#515+#516+#518+#520+#523.
 * NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529.
 * Does not implement #511 closeout or #573.
 */
export const BOUNDED_AI_COMPONENTS_RECIPE_ISSUE = "#529" as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_EPIC = "#511" as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_PLANNING_ID = "SQ-17" as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_STAMP = "0.221.50" as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_CONSUMES = ["#512", "#515", "#516", "#518", "#520", "#523"] as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_DEFAULT_REWRITE = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_NETWORK = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_CHATBOT = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_UNCONSTRAINED_TOOLS = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_MODEL_EMITTED_CODE = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_RUNTIME_GENERATED_UI = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_CLIENT_API_KEY = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_ON_DEVICE_TYPESAFE_CLAIM = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_DISTILLATION = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_UNAPPROVED_DATA_TRANSFER = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_INVENTED_CONSTRAINTS = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_TUCK_RUNTIME_TYPESAFE = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_CONFIDENCE_IS_NOT_AUTHORIZATION = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_AMBIGUITY_IS_NOT_A_FACT = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_OUTAGE_STAYS_USEFUL = true as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NO_529_IMPL = false as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_NEXT_AFTER_CLOSE = "#511" as const;

/** Existing contracts / owners this component generator composes over (consume — do not replace). */
export const BOUNDED_AI_COMPONENTS_OWNER_MODULES = [
  "contracts/semantic/question-pack.ts",
  "contracts/semantic/questions.ts",
  "kernel/services/semantic-runtime-safety.ts",
  "kernel/services/inference-receipt-store.ts",
  "kernel/services/applicability-path-projection.ts",
  "catalog/workflows/semantic-runtime-safety-rollout.ts",
] as const;

/**
 * The whole permitted action vocabulary of a generated component. A request for
 * anything outside this list is rejected before any effect is produced, no
 * matter how confidently a semantic result asks for it.
 */
export const PERMITTED_COMPONENT_ACTIONS = [
  "filter_activities",
  "suggest_activity",
  "start_activity_timer",
  "ask_clarifying_question",
  "show_offline_plan",
  "record_interpretation_correction",
] as const;
export type PermittedComponentAction = (typeof PERMITTED_COMPONENT_ACTIONS)[number];

/** Deterministic rejection vocabulary. `permitted` is not a rejection. */
export const ACTION_REJECTION_REASONS = [
  "unknown_action",
  "unknown_activity",
  "parameter_out_of_bounds",
  "missing_permission",
  "prerequisite_unmet",
  "fabricated_constraint",
  "stale_catalog",
  "missing_catalog_data",
  "model_emitted_code",
] as const;
export type ActionRejectionReason = (typeof ACTION_REJECTION_REASONS)[number];

export const ACTIVITY_NOISE_LEVELS = ["silent", "quiet", "audible"] as const;
export type ActivityNoiseLevel = (typeof ACTIVITY_NOISE_LEVELS)[number];

/** Closed equipment vocabulary. A word outside it is asked about, never invented. */
export const EQUIPMENT_KINDS = ["none", "mat", "chair", "wall", "resistance_band", "headphones"] as const;
export type EquipmentKind = (typeof EQUIPMENT_KINDS)[number];

export const COMPONENT_PERMISSIONS = ["local_notifications", "audio_playback", "background_timer"] as const;
export type ComponentPermission = (typeof COMPONENT_PERMISSIONS)[number];

/** The three material interpretation slots a user can inspect and correct. */
export const INTERPRETATION_SLOTS = ["maxDurationMinutes", "availableEquipment", "maxNoiseLevel"] as const;
export type InterpretationSlot = (typeof INTERPRETATION_SLOTS)[number];

/** How a constraint was resolved from natural language. There is no "guessed". */
export const CONSTRAINT_PARSE_OUTCOMES = ["exact", "ambiguous_ask", "absent"] as const;
export type ConstraintParseOutcome = (typeof CONSTRAINT_PARSE_OUTCOMES)[number];

export const COMPONENT_MODES = ["online_semantic", "deterministic_fallback"] as const;
export type ComponentMode = (typeof COMPONENT_MODES)[number];

/** Tested failure modes. Each one has a fixture; none of them fabricates facts. */
export const COMPONENT_FAILURE_CODES = [
  "service_unavailable",
  "deadline_exceeded",
  "cancelled",
  "partial_inference",
  "unsupported_language",
  "missing_catalog_data",
  "stale_catalog",
  "usage_budget_exhausted",
  "unsafe_action_rejected",
] as const;
export type ComponentFailureCode = (typeof COMPONENT_FAILURE_CODES)[number];

export const SUPPORTED_COMPONENT_LANGUAGES = ["en"] as const;

/** Correction affordances the generated component must expose for a material interpretation. */
export const CORRECTION_UI_HOOKS = [
  "interpretation.review_panel",
  "interpretation.slot_edit",
  "interpretation.clarifying_question",
  "interpretation.reset_to_structured_controls",
] as const;

/**
 * Runtime model limitations recorded with the build. These are stated, not
 * discovered at runtime, and they are shipped alongside the question pack.
 */
export const BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS = [
  "The semantic service runs server-side only; there is no on-device model and no distilled local copy.",
  "The model selects among deterministically filtered candidates; it cannot emit executable code, privileged tool calls, or runtime UI.",
  "Model confidence is never authorization; the deterministic policy owns prerequisites, duration limits, permissions, and the action vocabulary.",
  "The model never supplies a quantity the user did not state; an ambiguous duration or equipment mention becomes a clarifying question.",
  "Assessment latency and cost are provider-dependent and unknown at build time; the component enforces its own end-to-end deadline and usage bound instead.",
  "Fixtures are paper/synthetic; no real user data, no live provider call, and no measured latency or cost claim.",
] as const;

export interface BoundedAiComponentsRecipePolicy {
  readonly mode: "paper";
  readonly permittedActions: typeof PERMITTED_COMPONENT_ACTIONS;
  readonly rejectionReasons: typeof ACTION_REJECTION_REASONS;
  readonly noiseLevels: typeof ACTIVITY_NOISE_LEVELS;
  readonly equipmentKinds: typeof EQUIPMENT_KINDS;
  readonly permissions: typeof COMPONENT_PERMISSIONS;
  readonly interpretationSlots: typeof INTERPRETATION_SLOTS;
  readonly parseOutcomes: typeof CONSTRAINT_PARSE_OUTCOMES;
  readonly componentModes: typeof COMPONENT_MODES;
  readonly failureCodes: typeof COMPONENT_FAILURE_CODES;
  readonly supportedLanguages: typeof SUPPORTED_COMPONENT_LANGUAGES;
  readonly correctionUiHooks: typeof CORRECTION_UI_HOOKS;
  readonly modelLimitations: typeof BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS;
  /** Hard bans — all false, asserted by fixtures. */
  readonly chatbotSurface: false;
  readonly unconstrainedToolExecution: false;
  readonly modelEmitsExecutableCode: false;
  readonly modelGeneratesRuntimeUi: false;
  readonly clientHoldsCredential: false;
  readonly onDeviceTypeSafeModel: false;
  readonly automaticDistillation: false;
  readonly unapprovedCustomerDataTransfer: false;
  readonly modelInventsConstraints: false;
  readonly confidenceAuthorizesAction: false;
  readonly ambiguityBecomesFact: false;
  readonly outageBreaksProduct: false;
  readonly runtimeTypeSafeInOfflineBusinessWithoutScopeDecision: false;
  /** Required affordances — all true. */
  readonly interpretationInspectable: true;
  readonly interpretationCorrectable: true;
  readonly offlineFlowUseful: true;
  readonly serverSideCredentialHandling: true;
  readonly declaredNetworkPurpose: string;
  readonly declaredDataPurpose: string;
  /** Deterministic bounds. */
  readonly minActivityDurationMinutes: number;
  readonly maxActivityDurationMinutes: number;
  readonly maxInferenceCallsPerRequest: number;
  readonly maxDailyInferenceCalls: number;
  readonly endToEndDeadlineMs: number;
  readonly maxCandidateActivities: number;
  readonly catalogStaleAfterMs: number;
  readonly retentionDays: number;
  readonly ownerModules: readonly (typeof BOUNDED_AI_COMPONENTS_OWNER_MODULES)[number][];
}

export const BOUNDED_AI_COMPONENTS_RECIPE_POLICY: BoundedAiComponentsRecipePolicy = {
  mode: "paper",
  permittedActions: PERMITTED_COMPONENT_ACTIONS,
  rejectionReasons: ACTION_REJECTION_REASONS,
  noiseLevels: ACTIVITY_NOISE_LEVELS,
  equipmentKinds: EQUIPMENT_KINDS,
  permissions: COMPONENT_PERMISSIONS,
  interpretationSlots: INTERPRETATION_SLOTS,
  parseOutcomes: CONSTRAINT_PARSE_OUTCOMES,
  componentModes: COMPONENT_MODES,
  failureCodes: COMPONENT_FAILURE_CODES,
  supportedLanguages: SUPPORTED_COMPONENT_LANGUAGES,
  correctionUiHooks: CORRECTION_UI_HOOKS,
  modelLimitations: BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS,
  chatbotSurface: false,
  unconstrainedToolExecution: false,
  modelEmitsExecutableCode: false,
  modelGeneratesRuntimeUi: false,
  clientHoldsCredential: false,
  onDeviceTypeSafeModel: false,
  automaticDistillation: false,
  unapprovedCustomerDataTransfer: false,
  modelInventsConstraints: false,
  confidenceAuthorizesAction: false,
  ambiguityBecomesFact: false,
  outageBreaksProduct: false,
  runtimeTypeSafeInOfflineBusinessWithoutScopeDecision: false,
  interpretationInspectable: true,
  interpretationCorrectable: true,
  offlineFlowUseful: true,
  serverSideCredentialHandling: true,
  declaredNetworkPurpose: "Server-side semantic selection among already-filtered practice activities for the requesting session only.",
  declaredDataPurpose:
    "Interpret the session's stated time / equipment / noise constraints; no profile building, no cross-session pooling, no third-party sharing.",
  minActivityDurationMinutes: 1,
  maxActivityDurationMinutes: 30,
  maxInferenceCallsPerRequest: 1,
  maxDailyInferenceCalls: 50,
  endToEndDeadlineMs: 4000,
  maxCandidateActivities: 5,
  catalogStaleAfterMs: 86_400_000,
  retentionDays: 7,
  ownerModules: [...BOUNDED_AI_COMPONENTS_OWNER_MODULES],
};

/** True only if someone wrongly wired this module into the default workflows export. */
export function boundedAiComponentsTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("bounded-ai-product-components") && /export const workflows\s*=/.test(indexSource);
}

/**
 * True if an offline-business source (TUCK and friends) references this bounded
 * component at all. AC5 keeps that at zero absent an explicit scope decision.
 */
export function boundedAiComponentsReferencedInOfflineBusinessSource(source: string): boolean {
  return source.includes("bounded-ai-product-components");
}
