/**
 * #75 Stage A no-change closeout fixtures (U4-5 residual).
 *
 * Deterministic only. Pins AC→evidence map integrity, sequence lock after #75
 * (#76→#72 last), Stage A no-change valid closeout, Stage B held, Leave-open
 * flipped, no vector/embeddings/graph, coordinate-don't-steal listed siblings,
 * independent judgment → #75; live → #72. Does not run live greenfield / invent
 * measured interval, paid Stage B, redo #66/#70/#71/#73, or steal siblings.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  CATALOG_INDEX,
  DESIGN_FOUNDATION_FIXTURE,
  EVAL_BASELINES_FIXTURE,
  EVAL_BASELINES_PROTOCOL,
  GREENFIELD_66_AUDIT_DOC,
  GREENFIELD_66_FIXTURE,
  GREENFIELD_70_AUDIT_DOC,
  GREENFIELD_71_AUDIT_DOC,
  GREENFIELD_73_AUDIT_DOC,
  GREENFIELD_75_ACCEPTANCE,
  GREENFIELD_75_AUDIT_DOC,
  GREENFIELD_75_BASE_MAIN_SHA,
  GREENFIELD_75_COORDINATE_PINS,
  GREENFIELD_75_FIXTURE_SUITE,
  GREENFIELD_75_HARD_HOLDS,
  GREENFIELD_75_INDEPENDENT_JUDGMENT_OWNER,
  GREENFIELD_75_LIVE_OWNER,
  GREENFIELD_75_MAP_PATH,
  GREENFIELD_75_NEXT_AFTER_CLOSE,
  GREENFIELD_75_NO_CHANGE_CLOSEOUT_NOTE,
  GREENFIELD_75_NO_INFRA_NOTE,
  GREENFIELD_75_NO_U5,
  GREENFIELD_75_SEQUENCE_LOCK_NOTE,
  GREENFIELD_75_SKIP_CLOSED,
  GREENFIELD_75_STAGE_A,
  GREENFIELD_75_STAGE_B_HELD,
  GREENFIELD_75_STAMP,
  GREENFIELD_75_U4_REMAINING_SEQUENCE,
  GREENFIELD_BENCHMARK_PROTOCOL,
  HOSTED_DISCOVERY_FIXTURE,
  KNOWLEDGE_SERVICE,
  NODE_BRIEF,
  STAGE_A_CASES,
  STORE_UTTERANCES,
  getGreenfield75Acceptance,
  getGreenfield75StageA,
  getGreenfield75StageBHeld,
  greenfield75AcceptanceDoneOrHeld,
  greenfield75AllStageADone,
  greenfield75AllStageBHeld,
  greenfield75AllowsLiveInThisSlice,
  greenfield75AllowsMatchWorkflowsInCatalog,
  greenfield75AllowsPaidStageB,
  greenfield75AllowsU5,
  greenfield75AllowsVectorStore,
  greenfield75ClaimsUsabilityFromCiAlone,
  greenfield75Redoes66Umbrella,
  greenfield75Redoes70Applicability,
  greenfield75Redoes71Handoff,
  greenfield75Redoes73Overhead,
  greenfield75SequenceIsLocked,
  greenfield75StealsCoordinatePins,
  greenfield75TunesAgainstHeldOut,
} from "../../../catalog/providers/greenfield-75-retrieval-closeout-map.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const AUDIT_DOC = path.join(skillRoot, GREENFIELD_75_AUDIT_DOC);
const MAP_FILE = path.join(skillRoot, GREENFIELD_75_MAP_PATH);
const PROTOCOL = path.join(skillRoot, EVAL_BASELINES_PROTOCOL);
const EVAL_FIXTURE = path.join(skillRoot, EVAL_BASELINES_FIXTURE);
const STAGE_A = path.join(skillRoot, STAGE_A_CASES);
const HOSTED = path.join(skillRoot, HOSTED_DISCOVERY_FIXTURE);
const DESIGN = path.join(skillRoot, DESIGN_FOUNDATION_FIXTURE);
const SERVICE = path.join(skillRoot, KNOWLEDGE_SERVICE);
const BRIEF = path.join(skillRoot, NODE_BRIEF);
const CATALOG = path.join(skillRoot, CATALOG_INDEX);
const BENCHMARK = path.join(skillRoot, GREENFIELD_BENCHMARK_PROTOCOL);
const STORE = path.join(skillRoot, STORE_UTTERANCES);
const GF66_DOC = path.join(skillRoot, GREENFIELD_66_AUDIT_DOC);
const GF66_FIX = path.join(skillRoot, GREENFIELD_66_FIXTURE);
const GF70 = path.join(skillRoot, GREENFIELD_70_AUDIT_DOC);
const GF71 = path.join(skillRoot, GREENFIELD_71_AUDIT_DOC);
const GF73 = path.join(skillRoot, GREENFIELD_73_AUDIT_DOC);
const PACKAGE_JSON = path.join(skillRoot, "package.json");

const FORBIDDEN_RETRIEVAL_INFRA = ["pinecone", "chromadb", "weaviate", "qdrant", "@xenova/transformers"] as const;

export function register(harness: Harness): void {
  harness.check("greenfield-75: AC→evidence map covers acceptance + Stage A + Stage B held", () => {
    assert(existsSync(MAP_FILE), "typed map present");
    assert(existsSync(AUDIT_DOC), "rehearsal doc present");
    assert(getGreenfield75Acceptance() === GREENFIELD_75_ACCEPTANCE, "acceptance getter");
    assert(getGreenfield75StageA() === GREENFIELD_75_STAGE_A, "stage A getter");
    assert(getGreenfield75StageBHeld() === GREENFIELD_75_STAGE_B_HELD, "stage B getter");
    assert(GREENFIELD_75_ACCEPTANCE.length === 6, "six acceptance rows");
    assert(GREENFIELD_75_STAGE_A.length === 5, "five Stage A rows");
    assert(GREENFIELD_75_STAGE_B_HELD.length === 3, "three Stage B held rows");
    assert(greenfield75AcceptanceDoneOrHeld(), "acceptance done or held");
    assert(greenfield75AllStageADone(), "all Stage A done");
    assert(greenfield75AllStageBHeld(), "all Stage B held");
    for (const row of GREENFIELD_75_STAGE_A) {
      assert(row.status === "done", `${row.id} must be done`);
      assert(row.tipPath.length > 0, `${row.id} tip path`);
      assert(row.fixtureName.length > 0, `${row.id} fixture`);
    }
    for (const row of GREENFIELD_75_STAGE_B_HELD) {
      assert(row.status === "held", `${row.id} must be held`);
    }
    const doneIds = GREENFIELD_75_ACCEPTANCE.filter((r) => r.status === "done").map((r) => r.id);
    const heldIds = GREENFIELD_75_ACCEPTANCE.filter((r) => r.status === "held").map((r) => r.id);
    assert(doneIds.length === 5, `five acceptance done, got ${doneIds.length}`);
    assert(heldIds.length === 1, `one acceptance held, got ${heldIds.length}`);
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(/AC→evidence|Acceptance \/ report → evidence/i.test(audit), "audit names AC map");
    assert(audit.includes(GREENFIELD_75_BASE_MAIN_SHA), "audit pins base SHA");
    assert(audit.includes(GREENFIELD_75_STAMP), "audit pins stamp");
    assert(/STOP → #76|#76 deepen/i.test(audit), "audit names STOP → #76");
    assert(/closed on Stage A no-change/i.test(audit), "audit names closed on Stage A no-change");
  });

  harness.check("greenfield-75: sequence lock #76→#72; next=#76; live=#72; judgment=#75; no U5", () => {
    assert(greenfield75SequenceIsLocked(), "sequence locked");
    assert(JSON.stringify([...GREENFIELD_75_U4_REMAINING_SEQUENCE]) === JSON.stringify(["#76", "#72"]), "exact remaining order");
    assert(GREENFIELD_75_SKIP_CLOSED === "#74", "skip #74");
    assert(GREENFIELD_75_NEXT_AFTER_CLOSE === "#76", "next after close");
    assert(GREENFIELD_75_LIVE_OWNER === "#72", "live owner");
    assert(GREENFIELD_75_INDEPENDENT_JUDGMENT_OWNER === "#75", "judgment owner");
    assert(GREENFIELD_75_NO_U5 === "#511", "no U5");
    assert(GREENFIELD_75_SEQUENCE_LOCK_NOTE.includes("#76"), "lock note");
    assert(greenfield75AllowsLiveInThisSlice() === false, "no live in #75");
    assert(greenfield75AllowsPaidStageB() === false, "no paid Stage B");
    assert(greenfield75AllowsU5() === false, "no U5");
    assert(GREENFIELD_75_HARD_HOLDS.includes("live-greenfield-benchmark"), "live hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("publish-of-evidence"), "publish hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("measured-onboarding-interval"), "measured interval hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("paid-stage-b-worker-eval"), "Stage B hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("sibling-72-impl"), "sibling 72 hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("sibling-76-impl"), "sibling 76 hold");
  });

  harness.check("greenfield-75: Stage A no-change valid closeout; Leave-open flipped; Stage B held; no vector infra", () => {
    assert(existsSync(PROTOCOL) && existsSync(EVAL_FIXTURE) && existsSync(STAGE_A) && existsSync(SERVICE), "tip surfaces present");
    const protocol = readFileSync(PROTOCOL, "utf8");
    const evalFixture = readFileSync(EVAL_FIXTURE, "utf8");
    const stageA = readFileSync(STAGE_A, "utf8");
    const service = readFileSync(SERVICE, "utf8");
    const catalog = readFileSync(CATALOG, "utf8");
    const packageJson = readFileSync(PACKAGE_JSON, "utf8");
    const audit = readFileSync(AUDIT_DOC, "utf8");
    const benchmark = readFileSync(BENCHMARK, "utf8");

    assert(protocol.includes("no-change recommendation") || protocol.includes("Recommendation: no-change"), "protocol no-change");
    assert(protocol.includes("closed on Stage A no-change"), "protocol closed on Stage A no-change");
    assert(!protocol.includes("Leave #75 open"), "Leave #75 open must be gone");
    assert(protocol.includes("No vector store, embeddings, or graph database"), "protocol forbids vector infra");
    assert(protocol.includes("Do not extract `matchWorkflows` into hosted `catalog()`"), "protocol forbids matchWorkflows extract");
    assert(/Paid Stage B|Stage B.*held/i.test(protocol), "protocol holds Stage B");
    assert(/#72/i.test(protocol), "protocol names #72 for live hold");

    assert(evalFixture.includes('protocol.includes("closed on Stage A no-change")'), "fixture assert updated");
    assert(evalFixture.includes('!protocol.includes("Leave #75 open")'), "Leave-open negatively asserted");
    assert(evalFixture.includes("no-change recommendation") || evalFixture.includes("No vector store"), "fixture keeps no-change infra asserts");

    assert(stageA.includes('"issue": 75') || stageA.includes('"issue":75') || /"issue"\s*:\s*75/.test(stageA), "stage-a cases pin issue 75");
    assert(service.includes("BM25"), "BM25 stays");
    assert(!catalog.includes("matchWorkflows"), "hosted catalog must not import matchWorkflows");
    for (const name of FORBIDDEN_RETRIEVAL_INFRA) {
      assert(!packageJson.includes(name), `package.json must not add ${name}`);
    }

    assert(greenfield75AllowsVectorStore() === false, "no vector store");
    assert(greenfield75AllowsMatchWorkflowsInCatalog() === false, "no matchWorkflows in catalog");
    assert(greenfield75AllowsPaidStageB() === false, "no paid Stage B");
    assert(greenfield75ClaimsUsabilityFromCiAlone() === false, "no usability-from-CI claim");
    assert(greenfield75TunesAgainstHeldOut() === false, "no held-out tuning");
    assert(GREENFIELD_75_NO_CHANGE_CLOSEOUT_NOTE.includes("closed on Stage A no-change"), "no-change note");
    assert(GREENFIELD_75_NO_INFRA_NOTE.includes("vector store"), "no-infra note");
    assert(GREENFIELD_75_HARD_HOLDS.includes("vector-store"), "vector hard hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("embeddings-index"), "embeddings hard hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("graph-database"), "graph hard hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("extract-matchWorkflows-into-hosted-catalog"), "matchWorkflows hard hold");
    assert(/Leave-open flip|Leave #75 open/i.test(audit), "audit documents Leave-open flip");
    assert(/Stage B.*held|held/i.test(audit), "audit holds Stage B");
    assert(benchmark.includes("closed on Stage A no-change") || benchmark.includes("#75 closes on this Stage A no-change"), "benchmark closeout note");
  });

  harness.check("greenfield-75: coordinate-don't-steal + #66/#70/#71/#73 consume only; judgment=#75; live=#72", () => {
    assert(greenfield75StealsCoordinatePins() === false, "do not steal coordinate pins");
    assert(greenfield75Redoes66Umbrella() === false, "do not redo #66");
    assert(greenfield75Redoes70Applicability() === false, "do not redo #70");
    assert(greenfield75Redoes71Handoff() === false, "do not redo #71");
    assert(greenfield75Redoes73Overhead() === false, "do not redo #73");
    assert(existsSync(GF66_DOC) && existsSync(GF66_FIX), "#66 surfaces present to consume");
    assert(existsSync(GF70), "#70 rehearsal present to consume");
    assert(existsSync(GF71), "#71 rehearsal present to consume");
    assert(existsSync(GF73), "#73 rehearsal present to consume");
    assert(existsSync(HOSTED) && existsSync(DESIGN), "discovery fixtures present");
    assert(existsSync(BRIEF) && existsSync(STORE), "brief + store corpus present");
    assert(
      JSON.stringify([...GREENFIELD_75_COORDINATE_PINS]) === JSON.stringify(["#378", "#392", "#395", "#397", "#403", "#127", "#39", "#40"]),
      "coordinate pins exact",
    );
    assert(GREENFIELD_75_HARD_HOLDS.includes("steal-378-task-skill"), "378 steal hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("steal-392-astra"), "392 steal hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("steal-395-research-pivot"), "395 steal hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("steal-397-research-diagnostics"), "397 steal hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("steal-403-ladder"), "403 steal hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("steal-127-wrong-surface"), "127 steal hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("steal-39-scorer"), "39 steal hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("steal-40-wording"), "40 steal hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("redo-66-umbrella"), "66 redo hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("redo-70-applicability"), "70 redo hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("redo-71-handoff"), "71 redo hold");
    assert(GREENFIELD_75_HARD_HOLDS.includes("redo-73-overhead"), "73 redo hold");
    assert(GREENFIELD_75_INDEPENDENT_JUDGMENT_OWNER === "#75", "judgment → #75");
    assert(GREENFIELD_75_LIVE_OWNER === "#72", "live → #72");

    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(audit.includes("#378") && audit.includes("#392") && audit.includes("#403"), "audit coordinates addenda owners");
    assert(audit.includes("#395") && audit.includes("#397") && audit.includes("#127"), "audit coordinates research/surface owners");
    assert(audit.includes("#39") && audit.includes("#40"), "audit coordinates scorer/wording owners");
    assert(/do not steal|coordinate/i.test(audit), "audit coordinate language");
    assert(/independent judgment|#75/i.test(audit), "audit judgment ownership");
    assert(existsSync(path.join(skillRoot, GREENFIELD_75_FIXTURE_SUITE)), "closeout suite path");
  });
}
