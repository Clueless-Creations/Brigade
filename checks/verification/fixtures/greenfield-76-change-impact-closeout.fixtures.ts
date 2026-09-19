/**
 * #76 business-change-impact Required-scenario matrix closeout fixtures (U4-6 residual).
 *
 * Deterministic only. Pins AC→evidence map integrity, sequence lock after #76
 * (#72 last), residual Required-scenario rows landed or held→#72, live held,
 * no parallel dependency DB / second graph, four layers distinct, expected-IDs
 * rule, coordinate-don't-steal listed siblings. Does not run live greenfield /
 * invent measured interval, redo #66/#70/#71/#73/#75, or steal siblings.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BUSINESS_CHANGE_IMPACT_FIXTURE,
  CHANGE_CASCADE_CHECK,
  ENGINE_FIXTURE,
  GREENFIELD_66_AUDIT_DOC,
  GREENFIELD_70_AUDIT_DOC,
  GREENFIELD_71_AUDIT_DOC,
  GREENFIELD_73_AUDIT_DOC,
  GREENFIELD_75_AUDIT_DOC,
  GREENFIELD_75_MAP,
  GREENFIELD_76_ACCEPTANCE,
  GREENFIELD_76_AUDIT_DOC,
  GREENFIELD_76_BASE_MAIN_SHA,
  GREENFIELD_76_COORDINATE_PINS,
  GREENFIELD_76_EXPECTED_IDS_NOTE,
  GREENFIELD_76_FIXTURE_SUITE,
  GREENFIELD_76_FOUR_LAYERS_NOTE,
  GREENFIELD_76_HARD_HOLDS,
  GREENFIELD_76_LIVE_HELD,
  GREENFIELD_76_LIVE_OWNER,
  GREENFIELD_76_MAP_PATH,
  GREENFIELD_76_NEXT_AFTER_CLOSE,
  GREENFIELD_76_NO_PARALLEL_GRAPH_NOTE,
  GREENFIELD_76_NO_U5,
  GREENFIELD_76_REQUIRED_SCENARIOS,
  GREENFIELD_76_SEQUENCE_LOCK_NOTE,
  GREENFIELD_76_SKIP_CLOSED,
  GREENFIELD_76_STAMP,
  GREENFIELD_76_U4_REMAINING_SEQUENCE,
  GREENFIELD_BENCHMARK_PROTOCOL,
  LIFECYCLE,
  OPERATING_SYSTEM_WORKFLOWS,
  REVIEW_EVIDENCE,
  RUNSTATE,
  getGreenfield76Acceptance,
  getGreenfield76LiveHeld,
  getGreenfield76RequiredScenarios,
  greenfield76AcceptanceDoneOrHeld,
  greenfield76AllLiveHeld,
  greenfield76AllRequiredScenariosDoneOrHeld,
  greenfield76AllowsAutomaticPriceMigration,
  greenfield76AllowsLiveInThisSlice,
  greenfield76AllowsParallelDependencyDb,
  greenfield76AllowsSecondGraphService,
  greenfield76AllowsU5,
  greenfield76AllowsWorkerSelfApprove,
  greenfield76Redoes66Umbrella,
  greenfield76Redoes70Applicability,
  greenfield76Redoes71Handoff,
  greenfield76Redoes73Overhead,
  greenfield76Redoes75Retrieval,
  greenfield76SequenceIsLocked,
  greenfield76StealsCoordinatePins,
} from "../../../catalog/providers/greenfield-76-change-impact-closeout-map.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const AUDIT_DOC = path.join(skillRoot, GREENFIELD_76_AUDIT_DOC);
const MAP_FILE = path.join(skillRoot, GREENFIELD_76_MAP_PATH);
const BCI = path.join(skillRoot, BUSINESS_CHANGE_IMPACT_FIXTURE);
const ENGINE = path.join(skillRoot, ENGINE_FIXTURE);
const CASCADE = path.join(skillRoot, CHANGE_CASCADE_CHECK);
const OS = path.join(skillRoot, OPERATING_SYSTEM_WORKFLOWS);
const RUN = path.join(skillRoot, RUNSTATE);
const REVIEW = path.join(skillRoot, REVIEW_EVIDENCE);
const LIFE = path.join(skillRoot, LIFECYCLE);
const BENCHMARK = path.join(skillRoot, GREENFIELD_BENCHMARK_PROTOCOL);
const GF66 = path.join(skillRoot, GREENFIELD_66_AUDIT_DOC);
const GF70 = path.join(skillRoot, GREENFIELD_70_AUDIT_DOC);
const GF71 = path.join(skillRoot, GREENFIELD_71_AUDIT_DOC);
const GF73 = path.join(skillRoot, GREENFIELD_73_AUDIT_DOC);
const GF75 = path.join(skillRoot, GREENFIELD_75_AUDIT_DOC);
const GF75_MAP = path.join(skillRoot, GREENFIELD_75_MAP);

const REQUIRED_RESIDUAL_TITLES = [
  "approved price/entitlement change reopens offer chain and preserves unrelated visuals",
  "approved shipping-platform change reopens selected platform proof only",
  "source correction reopens only the linked claim chain",
  "source metadata/URL change opens freshness review without automatic semantic claim invalidation",
  "four proof layers stay distinct until authority applies consequences",
] as const;

const LANDED_TITLES = [
  "unverified import observation reopens dependents and preserves unrelated proof",
  "a changed import promise review does not stale unrelated local proof",
  "changed inputs hold a prior non-idempotent effect for readback",
  "an activated provider binding reopens only its affected obligations",
] as const;

export function register(harness: Harness): void {
  harness.check("greenfield-76: AC→evidence map covers acceptance + Required-scenarios + live held", () => {
    assert(existsSync(MAP_FILE), "typed map present");
    assert(existsSync(AUDIT_DOC), "rehearsal doc present");
    assert(getGreenfield76Acceptance() === GREENFIELD_76_ACCEPTANCE, "acceptance getter");
    assert(getGreenfield76RequiredScenarios() === GREENFIELD_76_REQUIRED_SCENARIOS, "required-scenarios getter");
    assert(getGreenfield76LiveHeld() === GREENFIELD_76_LIVE_HELD, "live-held getter");
    assert(GREENFIELD_76_ACCEPTANCE.length === 6, "six acceptance rows");
    assert(GREENFIELD_76_REQUIRED_SCENARIOS.length === 6, "six Required-scenario rows");
    assert(GREENFIELD_76_LIVE_HELD.length === 4, "four live-held rows");
    assert(greenfield76AcceptanceDoneOrHeld(), "acceptance done or held");
    assert(greenfield76AllRequiredScenariosDoneOrHeld(), "required scenarios done or held");
    assert(greenfield76AllLiveHeld(), "all live held");
    for (const row of GREENFIELD_76_REQUIRED_SCENARIOS) {
      assert(row.status === "done" || row.status === "held", `${row.id} must be done or held`);
      assert(row.tipPath.length > 0, `${row.id} tip path`);
      assert(row.fixtureName.length > 0, `${row.id} fixture`);
    }
    for (const row of GREENFIELD_76_LIVE_HELD) {
      assert(row.status === "held", `${row.id} must be held`);
    }
    const doneRequired = GREENFIELD_76_REQUIRED_SCENARIOS.filter((r) => r.status === "done");
    assert(doneRequired.length === 6, `all six Required-scenario rows done, got ${doneRequired.length}`);
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(/AC→evidence|Acceptance \/ report → evidence/i.test(audit), "audit names AC map");
    assert(audit.includes(GREENFIELD_76_BASE_MAIN_SHA), "audit pins base SHA");
    assert(audit.includes(GREENFIELD_76_STAMP), "audit pins stamp");
    assert(/STOP → #72|#72 deepen/i.test(audit), "audit names STOP → #72");
    assert(/Required.scenario/i.test(audit), "audit names Required-scenario matrix");
  });

  harness.check("greenfield-76: sequence lock #72 last; next=#72; live=#72; no U5; live held", () => {
    assert(greenfield76SequenceIsLocked(), "sequence locked");
    assert(JSON.stringify([...GREENFIELD_76_U4_REMAINING_SEQUENCE]) === JSON.stringify(["#72"]), "exact remaining order");
    assert(GREENFIELD_76_SKIP_CLOSED === "#74", "skip #74");
    assert(GREENFIELD_76_NEXT_AFTER_CLOSE === "#72", "next after close");
    assert(GREENFIELD_76_LIVE_OWNER === "#72", "live owner");
    assert(GREENFIELD_76_NO_U5 === "#511", "no U5");
    assert(GREENFIELD_76_SEQUENCE_LOCK_NOTE.includes("#72"), "lock note");
    assert(greenfield76AllowsLiveInThisSlice() === false, "no live in #76");
    assert(greenfield76AllowsU5() === false, "no U5");
    assert(GREENFIELD_76_HARD_HOLDS.includes("live-greenfield-benchmark"), "live hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("publish-of-evidence"), "publish hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("measured-onboarding-interval"), "measured interval hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("real-provider-access"), "provider hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("real-billing"), "billing hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("autonomous-external-change-detection"), "external-change hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("sibling-72-impl"), "sibling 72 hold");
  });

  harness.check("greenfield-76: residual Required-scenario rows landed; expected-IDs; four layers; no parallel graph", () => {
    assert(existsSync(BCI) && existsSync(ENGINE) && existsSync(RUN) && existsSync(OS), "tip cascade surfaces present");
    const bci = readFileSync(BCI, "utf8");
    const engine = readFileSync(ENGINE, "utf8");
    const audit = readFileSync(AUDIT_DOC, "utf8");
    for (const title of LANDED_TITLES) {
      assert(bci.includes(title), `landed check present: ${title}`);
    }
    for (const title of REQUIRED_RESIDUAL_TITLES) {
      assert(bci.includes(title), `residual check present: ${title}`);
    }
    assert(/interrupted run resumes/i.test(engine) || engine.includes("needs_readback"), "engine interruption coverage present");
    assert(bci.includes("needs_readback"), "business-change-impact needs_readback coverage");
    assert(GREENFIELD_76_EXPECTED_IDS_NOTE.includes("expected affected/unaffected IDs"), "expected-IDs note");
    assert(GREENFIELD_76_FOUR_LAYERS_NOTE.includes("Structural validity"), "four-layers note");
    assert(GREENFIELD_76_NO_PARALLEL_GRAPH_NOTE.includes("parallel dependency DB"), "no-parallel-graph note");
    assert(greenfield76AllowsParallelDependencyDb() === false, "no parallel dependency DB");
    assert(greenfield76AllowsSecondGraphService() === false, "no second graph service");
    assert(greenfield76AllowsAutomaticPriceMigration() === false, "no automatic price migration");
    assert(greenfield76AllowsWorkerSelfApprove() === false, "worker cannot self-approve");
    assert(GREENFIELD_76_HARD_HOLDS.includes("parallel-dependency-db"), "parallel-db hard hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("second-graph-service"), "second-graph hard hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("worker-self-approve-scope"), "worker-self-approve hard hold");
    assert(/expected.*IDs|Expected-IDs/i.test(audit), "audit states expected-IDs rule");
    assert(/four proof layers|Structural.*semantic.*approved.*runtime/i.test(audit), "audit states four layers");
    assert(/no parallel dependency|second graph/i.test(audit), "audit forbids parallel graph");
    assert(existsSync(CASCADE) && existsSync(REVIEW) && existsSync(LIFE), "cascade/review/lifecycle present");
  });

  harness.check("greenfield-76: coordinate-don't-steal + #66/#70/#71/#73/#75 consume only; live=#72", () => {
    assert(greenfield76StealsCoordinatePins() === false, "do not steal coordinate pins");
    assert(greenfield76Redoes66Umbrella() === false, "do not redo #66");
    assert(greenfield76Redoes70Applicability() === false, "do not redo #70");
    assert(greenfield76Redoes71Handoff() === false, "do not redo #71");
    assert(greenfield76Redoes73Overhead() === false, "do not redo #73");
    assert(greenfield76Redoes75Retrieval() === false, "do not redo #75");
    assert(existsSync(GF66), "#66 rehearsal present to consume");
    assert(existsSync(GF70), "#70 rehearsal present to consume");
    assert(existsSync(GF71), "#71 rehearsal present to consume");
    assert(existsSync(GF73), "#73 rehearsal present to consume");
    assert(existsSync(GF75) && existsSync(GF75_MAP), "#75 closeout present to consume");
    assert(
      JSON.stringify([...GREENFIELD_76_COORDINATE_PINS]) === JSON.stringify(["#38", "#68", "#107", "#117", "#395", "#397", "#403", "#127"]),
      "coordinate pins exact",
    );
    assert(GREENFIELD_76_HARD_HOLDS.includes("steal-38-apple-media"), "38 steal hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("steal-68-plan-projection"), "68 steal hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("steal-107-binding"), "107 steal hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("steal-117-semantic-chain"), "117 steal hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("steal-395-research-pivot"), "395 steal hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("steal-397-research-diagnostics"), "397 steal hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("steal-403-ladder"), "403 steal hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("steal-127-wrong-surface"), "127 steal hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("redo-66-umbrella"), "66 redo hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("redo-70-applicability"), "70 redo hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("redo-71-handoff"), "71 redo hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("redo-73-overhead"), "73 redo hold");
    assert(GREENFIELD_76_HARD_HOLDS.includes("redo-75-retrieval"), "75 redo hold");
    assert(GREENFIELD_76_LIVE_OWNER === "#72", "live → #72");

    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(audit.includes("#38") && audit.includes("#68") && audit.includes("#107") && audit.includes("#117"), "audit coordinates closed owners");
    assert(audit.includes("#395") && audit.includes("#397") && audit.includes("#403") && audit.includes("#127"), "audit coordinates research/surface owners");
    assert(/do not steal|coordinate/i.test(audit), "audit coordinate language");
    assert(existsSync(path.join(skillRoot, GREENFIELD_76_FIXTURE_SUITE)), "closeout suite path");
    assert(existsSync(BENCHMARK), "benchmark protocol present");
  });
}
