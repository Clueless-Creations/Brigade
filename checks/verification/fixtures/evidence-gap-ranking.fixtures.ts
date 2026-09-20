/**
 * #524 SQ-12 — Evidence-gap / decision-impact ranking fixtures (paper; synthetic; no-network).
 *
 * Proves all five Acceptance criteria + tip stamps / hard bans.
 * Import identifiers are locked to the live module exports.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  EVIDENCE_GAP_ACTION_CLASS_MAP,
  EVIDENCE_GAP_CANDIDATE_ACTIONS,
  EVIDENCE_GAP_KINDS,
  EVIDENCE_GAP_RANKING_OWNER_MODULES,
  EVIDENCE_GAP_RANKING_RECIPE_CONSUMES,
  EVIDENCE_GAP_RANKING_RECIPE_EPIC,
  EVIDENCE_GAP_RANKING_RECIPE_INFO_VALUE_IS_HEURISTIC,
  EVIDENCE_GAP_RANKING_RECIPE_ISSUE,
  EVIDENCE_GAP_RANKING_RECIPE_NEXT_AFTER_CLOSE,
  EVIDENCE_GAP_RANKING_RECIPE_NO_524_IMPL,
  EVIDENCE_GAP_RANKING_RECIPE_NO_DEFAULT_REWRITE,
  EVIDENCE_GAP_RANKING_RECIPE_NO_NETWORK,
  EVIDENCE_GAP_RANKING_RECIPE_NO_NEW_PLANNER,
  EVIDENCE_GAP_RANKING_RECIPE_PLANNING_ID,
  EVIDENCE_GAP_RANKING_RECIPE_POLICY,
  EVIDENCE_GAP_RANKING_RECIPE_STAMP,
  evidenceGapRankingTouchesDefaultIndex,
} from "../../../catalog/workflows/evidence-gap-ranking.js";
import {
  EVIDENCE_GAP_RANKING_AC,
  EVIDENCE_GAP_RANKING_BASE_MAIN_SHA,
  EVIDENCE_GAP_RANKING_CONSUMES,
  EVIDENCE_GAP_RANKING_EPIC,
  EVIDENCE_GAP_RANKING_FIXTURE,
  EVIDENCE_GAP_RANKING_HOSTED_KEY_OWNER,
  EVIDENCE_GAP_RANKING_INFO_VALUE_IS_HEURISTIC,
  EVIDENCE_GAP_RANKING_IOS_SIM_OOS,
  EVIDENCE_GAP_RANKING_ISSUE,
  EVIDENCE_GAP_RANKING_LIVE_NOT_PERFORMED,
  EVIDENCE_GAP_RANKING_MAP_PATH,
  EVIDENCE_GAP_RANKING_NEXT_AFTER_CLOSE,
  EVIDENCE_GAP_RANKING_NO_524_IMPL,
  EVIDENCE_GAP_RANKING_NO_AUTHORITY_REORDER,
  EVIDENCE_GAP_RANKING_NO_AUTO_APPROVAL,
  EVIDENCE_GAP_RANKING_NO_FOUNDER_QUESTION_COUNT_CHANGE,
  EVIDENCE_GAP_RANKING_NO_INFERRED_PREFERENCES,
  EVIDENCE_GAP_RANKING_NO_NETWORK,
  EVIDENCE_GAP_RANKING_NO_NEW_PLANNER,
  EVIDENCE_GAP_RANKING_PLANNING_ID,
  EVIDENCE_GAP_RANKING_STAMP,
  evidenceGapRankingAcEvidence,
} from "../../../catalog/providers/evidence-gap-ranking-map.js";
import {
  EVIDENCE_GAP_RANKING_CONSUMES as SERVICE_CONSUMES,
  EVIDENCE_GAP_RANKING_EPIC as SERVICE_EPIC,
  EVIDENCE_GAP_RANKING_INFO_VALUE_IS_HEURISTIC as SERVICE_HEURISTIC,
  EVIDENCE_GAP_RANKING_ISSUE as SERVICE_ISSUE,
  EVIDENCE_GAP_RANKING_NEXT_AFTER_CLOSE as SERVICE_NEXT_AFTER,
  EVIDENCE_GAP_RANKING_NO_524_IMPL as SERVICE_NO_524,
  EVIDENCE_GAP_RANKING_NO_AUTHORITY_REORDER as SERVICE_NO_AUTH_REORDER,
  EVIDENCE_GAP_RANKING_NO_AUTO_APPROVAL as SERVICE_NO_AUTO,
  EVIDENCE_GAP_RANKING_NO_FOUNDER_QUESTION_COUNT_CHANGE as SERVICE_NO_FQ,
  EVIDENCE_GAP_RANKING_NO_INFERRED_PREFERENCES as SERVICE_NO_PREF,
  EVIDENCE_GAP_RANKING_NO_NETWORK as SERVICE_NO_NETWORK,
  EVIDENCE_GAP_RANKING_NO_NEW_PLANNER as SERVICE_NO_PLANNER,
  EVIDENCE_GAP_RANKING_STAMP as SERVICE_STAMP,
  StoredEvidenceGapLedger,
  candidateActionsDistinguishObservationFromRetrieval,
  conflictingEvidenceIsLegible,
  mapGapToActionClass,
  mapGapToCandidateAction,
  orderReadyByEvidenceGaps,
  questionAppliesToCurrentRevision,
  rankEligibleWork,
  summarizeObservationalUsefulness,
  type EligibleRankingCandidate,
  type EvidenceGapRankingFactors,
  type StoredEvidenceGapAssessment,
} from "../../../kernel/services/evidence-gap-ranking.js";

function factors(overrides: Partial<EvidenceGapRankingFactors> = {}): EvidenceGapRankingFactors {
  return {
    dependencyImpact: 0.2,
    blockedDownstreamNodeIds: [],
    reversibility: "reversible",
    costBound: { maxCredits: 1, maxLatencyMs: 100 },
    decisionSensitive: false,
    heuristicInfoValue: 0.5,
    heuristicInfoValueExplanation: "Labeled heuristic for fixture purposes only.",
    ...overrides,
  };
}

function eligible(overrides: Partial<EligibleRankingCandidate> & Pick<EligibleRankingCandidate, "nodeId">): EligibleRankingCandidate {
  return {
    priorityClass: "P2",
    eligible: true,
    requiresFounderApproval: false,
    ...overrides,
  };
}

function assessment(
  overrides: Partial<StoredEvidenceGapAssessment> & Pick<StoredEvidenceGapAssessment, "nodeId" | "assessmentId">,
): StoredEvidenceGapAssessment {
  return {
    priorityClass: "P2",
    eligible: true,
    requiresFounderApproval: false,
    gapKind: "source_not_retrieved",
    factors: factors(),
    appliesToRevision: "rev-1",
    sourceRevisions: [{ sourceId: "src.main", revision: "rev-1" }],
    conflictingEvidence: [],
    recordedAt: "2026-09-20T00:00:00.000Z",
    ...overrides,
  };
}

export function register(harness: Harness): void {
  harness.check("evidence-gap-ranking: stamp/issue/consumes + AC map + hard bans + NO_524 cleared", () => {
    assert(EVIDENCE_GAP_RANKING_ISSUE === "#524", "map issue");
    assert(SERVICE_ISSUE === "#524", "service issue");
    assert(EVIDENCE_GAP_RANKING_RECIPE_ISSUE === "#524", "recipe issue");
    assert(EVIDENCE_GAP_RANKING_EPIC === "#511" && SERVICE_EPIC === "#511" && EVIDENCE_GAP_RANKING_RECIPE_EPIC === "#511", "epic");
    assert(EVIDENCE_GAP_RANKING_PLANNING_ID === "SQ-12" && EVIDENCE_GAP_RANKING_RECIPE_PLANNING_ID === "SQ-12", "planning id");
    assert(EVIDENCE_GAP_RANKING_STAMP === "0.221.45" && SERVICE_STAMP === "0.221.45" && EVIDENCE_GAP_RANKING_RECIPE_STAMP === "0.221.45", "stamp");
    assert(EVIDENCE_GAP_RANKING_NO_524_IMPL === false && SERVICE_NO_524 === false && EVIDENCE_GAP_RANKING_RECIPE_NO_524_IMPL === false, "NO_524 cleared");
    assert(
      EVIDENCE_GAP_RANKING_NEXT_AFTER_CLOSE === "#525" && SERVICE_NEXT_AFTER === "#525" && EVIDENCE_GAP_RANKING_RECIPE_NEXT_AFTER_CLOSE === "#525",
      "NEXT_AFTER=#525",
    );
    assert(JSON.stringify([...EVIDENCE_GAP_RANKING_CONSUMES]) === JSON.stringify(["#522", "#523"]), "map consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === JSON.stringify(["#522", "#523"]), "service consumes");
    assert(JSON.stringify([...EVIDENCE_GAP_RANKING_RECIPE_CONSUMES]) === JSON.stringify(["#522", "#523"]), "recipe consumes");
    assert(EVIDENCE_GAP_RANKING_NO_NETWORK && SERVICE_NO_NETWORK && EVIDENCE_GAP_RANKING_RECIPE_NO_NETWORK, "no network");
    assert(EVIDENCE_GAP_RANKING_NO_NEW_PLANNER && SERVICE_NO_PLANNER && EVIDENCE_GAP_RANKING_RECIPE_NO_NEW_PLANNER, "no new planner");
    assert(EVIDENCE_GAP_RANKING_NO_AUTHORITY_REORDER && SERVICE_NO_AUTH_REORDER, "no authority reorder");
    assert(EVIDENCE_GAP_RANKING_NO_FOUNDER_QUESTION_COUNT_CHANGE && SERVICE_NO_FQ, "no founder-question count change");
    assert(EVIDENCE_GAP_RANKING_NO_AUTO_APPROVAL && SERVICE_NO_AUTO, "no auto approval");
    assert(EVIDENCE_GAP_RANKING_NO_INFERRED_PREFERENCES && SERVICE_NO_PREF, "no inferred preferences");
    assert(EVIDENCE_GAP_RANKING_INFO_VALUE_IS_HEURISTIC && SERVICE_HEURISTIC && EVIDENCE_GAP_RANKING_RECIPE_INFO_VALUE_IS_HEURISTIC, "info value heuristic");
    assert(EVIDENCE_GAP_RANKING_RECIPE_NO_DEFAULT_REWRITE, "no default rewrite");
    assert(EVIDENCE_GAP_RANKING_LIVE_NOT_PERFORMED && EVIDENCE_GAP_RANKING_IOS_SIM_OOS, "live/ios oos");
    assert(EVIDENCE_GAP_RANKING_HOSTED_KEY_OWNER.includes("Eduardo"), "key owner");
    assert(EVIDENCE_GAP_RANKING_BASE_MAIN_SHA.length === 40, "base sha");
    assert(EVIDENCE_GAP_RANKING_AC.length === 5 && evidenceGapRankingAcEvidence().every((row) => row.covered), "AC covered");
    assert(EVIDENCE_GAP_RANKING_MAP_PATH.includes("evidence-gap-ranking-map"), "map path");
    assert(EVIDENCE_GAP_RANKING_FIXTURE.includes("evidence-gap-ranking.fixtures"), "fixture path");
    assert(EVIDENCE_GAP_KINDS.length === 4, "gap kinds");
    assert(EVIDENCE_GAP_RANKING_RECIPE_POLICY.heuristicInfoValueExplanation.includes("heuristic"), "heuristic explanation");
    assert(EVIDENCE_GAP_RANKING_RECIPE_POLICY.outrankFounderApproval === false, "founder supremacy policy");
    assert(EVIDENCE_GAP_RANKING_RECIPE_POLICY.maxLiveFounderQuestions === 1, "at most one founder question");
    assert(EVIDENCE_GAP_RANKING_OWNER_MODULES.includes("kernel/session/plan.ts"), "plan owner");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!evidenceGapRankingTouchesDefaultIndex(indexSource), "must not touch default workflows index");
  });

  harness.check("evidence-gap-ranking: AC1 equal-eligible diverge on blocking gap; explanation names downstream", () => {
    const result = rankEligibleWork([
      eligible({
        nodeId: "step.busy-observe",
        gapKind: "observation_required",
        factors: factors({ dependencyImpact: 0.1, heuristicInfoValue: 0.95 }),
      }),
      eligible({
        nodeId: "step.retrieve-blocker",
        gapKind: "source_not_retrieved",
        factors: factors({
          dependencyImpact: 0.95,
          blockedDownstreamNodeIds: ["step.decision-gate"],
          heuristicInfoValue: 0.3,
          decisionSensitive: true,
        }),
      }),
    ]);
    const first = result.ranked[0]!;
    assert(result.orderedNodeIds[0] === "step.retrieve-blocker", "gap closer ranks first");
    assert(result.orderedNodeIds[1] === "step.busy-observe", "busywork second");
    assert(first.explanation.includes("step.decision-gate"), "explanation names downstream dependency");
    assert(first.explanation.includes("source_not_retrieved"), "explanation names gap kind");
    assert(first.heuristic.labeledHeuristic === true, "heuristic labeled");
    assert(result.providerRequests === 0 && result.networkCalls === 0 && result.cacheRefreshed === false, "zero network");
  });

  harness.check("evidence-gap-ranking: AC2 founder approval wins over high info-gain", () => {
    const result = rankEligibleWork([
      eligible({
        nodeId: "step.high-info",
        gapKind: "observation_required",
        factors: factors({
          dependencyImpact: 1,
          blockedDownstreamNodeIds: ["step.lots"],
          heuristicInfoValue: 1,
          decisionSensitive: true,
        }),
      }),
      eligible({
        nodeId: "step.needs-founder",
        requiresFounderApproval: true,
        gapKind: "founder_preference",
        factors: factors({ dependencyImpact: 0.1, heuristicInfoValue: 0.1 }),
      }),
    ]);
    const winner = result.ranked[0]!;
    assert(result.orderedNodeIds[0] === "step.needs-founder", "founder approval wins");
    assert(winner.requiresFounderApproval, "winner requires founder");
    assert(winner.explanation.toLowerCase().includes("founder"), "explanation mentions founder");
    assert(result.orderedNodeIds[1] === "step.high-info", "high info-gain second");
  });

  harness.check("evidence-gap-ranking: AC3 missing observation vs missing retrieval → different candidate actions", () => {
    assert(candidateActionsDistinguishObservationFromRetrieval(), "candidate actions distinguish");
    assert(mapGapToCandidateAction("observation_required") === "produce_new_observation", "observation action");
    assert(mapGapToCandidateAction("source_not_retrieved") === "retrieve_existing_source", "retrieval action");
    const observationAction = mapGapToCandidateAction("observation_required");
    const retrievalAction = mapGapToCandidateAction("source_not_retrieved");
    assert(observationAction !== retrievalAction, "distinct");
    assert(mapGapToActionClass("observation_required") === "observe", "observation maps to observe");
    assert(mapGapToActionClass("source_not_retrieved") === "observe", "retrieval maps to observe");
    assert(mapGapToActionClass("founder_preference") === "draft", "founder preference maps to draft");
    assert(String(EVIDENCE_GAP_CANDIDATE_ACTIONS.observation_required) !== String(EVIDENCE_GAP_CANDIDATE_ACTIONS.source_not_retrieved), "recipe distinct");
    assert(EVIDENCE_GAP_ACTION_CLASS_MAP.evidence_conflict === "observe", "conflict maps to observe");
  });

  harness.check("evidence-gap-ranking: AC4 repeated plan ranking → zero workspace/provider delta", () => {
    const ledger = new StoredEvidenceGapLedger();
    ledger.put(
      assessment({
        assessmentId: "a1",
        nodeId: "step.a",
        gapKind: "source_not_retrieved",
        factors: factors({ dependencyImpact: 0.8, blockedDownstreamNodeIds: ["step.b"] }),
      }),
    );
    ledger.put(
      assessment({
        assessmentId: "a2",
        nodeId: "step.c",
        gapKind: "observation_required",
        factors: factors({ dependencyImpact: 0.2, heuristicInfoValue: 0.9 }),
      }),
    );
    const priorityClassByNodeId = new Map([
      ["step.a", "P2"],
      ["step.c", "P2"],
    ]);
    const revisions = [{ sourceId: "src.main", revision: "rev-1" }];
    const first = orderReadyByEvidenceGaps({
      readyNodeIds: ["step.c", "step.a"],
      priorityClassByNodeId,
      ledger,
      currentSourceRevisions: revisions,
    });
    const second = orderReadyByEvidenceGaps({
      readyNodeIds: ["step.c", "step.a"],
      priorityClassByNodeId,
      ledger,
      currentSourceRevisions: revisions,
    });
    assert(JSON.stringify(first.orderedNodeIds) === JSON.stringify(second.orderedNodeIds), "stable order");
    assert(first.providerRequests === 0 && second.providerRequests === 0, "provider requests unchanged at 0");
    assert(first.networkCalls === 0 && second.networkCalls === 0, "network calls unchanged at 0");
    assert(first.cacheRefreshed === false && second.cacheRefreshed === false, "no cache refresh");
    const readA = ledger.readForPlan("step.a", revisions);
    assert(readA.providerRequests === 0 && readA.networkCalls === 0 && readA.cacheRefreshed === false, "ledger read zero-network");
    assert(first.orderedNodeIds[0] === "step.a", "blocking retrieval still first after repeat");
  });

  harness.check("evidence-gap-ranking: AC5 source change invalidates; contradictory evidence stays legible", () => {
    const ledger = new StoredEvidenceGapLedger();
    ledger.put(
      assessment({
        assessmentId: "conflict-1",
        nodeId: "step.conflict",
        gapKind: "evidence_conflict",
        factors: factors({ dependencyImpact: 0.7, decisionSensitive: true }),
        conflictingEvidence: [
          { evidenceId: "e1", interpretation: "Metric rose after change A", sourceId: "src.main", revision: "rev-1" },
          { evidenceId: "e2", interpretation: "Metric fell after change A", sourceId: "src.main", revision: "rev-1" },
        ],
      }),
    );
    const current = ledger.readForPlan("step.conflict", [{ sourceId: "src.main", revision: "rev-1" }]);
    assert(current.status === "current", "current at rev-1");
    assert(questionAppliesToCurrentRevision(current.assessment?.appliesToRevision, "rev-1"), "applies at rev-1");
    const legible = conflictingEvidenceIsLegible(current.assessment!.conflictingEvidence);
    assert(legible.legible, "conflicts legible");
    assert(legible.collapsedToSingleConfidence === false, "not collapsed to one confidence");
    assert(legible.count === 2, "two interpretations retained");

    const stale = ledger.readForPlan("step.conflict", [{ sourceId: "src.main", revision: "rev-2" }]);
    assert(stale.status === "stale", "stale after source change");
    assert(!questionAppliesToCurrentRevision(stale.assessment?.appliesToRevision, "rev-2"), "question invalidated on source change");

    const rankedStale = orderReadyByEvidenceGaps({
      readyNodeIds: ["step.conflict"],
      priorityClassByNodeId: new Map([["step.conflict", "P2"]]),
      ledger,
      currentSourceRevisions: [{ sourceId: "src.main", revision: "rev-2" }],
    });
    const staleRanked = rankedStale.ranked[0]!;
    assert(staleRanked.assessmentStatus === "stale", "ranked as stale");
    assert(staleRanked.explanation.includes("stale") || staleRanked.explanation.includes("invalidated"), "stale explanation");
  });

  harness.check("evidence-gap-ranking: never promote across priority class; ineligible refused", () => {
    const result = rankEligibleWork([
      eligible({
        nodeId: "step.p2-high",
        priorityClass: "P2",
        factors: factors({ dependencyImpact: 1, heuristicInfoValue: 1, blockedDownstreamNodeIds: ["x"] }),
      }),
      eligible({
        nodeId: "step.p1-low",
        priorityClass: "P1",
        factors: factors({ dependencyImpact: 0.01, heuristicInfoValue: 0.01 }),
      }),
    ]);
    assert(result.orderedNodeIds.includes("step.p2-high") && result.orderedNodeIds.includes("step.p1-low"), "both present");
    assert(result.orderedNodeIds.indexOf("step.p2-high") < result.orderedNodeIds.indexOf("step.p1-low"), "encounter-order classes preserved");

    let threw = false;
    try {
      // @ts-expect-error intentional ineligible
      rankEligibleWork([{ nodeId: "bad", priorityClass: "P2", eligible: false, requiresFounderApproval: false }]);
    } catch (error) {
      threw = error instanceof Error;
    }
    assert(threw, "ineligible input refused");
  });

  harness.check("evidence-gap-ranking: observational usefulness separate from ranking correctness", () => {
    const summary = summarizeObservationalUsefulness([
      { trialId: "t1", selectedNodeId: "step.retrieve-blocker", reworkDelta: -2, founderEffortDelta: -1, notes: "less rework" },
      { trialId: "t2", selectedNodeId: "step.retrieve-blocker", reworkDelta: -1, founderEffortDelta: 0, notes: "stable" },
    ]);
    assert(summary.separateFromRankingCorrectness === true, "separated");
    assert(summary.trialCount === 2, "trial count");
    assert(summary.meanReworkDelta === -1.5, "mean rework");
  });
}
