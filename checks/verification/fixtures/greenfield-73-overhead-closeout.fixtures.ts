/**
 * #73 Stage A retain closeout fixtures (U4-4 residual).
 *
 * Deterministic only. Pins AC→evidence map integrity, sequence lock after #73
 * (#75→#76→#72 last), Stage A retain valid closeout, Stage B held, Leave-open
 * flipped, no fake consolidation, coordinate-don't-steal #75/#403/#395/#397/#127,
 * #38 Apple media independent keep. Does not run live greenfield / invent
 * measured interval, Stage B merge, redo #66/#70/#71, or steal siblings.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  EVAL_BASELINES_FIXTURE,
  EVAL_BASELINES_PROTOCOL,
  GREENFIELD_66_AUDIT_DOC,
  GREENFIELD_66_FIXTURE,
  GREENFIELD_70_AUDIT_DOC,
  GREENFIELD_71_AUDIT_DOC,
  GREENFIELD_73_ACCEPTANCE,
  GREENFIELD_73_AUDIT_DOC,
  GREENFIELD_73_BASE_MAIN_SHA,
  GREENFIELD_73_COORDINATE_PINS,
  GREENFIELD_73_FIXTURE_SUITE,
  GREENFIELD_73_HARD_HOLDS,
  GREENFIELD_73_INDEPENDENT_JUDGMENT_OWNER,
  GREENFIELD_73_LIVE_OWNER,
  GREENFIELD_73_MAP_PATH,
  GREENFIELD_73_NEXT_AFTER_CLOSE,
  GREENFIELD_73_NO_FAKE_SAVINGS_NOTE,
  GREENFIELD_73_NO_U5,
  GREENFIELD_73_RETAIN_CLOSEOUT_NOTE,
  GREENFIELD_73_SEQUENCE_LOCK_NOTE,
  GREENFIELD_73_SKIP_CLOSED,
  GREENFIELD_73_STAGE_A,
  GREENFIELD_73_STAGE_B_HELD,
  GREENFIELD_73_STAMP,
  GREENFIELD_73_U4_REMAINING_SEQUENCE,
  GREENFIELD_BENCHMARK_PROTOCOL,
  PRODUCT_EXPERIENCE_WORKFLOWS,
  WORKFLOW_OVERHEAD_BOUNDARIES,
  getGreenfield73Acceptance,
  getGreenfield73StageA,
  getGreenfield73StageBHeld,
  greenfield73AcceptanceDoneOrHeld,
  greenfield73AllStageADone,
  greenfield73AllStageBHeld,
  greenfield73AllowsLiveInThisSlice,
  greenfield73AllowsStageBConsolidation,
  greenfield73AllowsU5,
  greenfield73AllowsWorkPackageSuite,
  greenfield73ClaimsFakeSavingsFromWorkflowCount,
  greenfield73MergesAppleMedia,
  greenfield73Redoes66Umbrella,
  greenfield73Redoes70Applicability,
  greenfield73Redoes71Handoff,
  greenfield73SequenceIsLocked,
  greenfield73StealsCoordinatePins,
} from "../../../catalog/providers/greenfield-73-overhead-closeout-map.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const AUDIT_DOC = path.join(skillRoot, GREENFIELD_73_AUDIT_DOC);
const MAP_FILE = path.join(skillRoot, GREENFIELD_73_MAP_PATH);
const BOUNDARIES = path.join(skillRoot, WORKFLOW_OVERHEAD_BOUNDARIES);
const PROTOCOL = path.join(skillRoot, EVAL_BASELINES_PROTOCOL);
const BENCHMARK = path.join(skillRoot, GREENFIELD_BENCHMARK_PROTOCOL);
const EVAL_FIXTURE = path.join(skillRoot, EVAL_BASELINES_FIXTURE);
const GF66_DOC = path.join(skillRoot, GREENFIELD_66_AUDIT_DOC);
const GF66_FIX = path.join(skillRoot, GREENFIELD_66_FIXTURE);
const GF70 = path.join(skillRoot, GREENFIELD_70_AUDIT_DOC);
const GF71 = path.join(skillRoot, GREENFIELD_71_AUDIT_DOC);
const PRODUCT_EXPERIENCE = path.join(skillRoot, PRODUCT_EXPERIENCE_WORKFLOWS);
const WORK_PACKAGE_SUITE = path.join(skillRoot, "checks/verification/fixtures/work-package-equivalence.fixtures.ts");

export function register(harness: Harness): void {
  harness.check("greenfield-73: AC→evidence map covers acceptance + Stage A + Stage B held", () => {
    assert(existsSync(MAP_FILE), "typed map present");
    assert(existsSync(AUDIT_DOC), "rehearsal doc present");
    assert(getGreenfield73Acceptance() === GREENFIELD_73_ACCEPTANCE, "acceptance getter");
    assert(getGreenfield73StageA() === GREENFIELD_73_STAGE_A, "stage A getter");
    assert(getGreenfield73StageBHeld() === GREENFIELD_73_STAGE_B_HELD, "stage B getter");
    assert(GREENFIELD_73_ACCEPTANCE.length === 6, "six acceptance rows");
    assert(GREENFIELD_73_STAGE_A.length === 6, "six Stage A rows");
    assert(GREENFIELD_73_STAGE_B_HELD.length === 3, "three Stage B held rows");
    assert(greenfield73AcceptanceDoneOrHeld(), "acceptance done or held");
    assert(greenfield73AllStageADone(), "all Stage A done");
    assert(greenfield73AllStageBHeld(), "all Stage B held");
    for (const row of GREENFIELD_73_STAGE_A) {
      assert(row.status === "done", `${row.id} must be done`);
      assert(row.tipPath.length > 0, `${row.id} tip path`);
      assert(row.fixtureName.length > 0, `${row.id} fixture`);
    }
    for (const row of GREENFIELD_73_STAGE_B_HELD) {
      assert(row.status === "held", `${row.id} must be held`);
    }
    const doneIds = GREENFIELD_73_ACCEPTANCE.filter((r) => r.status === "done").map((r) => r.id);
    const heldIds = GREENFIELD_73_ACCEPTANCE.filter((r) => r.status === "held").map((r) => r.id);
    assert(doneIds.length === 4, `four acceptance done, got ${doneIds.length}`);
    assert(heldIds.length === 2, `two acceptance held, got ${heldIds.length}`);
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(/AC→evidence|Acceptance \/ decision report → evidence/i.test(audit), "audit names AC map");
    assert(audit.includes(GREENFIELD_73_BASE_MAIN_SHA), "audit pins base SHA");
    assert(audit.includes(GREENFIELD_73_STAMP), "audit pins stamp");
    assert(/STOP → #75|#75 deepen/i.test(audit), "audit names STOP → #75");
    assert(/closed on Stage A retain/i.test(audit), "audit names closed on Stage A retain");
  });

  harness.check("greenfield-73: sequence lock #75→#76→#72; next=#75; live=#72; judgment=#75; no U5", () => {
    assert(greenfield73SequenceIsLocked(), "sequence locked");
    assert(JSON.stringify([...GREENFIELD_73_U4_REMAINING_SEQUENCE]) === JSON.stringify(["#75", "#76", "#72"]), "exact remaining order");
    assert(GREENFIELD_73_SKIP_CLOSED === "#74", "skip #74");
    assert(GREENFIELD_73_NEXT_AFTER_CLOSE === "#75", "next after close");
    assert(GREENFIELD_73_LIVE_OWNER === "#72", "live owner");
    assert(GREENFIELD_73_INDEPENDENT_JUDGMENT_OWNER === "#75", "judgment owner");
    assert(GREENFIELD_73_NO_U5 === "#511", "no U5");
    assert(GREENFIELD_73_SEQUENCE_LOCK_NOTE.includes("#75"), "lock note");
    assert(greenfield73AllowsLiveInThisSlice() === false, "no live in #73");
    assert(greenfield73AllowsU5() === false, "no U5");
    assert(GREENFIELD_73_HARD_HOLDS.includes("live-greenfield-benchmark"), "live hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("publish-of-evidence"), "publish hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("measured-onboarding-interval"), "measured interval hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("sibling-72-impl"), "sibling 72 hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("sibling-75-impl"), "sibling 75 hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("sibling-76-impl"), "sibling 76 hold");
  });

  harness.check("greenfield-73: Stage A retain valid closeout; Leave-open flipped; Stage B held; no fake consolidation", () => {
    assert(existsSync(BOUNDARIES) && existsSync(PROTOCOL) && existsSync(BENCHMARK) && existsSync(EVAL_FIXTURE), "tip surfaces present");
    const table = readFileSync(BOUNDARIES, "utf8");
    const protocol = readFileSync(PROTOCOL, "utf8");
    const benchmark = readFileSync(BENCHMARK, "utf8");
    const evalFixture = readFileSync(EVAL_FIXTURE, "utf8");
    const audit = readFileSync(AUDIT_DOC, "utf8");

    assert(table.includes("**Retain the current graph.**"), "table retains graph");
    assert(table.includes("Observed cost is **unknown**"), "table unknown cost");
    assert(table.includes("independent-effect boundary"), "Apple media independent");
    assert(table.includes("| keep |"), "all keep actions");
    assert(!table.includes("| consolidate |") && !table.includes("| merge |"), "no consolidate/merge action");

    assert(protocol.includes("closed on Stage A retain"), "protocol closed on Stage A retain");
    assert(!protocol.includes("Leave #73 open"), "Leave #73 open must be gone");
    assert(protocol.includes("retain the current graph"), "protocol retain language");
    assert(/Stage B|measured.*held|#72/i.test(protocol), "protocol holds Stage B / #72");

    assert(benchmark.includes("retain the current graph"), "benchmark retain");
    assert(benchmark.includes("closed on Stage A retain") || benchmark.includes("#73 closes on this Stage A retain"), "benchmark closeout note");

    assert(evalFixture.includes('protocol.includes("closed on Stage A retain")'), "fixture assert updated");
    assert(evalFixture.includes('!protocol.includes("Leave #73 open")'), "Leave-open negatively asserted");
    assert(evalFixture.includes("work-package-equivalence.fixtures.ts"), "still asserts suite absent");

    assert(!existsSync(WORK_PACKAGE_SUITE), "work-package-equivalence suite must stay absent");
    assert(greenfield73AllowsWorkPackageSuite() === false, "no work-package suite");
    assert(greenfield73AllowsStageBConsolidation() === false, "no Stage B");
    assert(greenfield73ClaimsFakeSavingsFromWorkflowCount() === false, "no fake savings");
    assert(greenfield73MergesAppleMedia() === false, "do not merge Apple media");
    assert(GREENFIELD_73_RETAIN_CLOSEOUT_NOTE.includes("closed on Stage A retain"), "retain note");
    assert(GREENFIELD_73_NO_FAKE_SAVINGS_NOTE.includes("workflow-count alone"), "no-fake-savings note");
    assert(GREENFIELD_73_HARD_HOLDS.includes("stage-b-consolidation"), "Stage B hard hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("work-package-equivalence-suite"), "work-package hard hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("fake-overhead-savings-from-workflow-count"), "fake-savings hard hold");
    assert(/Leave-open flip|Leave #73 open/i.test(audit), "audit documents Leave-open flip");
    assert(/Stage B.*held|held → #72/i.test(audit), "audit holds Stage B");
  });

  harness.check("greenfield-73: coordinate-don't-steal + #66/#70/#71 consume only + Apple media keep", () => {
    assert(greenfield73StealsCoordinatePins() === false, "do not steal coordinate pins");
    assert(greenfield73Redoes66Umbrella() === false, "do not redo #66");
    assert(greenfield73Redoes70Applicability() === false, "do not redo #70");
    assert(greenfield73Redoes71Handoff() === false, "do not redo #71");
    assert(existsSync(GF66_DOC) && existsSync(GF66_FIX), "#66 surfaces present to consume");
    assert(existsSync(GF70), "#70 rehearsal present to consume");
    assert(existsSync(GF71), "#71 rehearsal present to consume");
    assert(existsSync(PRODUCT_EXPERIENCE), "product-experience present");
    assert(JSON.stringify([...GREENFIELD_73_COORDINATE_PINS]) === JSON.stringify(["#75", "#403", "#395", "#397", "#127"]), "coordinate pins exact");
    assert(GREENFIELD_73_HARD_HOLDS.includes("steal-75-retrieval"), "75 steal hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("steal-403-ladder"), "403 steal hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("steal-395-research-pivot"), "395 steal hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("steal-397-research-diagnostics"), "397 steal hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("steal-127-wrong-surface"), "127 steal hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("redo-66-umbrella"), "66 redo hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("redo-70-applicability"), "70 redo hold");
    assert(GREENFIELD_73_HARD_HOLDS.includes("redo-71-handoff"), "71 redo hold");

    const gf66 = readFileSync(GF66_FIX, "utf8");
    assert(gf66.includes("overheadSavingsFromWorkflowCountAlone") || gf66.includes("refuse-fake-overhead-savings"), "#66 refuse-fake-savings intact");
    assert(gf66.includes("stageARetainRequired") || gf66.includes("Stage A"), "#66 Stage A retain intact");

    const table = readFileSync(BOUNDARIES, "utf8");
    assert(table.includes("apple-store-media-standing-envelope") || table.includes("independent-effect boundary"), "Apple media row present");
    assert(table.includes("Not an onboarding node") || table.includes("independent-effect"), "Apple media not onboarding");

    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(audit.includes("#75") && audit.includes("#403") && audit.includes("#127"), "audit coordinates owners");
    assert(audit.includes("#395") && audit.includes("#397"), "audit coordinates research owners");
    assert(/do not steal|coordinate/i.test(audit), "audit coordinate language");
    assert(existsSync(path.join(skillRoot, GREENFIELD_73_FIXTURE_SUITE)), "closeout suite path");
  });
}
