/**
 * #395 Pivot/hold + post-audit continuation closeout fixtures (U6 R1).
 *
 * Deterministic only. Proves AC1–AC7 + ownership holds + scenario map integrity.
 * Consumes prior #395 increments; does not redo #397 or rewrite #74. No npm.
 * Fixture success ≠ live business proof (#74) or real-agent efficiency (#75).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  RESEARCH_395_AC,
  RESEARCH_395_ADR,
  RESEARCH_395_ARTIFACT_CONTRACTS,
  RESEARCH_395_AUDIT_DOC,
  RESEARCH_395_AUTHORING,
  RESEARCH_395_BASE_MAIN_SHA,
  RESEARCH_395_CHECKPOINT,
  RESEARCH_395_CONSUMES,
  RESEARCH_395_COORDINATES,
  RESEARCH_395_CORE_FIXTURES,
  RESEARCH_395_FIXTURE,
  RESEARCH_395_ISSUE,
  RESEARCH_395_MAP_PATH,
  RESEARCH_395_NEXT_AFTER_CLOSE,
  RESEARCH_395_NO_74_REWRITE,
  RESEARCH_395_NO_397_REDO,
  RESEARCH_395_NO_NPM_PUBLISH,
  RESEARCH_395_NO_PROFILE_STEAL,
  RESEARCH_395_NO_SECOND_PLANNER,
  RESEARCH_395_PLANNING,
  RESEARCH_395_PROOF,
  RESEARCH_395_PUBLIC_TEST,
  RESEARCH_395_REVIEW_DOC,
  RESEARCH_395_SCENARIOS,
  RESEARCH_395_STAMP,
  research395AcEvidence,
  research395AllAcceptanceDone,
} from "../../../catalog/providers/research-395-pivot-hold-closeout-map.js";

const MAP = path.join(skillRoot, RESEARCH_395_MAP_PATH);
const AUDIT = path.join(skillRoot, RESEARCH_395_AUDIT_DOC);
const REVIEW = path.join(skillRoot, RESEARCH_395_REVIEW_DOC);
const ADR = path.join(skillRoot, RESEARCH_395_ADR);
const AUTHORING = path.join(skillRoot, RESEARCH_395_AUTHORING);
const CHECKPOINT = path.join(skillRoot, RESEARCH_395_CHECKPOINT);
const PROOF = path.join(skillRoot, RESEARCH_395_PROOF);
const PLANNING = path.join(skillRoot, RESEARCH_395_PLANNING);
const PUBLIC_TEST = path.join(skillRoot, RESEARCH_395_PUBLIC_TEST);
const CORE = path.join(skillRoot, RESEARCH_395_CORE_FIXTURES);
const ARTIFACTS = path.join(skillRoot, RESEARCH_395_ARTIFACT_CONTRACTS);
const PACKAGE = path.join(skillRoot, "package.json");
const SKILL_VERSION = path.join(skillRoot, "skill-version.json");
const CONTRACT = path.join(skillRoot, "contracts/public-api/contract.ts");

export function register(harness: Harness): void {
  harness.check("research-395: tip stamps / consumes / holds / AC map integrity", () => {
    assert(existsSync(MAP), "map present");
    assert(existsSync(AUDIT), "audit present");
    assert(existsSync(REVIEW), "review present");
    assert(existsSync(ADR), "ADR present");
    assert(existsSync(AUTHORING), "authoring present");
    assert(existsSync(CHECKPOINT), "checkpoint projection present");
    assert(existsSync(PROOF), "proof projection present");
    assert(existsSync(PUBLIC_TEST), "public tests present");
    assert(RESEARCH_395_ISSUE === "#395", "issue lock");
    assert(RESEARCH_395_STAMP === "0.221.60", "stamp lock");
    assert(RESEARCH_395_BASE_MAIN_SHA.startsWith("b85f26f"), "base tip");
    assert(RESEARCH_395_NEXT_AFTER_CLOSE === "#213", "next after close");
    assert(RESEARCH_395_NO_NPM_PUBLISH && RESEARCH_395_NO_PROFILE_STEAL, "publish/profile holds");
    assert(RESEARCH_395_NO_397_REDO && RESEARCH_395_NO_74_REWRITE && RESEARCH_395_NO_SECOND_PLANNER, "ownership holds");
    assert(RESEARCH_395_CONSUMES.length >= 10, "consumes prior increments");
    assert(RESEARCH_395_COORDINATES.includes("#71") && RESEARCH_395_COORDINATES.includes("#74"), "coords");
    assert(research395AllAcceptanceDone(), "all AC covered");
    assert(RESEARCH_395_AC.length === 7, "seven ACs");
    assert(RESEARCH_395_SCENARIOS.length === 12, "twelve scenarios");
    for (const row of RESEARCH_395_AC) {
      assert(research395AcEvidence(row.id).length > 0, `evidence for ${row.id}`);
    }
    const pkg = JSON.parse(readFileSync(PACKAGE, "utf8")) as { version: string };
    const skill = JSON.parse(readFileSync(SKILL_VERSION, "utf8")) as { version: string };
    assert(pkg.version === RESEARCH_395_STAMP && skill.version === RESEARCH_395_STAMP, "package/skill stamp");
  });

  harness.check("research-395: AC1 R0 mapping + not_run settlement recorded", () => {
    const adr = readFileSync(ADR, "utf8");
    assert(adr.includes("Additive `not_run` is not introduced"), "not_run settlement");
    assert(adr.includes("Before / after state and authority"), "R0 table");
    assert(adr.includes("business.research.decision"), "authoring op");
    assert(adr.includes("researchCheckpoint"), "checkpoint projection");
    assert(adr.includes("#74"), "proof owner retained");
  });

  harness.check("research-395: AC2 distinct checkpoint vs proof vs init", () => {
    const checkpoint = readFileSync(CHECKPOINT, "utf8");
    const proof = readFileSync(PROOF, "utf8");
    const planning = readFileSync(PLANNING, "utf8");
    const contract = readFileSync(CONTRACT, "utf8");
    assert(checkpoint.includes("#395"), "checkpoint ownership");
    assert(checkpoint.includes("initializationEligible: false"), "never grants init");
    assert(proof.includes("#74"), "proof ownership");
    assert(proof.includes("OfferDecisionProjection"), "offer demand stays with #74");
    assert(planning.includes("projectResearchCheckpoint"), "wired into resume");
    assert(planning.includes("projectResearchProof"), "proof still wired");
    assert(contract.includes("researchCheckpoint"), "public resume field");
    assert(contract.includes('recordedVia: z.enum(["product_decision_log", "absent"])'), "recordedVia enum");
  });

  harness.check("research-395: AC3 guarded authoring path exists once", () => {
    const authoring = readFileSync(AUTHORING, "utf8");
    assert(authoring.includes("recordResearchDecision"), "owner export");
    assert(authoring.includes("initializationEligible: false"), "no init grant");
    assert(authoring.includes("authorityGranted: false"), "no authority grant");
    assert(authoring.includes(".b2c-research-decision-journal.json"), "journal recovery");
    assert(authoring.includes("uniqueKeys: true"), "duplicate YAML refuse");
    const artifacts = readFileSync(ARTIFACTS, "utf8");
    assert(artifacts.includes("b2c research-decision"), "conditional guidance");
  });

  harness.check("research-395: AC4 interruption / stale / untrusted / protected coverage", () => {
    const publicTest = readFileSync(PUBLIC_TEST, "utf8");
    assert(publicTest.includes("stale_revision"), "stale");
    assert(publicTest.includes("fixture journal interruption"), "journal interrupt");
    assert(publicTest.includes("fixture interruption"), "product interrupt");
    assert(publicTest.includes("fixture rendered interruption"), "rendered interrupt");
    assert(publicTest.includes("third-party-note"), "third-party preserve");
    assert(publicTest.includes("research_decision_id_reused"), "changed payload refuse");
    assert(publicTest.includes("finding_id_ambiguous"), "ambiguous findings");
    assert(publicTest.includes("session_lock_unavailable"), "concurrent lock");
    assert(publicTest.includes("symlinkSync"), "unsafe path");
    assert(publicTest.includes("Kill checkpoint"), "explicit Kill");
    assert(publicTest.includes("Pivot checkpoint holds initialization"), "Pivot hold E2E");
  });

  harness.check("research-395: AC5 old run/waived meaning + surfaces", () => {
    const core = readFileSync(CORE, "utf8");
    assert(core.includes("| not_run |"), "not_run negative fixture");
    assert(core.includes("research.offer_test_decision_incomplete"), "incomplete not waived");
    assert(core.includes("done research whose latest verdict is Pivot remains a held checkpoint"), "Pivot held");
    assert(core.includes("done research whose latest verdict is Kill remains a held checkpoint"), "Kill held");
    const artifacts = readFileSync(ARTIFACTS, "utf8");
    assert(artifacts.includes("`run` or `waived` only"), "guidance preserves enum");
  });

  harness.check("research-395: AC6/AC7 review + handoffs present", () => {
    const audit = readFileSync(AUDIT, "utf8");
    const review = readFileSync(REVIEW, "utf8");
    assert(audit.includes("#71"), "handoff #71");
    assert(audit.includes("#74"), "handoff #74");
    assert(audit.includes("#73"), "scenario #73");
    assert(audit.includes("#75"), "scenario #75");
    assert(audit.includes("STOP"), "stop line");
    assert(/independent/i.test(review), "independent review");
    assert(review.includes(RESEARCH_395_STAMP) || review.includes("0.221.60"), "stamp in review");
    assert(existsSync(path.join(skillRoot, RESEARCH_395_FIXTURE)), "fixture path");
  });
}
