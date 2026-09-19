/**
 * #72 Path A paper closeout fixtures (U4-7 LAST residual).
 *
 * Deterministic only. Pins AC→evidence map integrity, Path A only,
 * live/publish/measured not performed, protocol ≠ completion,
 * fixtures ≠ live, deliveryAccepted ≠ submitted ≠ released ≠ live,
 * U4 DONE after #72, next=#511 PARKED, #73/#75 Stage B still held,
 * prior U4 consume-only. Does not run live, invent workspace, claim
 * live AC done, unlock Stage B, redo #66–#76, or start #511.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  COMPLETE_BUSINESS_FIXTURE,
  COMPLETE_BUSINESS_SCENARIO,
  EVAL_BASELINES_FIXTURE,
  EVAL_BASELINES_PROTOCOL,
  EVIDENCE_HONESTY,
  GREENFIELD_66_AUDIT_DOC,
  GREENFIELD_70_AUDIT_DOC,
  GREENFIELD_71_AUDIT_DOC,
  GREENFIELD_72_ACCEPTANCE,
  GREENFIELD_72_AUDIT_DOC,
  GREENFIELD_72_BASE_MAIN_SHA,
  GREENFIELD_72_CLOSE_PATH,
  GREENFIELD_72_COMMENT_HOLDS,
  GREENFIELD_72_COORDINATE_PINS,
  GREENFIELD_72_EXECUTION_RECIPE,
  GREENFIELD_72_FIXTURE_SUITE,
  GREENFIELD_72_HARD_HOLDS,
  GREENFIELD_72_MAP_PATH,
  GREENFIELD_72_NEXT_AFTER_CLOSE,
  GREENFIELD_72_NEXT_STATUS,
  GREENFIELD_72_NO_U5,
  GREENFIELD_72_PATH_A_HONESTY,
  GREENFIELD_72_PATH_A_NOTE,
  GREENFIELD_72_PRIOR_U4_CONSUME,
  GREENFIELD_72_REPORT_CONTRACT,
  GREENFIELD_72_SEQUENCE_LOCK_NOTE,
  GREENFIELD_72_SKIP_CLOSED,
  GREENFIELD_72_STAMP,
  GREENFIELD_72_U4_REMAINING_SEQUENCE,
  GREENFIELD_72_U4_STATUS,
  GREENFIELD_73_AUDIT_DOC,
  GREENFIELD_75_AUDIT_DOC,
  GREENFIELD_76_AUDIT_DOC,
  GREENFIELD_76_MAP,
  GREENFIELD_BENCHMARK_PROTOCOL,
  getGreenfield72Acceptance,
  getGreenfield72CommentHolds,
  getGreenfield72ExecutionRecipe,
  getGreenfield72PathAHonesty,
  getGreenfield72ReportContract,
  greenfield72AcceptanceMapped,
  greenfield72AllCommentHoldsHeld,
  greenfield72AllowsLiveInThisSlice,
  greenfield72AllowsMeasuredInterval,
  greenfield72AllowsPublishOfEvidence,
  greenfield72AllowsU5,
  greenfield72ClaimsLiveAcDone,
  greenfield72ClosePathIsPathA,
  greenfield72InventedWorkspace,
  greenfield72NoLiveAcClaimedDone,
  greenfield72PathAHonestyComplete,
  greenfield72RedoesPriorU4,
  greenfield72SequenceIsLocked,
  greenfield72StealsCoordinatePins,
  greenfield72Unlocks73StageB,
  greenfield72Unlocks75StageB,
} from "../../../catalog/providers/greenfield-72-benchmark-closeout-map.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const AUDIT_DOC = path.join(skillRoot, GREENFIELD_72_AUDIT_DOC);
const MAP_FILE = path.join(skillRoot, GREENFIELD_72_MAP_PATH);
const BENCHMARK = path.join(skillRoot, GREENFIELD_BENCHMARK_PROTOCOL);
const EVAL_PROTO = path.join(skillRoot, EVAL_BASELINES_PROTOCOL);
const EVAL_FIX = path.join(skillRoot, EVAL_BASELINES_FIXTURE);
const CB_FIX = path.join(skillRoot, COMPLETE_BUSINESS_FIXTURE);
const CB_SCEN = path.join(skillRoot, COMPLETE_BUSINESS_SCENARIO);
const EVIDENCE = path.join(skillRoot, EVIDENCE_HONESTY);
const GF66 = path.join(skillRoot, GREENFIELD_66_AUDIT_DOC);
const GF70 = path.join(skillRoot, GREENFIELD_70_AUDIT_DOC);
const GF71 = path.join(skillRoot, GREENFIELD_71_AUDIT_DOC);
const GF73 = path.join(skillRoot, GREENFIELD_73_AUDIT_DOC);
const GF75 = path.join(skillRoot, GREENFIELD_75_AUDIT_DOC);
const GF76 = path.join(skillRoot, GREENFIELD_76_AUDIT_DOC);
const GF76_MAP = path.join(skillRoot, GREENFIELD_76_MAP);

export function register(harness: Harness): void {
  harness.check("greenfield-72: AC→evidence map covers acceptance + report + recipe + holds + Path A honesty", () => {
    assert(existsSync(MAP_FILE), "typed map present");
    assert(existsSync(AUDIT_DOC), "rehearsal doc present");
    assert(getGreenfield72Acceptance() === GREENFIELD_72_ACCEPTANCE, "acceptance getter");
    assert(getGreenfield72ReportContract() === GREENFIELD_72_REPORT_CONTRACT, "report getter");
    assert(getGreenfield72ExecutionRecipe() === GREENFIELD_72_EXECUTION_RECIPE, "recipe getter");
    assert(getGreenfield72CommentHolds() === GREENFIELD_72_COMMENT_HOLDS, "comment-holds getter");
    assert(getGreenfield72PathAHonesty() === GREENFIELD_72_PATH_A_HONESTY, "path-a honesty getter");
    assert(GREENFIELD_72_ACCEPTANCE.length === 7, "seven acceptance rows");
    assert(GREENFIELD_72_REPORT_CONTRACT.length === 5, "five report-contract rows");
    assert(GREENFIELD_72_EXECUTION_RECIPE.length === 8, "eight recipe rows");
    assert(GREENFIELD_72_COMMENT_HOLDS.length === 5, "five comment-hold rows");
    assert(GREENFIELD_72_PATH_A_HONESTY.length === 9, "nine Path A honesty rows");
    assert(greenfield72AcceptanceMapped(), "acceptance fully mapped");
    assert(greenfield72PathAHonestyComplete(), "Path A honesty complete");
    assert(greenfield72AllCommentHoldsHeld(), "comment holds held");
    assert(greenfield72NoLiveAcClaimedDone(), "live AC rows not claimed done");
    for (const row of [...GREENFIELD_72_ACCEPTANCE, ...GREENFIELD_72_REPORT_CONTRACT, ...GREENFIELD_72_EXECUTION_RECIPE]) {
      assert(row.tipPath.length > 0, `${row.id} tip path`);
      assert(row.fixtureName.length > 0, `${row.id} fixture`);
    }
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(/AC→evidence|Acceptance \/ closure → evidence/i.test(audit), "audit names AC map");
    assert(audit.includes(GREENFIELD_72_BASE_MAIN_SHA), "audit pins base SHA");
    assert(audit.includes(GREENFIELD_72_STAMP), "audit pins stamp");
    assert(/Path A/i.test(audit), "audit names Path A");
    assert(/live-not-performed|not performed/i.test(audit), "audit states live not performed");
    assert(/U4 DONE/i.test(audit), "audit names U4 DONE");
    assert(/#511.*PARKED|PARKED.*#511/i.test(audit), "audit parks #511");
  });

  harness.check("greenfield-72: Path A only; live/publish/measured not performed; no live AC claim", () => {
    assert(greenfield72ClosePathIsPathA(), "close path is Path A");
    assert(GREENFIELD_72_CLOSE_PATH === "path-a-paper", "close path constant");
    assert(greenfield72AllowsLiveInThisSlice() === false, "no live in #72 Path A");
    assert(greenfield72AllowsPublishOfEvidence() === false, "no publish");
    assert(greenfield72AllowsMeasuredInterval() === false, "no measured interval");
    assert(greenfield72ClaimsLiveAcDone() === false, "does not claim live AC done");
    assert(greenfield72InventedWorkspace() === false, "did not invent workspace");
    assert(GREENFIELD_72_HARD_HOLDS.includes("live-complete-business-benchmark"), "live hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("publish-of-evidence"), "publish hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("measured-onboarding-interval"), "measured hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("claim-live-ac-boxes-done"), "claim-live hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("invent-workspace-mandate-budget"), "invent hold");
    assert(GREENFIELD_72_PATH_A_NOTE.includes("Path A"), "Path A note");
    assert(GREENFIELD_72_PATH_A_NOTE.includes("not performed"), "not-performed in note");
    const honestyIds = GREENFIELD_72_PATH_A_HONESTY.map((r) => r.id);
    assert(honestyIds.includes("honesty-live-not-performed"), "live-not-performed row");
    assert(honestyIds.includes("honesty-publish-not-performed"), "publish-not-performed row");
    assert(honestyIds.includes("honesty-measured-interval-not-performed"), "measured-not-performed row");
    const liveAc = GREENFIELD_72_ACCEPTANCE.find((r) => r.id === "ac-real-attempt-evidence-index");
    assert(liveAc?.status === "n_a_path_a", "real-attempt row is n_a_path_a");
  });

  harness.check("greenfield-72: protocol ≠ completion; fixtures ≠ live; ungraded forbids completion; proof-class separation", () => {
    assert(existsSync(BENCHMARK) && existsSync(EVAL_PROTO) && existsSync(EVAL_FIX), "protocol surfaces present");
    assert(existsSync(CB_FIX) && existsSync(CB_SCEN) && existsSync(EVIDENCE), "complete-business + EVIDENCE present");
    const benchmark = readFileSync(BENCHMARK, "utf8");
    const evidence = readFileSync(EVIDENCE, "utf8");
    const scenario = readFileSync(CB_SCEN, "utf8");
    const cb = readFileSync(CB_FIX, "utf8");
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(
      /protocol PR is progress, not completion|Protocol ≠ completion|protocol ≠ completion/i.test(benchmark) || /progress, not completion/i.test(benchmark),
      "protocol ≠ completion",
    );
    assert(/Current hold/i.test(benchmark), "Current hold retained");
    assert(/Path A paper|Path A — paper|live.*not performed|not performed/i.test(benchmark), "benchmark records Path A paper close");
    assert(/fabricated-receipt|fixtures.*not live|not live-provider/i.test(evidence), "EVIDENCE fixtures ≠ live");
    assert(/ungradedForbidsCompletionClaim:\s*true|ungradedForbidsCompletionClaim/i.test(scenario), "ungraded forbids completion");
    assert(/criteria-frozen/i.test(scenario), "criteria-frozen");
    assert(/ungraded/i.test(cb), "complete-business fixtures assert ungraded");
    assert(/deliveryAccepted|submitted|released|live/i.test(audit), "audit states proof-class separation");
    assert(
      GREENFIELD_72_PATH_A_HONESTY.some((r) => r.id === "honesty-protocol-neq-completion"),
      "protocol honesty row",
    );
    assert(
      GREENFIELD_72_PATH_A_HONESTY.some((r) => r.id === "honesty-fixtures-neq-live"),
      "fixtures honesty row",
    );
    assert(
      GREENFIELD_72_PATH_A_HONESTY.some((r) => r.id === "honesty-deliveryAccepted-chain"),
      "deliveryAccepted honesty row",
    );
    assert(GREENFIELD_72_HARD_HOLDS.includes("second-telemetry-platform"), "no second telemetry");
    assert(GREENFIELD_72_HARD_HOLDS.includes("parallel-acceptance-store"), "no parallel acceptance store");
  });

  harness.check("greenfield-72: U4 DONE; next=#511 PARKED; #73/#75 Stage B still held; prior U4 consume only", () => {
    assert(greenfield72SequenceIsLocked(), "sequence locked");
    assert(GREENFIELD_72_U4_REMAINING_SEQUENCE.length === 0, "U4 remaining empty");
    assert(GREENFIELD_72_U4_STATUS === "DONE", "U4 DONE");
    assert(GREENFIELD_72_SKIP_CLOSED === "#74", "skip #74");
    assert(GREENFIELD_72_NEXT_AFTER_CLOSE === "#511", "next after close");
    assert(GREENFIELD_72_NEXT_STATUS === "PARKED", "next PARKED");
    assert(GREENFIELD_72_NO_U5 === "#511", "no U5");
    assert(greenfield72AllowsU5() === false, "allows U5 false");
    assert(greenfield72Unlocks73StageB() === false, "does not unlock #73 Stage B");
    assert(greenfield72Unlocks75StageB() === false, "does not unlock #75 Stage B");
    assert(GREENFIELD_72_HARD_HOLDS.includes("unlock-73-stage-b"), "73 Stage B hard hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("unlock-75-paid-stage-b"), "75 Stage B hard hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("u5-511-auto-start"), "511 auto-start hold");
    assert(GREENFIELD_72_SEQUENCE_LOCK_NOTE.includes("U4 DONE"), "lock note U4 DONE");
    assert(GREENFIELD_72_SEQUENCE_LOCK_NOTE.includes("PARKED"), "lock note PARKED");
    assert(
      GREENFIELD_72_PATH_A_HONESTY.some((r) => r.id === "honesty-73-stage-b-still-held"),
      "73 Stage B honesty",
    );
    assert(
      GREENFIELD_72_PATH_A_HONESTY.some((r) => r.id === "honesty-75-stage-b-still-held"),
      "75 Stage B honesty",
    );
    assert(
      GREENFIELD_72_PATH_A_HONESTY.some((r) => r.id === "honesty-511-parked"),
      "511 parked honesty",
    );

    assert(greenfield72RedoesPriorU4() === false, "do not redo prior U4");
    assert(greenfield72StealsCoordinatePins() === false, "do not steal coordinates");
    assert(JSON.stringify([...GREENFIELD_72_PRIOR_U4_CONSUME]) === JSON.stringify(["#66", "#70", "#71", "#73", "#75", "#76"]), "prior U4 consume exact");
    assert(
      JSON.stringify([...GREENFIELD_72_COORDINATE_PINS]) === JSON.stringify(["#88", "#2", "#25", "#52", "#65", "#403", "#101", "#106"]),
      "coordinate pins exact",
    );
    assert(existsSync(GF66) && existsSync(GF70) && existsSync(GF71), "#66/#70/#71 present to consume");
    assert(existsSync(GF73) && existsSync(GF75) && existsSync(GF76) && existsSync(GF76_MAP), "#73/#75/#76 present to consume");
    assert(GREENFIELD_72_HARD_HOLDS.includes("redo-66-umbrella"), "66 redo hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("redo-76-change-impact"), "76 redo hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("steal-88-expo"), "88 steal hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("formation"), "formation hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("app-review"), "app-review hold");
    assert(GREENFIELD_72_HARD_HOLDS.includes("prices"), "prices hold");
    assert(existsSync(path.join(skillRoot, GREENFIELD_72_FIXTURE_SUITE)), "closeout suite path");

    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(/Stage B.*held|#73 Stage B/i.test(audit), "audit holds #73 Stage B");
    assert(/#75.*Stage B|paid Stage B/i.test(audit), "audit holds #75 Stage B");
    assert(/consume only|do not rebuild/i.test(audit), "audit consume language");
    assert(/STOP/i.test(audit), "audit STOP");
  });
}
