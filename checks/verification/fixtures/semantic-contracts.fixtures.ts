/**
 * SQ-01 / #512 — provider-boundary semantic contract fixtures.
 *
 * Contracts-only: no network, credentials, adapter transport, or package activation.
 */
import assert from "node:assert/strict";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import {
  INITIAL_SLICE_OPERATORS,
  RESERVED_OPERATORS,
  assertNoKernelPrivilegeClaim,
  computePlanIdentity,
  digestOf,
  isPolarizedScore,
  isReservedOperator,
  noulConfidencePresent,
  parseInferenceReceipt,
  parsePolicyApplicationReceipt,
  parseQuestionPack,
  parseSemanticAnswer,
  parseSemanticPackageResource,
  parseSemanticQueryPlan,
  parseSemanticQuestionResult,
  receiptParsesAsForbiddenAuthority,
  scoreExpectation,
  tryParseQuestionPack,
  withQuestionPackContentDigest,
  type ChoiceAnswer,
  type NoulAnswer,
  type QuestionPack,
  type ScoreAnswer,
  type SemanticQueryPlan,
} from "../../../contracts/semantic/index.js";
import { assert as harnessAssert, type Harness } from "./_harness.js";

function fails(run: () => unknown): boolean {
  try {
    run();
    return false;
  } catch {
    return true;
  }
}

