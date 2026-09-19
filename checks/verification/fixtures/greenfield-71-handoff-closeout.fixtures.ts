/**
 * #71 handoff / stop-lines closeout fixtures (U4-3 residual).
 *
 * Deterministic only. Pins AC→evidence map integrity, sequence lock after #71,
 * hard holds (live/#72/#75), coordinate-don't-steal, stop-line honesty,
 * catalog fail-closed consume, and handoff ≠ second planner. Does not run live
 * greenfield / publish-of-evidence, redo #66/#70, steal siblings, or invent a
 * second planner.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BUSINESS_HELP_PUBLIC_API,
  GREENFIELD_66_AUDIT_DOC,
  GREENFIELD_70_AUDIT_DOC,
  GREENFIELD_71_ACCEPTANCE,
  GREENFIELD_71_AUDIT_DOC,
  GREENFIELD_71_BASE_MAIN_SHA,
  GREENFIELD_71_BOUNDARIES,
  GREENFIELD_71_CATALOG_MATRIX,
  GREENFIELD_71_COORDINATE_PINS,
  GREENFIELD_71_FIXTURE_SUITE,
  GREENFIELD_71_HARD_HOLDS,
  GREENFIELD_71_HANDOFF_NOTE,
  GREENFIELD_71_HELD_ROWS,
  GREENFIELD_71_INDEPENDENT_JUDGMENT_OWNER,
  GREENFIELD_71_LIVE_OWNER,
  GREENFIELD_71_MAP_PATH,
  GREENFIELD_71_NEXT_AFTER_CLOSE,
  GREENFIELD_71_NO_U5,
  GREENFIELD_71_SEQUENCE_LOCK_NOTE,
  GREENFIELD_71_SKIP_CLOSED,
  GREENFIELD_71_STAMP,
  GREENFIELD_71_STOP_LINE_NOTE,
  GREENFIELD_71_U4_REMAINING_SEQUENCE,
  INITIALIZATION_PUBLIC_API,
  LIFECYCLE_PUBLIC_API,
  LIFECYCLE_SERVICE,
  PORCHWATCH_LIFECYCLE_FIXTURE,
  RECOVERY_PUBLIC_API,
  RESEARCH_DECISION_PUBLIC_API,
  getGreenfield71Acceptance,
  getGreenfield71Boundaries,
  getGreenfield71CatalogMatrix,
  getGreenfield71HeldRows,
  greenfield71AllAcceptanceDone,
  greenfield71AllBoundariesDone,
  greenfield71AllCatalogMatrixDone,
  greenfield71AllowsLiveInThisSlice,
  greenfield71AllowsU5,
  greenfield71BuildsSecondPlanner,
  greenfield71FlipsLiveLaunchProvenFromSynthetic,
  greenfield71Redoes66Umbrella,
  greenfield71Redoes70Applicability,
  greenfield71SequenceIsLocked,
  greenfield71Steals403Ladder,
  greenfield71StealsCoordinatePins,
} from "../../../catalog/providers/greenfield-71-handoff-closeout-map.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const AUDIT_DOC = path.join(skillRoot, GREENFIELD_71_AUDIT_DOC);
const MAP_FILE = path.join(skillRoot, GREENFIELD_71_MAP_PATH);
const LIFECYCLE = path.join(skillRoot, LIFECYCLE_PUBLIC_API);
const INIT = path.join(skillRoot, INITIALIZATION_PUBLIC_API);
const RECOVERY = path.join(skillRoot, RECOVERY_PUBLIC_API);
const RESEARCH = path.join(skillRoot, RESEARCH_DECISION_PUBLIC_API);
const HELP = path.join(skillRoot, BUSINESS_HELP_PUBLIC_API);
const PORCH = path.join(skillRoot, PORCHWATCH_LIFECYCLE_FIXTURE);
const SERVICE = path.join(skillRoot, LIFECYCLE_SERVICE);
const GF66 = path.join(skillRoot, GREENFIELD_66_AUDIT_DOC);
const GF70 = path.join(skillRoot, GREENFIELD_70_AUDIT_DOC);

export function register(harness: Harness): void {
  harness.check("greenfield-71: AC→evidence map covers acceptance + boundaries + catalog matrix", () => {
    assert(existsSync(MAP_FILE), "typed map present");
    assert(existsSync(AUDIT_DOC), "rehearsal doc present");
    assert(getGreenfield71Acceptance() === GREENFIELD_71_ACCEPTANCE, "acceptance getter");
    assert(getGreenfield71Boundaries() === GREENFIELD_71_BOUNDARIES, "boundaries getter");
    assert(getGreenfield71CatalogMatrix() === GREENFIELD_71_CATALOG_MATRIX, "catalog getter");
    assert(getGreenfield71HeldRows() === GREENFIELD_71_HELD_ROWS, "held getter");
    assert(GREENFIELD_71_ACCEPTANCE.length === 5, "five acceptance rows");
    assert(GREENFIELD_71_BOUNDARIES.length === 10, "ten boundary rows");
    assert(GREENFIELD_71_CATALOG_MATRIX.length === 5, "five catalog matrix rows");
    assert(GREENFIELD_71_HELD_ROWS.length === 3, "three held/sibling rows");
    assert(greenfield71AllAcceptanceDone(), "all acceptance done");
    assert(greenfield71AllBoundariesDone(), "all boundaries done");
    assert(greenfield71AllCatalogMatrixDone(), "all catalog matrix done");
    for (const row of [...GREENFIELD_71_ACCEPTANCE, ...GREENFIELD_71_BOUNDARIES, ...GREENFIELD_71_CATALOG_MATRIX]) {
      assert(row.status === "done", `${row.id} must be done`);
      assert(row.tipPath.length > 0, `${row.id} tip path`);
      assert(row.fixtureName.length > 0, `${row.id} fixture`);
    }
    for (const row of GREENFIELD_71_HELD_ROWS) {
      assert(row.status === "held" || row.status === "sibling", `${row.id} held/sibling`);
    }
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(/AC→evidence|acceptance → evidence|Verification \/ acceptance/i.test(audit), "audit names AC map");
    assert(audit.includes(GREENFIELD_71_BASE_MAIN_SHA), "audit pins base SHA");
    assert(audit.includes(GREENFIELD_71_STAMP), "audit pins stamp");
    assert(/STOP → #73|#73 deepen/i.test(audit), "audit names STOP → #73");
  });

  harness.check("greenfield-71: sequence lock #73→#75→#76→#72; next=#73; live=#72; judgment=#75; no U5", () => {
    assert(greenfield71SequenceIsLocked(), "sequence locked");
    assert(JSON.stringify([...GREENFIELD_71_U4_REMAINING_SEQUENCE]) === JSON.stringify(["#73", "#75", "#76", "#72"]), "exact remaining order");
    assert(GREENFIELD_71_SKIP_CLOSED === "#74", "skip #74");
    assert(GREENFIELD_71_NEXT_AFTER_CLOSE === "#73", "next after close");
    assert(GREENFIELD_71_LIVE_OWNER === "#72", "live owner");
    assert(GREENFIELD_71_INDEPENDENT_JUDGMENT_OWNER === "#75", "judgment owner");
    assert(GREENFIELD_71_NO_U5 === "#511", "no U5");
    assert(GREENFIELD_71_SEQUENCE_LOCK_NOTE.includes("#73"), "lock note");
    assert(greenfield71AllowsLiveInThisSlice() === false, "no live in #71");
    assert(greenfield71AllowsU5() === false, "no U5");
    assert(GREENFIELD_71_HARD_HOLDS.includes("live-greenfield-benchmark"), "live hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("publish-of-evidence"), "publish hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("sibling-72-impl"), "sibling 72 hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("sibling-73-impl"), "sibling 73 hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("sibling-75-impl"), "sibling 75 hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("sibling-76-impl"), "sibling 76 hold");
  });

  harness.check("greenfield-71: stop-line honesty + catalog fail-closed + handoff≠second planner", () => {
    assert(existsSync(HELP) && existsSync(LIFECYCLE) && existsSync(SERVICE) && existsSync(PORCH), "tip surfaces present");
    const help = readFileSync(HELP, "utf8");
    const lifecycle = readFileSync(LIFECYCLE, "utf8");
    const service = readFileSync(SERVICE, "utf8");
    const porch = readFileSync(PORCH, "utf8");
    const audit = readFileSync(AUDIT_DOC, "utf8");

    assert(help.includes("deliveryAccepted"), "help pins deliveryAccepted");
    assert(help.includes("liveLaunchProven"), "help pins liveLaunchProven");
    assert(help.includes("store submission"), "help distinguishes store submission");
    assert(GREENFIELD_71_STOP_LINE_NOTE.includes("deliveryAccepted"), "stop-line note");
    assert(greenfield71FlipsLiveLaunchProvenFromSynthetic() === false, "do not flip from synthetic");
    assert(service.includes("liveLaunchProven: false"), "service keeps liveLaunchProven false");

    assert(lifecycle.includes("LOCAL_OPERATION_REFUSED"), "lifecycle pins LOCAL_OPERATION_REFUSED");
    assert(lifecycle.includes("business.catalog_unavailable"), "lifecycle pins catalog_unavailable");
    assert(lifecycle.includes("corrupt catalog"), "corrupt catalog refusal present");
    assert(lifecycle.includes("missing catalog"), "missing catalog refusal present");
    assert(lifecycle.includes("disagrees with the runtime pin"), "mismatched pin refusal present");
    assert(lifecycle.includes("CLI and local MCP"), "CLI/MCP parity present");
    assert(GREENFIELD_71_HARD_HOLDS.includes("silent-catalog-fallback"), "no silent catalog fallback");
    assert(GREENFIELD_71_HARD_HOLDS.includes("auto-repin"), "no auto-repin");

    assert(greenfield71BuildsSecondPlanner() === false, "no second planner");
    assert(GREENFIELD_71_HANDOFF_NOTE.includes("not a second planner"), "handoff note");
    assert(GREENFIELD_71_HARD_HOLDS.includes("second-planner"), "second-planner hard hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("hidden-daemon"), "hidden-daemon hard hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("unbounded-re-dispatch"), "unbounded re-dispatch hard hold");
    assert(porch.includes("accepted_product_required"), "porchwatch pins accepted_product_required");
    assert(porch.includes("needs_reconciliation"), "porchwatch pins needs_reconciliation");
    assert(porch.includes("not_initialized"), "porchwatch pins not_initialized resume");
    assert(/second planner|not a second planner/i.test(audit), "audit forbids second planner");
  });

  harness.check("greenfield-71: coordinate-don't-steal + #66/#70 consume only + composition surfaces present", () => {
    assert(greenfield71Steals403Ladder() === false, "do not steal #403 ladder");
    assert(greenfield71StealsCoordinatePins() === false, "do not steal coordinate pins");
    assert(greenfield71Redoes66Umbrella() === false, "do not redo #66");
    assert(greenfield71Redoes70Applicability() === false, "do not redo #70");
    assert(existsSync(GF66), "#66 rehearsal present to consume");
    assert(existsSync(GF70), "#70 rehearsal present to consume");
    assert(existsSync(INIT) && existsSync(RECOVERY) && existsSync(RESEARCH), "init/recovery/research suites present");
    assert(
      JSON.stringify([...GREENFIELD_71_COORDINATE_PINS]) === JSON.stringify(["#395", "#397", "#402", "#403", "#404", "#405", "#127"]),
      "coordinate pins exact",
    );
    assert(GREENFIELD_71_HARD_HOLDS.includes("steal-403-ladder"), "403 steal hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("steal-402-405-post-build"), "402-405 steal hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("steal-395-research-pivot"), "395 steal hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("steal-127-wrong-surface"), "127 steal hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("redo-66-umbrella"), "66 redo hold");
    assert(GREENFIELD_71_HARD_HOLDS.includes("redo-70-applicability"), "70 redo hold");

    const lifecycle = readFileSync(LIFECYCLE, "utf8");
    const init = readFileSync(INIT, "utf8");
    const recovery = readFileSync(RECOVERY, "utf8");
    const research = readFileSync(RESEARCH, "utf8");
    const porch = readFileSync(PORCH, "utf8");
    assert(lifecycle.includes("accepted initialization"), "lifecycle create/accept/init");
    assert(lifecycle.includes("never repeats effects"), "lifecycle first-run/replay");
    assert(init.includes("forged completed stage"), "init interrupt boundary");
    assert(recovery.includes("settled requests"), "recovery settled-only");
    assert(research.includes("applies once"), "research apply-once");
    assert(research.includes("Pivot checkpoint"), "research Pivot hold");
    assert(porch.includes("product acceptance and initialize stay separate"), "porch accept≠init");
    assert(porch.includes("uncertain research resumes"), "porch research resume");
    assert(porch.includes("absent-directory creation preserves the founder brief"), "porch absent-dir create");
    assert(existsSync(path.join(skillRoot, GREENFIELD_71_FIXTURE_SUITE)), "closeout suite path");

    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(audit.includes("#395") && audit.includes("#403") && audit.includes("#127"), "audit coordinates owners");
    assert(/do not steal|coordinate/i.test(audit), "audit coordinate language");
    assert(/#402|#403|#405/.test(audit), "audit names post-build owners");
    assert(/core handoff matrix|core matrix/i.test(audit), "HoE Q4 core matrix bar");
  });
}
