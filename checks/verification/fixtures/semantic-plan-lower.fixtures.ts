/**
 * #516 SQ-05 — semantic query plan lowering fixtures (compile-pure; no network).
 *
 * Proves all five Acceptance criteria:
 * 1. Four independent branch checks → one assessment stage
 * 2. Data-dependent candidates retain a necessary second stage
 * 3. Unauthorized branch cannot speculative-share state
 * 4. Cycles / dangling refs / incompatible types / unbounded fan-out fail before execution
 * 5. Equivalent pinned inputs → byte-stable plans; explain estimates ≠ observed latency/spend
 */
import {
  digestOf,
  parseSemanticQueryPlan,
  withQuestionPackContentDigest,
  type QuestionPack,
  type SemanticQueryPlan,
} from "../../../contracts/semantic/index.js";
import {
  SEMANTIC_PLAN_LOWER_CONSUMES,
  SEMANTIC_PLAN_LOWER_EPIC,
  SEMANTIC_PLAN_LOWER_ISSUE,
  SEMANTIC_PLAN_LOWER_STAMP,
  assertCompilePurity,
  canSpeculativeShare,
  compileSemanticQueryPlan,
  tryCompileSemanticQueryPlan,
  type DeclaredProviderCoverage,
  type SemanticPlanCompileInput,
} from "../../../kernel/composition/semantic-plan-lower.js";
import { SEMANTIC_PLAN_LOWER_AC, SEMANTIC_PLAN_LOWER_MAP_PATH, semanticPlanLowerAcEvidence } from "../../../catalog/providers/semantic-plan-lower-map.js";
import { assert, type Harness } from "./_harness.js";

const PROVIDER: DeclaredProviderCoverage = {
  bindingId: "typesafe/systemone",
  operation: "semantic-assessment/systemone",
  coverage: "declared",
};

function samplePack(): QuestionPack {
  return withQuestionPackContentDigest({
    schemaVersion: 1,
    id: "pack.feedback.lower",
    version: "1.0.0",
    title: "Feedback lower",
    instructions: "Assess branch hypotheses about a payment surprise after long setup.",
    questions: [
      {
        id: "q.onboarding-effort",
        kind: "noul",
        instruction: "Was onboarding effort the primary cause?",
        statePaths: ["observation.summary"],
        vocabulary: { kind: "noul", proposition: "Onboarding effort caused the surprise." },
      },
      {
        id: "q.offer-expectation",
        kind: "noul",
        instruction: "Was offer expectation mismatched?",
        statePaths: ["observation.summary"],
        vocabulary: { kind: "noul", proposition: "Offer expectation was mismatched." },
      },
      {
        id: "q.implementation-mismatch",
        kind: "noul",
        instruction: "Was implementation mismatched?",
        statePaths: ["observation.summary"],
        vocabulary: { kind: "noul", proposition: "Implementation mismatched the promise." },
      },
      {
        id: "q.wrong-audience",
        kind: "noul",
        instruction: "Was this the wrong audience?",
        statePaths: ["observation.summary"],
        vocabulary: { kind: "noul", proposition: "Wrong audience fit." },
      },
      {
        id: "q.severity",
        kind: "score",
        instruction: "How severe is the impact?",
        statePaths: ["observation.summary"],
        vocabulary: {
          kind: "score",
          levels: [
            { level: 1, label: "low" },
            { level: 2, label: "medium" },
            { level: 3, label: "high" },
          ],
        },
      },
      {
        id: "q.route",
        kind: "choice",
        instruction: "Which next action fits?",
        statePaths: ["observation.summary", "candidate.journey"],
        vocabulary: {
          kind: "choice",
          options: [
            { id: "observe", label: "Gather more evidence" },
            { id: "repair", label: "Propose a reversible repair" },
            { id: "none", label: "No action" },
          ],
        },
      },
    ],
    projections: [
      { id: "proj.main", statePaths: ["observation.summary"], required: true },
      { id: "proj.journey", statePaths: ["observation.summary", "candidate.journey"], required: true },
    ],
  });
}