function samplePack(): QuestionPack {
  return withQuestionPackContentDigest({
    schemaVersion: 1,
    id: "pack.feedback",
    version: "1.0.0",
    title: "Feedback",
    instructions: "Assess whether observations share a failure mechanism.",
    questions: [
      {
        id: "q.same-mechanism",
        kind: "noul",
        instruction: "Do these reports describe the same failure mechanism?",
        statePaths: ["observation.summary", "observation.tags"],
        vocabulary: { kind: "noul", proposition: "Reports share a failure mechanism." },
      },
      {
        id: "q.severity",
        kind: "score",
        instruction: "How severe is the customer impact?",
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
        statePaths: ["observation.summary"],
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
      {
        id: "proj.main",
        statePaths: ["observation.summary", "observation.tags"],
        required: true,
      },
    ],
  });
}

function samplePlan(pack: QuestionPack, overrides: Partial<SemanticQueryPlan> = {}): SemanticQueryPlan {
  const base = {
    schemaVersion: 1 as const,
    id: "plan.feedback-1",
    questionPackId: pack.id,
    questionPackVersion: pack.version,
    questionPackDigest: pack.contentDigest!,
    projectionDigest: digestOf(pack.projections),
    sourceRevisions: [{ sourceId: "src.reports", revision: "rev-a" }],
    steps: [
      { id: "s1", operator: "select" as const, support: "initial-slice" as const, sourceScope: ["src.reports"] },
      { id: "s2", operator: "project" as const, support: "initial-slice" as const, projectionRef: "proj.main" },
      { id: "s3", operator: "assess" as const, support: "initial-slice" as const, questionPackRef: pack.id },
      { id: "s4", operator: "reduce" as const, support: "initial-slice" as const },
      { id: "s5", operator: "proposeWork" as const, support: "initial-slice" as const },
    ],
    edges: [
      { kind: "data" as const, fromStepId: "s1", toStepId: "s2" },
      { kind: "data" as const, fromStepId: "s2", toStepId: "s3" },
      { kind: "data" as const, fromStepId: "s3", toStepId: "s4" },
      { kind: "result-use" as const, fromStepId: "s4", toStepId: "s5", predicate: "has-candidates" },
      { kind: "authority" as const, stepId: "s5", requirement: "work-proposal-only" },
    ],
    resultConsumption: {
      schemaVersion: 1 as const,
      thresholds: [{ questionId: "q.same-mechanism", metric: "probability" as const, comparison: "gte" as const, value: 0.6 }],
      onFailure: "retain" as const,
    },
    canonicalizationVersion: 1 as const,
  };
  return parseSemanticQueryPlan({ ...base, ...overrides });
}

export function register(harness: Harness): void {
  harness.check("semantic contracts: TS/JSON/YAML round-trip preserves fields and rejects unknown keys", () => {
    const pack = samplePack();
    const fromJson = parseQuestionPack(JSON.parse(JSON.stringify(pack)));
    const fromYaml = parseQuestionPack(parseYaml(stringifyYaml(pack)));
    assert.deepEqual(fromJson, pack);
    assert.deepEqual(fromYaml, pack);
    assert.equal(tryParseQuestionPack({ ...pack, surprise: true }).ok, false);
    assert.equal(tryParseQuestionPack({ ...pack, contentDigest: undefined, questions: [...pack.questions, pack.questions[0]!] }).ok, false);
    assert.equal(
      tryParseQuestionPack({
        ...pack,
        contentDigest: undefined,
        questions: [{ ...pack.questions[0]!, statePaths: ["missing.path"] }],
      }).ok,
      false,
    );
    assert.equal(tryParseQuestionPack({ ...pack, contentDigest: undefined, schemaVersion: 99 }).ok, false);
  });

  harness.check("semantic contracts: polarized Score stays distinct from concentrated midpoint; Noul confidence is not fabricated", () => {
    const polarized = parseSemanticAnswer({
      kind: "score",
      questionId: "q.severity",
      levels: [
        { level: 1, label: "low", probability: 0.5 },
        { level: 2, label: "medium", probability: 0 },
        { level: 3, label: "high", probability: 0.5 },
      ],
      expectation: 2,
    }) as ScoreAnswer;
    const midpoint = parseSemanticAnswer({
      kind: "score",
      questionId: "q.severity",
      levels: [
        { level: 1, label: "low", probability: 0 },
        { level: 2, label: "medium", probability: 1 },
        { level: 3, label: "high", probability: 0 },
      ],
      expectation: 2,
    }) as ScoreAnswer;
    assert.equal(scoreExpectation(polarized), scoreExpectation(midpoint));
    assert.equal(isPolarizedScore(polarized), true);
    assert.equal(isPolarizedScore(midpoint), false);
    assert.notDeepEqual(polarized.levels, midpoint.levels);

    const noul = parseSemanticAnswer({ kind: "noul", questionId: "q.same-mechanism", probability: 0.7 }) as NoulAnswer;
    assert.equal(noulConfidencePresent(noul), false);
    assert.equal(Object.prototype.hasOwnProperty.call(noul, "confidence"), false);

    const negativeChoice = parseSemanticAnswer({
      kind: "choice",
      questionId: "q.route",
      options: [
        { id: "observe", label: "Gather more evidence", probability: 0.1 },
        { id: "repair", label: "Propose a reversible repair", probability: 0.1 },
        { id: "none", label: "No action", probability: 0.8 },
      ],
      selectedOptionId: "none",
    }) as ChoiceAnswer;
    assert.equal(negativeChoice.selectedOptionId, "none");

    for (const status of ["unknown", "insufficient-context", "unsupported", "cancelled", "timeout", "invalid-response"] as const) {
      const failure = parseSemanticQuestionResult({ status, questionId: "q.same-mechanism" });
      assert.equal(failure.status, status);
    }
  });

  harness.check("semantic contracts: identical normalized input yields identical plan identity; question/projection/source revisions change it", () => {
    const pack = samplePack();
    const plan = samplePlan(pack);
    const identity = computePlanIdentity(plan);
    const reordered = samplePlan(pack, {
      steps: [...plan.steps].reverse(),
      edges: [...plan.edges].reverse(),
      sourceRevisions: [...plan.sourceRevisions],
    });
    assert.equal(computePlanIdentity(reordered), identity);

    assert.notEqual(computePlanIdentity(samplePlan(pack, { questionPackDigest: digestOf("other-pack") })), identity);
    assert.notEqual(computePlanIdentity(samplePlan(pack, { projectionDigest: digestOf("other-projection") })), identity);
    assert.notEqual(computePlanIdentity(samplePlan(pack, { sourceRevisions: [{ sourceId: "src.reports", revision: "rev-b" }] })), identity);

    for (const operator of INITIAL_SLICE_OPERATORS) {
      harnessAssert(plan.steps.some((step) => step.operator === operator) || operator === "select", `initial slice includes ${operator}`);
    }
    for (const operator of RESERVED_OPERATORS) {
      assert.equal(isReservedOperator(operator), true);
    }
    const withReserved = samplePlan(pack, {
      steps: [...plan.steps, { id: "s6", operator: "semanticFilter", support: "reserved", sourceScope: [] }],
    });
    assert.notEqual(computePlanIdentity(withReserved), identity);
    assert.equal(
      fails(() =>
        parseSemanticQueryPlan({
          ...plan,
          steps: [...plan.steps, { id: "bad", operator: "semanticFilter", support: "initial-slice" }],
        }),
      ),
      true,
    );
  });

  harness.check("semantic contracts: receipt cannot parse as runtime proof, product truth, authority grant, or tool request", () => {
    const pack = samplePack();
    const plan = samplePlan(pack);
    const noul = parseSemanticAnswer({ kind: "noul", questionId: "q.same-mechanism", probability: 0.55 });
    const receipt = parseInferenceReceipt({
      schemaVersion: 1,
      kind: "inference-receipt",
      evidenceClass: "inference",
      receiptId: "rcpt.1",
      requestId: "req.1",
      attemptId: "att.1",
      planId: plan.id,
      planIdentity: computePlanIdentity(plan),
      questionPackId: pack.id,
      questionPackDigest: pack.contentDigest!,
      projectionDigest: plan.projectionDigest,
      sourceRevisions: plan.sourceRevisions,
      coverage: { includedSourceIds: ["src.reports"], omittedSourceIds: [], omittedFields: ["observation.private"] },
      binding: { providerBindingId: "binding.fixture" },
      results: [{ status: "answered", answer: noul }],
      usageCost: { status: "unknown", reason: "fixture-no-provider" },
      recordedAt: "2026-09-19T12:00:00.000Z",
    });
    assert.equal(receipt.usageCost.status, "unknown");
    assert.equal(receiptParsesAsForbiddenAuthority(receipt), false);
    assert.equal(receiptParsesAsForbiddenAuthority({ kind: "runtime-proof", proofId: "p1", verified: true }), true);
    assert.equal(receiptParsesAsForbiddenAuthority({ kind: "accepted-product-truth", claimId: "c1", accepted: true }), true);
    assert.equal(receiptParsesAsForbiddenAuthority({ kind: "authority-grant", grantId: "g1", permission: "write" }), true);
    assert.equal(receiptParsesAsForbiddenAuthority({ kind: "executable-tool-request", toolName: "run", arguments: {} }), true);
    assert.equal(
      fails(() => parseInferenceReceipt({ ...receipt, kind: "executable-tool-request" })),
      true,
    );

    const policy = parsePolicyApplicationReceipt({
      schemaVersion: 1,
      kind: "policy-application-receipt",
      evidenceClass: "inference",
      receiptId: "rcpt.policy.1",
      inferenceReceiptId: receipt.receiptId,
      inferenceReceiptDigest: digestOf(receipt),
      policyDigest: digestOf(plan.resultConsumption),
      decision: {
        outcome: "defer",
        excludedAlternatives: [{ alternativeId: "repair-now", reason: "evidence below threshold" }],
      },
      derived: { next: "observe" },
      recordedAt: "2026-09-19T12:00:01.000Z",
    });
    assert.equal(policy.decision.outcome, "defer");
    assert.equal(receiptParsesAsForbiddenAuthority(policy), false);
  });

  harness.check("semantic contracts: external package can declare the same semantic resource without kernel/vendor privileges", () => {
    const firstParty = parseSemanticPackageResource({
      apiVersion: "b2c.semantic/v1",
      kind: "question-pack",
      id: "b2c/feedback-pack",
      version: "1.0.0",
      path: "semantic/feedback.question-pack.json",
      mediaType: "application/json",
      experimental: true,
    });
    const external = parseSemanticPackageResource({
      apiVersion: "b2c.semantic/v1",
      kind: "question-pack",
      id: "acme/feedback-pack",
      version: "1.0.0",
      path: "semantic/feedback.question-pack.json",
      mediaType: "application/json",
      experimental: true,
    });
    assert.equal(firstParty.kind, external.kind);
    assert.equal(firstParty.experimental, true);
    assert.equal(external.id.startsWith("acme/"), true);
    assert.equal(
      fails(() => assertNoKernelPrivilegeClaim({ ...external, kernelPrivilege: "vendor" })),
      true,
    );
    assert.equal(
      fails(() => parseSemanticPackageResource({ ...external, vendorPrivilege: true })),
      true,
    );
  });
}
