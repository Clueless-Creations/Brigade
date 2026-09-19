/**
 * #514 SQ-03 semantic-execution baselines + held-out decision-quality fixtures
 * (paper; no live).
 *
 * Proves three arms, held-out reservation + predeclared thresholds, separated
 * decision-quality metrics, honesty gates, metamorphic suite, and cheap
 * ultrafast non-live interactive decision feed. Consumes #512/#513/#515.
 * Does not replace #75 retrieval scope or #73 cost stores. No live browser,
 * paid provider, credentials, or iOS-sim.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SEMANTIC_EVAL_ISSUE,
  SEMANTIC_EVAL_EPIC,
  SEMANTIC_EVAL_CONSUMES,
  SEMANTIC_EVAL_REUSES,
  SEMANTIC_EVAL_STAMP,
  SEMANTIC_EVAL_BASE_MAIN_SHA,
  SEMANTIC_EVAL_LIVE_NOT_PERFORMED,
  SEMANTIC_EVAL_BROWSER_NOT_PERFORMED,
  SEMANTIC_EVAL_IOS_SIM_OOS,
  SEMANTIC_EVAL_HOSTED_KEY_OWNER,
  SEMANTIC_EVAL_ARMS,
  SEMANTIC_EVAL_CASE_CLASSES,
  SEMANTIC_EVAL_CASES,
  SEMANTIC_EVAL_ADMISSION_THRESHOLDS,
  SEMANTIC_EVAL_METRIC_IDS,
  SEMANTIC_EVAL_COST_ACCOUNTING_RULES,
  SEMANTIC_EVAL_MAP_PATH,
  SEMANTIC_EVAL_PROTOCOL,
  SEMANTIC_EVAL_FIXTURE,
  SEMANTIC_EVAL_GOLDEN,
  SEMANTIC_ULTRAFAST_DOC,
  SEMANTIC_ULTRAFAST_GITHUB,
  SEMANTIC_ULTRAFAST_NOTE,
  SEMANTIC_ULTRAFAST_FIXTURE_PAGE,
  EVAL_BASELINES_PROTOCOL,
  EVAL_BASELINES_FIXTURE,
  SEMANTIC_CONTRACTS_DIR,
  TYPESAFE_ADAPTER_DIR,
  TYPESAFE_QUALIFY_MAP,
  heldOutCases,
  requiredCaseClassesPresent,
  runDeterministicArm,
  runAgentArm,
  runSemanticArm,
  scoreArm,
  buildDecisionQualityReport,
  droppingHardCasesWouldInflate,
  cheaterDroppingHardCasesWouldInflate,
  metamorphicRenameOrderStable,
  metamorphicContradictionFlips,
  metamorphicDuplicationNotCorroboration,
  wrongHighConfidenceFailsDownstream,
  decideUltrafastFromAssessment,
  loadHeldOutGolden,
  assertConsumePathsExist,
  getSemanticEvalAcceptance,
} from "../../../catalog/providers/semantic-eval-baselines-map.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

function read(relative: string): string {
  return readFileSync(path.join(skillRoot, relative), "utf8");
}

export function register(harness: Harness): void {
  harness.check("semantic-eval-baselines: issue/epic/stamp + consume/reuse pins", () => {
    assert(SEMANTIC_EVAL_ISSUE === "#514", "issue #514");
    assert(SEMANTIC_EVAL_EPIC === "#511", "epic #511");
    assert(SEMANTIC_EVAL_STAMP === "0.221.35", "stamp 0.221.35");
    assert(SEMANTIC_EVAL_BASE_MAIN_SHA === "c43a8f706ac1fa52f979826bf1bf192dc656d565", "base main sha");
    assert(SEMANTIC_EVAL_CONSUMES.join(",") === "#512,#513,#515", "consumes 512+513+515");
    assert(SEMANTIC_EVAL_REUSES.join(",") === "#73,#74,#75", "reuses 73+74+75");
    assert(SEMANTIC_EVAL_LIVE_NOT_PERFORMED === true, "live not performed");
    assert(SEMANTIC_EVAL_BROWSER_NOT_PERFORMED === true, "browser not performed");
    assert(SEMANTIC_EVAL_IOS_SIM_OOS === true, "ios-sim oos");
    assert(SEMANTIC_EVAL_HOSTED_KEY_OWNER.includes("Eduardo"), "hosted key owner Eduardo");
  });

  harness.check("semantic-eval-baselines: consume paths exist (no redo of #512/#513/#515)", () => {
    const missing = assertConsumePathsExist(skillRoot);
    assert(missing.length === 0, `missing consume paths: ${missing.join(", ")}`);
    assert(existsSync(path.join(skillRoot, SEMANTIC_CONTRACTS_DIR)), "contracts/semantic");
    assert(existsSync(path.join(skillRoot, TYPESAFE_ADAPTER_DIR)), "typesafe adapter");
    assert(existsSync(path.join(skillRoot, TYPESAFE_QUALIFY_MAP)), "qualify map");
    assert(existsSync(path.join(skillRoot, EVAL_BASELINES_PROTOCOL)), "eval-baselines protocol");
    assert(existsSync(path.join(skillRoot, EVAL_BASELINES_FIXTURE)), "eval-baselines fixtures");
    assert(existsSync(path.join(skillRoot, SEMANTIC_EVAL_MAP_PATH)), "eval map");
    assert(existsSync(path.join(skillRoot, SEMANTIC_EVAL_GOLDEN)), "held-out golden");
    assert(existsSync(path.join(skillRoot, SEMANTIC_EVAL_FIXTURE)), "this fixture");
  });

  harness.check("semantic-eval-baselines: three arms frozen with equivalent-evidence discipline", () => {
    assert(SEMANTIC_EVAL_ARMS.length === 3, "three arms");
    const ids = SEMANTIC_EVAL_ARMS.map((arm) => arm.id);
    assert(ids.includes("deterministic-route-retrieval"), "deterministic arm");
    assert(ids.includes("agent-driven-workflow"), "agent arm");
    assert(ids.includes("semantic-candidate"), "semantic arm");
  });

  harness.check("semantic-eval-baselines: held-out reservation + all case classes present", () => {
    assert(SEMANTIC_EVAL_CASE_CLASSES.length === 7, "seven case classes");
    const held = heldOutCases();
    assert(held.length === 7, "seven held-out cases");
    assert(requiredCaseClassesPresent(held), "all required classes in held-out");
    assert(
      SEMANTIC_EVAL_CASES.some((row) => row.split === "tuning-frozen"),
      "tuning-frozen seed present and separate from held-out",
    );
    for (const row of held) {
      assert(row.questionVersion.length > 0, `${row.id} question version`);
      assert(row.sourceVersion.length > 0, `${row.id} source version`);
    }
  });

  harness.check("semantic-eval-baselines: admission thresholds frozen before held-out run", () => {
    assert(SEMANTIC_EVAL_ADMISSION_THRESHOLDS.frozenBeforeHeldOutRun === true, "frozen before held-out");
    assert(SEMANTIC_EVAL_ADMISSION_THRESHOLDS.frozenAt.startsWith("2026-09-19"), "frozenAt date");
    assert(SEMANTIC_EVAL_ADMISSION_THRESHOLDS.sampleSizeClass === "small-pilot", "small-pilot");
    assert(SEMANTIC_EVAL_ADMISSION_THRESHOLDS.rareFailureReliabilityClaimAllowed === false, "no rare-failure claim");
    assert(SEMANTIC_EVAL_ADMISSION_THRESHOLDS.honesty.wrongHighConfidenceMustFailDownstream === true, "wrong HC gate");
    assert(SEMANTIC_EVAL_ADMISSION_THRESHOLDS.honesty.hardCasesRequiredInDenominator === true, "hard cases required");
    assert(SEMANTIC_EVAL_ADMISSION_THRESHOLDS.honesty.noChangeOrRejectTypesafeAcceptable === true, "no-change ok");
    const golden = loadHeldOutGolden(skillRoot);
    assert(golden.metadata.thresholdsFrozenAt === SEMANTIC_EVAL_ADMISSION_THRESHOLDS.frozenAt, "golden freeze matches");
    assert(golden.metadata.heldOutUnusedForTuning === true, "held-out unused for tuning");
    assert(golden.metadata.liveNotPerformed === true, "golden live not performed");
  });

  harness.check("semantic-eval-baselines: three arms run on held-out with per-case traces", () => {
    const held = heldOutCases();
    const traces = [];
    for (const evalCase of held) {
      const deterministic = runDeterministicArm(evalCase);
      const agent = runAgentArm(evalCase, { omitToolTrace: true });
      const semantic = runSemanticArm(evalCase);
      assert(deterministic.armId === "deterministic-route-retrieval", "deterministic arm id");
      assert(agent.armId === "agent-driven-workflow", "agent arm id");
      assert(semantic.armId === "semantic-candidate", "semantic arm id");
      assert(deterministic.toolTracePresent === true, "deterministic tool trace");
      assert(agent.toolTracePresent === false, "agent missing tool trace");
      assert(typeof agent.toolTraceDisclosure === "string" && agent.toolTraceDisclosure.length > 0, "agent discloses missing tool trace");
      assert(agent.sameModelJudgingDisclosed === true, "agent discloses same-model judging");
      assert(semantic.liveProviderLatencyMs === null, "fixture latency only on semantic");
      assert(semantic.actualCost === "unknown", "actual cost unknown not zero");
      traces.push(deterministic, agent, semantic);
    }
    assert(traces.length === held.length * 3, "per-case × three arms");
    const semanticOnly = traces.filter((trace) => trace.armId === "semantic-candidate");
    const scores = scoreArm(semanticOnly);
    assert(typeof scores.candidateGenerationRecall === "number", "recall metric");
    assert(typeof scores.assessmentQuality === "number", "assessment metric");
    assert(typeof scores.graphPathRelevance === "number", "graph path metric");
    assert(typeof scores.guidanceDelivered === "number", "guidance metric");
    assert(typeof scores.downstreamProposalCorrectness === "number", "downstream metric");
    assert(typeof scores.fixtureLatencyP95Ms === "number", "fixture latency p95");
    assert(SEMANTIC_EVAL_METRIC_IDS.length >= 10, "metric id catalog");
    assert(
      SEMANTIC_EVAL_COST_ACCOUNTING_RULES.some((rule) => rule.includes("#73")),
      "reuses #73 cost rules",
    );
  });

  harness.check("semantic-eval-baselines: wrong high-confidence candidate fails downstream", () => {
    assert(wrongHighConfidenceFailsDownstream() === true, "wrong HC fails downstream");
  });

  harness.check("semantic-eval-baselines: cannot pass by dropping hard/unknown cases", () => {
    assert(requiredCaseClassesPresent(heldOutCases()) === true, "hard classes present");
    const cheater = cheaterDroppingHardCasesWouldInflate();
    assert(cheater.wouldInflate === true, `cheater would inflate: ${cheater.detail}`);
    assert(cheater.hardClassesRequired === true, "hard classes required flag");
    const honestTraces = heldOutCases().map((evalCase) => runSemanticArm(evalCase));
    const honest = droppingHardCasesWouldInflate(honestTraces);
    assert(typeof honest.wouldInflate === "boolean", "honest inflate boolean");
  });

  harness.check("semantic-eval-baselines: decision-quality report limits + no-change disposition", () => {
    const traces = heldOutCases().flatMap((evalCase) => [runDeterministicArm(evalCase), runAgentArm(evalCase), runSemanticArm(evalCase)]);
    const report = buildDecisionQualityReport(traces);
    assert(report.issue === "#514", "report issue");
    assert(report.stamp === "0.221.35", "report stamp");
    assert(report.sampleSizeClass === "small-pilot", "small-pilot");
    assert(report.rareFailureReliabilityClaim === false, "no rare-failure claim");
    assert(report.liveNotPerformed === true, "live not performed");
    assert(report.browserNotPerformed === true, "browser not performed");
    assert(report.thresholdsFrozenBeforeHeldOut === true, "thresholds frozen");
    assert(report.typesafeDisposition === "no-change", "no-change disposition");
    assert(report.modelVersionUncertainty.length > 10, "model uncertainty named");
    assert(report.dispositionRationale.length > 40, "disposition rationale present");
    assert(report.aggregates.liveProviderLatencyMs === "not-performed", "live latency separate");
    assert(report.aggregates.actualCost === "unknown", "cost unknown not zero");
  });

  harness.check("semantic-eval-baselines: metamorphic rename/order, contradiction, duplication", () => {
    const held = heldOutCases();
    assert(metamorphicRenameOrderStable(held[0]!) === true, "rename/order stable");
    assert(metamorphicContradictionFlips() === true, "contradiction flips");
    assert(metamorphicDuplicationNotCorroboration(held[0]!) === true, "duplication ≠ corroboration");
  });

  harness.check("semantic-eval-baselines: cheap ultrafast non-live indexed-element decision", () => {
    assert(existsSync(path.join(skillRoot, SEMANTIC_ULTRAFAST_DOC)), "ultrafast doc");
    const doc = read(SEMANTIC_ULTRAFAST_DOC);
    assert(doc.includes("browser-use/jev-ultrafast") || doc.includes(SEMANTIC_ULTRAFAST_GITHUB), "cites jev-ultrafast");
    assert(doc.includes("12-jev-ultrafast") || doc.includes(SEMANTIC_ULTRAFAST_NOTE), "cites note 12");
    assert(/not performed|not-performed|No live/i.test(doc), "live hold named");
    assert(/iOS-sim|ios-sim|OOS/i.test(doc), "ios-sim oos");
    assert(!/sk-[a-zA-Z0-9]{10,}/.test(doc), "no credential values in doc");

    const click = decideUltrafastFromAssessment({ selectedOptionId: "click-pay", confidence: 0.9 }, SEMANTIC_ULTRAFAST_FIXTURE_PAGE);
    assert(click.operation === "CLICK", "click pay");
    assert(click.targetIndex === 3, "pay index 3");
    assert(click.modelEmittedSelectors === false, "no selectors");
    assert(click.modelEmittedCoords === false, "no coords");
    assert(click.modelEmittedJs === false, "no js");
    assert(click.browserUsed === false, "no browser");
    assert(click.iosSimUsed === false, "no ios-sim");
    assert(click.liveProviderUsed === false, "no live provider");

    const typeText = decideUltrafastFromAssessment({ selectedOptionId: "type-email", confidence: 0.85 }, SEMANTIC_ULTRAFAST_FIXTURE_PAGE, "user@example.com");
    assert(typeText.operation === "TYPE_TEXT", "type email");
    assert(typeText.targetIndex === 1, "email index");
    assert(typeText.text === "user@example.com", "llm text payload only");

    const abort = decideUltrafastFromAssessment({ selectedOptionId: "click-pay", confidence: 0.2 }, SEMANTIC_ULTRAFAST_FIXTURE_PAGE);
    assert(abort.operation === "ABORT", "low confidence aborts");
  });

  harness.check("semantic-eval-baselines: protocol AC map + acceptance rows", () => {
    assert(existsSync(path.join(skillRoot, SEMANTIC_EVAL_PROTOCOL)), "protocol present");
    const protocol = read(SEMANTIC_EVAL_PROTOCOL);
    assert(protocol.includes("#514"), "protocol names #514");
    assert(protocol.includes("#511"), "protocol names epic");
    assert(protocol.includes("0.221.35"), "protocol stamp");
    assert(protocol.includes("no-change"), "no-change acceptable");
    assert(protocol.includes("STOP"), "stop gate");
    const acceptance = getSemanticEvalAcceptance();
    assert(acceptance.length === 5, "five acceptance rows");
  });

  harness.check("semantic-eval-baselines: does not break #73/#75 eval-baselines pins", () => {
    const protocol = read(EVAL_BASELINES_PROTOCOL);
    assert(protocol.includes("#75"), "keeps #75 pin");
    assert(protocol.includes("#73"), "keeps #73 pin");
    assert(existsSync(path.join(skillRoot, EVAL_BASELINES_FIXTURE)), "eval-baselines fixtures intact");
  });
}
