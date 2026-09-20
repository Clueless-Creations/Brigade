/**
 * #529 SQ-17 — Bounded AI-powered product component fixtures (paper; synthetic;
 * no-network).
 *
 * Proves all five Acceptance criteria plus tip stamps / hard bans / NO_529
 * cleared, the versioned question pack + policy, and the tested failure modes
 * (unsupported language, missing catalog data, stale catalog, cancellation,
 * partial inference, deadline).
 *
 * These cases execute the component and assert the *effects* it produced and the
 * actions it actually ran — not merely that a JSON payload parsed.
 * Import identifiers are locked to live exports.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  ACTION_REJECTION_REASONS,
  BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS,
  BOUNDED_AI_COMPONENTS_OWNER_MODULES,
  BOUNDED_AI_COMPONENTS_RECIPE_AMBIGUITY_IS_NOT_A_FACT,
  BOUNDED_AI_COMPONENTS_RECIPE_CONFIDENCE_IS_NOT_AUTHORIZATION,
  BOUNDED_AI_COMPONENTS_RECIPE_CONSUMES,
  BOUNDED_AI_COMPONENTS_RECIPE_EPIC,
  BOUNDED_AI_COMPONENTS_RECIPE_ISSUE,
  BOUNDED_AI_COMPONENTS_RECIPE_NEXT_AFTER_CLOSE,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_529_IMPL,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_CHATBOT,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_CLIENT_API_KEY,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_DEFAULT_REWRITE,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_DISTILLATION,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_INVENTED_CONSTRAINTS,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_MODEL_EMITTED_CODE,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_NETWORK,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_ON_DEVICE_TYPESAFE_CLAIM,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_RUNTIME_GENERATED_UI,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_TUCK_RUNTIME_TYPESAFE,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_UNAPPROVED_DATA_TRANSFER,
  BOUNDED_AI_COMPONENTS_RECIPE_NO_UNCONSTRAINED_TOOLS,
  BOUNDED_AI_COMPONENTS_RECIPE_OUTAGE_STAYS_USEFUL,
  BOUNDED_AI_COMPONENTS_RECIPE_PLANNING_ID,
  BOUNDED_AI_COMPONENTS_RECIPE_POLICY,
  BOUNDED_AI_COMPONENTS_RECIPE_STAMP,
  COMPONENT_FAILURE_CODES,
  CORRECTION_UI_HOOKS,
  PERMITTED_COMPONENT_ACTIONS,
  boundedAiComponentsReferencedInOfflineBusinessSource,
  boundedAiComponentsTouchesDefaultIndex,
} from "../../../catalog/workflows/bounded-ai-product-components.js";
import {
  BOUNDED_AI_COMPONENTS_AC,
  BOUNDED_AI_COMPONENTS_AMBIGUITY_IS_NOT_A_FACT,
  BOUNDED_AI_COMPONENTS_BASE_MAIN_SHA,
  BOUNDED_AI_COMPONENTS_CONFIDENCE_IS_NOT_AUTHORIZATION,
  BOUNDED_AI_COMPONENTS_CONSUMES,
  BOUNDED_AI_COMPONENTS_EPIC,
  BOUNDED_AI_COMPONENTS_FIXTURE,
  BOUNDED_AI_COMPONENTS_HOSTED_KEY_OWNER,
  BOUNDED_AI_COMPONENTS_ISSUE,
  BOUNDED_AI_COMPONENTS_LIVE_NOT_PERFORMED,
  BOUNDED_AI_COMPONENTS_MAP_PATH,
  BOUNDED_AI_COMPONENTS_NEXT_AFTER_CLOSE,
  BOUNDED_AI_COMPONENTS_NO_529_IMPL,
  BOUNDED_AI_COMPONENTS_NO_CHATBOT,
  BOUNDED_AI_COMPONENTS_NO_CLIENT_API_KEY,
  BOUNDED_AI_COMPONENTS_NO_DISTILLATION,
  BOUNDED_AI_COMPONENTS_NO_INVENTED_CONSTRAINTS,
  BOUNDED_AI_COMPONENTS_NO_MODEL_EMITTED_CODE,
  BOUNDED_AI_COMPONENTS_NO_NETWORK,
  BOUNDED_AI_COMPONENTS_NO_ON_DEVICE_TYPESAFE_CLAIM,
  BOUNDED_AI_COMPONENTS_NO_RUNTIME_GENERATED_UI,
  BOUNDED_AI_COMPONENTS_NO_TUCK_RUNTIME_TYPESAFE,
  BOUNDED_AI_COMPONENTS_NO_UNAPPROVED_DATA_TRANSFER,
  BOUNDED_AI_COMPONENTS_NO_UNCONSTRAINED_TOOLS,
  BOUNDED_AI_COMPONENTS_OUTAGE_STAYS_USEFUL,
  BOUNDED_AI_COMPONENTS_PLANNING_ID,
  BOUNDED_AI_COMPONENTS_STAMP,
  boundedAiComponentsAcEvidence,
} from "../../../catalog/providers/bounded-ai-product-components-map.js";
import {
  BOUNDED_AI_COMPONENTS_CONSUMES as SERVICE_CONSUMES,
  BOUNDED_AI_COMPONENTS_EPIC as SERVICE_EPIC,
  BOUNDED_AI_COMPONENTS_ISSUE as SERVICE_ISSUE,
  BOUNDED_AI_COMPONENTS_NEXT_AFTER_CLOSE as SERVICE_NEXT_AFTER,
  BOUNDED_AI_COMPONENTS_NO_529_IMPL as SERVICE_NO_529,
  BOUNDED_AI_COMPONENTS_NO_CHATBOT as SERVICE_NO_CHATBOT,
  BOUNDED_AI_COMPONENTS_NO_CLIENT_API_KEY as SERVICE_NO_CLIENT_KEY,
  BOUNDED_AI_COMPONENTS_NO_MODEL_EMITTED_CODE as SERVICE_NO_CODE,
  BOUNDED_AI_COMPONENTS_NO_NETWORK as SERVICE_NO_NETWORK,
  BOUNDED_AI_COMPONENTS_NO_TUCK_RUNTIME_TYPESAFE as SERVICE_NO_TUCK,
  BOUNDED_AI_COMPONENTS_QUESTION_PACK,
  BOUNDED_AI_COMPONENTS_QUESTION_PACK_DIGEST,
  BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE,
  BOUNDED_AI_COMPONENTS_STAMP as SERVICE_STAMP,
  applyInterpretationCorrection,
  assertNoRuntimeTypeSafeInOfflineBusiness,
  assessSeededBoundedComponent,
  assessSeededOutageFallback,
  authorizeAction,
  catalogFreshness,
  describeClientBundle,
  eraseComponentSession,
  executeAction,
  filterActivities,
  interpretConstraints,
  projectPredicates,
  runBoundedComponent,
  scanClientArtifactsForSecrets,
  versionedComponentPolicy,
} from "../../../kernel/services/bounded-ai-product-components.js";

function walkSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkSources(full, out);
      continue;
    }
    out.push(full);
  }
  return out;
}

export function register(harness: Harness): void {
  harness.check("bounded-ai-product-components: stamp/issue/consumes + AC map + hard bans + NO_529 cleared", () => {
    assert(BOUNDED_AI_COMPONENTS_ISSUE === "#529", "map issue");
    assert(SERVICE_ISSUE === "#529", "service issue");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_ISSUE === "#529", "recipe issue");
    assert(BOUNDED_AI_COMPONENTS_EPIC === "#511" && SERVICE_EPIC === "#511" && BOUNDED_AI_COMPONENTS_RECIPE_EPIC === "#511", "epic");
    assert(BOUNDED_AI_COMPONENTS_PLANNING_ID === "SQ-17" && BOUNDED_AI_COMPONENTS_RECIPE_PLANNING_ID === "SQ-17", "planning id");
    assert(BOUNDED_AI_COMPONENTS_STAMP === "0.221.50" && SERVICE_STAMP === "0.221.50" && BOUNDED_AI_COMPONENTS_RECIPE_STAMP === "0.221.50", "stamp");
    assert(BOUNDED_AI_COMPONENTS_NO_529_IMPL === false && SERVICE_NO_529 === false && BOUNDED_AI_COMPONENTS_RECIPE_NO_529_IMPL === false, "NO_529 cleared");
    assert(
      BOUNDED_AI_COMPONENTS_NEXT_AFTER_CLOSE === "#511" && SERVICE_NEXT_AFTER === "#511" && BOUNDED_AI_COMPONENTS_RECIPE_NEXT_AFTER_CLOSE === "#511",
      "NEXT_AFTER=#511 (epic closeout path)",
    );
    const consumes = JSON.stringify(["#512", "#515", "#516", "#518", "#520", "#523"]);
    assert(JSON.stringify([...BOUNDED_AI_COMPONENTS_CONSUMES]) === consumes, "map consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === consumes, "service consumes");
    assert(JSON.stringify([...BOUNDED_AI_COMPONENTS_RECIPE_CONSUMES]) === consumes, "recipe consumes");
    assert(BOUNDED_AI_COMPONENTS_NO_NETWORK && SERVICE_NO_NETWORK && BOUNDED_AI_COMPONENTS_RECIPE_NO_NETWORK, "no network");
    assert(BOUNDED_AI_COMPONENTS_NO_CHATBOT && SERVICE_NO_CHATBOT && BOUNDED_AI_COMPONENTS_RECIPE_NO_CHATBOT, "not a chatbot");
    assert(BOUNDED_AI_COMPONENTS_NO_UNCONSTRAINED_TOOLS && BOUNDED_AI_COMPONENTS_RECIPE_NO_UNCONSTRAINED_TOOLS, "no unconstrained tools");
    assert(BOUNDED_AI_COMPONENTS_NO_MODEL_EMITTED_CODE && SERVICE_NO_CODE && BOUNDED_AI_COMPONENTS_RECIPE_NO_MODEL_EMITTED_CODE, "no model-emitted code");
    assert(BOUNDED_AI_COMPONENTS_NO_RUNTIME_GENERATED_UI && BOUNDED_AI_COMPONENTS_RECIPE_NO_RUNTIME_GENERATED_UI, "no runtime-generated UI");
    assert(BOUNDED_AI_COMPONENTS_NO_CLIENT_API_KEY && SERVICE_NO_CLIENT_KEY && BOUNDED_AI_COMPONENTS_RECIPE_NO_CLIENT_API_KEY, "no client API key");
    assert(BOUNDED_AI_COMPONENTS_NO_ON_DEVICE_TYPESAFE_CLAIM && BOUNDED_AI_COMPONENTS_RECIPE_NO_ON_DEVICE_TYPESAFE_CLAIM, "no on-device claim");
    assert(BOUNDED_AI_COMPONENTS_NO_DISTILLATION && BOUNDED_AI_COMPONENTS_RECIPE_NO_DISTILLATION, "no distillation");
    assert(BOUNDED_AI_COMPONENTS_NO_UNAPPROVED_DATA_TRANSFER && BOUNDED_AI_COMPONENTS_RECIPE_NO_UNAPPROVED_DATA_TRANSFER, "no unapproved transfer");
    assert(BOUNDED_AI_COMPONENTS_NO_INVENTED_CONSTRAINTS && BOUNDED_AI_COMPONENTS_RECIPE_NO_INVENTED_CONSTRAINTS, "no invented constraints");
    assert(BOUNDED_AI_COMPONENTS_NO_TUCK_RUNTIME_TYPESAFE && SERVICE_NO_TUCK && BOUNDED_AI_COMPONENTS_RECIPE_NO_TUCK_RUNTIME_TYPESAFE, "no TUCK runtime call");
    assert(BOUNDED_AI_COMPONENTS_CONFIDENCE_IS_NOT_AUTHORIZATION && BOUNDED_AI_COMPONENTS_RECIPE_CONFIDENCE_IS_NOT_AUTHORIZATION, "confidence ≠ authorization");
    assert(BOUNDED_AI_COMPONENTS_AMBIGUITY_IS_NOT_A_FACT && BOUNDED_AI_COMPONENTS_RECIPE_AMBIGUITY_IS_NOT_A_FACT, "ambiguity ≠ fact");
    assert(BOUNDED_AI_COMPONENTS_OUTAGE_STAYS_USEFUL && BOUNDED_AI_COMPONENTS_RECIPE_OUTAGE_STAYS_USEFUL, "outage stays useful");
    assert(BOUNDED_AI_COMPONENTS_LIVE_NOT_PERFORMED, "live not performed");
    assert(BOUNDED_AI_COMPONENTS_HOSTED_KEY_OWNER.includes("Eduardo"), "key owner");
    assert(BOUNDED_AI_COMPONENTS_BASE_MAIN_SHA === "be93b972b60a2fd2cefce979146c0ff9406d94f8", "base sha");
    assert(BOUNDED_AI_COMPONENTS_AC.length === 5 && boundedAiComponentsAcEvidence().every((row) => row.covered), "AC covered");
    assert(BOUNDED_AI_COMPONENTS_MAP_PATH.includes("bounded-ai-product-components-map"), "map path");
    assert(BOUNDED_AI_COMPONENTS_FIXTURE.includes("bounded-ai-product-components.fixtures"), "fixture path");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.chatbotSurface === false, "policy chatbot");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.unconstrainedToolExecution === false, "policy tools");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.modelEmitsExecutableCode === false, "policy code");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.modelGeneratesRuntimeUi === false, "policy runtime UI");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.clientHoldsCredential === false, "policy client credential");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.onDeviceTypeSafeModel === false, "policy on-device");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.automaticDistillation === false, "policy distillation");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.modelInventsConstraints === false, "policy invented constraints");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.confidenceAuthorizesAction === false, "policy confidence");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.ambiguityBecomesFact === false, "policy ambiguity");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.outageBreaksProduct === false, "policy outage");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_POLICY.runtimeTypeSafeInOfflineBusinessWithoutScopeDecision === false, "policy offline business");
    assert(BOUNDED_AI_COMPONENTS_RECIPE_NO_DEFAULT_REWRITE, "no default rewrite");
    assert(BOUNDED_AI_COMPONENTS_OWNER_MODULES.includes("contracts/semantic/question-pack.ts"), "question-pack owner");
    assert(BOUNDED_AI_COMPONENTS_OWNER_MODULES.includes("kernel/services/semantic-runtime-safety.ts"), "runtime-safety owner");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!boundedAiComponentsTouchesDefaultIndex(indexSource), "must not touch default workflows index");
  });

  harness.check("bounded-ai-product-components: versioned question pack + policy + recorded model limitations", () => {
    const policy = versionedComponentPolicy();
    assert(policy.buildVersion === "0.221.50", "policy stamped with build");
    assert(policy.packVersion === "0.221.50", "question pack versioned with build");
    assert(policy.packId === "pack.bounded-ai-product-components", "pack id");
    assert(/^[a-f0-9]{64}$/.test(policy.packDigest), "pack content digest");
    assert(BOUNDED_AI_COMPONENTS_QUESTION_PACK.contentDigest === BOUNDED_AI_COMPONENTS_QUESTION_PACK_DIGEST, "pack carries its own digest");
    assert(BOUNDED_AI_COMPONENTS_QUESTION_PACK.questions.length === 2, "two bounded questions");
    assert(
      BOUNDED_AI_COMPONENTS_QUESTION_PACK.questions.every((question) => question.id.startsWith("q.")),
      "question ids",
    );
    const choice = BOUNDED_AI_COMPONENTS_QUESTION_PACK.questions.find((question) => question.kind === "choice")!;
    assert(
      choice.vocabulary.kind === "choice" && choice.vocabulary.options.every((option) => option.id.startsWith("candidate.")),
      "closed candidate vocabulary",
    );
    assert(policy.modelLimitations.length === BOUNDED_AI_COMPONENTS_MODEL_LIMITATIONS.length && policy.modelLimitations.length >= 5, "limitations recorded");
    assert(
      policy.modelLimitations.some((line) => /on-device/i.test(line)),
      "on-device limitation recorded",
    );
    assert(
      policy.modelLimitations.some((line) => /confidence is never authorization/i.test(line)),
      "confidence limitation recorded",
    );
    assert(
      policy.modelLimitations.some((line) => /unknown at build time/i.test(line)),
      "unknown cost/latency recorded honestly",
    );
    assert(PERMITTED_COMPONENT_ACTIONS.length === 6, "six permitted actions");
    assert(ACTION_REJECTION_REASONS.includes("unknown_action") && ACTION_REJECTION_REASONS.includes("model_emitted_code"), "rejection vocabulary");
  });

  harness.check("bounded-ai-product-components: AC1 unrecognized/unsafe action rejected despite confident semantic result", () => {
    const seeded = BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE;
    const unknown = authorizeAction(seeded.unsafeProposedAction, seeded.context);
    assert(seeded.unsafeProposedAction.confidence === 0.99, "semantic result is confident");
    assert(unknown.allowed === false, "unknown action rejected");
    assert(unknown.reasonCode === "unknown_action", "reason is unknown_action");
    assert(unknown.confidenceConsidered === false, "confidence not considered");
    assert(unknown.modelConfidence === 0.99, "confidence recorded but inert");
    assert(!unknown.permittedActions.includes("purchase_equipment" as never), "purchase_equipment is not permitted");

    const fabricated = authorizeAction(seeded.fabricatedActivityAction, seeded.context);
    assert(fabricated.allowed === false && fabricated.reasonCode === "unknown_activity", "activity outside catalog rejected");

    const outOfBounds = authorizeAction(seeded.outOfBoundsAction, seeded.context);
    assert(outOfBounds.allowed === false && outOfBounds.reasonCode === "parameter_out_of_bounds", "45-minute timer rejected by policy bound");

    const smuggledCode = authorizeAction(seeded.codeEmittingAction, seeded.context);
    assert(smuggledCode.allowed === false && smuggledCode.reasonCode === "model_emitted_code", "model-emitted code rejected");

    const permissionGated = authorizeAction({ action: "start_activity_timer", activityId: "act.interval-jumps", confidence: 1 }, seeded.context);
    assert(
      permissionGated.allowed === false && (permissionGated.reasonCode === "missing_permission" || permissionGated.reasonCode === "prerequisite_unmet"),
      `permission/prerequisite gate: ${permissionGated.reasonCode}`,
    );

    // Rejection happens before any effect exists, not after.
    let threw = false;
    try {
      executeAction(seeded.unsafeProposedAction, seeded.context);
    } catch (error) {
      threw = error instanceof Error && /outside the permitted action set/i.test(error.message);
    }
    assert(threw, "executeAction refuses an unpermitted action");

    // And the same rejection holds inside a full run with a confident service.
    const run = runBoundedComponent({
      context: seeded.context,
      utterance: seeded.exactUtterance,
      service: { available: true, latencyMs: 700, result: seeded.semanticAnswer, proposedAction: seeded.unsafeProposedAction },
    });
    assert(run.failure?.code === "unsafe_action_rejected", "run records the rejection");
    assert(!run.executedActions.includes("suggest_activity"), "no suggestion produced from a rejected proposal");
    assert(
      run.executedActions.every((action) => (PERMITTED_COMPONENT_ACTIONS as readonly string[]).includes(action)),
      "every executed action is permitted",
    );
    assert(run.usable, "the user still gets a deterministic plan");
  });

  harness.check("bounded-ai-product-components: AC2 service outage → useful deterministic flow, no client secret", () => {
    const seeded = BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE;
    const run = assessSeededOutageFallback();
    assert(run.mode === "deterministic_fallback", "deterministic fallback mode");
    assert(run.failure?.code === "service_unavailable", "outage recorded honestly");
    assert(run.failure?.fabricatedFacts === false, "no fabricated facts in the fallback");
    assert(run.usable, "flow stays useful");
    assert(run.usage.inferenceCalls === 0, "no inference call attempted while down");
    assert(run.usage.costKnown === false, "unknown cost is not reported as zero");
    assert(run.networkCallsFromClient === 0, "client makes no direct provider call");
    const offline = run.effects.find((effect) => effect.kind === "offline_plan_shown");
    assert(offline !== undefined && offline.kind === "offline_plan_shown", "offline plan shown");
    assert(offline.kind === "offline_plan_shown" && offline.deterministic === true, "offline plan is deterministic");
    assert(offline.kind === "offline_plan_shown" && offline.activityIds.length > 0, "offline plan has real activities");
    // Same inputs, same plan — the fallback is not a coin flip.
    const again = assessSeededOutageFallback();
    assert(JSON.stringify(again.candidateActivityIds) === JSON.stringify(run.candidateActivityIds), "fallback is deterministic across runs");

    const bundle = describeClientBundle();
    assert(bundle.credentialLocation === "server_side_only", "credentials server-side only");
    assert(bundle.clientSecrets.length === 0, "no secret in the shipped client");
    assert(bundle.onDeviceModel === false && bundle.distilledLocalModel === false, "no on-device / distilled model claim");
    assert(bundle.declaredNetworkPurpose.length > 0 && bundle.declaredDataPurpose.length > 0, "network + data purpose declared");
    assert(bundle.endToEndDeadlineMs === BOUNDED_AI_COMPONENTS_RECIPE_POLICY.endToEndDeadlineMs, "E2E deadline declared");
    assert(bundle.maxInferenceCallsPerRequest >= 1 && bundle.maxDailyInferenceCalls > 0, "usage bounded");
    assert(bundle.offlineFlowAvailable === true, "offline flow declared");
    assert(bundle.retention.retentionDays <= 30 && bundle.retention.erasureSupported === true, "minimal retention + erasure");
    assert(bundle.correctionUiHooks.length === CORRECTION_UI_HOOKS.length, "correction UI hooks declared");

    assert(scanClientArtifactsForSecrets(seeded.clientArtifacts).length === 0, "shipped client artifacts carry no credential");
    const planted = scanClientArtifactsForSecrets([...seeded.clientArtifacts, seeded.leakyClientArtifact]);
    assert(planted.length > 0 && planted[0]!.path.includes("typesafeClient"), "the secret scanner actually has teeth");

    const erasure = eraseComponentSession(seeded.sessionStore, "session.paper.529");
    assert(erasure.result.erased === 2 && erasure.result.remaining === 0, "authorized erasure removes the session");
    assert(erasure.store.length === 1, "other sessions untouched");
    assert(erasure.result.cascade.includes("session.inferenceReceipt"), "erasure cascades to the receipt");
  });

  harness.check("bounded-ai-product-components: AC3 interpretation inspectable/correctable; ambiguity never becomes a fact", () => {
    const seeded = BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE;
    const record = interpretConstraints({ sessionId: seeded.context.sessionId, utterance: seeded.ambiguousUtterance });
    assert(record.inspectable && record.correctable, "interpretation is inspectable and correctable");
    assert(record.slots.length === 3, "all three material slots surfaced");
    assert(
      record.slots.every((entry) => entry.fabricated === false),
      "no slot is fabricated",
    );
    const duration = record.slots.find((entry) => entry.slot === "maxDurationMinutes")!;
    assert(duration.outcome === "ambiguous_ask", '"a few minutes" is ambiguous');
    assert(duration.value === null, "no minute count invented");
    assert(duration.clarifyingQuestion !== null && /how many minutes/i.test(duration.clarifyingQuestion), "asks for the number");
    assert(duration.sourcePhrase !== null, "cites the phrase it could not resolve");
    const equipment = record.slots.find((entry) => entry.slot === "availableEquipment")!;
    assert(equipment.outcome === "ambiguous_ask" && equipment.value === null, '"maybe a mat" is ambiguous, not an owned mat');
    const noise = record.slots.find((entry) => entry.slot === "maxNoiseLevel")!;
    assert(noise.outcome === "exact" && noise.value === "quiet", '"keep it down" resolves exactly');

    const predicates = projectPredicates(record);
    assert(predicates.maxDurationMinutes === null, "ambiguous duration never becomes a filter value");
    assert(predicates.availableEquipment === null, "ambiguous equipment never becomes a filter value");
    assert(predicates.maxNoiseLevel === "quiet", "exact noise becomes a predicate");
    assert(predicates.invented === false, "nothing invented");
    assert(predicates.unresolvedSlots.length === 2 && predicates.clarifyingQuestions.length === 2, "two open questions");

    // Gear outside the catalog vocabulary is asked about, never remapped.
    const outOfVocabulary = interpretConstraints({ sessionId: seeded.context.sessionId, utterance: seeded.outOfVocabularyUtterance });
    const gear = outOfVocabulary.slots.find((entry) => entry.slot === "availableEquipment")!;
    assert(gear.outcome === "ambiguous_ask" && gear.value === null, "kettlebell is not silently mapped to a known kind");
    assert(gear.clarifyingQuestion !== null && /kettlebell/i.test(gear.clarifyingQuestion), "asks about the unknown gear");
    const outOfVocabularyDuration = outOfVocabulary.slots.find((entry) => entry.slot === "maxDurationMinutes")!;
    assert(outOfVocabularyDuration.outcome === "exact" && outOfVocabularyDuration.value === 10, "the stated quantity is parsed exactly");

    // The user corrects the material interpretation and the plan re-derives.
    const corrected = applyInterpretationCorrection(record, { slot: "maxDurationMinutes", value: 10, correctedAtIso: "2026-09-20T06:05:00.000Z" });
    assert(corrected.corrections.length === 1 && corrected.corrections[0]!.correctedBy === "user", "correction recorded with provenance");
    assert(corrected.corrections[0]!.fromOutcome === "ambiguous_ask" && corrected.corrections[0]!.toValue === 10, "correction audit trail");
    const correctedPredicates = projectPredicates(corrected);
    assert(correctedPredicates.maxDurationMinutes === 10, "corrected slot becomes a predicate");
    assert(correctedPredicates.unresolvedSlots.length === 1, "one question remains open");
    const before = filterActivities(seeded.context.catalog, predicates, seeded.context);
    const after = filterActivities(seeded.context.catalog, correctedPredicates, seeded.context);
    assert(after.length <= before.length, "the correction actually narrows the plan");
    assert(
      after.every((activity) => activity.durationMinutes <= 10),
      "corrected constraint is enforced",
    );
    const effect = executeAction({ action: "record_interpretation_correction" }, seeded.context, {
      correction: { slot: "maxDurationMinutes", toValue: 10 },
    });
    assert(effect.kind === "interpretation_corrected" && effect.toValue === 10, "correction is a permitted, executed action");

    // A correction outside the domain vocabulary is refused rather than absorbed.
    let refused = false;
    try {
      applyInterpretationCorrection(record, { slot: "availableEquipment", value: ["kettlebell"] as never, correctedAtIso: "2026-09-20T06:06:00.000Z" });
    } catch (error) {
      refused = error instanceof Error && /equipment vocabulary/i.test(error.message);
    }
    assert(refused, "corrections stay inside the catalog vocabulary");
  });

  harness.check("bounded-ai-product-components: AC4 bounded control flow + actual permitted actions (not JSON validity)", () => {
    const seeded = BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE;
    const run = assessSeededBoundedComponent();
    assert(run.mode === "online_semantic" && run.failure === null, "happy path completes");
    assert(run.usage.inferenceCalls <= run.usage.maxInferenceCallsPerRequest, "inference calls bounded");
    assert(run.usage.withinDeadline, "within the end-to-end deadline");
    assert(run.candidateActivityIds.length <= BOUNDED_AI_COMPONENTS_RECIPE_POLICY.maxCandidateActivities, "candidate set bounded");
    assert(JSON.stringify(run.candidateActivityIds) === JSON.stringify(["act.guided-cooldown", "act.wall-mobility"]), "deterministic candidate set");
    assert(
      run.executedActions.every((action) => (PERMITTED_COMPONENT_ACTIONS as readonly string[]).includes(action)),
      "executed actions ⊆ permitted actions",
    );
    const suggested = run.effects.find((effect) => effect.kind === "activity_suggested");
    assert(suggested !== undefined && suggested.kind === "activity_suggested" && suggested.activityId === "act.wall-mobility", "a real suggestion landed");
    assert(
      suggested.kind === "activity_suggested" && suggested.durationMinutes === 7 && suggested.durationSource === "catalog",
      "duration comes from the catalog",
    );

    // A structurally valid, schema-parsed answer that points outside the
    // deterministic candidate set still produces no suggestion.
    const offCandidate = runBoundedComponent({
      context: seeded.context,
      utterance: seeded.exactUtterance,
      service: { available: true, latencyMs: 800, result: seeded.semanticAnswer, proposedActivityId: "act.mat-flow" },
    });
    assert(offCandidate.failure?.code === "unsafe_action_rejected", "off-candidate selection rejected");
    assert(!offCandidate.executedActions.includes("suggest_activity"), "valid JSON is not enough to act");
    assert(offCandidate.mode === "deterministic_fallback" && offCandidate.usable, "and the user still gets a plan");

    // The executed timer effect uses the catalog duration, not the model's number.
    const timer = executeAction({ action: "start_activity_timer", activityId: "act.mat-flow", durationMinutes: 25, confidence: 0.99 }, seeded.context);
    assert(timer.kind === "timer_started" && timer.activityId === "act.mat-flow", "timer started for the catalog activity");
    assert(timer.kind === "timer_started" && timer.durationMinutes === 12 && timer.durationSource === "catalog", "model's 25 minutes never reaches the effect");

    // Every declared failure mode has a tested, fact-free path.
    const cancelled = runBoundedComponent({
      context: seeded.context,
      utterance: seeded.exactUtterance,
      service: { available: true, latencyMs: 200, cancelled: true, result: seeded.semanticAnswer },
    });
    assert(cancelled.failure?.code === "cancelled" && cancelled.mode === "deterministic_fallback" && cancelled.usable, "cancellation");
    const partial = runBoundedComponent({
      context: seeded.context,
      utterance: seeded.exactUtterance,
      service: { available: true, latencyMs: 300, partial: true, result: seeded.semanticAnswer },
    });
    assert(partial.failure?.code === "partial_inference" && partial.usable, "partial inference");
    const slow = runBoundedComponent({
      context: seeded.context,
      utterance: seeded.exactUtterance,
      service: { available: true, latencyMs: 9000, result: seeded.semanticAnswer, proposedActivityId: "act.wall-mobility" },
    });
    assert(slow.failure?.code === "deadline_exceeded" && slow.usage.withinDeadline === false, "deadline exceeded");
    const stale = runBoundedComponent({
      context: seeded.staleContext,
      utterance: seeded.exactUtterance,
      service: { available: true, latencyMs: 400, result: seeded.semanticAnswer, proposedActivityId: "act.wall-mobility" },
    });
    assert(catalogFreshness(seeded.staleContext.catalog, seeded.staleContext.nowIso) === "stale", "catalog is stale");
    assert(stale.failure?.code === "stale_catalog" && stale.usable, "stale catalog keeps the last-known plan");
    const staleTimer = authorizeAction({ action: "start_activity_timer", activityId: "act.mat-flow", confidence: 1 }, seeded.staleContext);
    assert(staleTimer.allowed === false && staleTimer.reasonCode === "stale_catalog", "timers blocked while stale");
    const missing = runBoundedComponent({
      context: seeded.emptyCatalogContext,
      utterance: seeded.exactUtterance,
      service: { available: true, latencyMs: 100, result: seeded.semanticAnswer },
    });
    assert(missing.failure?.code === "missing_catalog_data" && missing.usable === false, "missing data is admitted, not filled in");
    assert(missing.effects.length === 0, "no effect invented from an empty catalog");
    const foreign = runBoundedComponent({
      context: seeded.context,
      utterance: "tengo diez minutos y una colchoneta",
      language: "es",
      service: { available: true, latencyMs: 100, result: seeded.semanticAnswer },
    });
    assert(foreign.failure?.code === "unsupported_language", "unsupported language reported");
    assert(foreign.interpretation === null && foreign.predicates === null, "no interpretation invented for an unsupported language");
    assert(foreign.usable && foreign.candidateActivityIds.length > 0, "structured deterministic flow still works");
    const allCodes = [cancelled, partial, slow, stale, missing, foreign].map((result) => result.failure!.code);
    assert(
      allCodes.every((code) => (COMPONENT_FAILURE_CODES as readonly string[]).includes(code)),
      "failure codes come from the declared vocabulary",
    );
    assert(
      [cancelled, partial, slow, stale, missing, foreign].every((result) => result.failure!.fabricatedFacts === false),
      "no failure mode fabricates facts",
    );
  });

  harness.check("bounded-ai-product-components: AC5 no runtime TypeSafe call in TUCK or an existing offline business", () => {
    const seeded = BOUNDED_AI_COMPONENTS_SEEDED_FIXTURE;
    const guard = assertNoRuntimeTypeSafeInOfflineBusiness(seeded.offlineBusinesses);
    assert(guard.allowed === true && guard.blocked.length === 0, "TUCK keeps its accepted offline contract");
    assert(guard.inventedScopeDecision === false, "no scope decision invented");
    assert(/TUCK/i.test(guard.reason), "reason names TUCK");
    const blocked = assertNoRuntimeTypeSafeInOfflineBusiness(seeded.unscopedOfflineBusinesses);
    assert(blocked.allowed === false && blocked.blocked.includes("tuck"), "an unscoped runtime call into TUCK is blocked");
    assert(blocked.inventedScopeDecision === false, "still no invented decision");
    const scoped = assertNoRuntimeTypeSafeInOfflineBusiness([
      { businessId: "tuck", offline: true, runtimeTypeSafeCall: true, scopeDecisionId: "decision.hoe.001" },
    ]);
    assert(scoped.allowed === true, "an explicit scope decision is the only way through");

    // Source-level proof: no offline-business fixture references this component.
    const offlineSources = walkSources(path.join(skillRoot, "examples/tuck")).filter((file) => /\.(ts|tsx|json|ya?ml|md)$/.test(file));
    assert(offlineSources.length > 0, "TUCK example sources present");
    const referencing = offlineSources.filter((file) => boundedAiComponentsReferencedInOfflineBusinessSource(readFileSync(file, "utf8")));
    assert(referencing.length === 0, `no TUCK source references the bounded component: ${referencing.join(", ")}`);
  });
}