function baseMeta(pack: QuestionPack) {
  return {
    schemaVersion: 1 as const,
    questionPackId: pack.id,
    questionPackVersion: pack.version,
    questionPackDigest: pack.contentDigest!,
    projectionDigest: digestOf(pack.projections),
    sourceRevisions: [{ sourceId: "src.reports", revision: "rev-a" }],
    canonicalizationVersion: 1 as const,
  };
}

/** AC1: four independent branch assesses sharing one project — one assessment stage. */
function fourBranchPlan(pack: QuestionPack): SemanticQueryPlan {
  return parseSemanticQueryPlan({
    ...baseMeta(pack),
    id: "plan.four-branch",
    steps: [
      { id: "s.select", operator: "select", support: "initial-slice", sourceScope: ["src.reports"] },
      { id: "s.project", operator: "project", support: "initial-slice", projectionRef: "proj.main" },
      { id: "s.assess.onboarding", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
      { id: "s.assess.offer", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
      { id: "s.assess.impl", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
      { id: "s.assess.audience", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
      { id: "s.reduce", operator: "reduce", support: "initial-slice" },
      { id: "s.propose", operator: "proposeWork", support: "initial-slice" },
    ],
    edges: [
      { kind: "data", fromStepId: "s.select", toStepId: "s.project" },
      { kind: "data", fromStepId: "s.project", toStepId: "s.assess.onboarding" },
      { kind: "data", fromStepId: "s.project", toStepId: "s.assess.offer" },
      { kind: "data", fromStepId: "s.project", toStepId: "s.assess.impl" },
      { kind: "data", fromStepId: "s.project", toStepId: "s.assess.audience" },
      // Result-use only between branches — does not force sequential assessment turns.
      { kind: "result-use", fromStepId: "s.assess.onboarding", toStepId: "s.reduce", predicate: "branch-selected" },
      { kind: "result-use", fromStepId: "s.assess.offer", toStepId: "s.reduce", predicate: "branch-selected" },
      { kind: "result-use", fromStepId: "s.assess.impl", toStepId: "s.reduce", predicate: "branch-selected" },
      { kind: "result-use", fromStepId: "s.assess.audience", toStepId: "s.reduce", predicate: "branch-selected" },
      { kind: "data", fromStepId: "s.assess.onboarding", toStepId: "s.reduce" },
      { kind: "data", fromStepId: "s.assess.offer", toStepId: "s.reduce" },
      { kind: "data", fromStepId: "s.assess.impl", toStepId: "s.reduce" },
      { kind: "data", fromStepId: "s.assess.audience", toStepId: "s.reduce" },
      { kind: "result-use", fromStepId: "s.reduce", toStepId: "s.propose", predicate: "has-candidates" },
      { kind: "authority", stepId: "s.propose", requirement: "work-proposal-only" },
    ],
  });
}

/** AC2: second-round assess depends on first-round answers (data dep) — retains second stage. */
function dataDependentPlan(pack: QuestionPack): SemanticQueryPlan {
  return parseSemanticQueryPlan({
    ...baseMeta(pack),
    id: "plan.data-dep-second",
    steps: [
      { id: "s.select", operator: "select", support: "initial-slice", sourceScope: ["src.reports"] },
      { id: "s.project1", operator: "project", support: "initial-slice", projectionRef: "proj.main" },
      { id: "s.assess.round1", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
      { id: "s.project2", operator: "project", support: "initial-slice", projectionRef: "proj.journey" },
      { id: "s.assess.round2", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
      { id: "s.reduce", operator: "reduce", support: "initial-slice" },
      { id: "s.propose", operator: "proposeWork", support: "initial-slice" },
    ],
    edges: [
      { kind: "data", fromStepId: "s.select", toStepId: "s.project1" },
      { kind: "data", fromStepId: "s.project1", toStepId: "s.assess.round1" },
      // Candidate records for round2 depend on round1 answers — true data dependency.
      { kind: "data", fromStepId: "s.assess.round1", toStepId: "s.project2" },
      { kind: "data", fromStepId: "s.project2", toStepId: "s.assess.round2" },
      { kind: "data", fromStepId: "s.assess.round2", toStepId: "s.reduce" },
      { kind: "result-use", fromStepId: "s.reduce", toStepId: "s.propose", predicate: "has-candidates" },
      { kind: "authority", stepId: "s.propose", requirement: "work-proposal-only" },
    ],
  });
}

/** AC3: private-authority branch must not speculative-share with public batch. */
function unauthorizedBranchPlan(pack: QuestionPack): SemanticQueryPlan {
  return parseSemanticQueryPlan({
    ...baseMeta(pack),
    id: "plan.unauthorized-branch",
    steps: [
      { id: "s.select", operator: "select", support: "initial-slice", sourceScope: ["src.reports"] },
      { id: "s.project", operator: "project", support: "initial-slice", projectionRef: "proj.main" },
      { id: "s.assess.public", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
      { id: "s.assess.private", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
      { id: "s.reduce", operator: "reduce", support: "initial-slice" },
      { id: "s.propose", operator: "proposeWork", support: "initial-slice" },
    ],
    edges: [
      { kind: "data", fromStepId: "s.select", toStepId: "s.project" },
      { kind: "data", fromStepId: "s.project", toStepId: "s.assess.public" },
      { kind: "data", fromStepId: "s.project", toStepId: "s.assess.private" },
      { kind: "authority", stepId: "s.assess.private", requirement: "private-customer-payload" },
      { kind: "resource", stepId: "s.assess.private", requirement: "restricted-snapshot" },
      { kind: "data", fromStepId: "s.assess.public", toStepId: "s.reduce" },
      { kind: "data", fromStepId: "s.assess.private", toStepId: "s.reduce" },
      { kind: "result-use", fromStepId: "s.reduce", toStepId: "s.propose", predicate: "has-candidates" },
      { kind: "authority", stepId: "s.propose", requirement: "work-proposal-only" },
    ],
  });
}

function inputFor(plan: unknown, pack: QuestionPack, policy?: SemanticPlanCompileInput["recipePolicy"]): SemanticPlanCompileInput {
  return {
    plan,
    questionPack: pack,
    providerCoverage: [PROVIDER],
    recipePolicy: policy ?? { maxFanOut: 64 },
  };
}

export function register(harness: Harness): void {
  harness.check("semantic-plan-lower: stamp/issue/consumes + AC map present", () => {
    assert(SEMANTIC_PLAN_LOWER_ISSUE === "#516", "issue #516");
    assert(SEMANTIC_PLAN_LOWER_EPIC === "#511", "epic #511");
    assert(SEMANTIC_PLAN_LOWER_STAMP === "0.221.36", "stamp 0.221.36");
    assert(
      SEMANTIC_PLAN_LOWER_CONSUMES.includes("#512") &&
        SEMANTIC_PLAN_LOWER_CONSUMES.includes("#513") &&
        SEMANTIC_PLAN_LOWER_CONSUMES.includes("#514") &&
        SEMANTIC_PLAN_LOWER_CONSUMES.includes("#515"),
      "consumes prior U5",
    );
    assert(SEMANTIC_PLAN_LOWER_AC.length === 5, "five AC rows");
    assert(SEMANTIC_PLAN_LOWER_MAP_PATH.includes("semantic-plan-lower-map"), "map path");
    const evidence = semanticPlanLowerAcEvidence();
    assert(
      evidence.every((row) => row.covered),
      "all AC covered by fixtures",
    );
  });

  harness.check("AC1: four independent branch checks compile to one assessment stage", () => {
    const pack = samplePack();
    const compiled = compileSemanticQueryPlan(inputFor(fourBranchPlan(pack), pack));
    assert(compiled.assessmentStageCount === 1, `expected 1 assessment stage, got ${compiled.assessmentStageCount}`);
    const assess = compiled.stages.find((stage) => stage.kind === "assessment");
    assert(assess !== undefined, "assessment stage present");
    assert(assess!.stepIds.length === 4, `expected 4 coalesced assesses, got ${assess!.stepIds.length}`);
    assert(compiled.explain.sequentialRounds === 1, "one sequential round");
    assert(
      !compiled.stages.some((stage) => stage.kind === "assessment" && stage.reasonRetainedSequential?.startsWith("data-dependency")),
      "no data-dep sequential retention among independent branches",
    );
    assertCompilePurity(compiled);
  });

  harness.check("AC2: data-dependent candidate records retain necessary second assessment stage", () => {
    const pack = samplePack();
    const compiled = compileSemanticQueryPlan(inputFor(dataDependentPlan(pack), pack));
    assert(compiled.assessmentStageCount === 2, `expected 2 assessment stages, got ${compiled.assessmentStageCount}`);
    const assessStages = compiled.stages.filter((stage) => stage.kind === "assessment");
    assert(assessStages[1]!.reasonRetainedSequential?.startsWith("data-dependency-from:") === true, "second stage retained for data dep");
    assert(compiled.explain.sequentialRounds === 2, "two sequential rounds");
    assertCompilePurity(compiled);
  });

  harness.check("AC3: unauthorized branch cannot expose state in speculative shared batch", () => {
    const pack = samplePack();
    const plan = unauthorizedBranchPlan(pack);
    assert(canSpeculativeShare("s.assess.public", "s.assess.private", plan.edges) === false, "canSpeculativeShare rejects cross-authority");
    const compiled = compileSemanticQueryPlan(inputFor(plan, pack));
    const assessStages = compiled.stages.filter((stage) => stage.kind === "assessment");
    assert(assessStages.length === 2, `expected split assessment stages, got ${assessStages.length}`);
    const privateStage = assessStages.find((stage) => stage.stepIds.includes("s.assess.private"));
    const publicStage = assessStages.find((stage) => stage.stepIds.includes("s.assess.public"));
    assert(privateStage !== undefined && publicStage !== undefined, "both stages present");
    assert(privateStage!.stageId !== publicStage!.stageId, "not the same speculative batch");
    assert(privateStage!.authorityRequirements.includes("private-customer-payload"), "private authority gated");
    assert(privateStage!.resourceRequirements.includes("restricted-snapshot"), "resource gated");
    assert(!publicStage!.stepIds.includes("s.assess.private"), "private step not in public batch");
    assertCompilePurity(compiled);
  });

  harness.check("AC4: cycles / dangling refs / incompatible types / unbounded fan-out fail before execution", () => {
    const pack = samplePack();

    const cyclic = tryCompileSemanticQueryPlan(
      inputFor(
        parseSemanticQueryPlan({
          ...baseMeta(pack),
          id: "plan.cycle",
          steps: [
            { id: "s.select", operator: "select", support: "initial-slice", sourceScope: ["src.reports"] },
            { id: "s.project", operator: "project", support: "initial-slice", projectionRef: "proj.main" },
            { id: "s.assess", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
            { id: "s.reduce", operator: "reduce", support: "initial-slice" },
            { id: "s.propose", operator: "proposeWork", support: "initial-slice" },
          ],
          edges: [
            { kind: "data", fromStepId: "s.select", toStepId: "s.project" },
            { kind: "data", fromStepId: "s.project", toStepId: "s.assess" },
            { kind: "data", fromStepId: "s.assess", toStepId: "s.reduce" },
            { kind: "data", fromStepId: "s.reduce", toStepId: "s.project" },
            { kind: "authority", stepId: "s.propose", requirement: "work-proposal-only" },
            { kind: "data", fromStepId: "s.reduce", toStepId: "s.propose" },
          ],
        }),
        pack,
      ),
    );
    assert(cyclic.ok === false && cyclic.code === "cycle", `cycle fails closed: ${JSON.stringify(cyclic)}`);

    const dangling = tryCompileSemanticQueryPlan(
      inputFor(
        {
          ...baseMeta(pack),
          id: "plan.dangling",
          steps: [
            { id: "s.select", operator: "select", support: "initial-slice", sourceScope: ["src.reports"] },
            { id: "s.project", operator: "project", support: "initial-slice", projectionRef: "proj.missing" },
            { id: "s.assess", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
            { id: "s.reduce", operator: "reduce", support: "initial-slice" },
            { id: "s.propose", operator: "proposeWork", support: "initial-slice" },
          ],
          edges: [
            { kind: "data", fromStepId: "s.select", toStepId: "s.project" },
            { kind: "data", fromStepId: "s.project", toStepId: "s.assess" },
            { kind: "data", fromStepId: "s.assess", toStepId: "s.reduce" },
            { kind: "data", fromStepId: "s.reduce", toStepId: "s.propose" },
            { kind: "authority", stepId: "s.propose", requirement: "work-proposal-only" },
          ],
          canonicalizationVersion: 1 as const,
          schemaVersion: 1 as const,
        },
        pack,
      ),
    );
    assert(dangling.ok === false && dangling.code === "dangling_projection_ref", `dangling fails: ${JSON.stringify(dangling)}`);

    const incompatible = tryCompileSemanticQueryPlan(
      inputFor(
        parseSemanticQueryPlan({
          ...baseMeta(pack),
          id: "plan.incompatible",
          steps: [
            { id: "s.select", operator: "select", support: "initial-slice", sourceScope: ["src.reports"] },
            { id: "s.assess", operator: "assess", support: "initial-slice", questionPackRef: pack.id },
            { id: "s.reduce", operator: "reduce", support: "initial-slice" },
            { id: "s.propose", operator: "proposeWork", support: "initial-slice" },
          ],
          edges: [
            { kind: "data", fromStepId: "s.select", toStepId: "s.assess" },
            { kind: "data", fromStepId: "s.assess", toStepId: "s.reduce" },
            { kind: "data", fromStepId: "s.reduce", toStepId: "s.propose" },
            { kind: "authority", stepId: "s.propose", requirement: "work-proposal-only" },
          ],
        }),
        pack,
      ),
    );
    assert(incompatible.ok === false && incompatible.code === "incompatible_result_types", `incompatible types fail: ${JSON.stringify(incompatible)}`);

    const unbounded = tryCompileSemanticQueryPlan(inputFor(fourBranchPlan(pack), pack, { maxFanOut: 2 }));
    assert(unbounded.ok === false && unbounded.code === "unbounded_fan_out", `unbounded fan-out fails: ${JSON.stringify(unbounded)}`);
  });

  harness.check("AC5: equivalent pinned inputs yield byte-stable plans; explain estimates not observed latency/spend", () => {
    const pack = samplePack();
    const plan = fourBranchPlan(pack);
    const a = compileSemanticQueryPlan(inputFor(plan, pack));
    const b = compileSemanticQueryPlan(inputFor(plan, pack));
    assert(a.compiledDigest === b.compiledDigest, "compiledDigest byte-stable");
    assert(a.sourcePlanDigest === b.sourcePlanDigest, "sourcePlanDigest byte-stable");
    assert(a.lowered.loweredDigest === b.lowered.loweredDigest, "loweredDigest byte-stable");
    assert(JSON.stringify(a.stages) === JSON.stringify(b.stages), "stages byte-stable");
    assert(JSON.stringify(a.explain.estimates) === JSON.stringify(b.explain.estimates), "estimates byte-stable");
    assert(a.explain.estimates.kind === "compile-estimate", "estimate kind");
    assert(a.explain.honesty.estimatesAreNotObservedLatency === true, "not observed latency");
    assert(a.explain.honesty.estimatesAreNotObservedSpend === true, "not observed spend");
    // Explain surface must not carry observed latency/spend fields.
    const explainJson = JSON.stringify(a.explain);
    assert(!explainJson.includes("observedLatency"), "no observedLatency field");
    assert(!explainJson.includes("observedSpend"), "no observedSpend field");
    assert(!explainJson.includes("observed_latency"), "no observed_latency field");
    assertCompilePurity(a);

    // Lowered nodes map to occurrence kinds — not a new graph engine.
    assert(a.lowered.policyOwner === "recipe", "recipe owns policy");
    assert(
      a.lowered.nodes.every((node) => node.occurrenceKind.startsWith("semantic-")),
      "occurrence kinds",
    );
    assert(
      a.lowered.nodes.some((node) => node.occurrenceKind === "semantic-assessment"),
      "assessment occurrence",
    );
  });

  harness.check("semantic-plan-lower: compile purity — no wall-clock/network/secrets/availability probes in API surface", () => {
    const pack = samplePack();
    const compiled = compileSemanticQueryPlan(inputFor(fourBranchPlan(pack), pack));
    assertCompilePurity(compiled);
    // Module exports do not accept clock/network/secret/availability hooks.
    const source = compileSemanticQueryPlan.toString();
    assert(!source.includes("Date.now"), "no Date.now in compile");
    assert(!source.includes("fetch("), "no fetch in compile");
    assert(!source.includes("process.env"), "no process.env in compile");
  });
}
