/**
 * #66 greenfield delivery-audit framework fixtures.
 *
 * Deterministic only. No live greenfield benchmark, publish-of-evidence,
 * workflow consolidation, sibling implementation, or U5/#511. Consumes
 * landed proof-strength / complete-business / rehearsal surfaces — does not
 * invent a second proof ontology.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  COMPLETE_BUSINESS_FIXTURE,
  GREENFIELD_66_AUDIT_DOC,
  GREENFIELD_66_BASE_MAIN_SHA,
  GREENFIELD_66_CHILDREN,
  GREENFIELD_66_CLOSED_CHILDREN,
  GREENFIELD_66_DISTINCT_PROOF_NOTE,
  GREENFIELD_66_FIXTURE_SUITE,
  GREENFIELD_66_HARD_HOLDS,
  GREENFIELD_66_LIVE_OWNER,
  GREENFIELD_66_MAP_PATH,
  GREENFIELD_66_NEXT_AFTER_CLOSE,
  GREENFIELD_66_NO_U5,
  GREENFIELD_66_OPEN_CHILDREN,
  GREENFIELD_66_PILLAR_NOTES,
  GREENFIELD_66_PILLARS,
  GREENFIELD_66_PROGRAM_ACCEPTANCE,
  GREENFIELD_66_PROOF_CLASSES,
  GREENFIELD_66_SEQUENCE_LOCK_NOTE,
  GREENFIELD_66_SKIP_CLOSED,
  GREENFIELD_66_STAMP,
  GREENFIELD_66_U4_REMAINING_SEQUENCE,
  GREENFIELD_BENCHMARK_PROTOCOL,
  INITIALIZATION_PUBLIC_TEST,
  LIFECYCLE_PUBLIC_TEST,
  PROOF_STRENGTH_FIXTURE,
  REHEARSAL_EVIDENCE_DOC,
  WORKFLOW_OVERHEAD_BOUNDARIES,
  getGreenfield66Children,
  greenfield66AllowsLiveInThisSlice,
  greenfield66AllowsU5,
  greenfield66ChildRow,
  greenfield66ClosedChildren,
  greenfield66ConsolidatesWorkflows,
  greenfield66InventedSecondProofOntology,
  greenfield66OpenChildren,
  greenfield66ProofClassesRemainDistinct,
  greenfield66SequenceIsLocked,
  greenfield66UmbrellaClosesChildren,
} from "../../../catalog/providers/greenfield-delivery-audit-map.js";
import {
  deliveryClassesCollapsed,
  distinctProofNote,
  greenfield66MapModulePath,
  hardHoldActive,
  implementsSiblingIn66,
  intentEqualsDocsPadding,
  liveAllowedIn66,
  liveLaunchProvenFromSynthetic,
  liveOwnerIssue,
  nextAfter66,
  nonLiveProofClaimsLive,
  overheadSavingsFromWorkflowCountAlone,
  pillarsLocked,
  proofClassIsLiveCompleteBusiness,
  proofClassesRemainDistinct,
  reopensClosedChild,
  secondProofOntologyIntroduced,
  sequenceLockHolds,
  shotgunOpenChildren,
  skipClosedIssue,
  sourceClaimsForbiddenSuccess,
  stageARetainRequired,
  u4RemainingSequence,
  u5AllowedIn66,
  umbrellaCloseClosesChildren,
  workflowsConsolidatedIn66,
} from "../../../adapters/greenfield/boundary.js";
import { classifyGreenfield66FailSafe, liveProtectedAllowedByYesFlag } from "../../../adapters/greenfield/fail-safe.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const AUDIT_DOC = path.join(skillRoot, GREENFIELD_66_AUDIT_DOC);
const MAP_FILE = path.join(skillRoot, GREENFIELD_66_MAP_PATH);
const PROOF_STRENGTH = path.join(skillRoot, PROOF_STRENGTH_FIXTURE);
const COMPLETE_BUSINESS = path.join(skillRoot, COMPLETE_BUSINESS_FIXTURE);
const BENCHMARK = path.join(skillRoot, GREENFIELD_BENCHMARK_PROTOCOL);
const OVERHEAD = path.join(skillRoot, WORKFLOW_OVERHEAD_BOUNDARIES);
const EVIDENCE = path.join(skillRoot, REHEARSAL_EVIDENCE_DOC);
const LIFECYCLE = path.join(skillRoot, LIFECYCLE_PUBLIC_TEST);
const INITIALIZATION = path.join(skillRoot, INITIALIZATION_PUBLIC_TEST);

export function register(harness: Harness): void {
  harness.check("greenfield-66: residual map covers closed + open children with implementIn66=false", () => {
    assert(getGreenfield66Children() === GREENFIELD_66_CHILDREN, "getter returns authored map");
    assert(greenfield66MapModulePath() === GREENFIELD_66_MAP_PATH, "stable map path");
    assert(GREENFIELD_66_CHILDREN.length === 12, "twelve child rows");
    assert(greenfield66ClosedChildren().length === 6, "six closed");
    assert(greenfield66OpenChildren().length === 6, "six open");
    assert(GREENFIELD_66_CLOSED_CHILDREN.length === 6, "closed constant");
    assert(GREENFIELD_66_OPEN_CHILDREN.length === 6, "open constant");
    for (const row of GREENFIELD_66_CHILDREN) {
      assert(row.implementIn66 === false, `${row.issue} not implemented in #66`);
      assert(row.title.length > 0, `${row.issue} has title`);
      assert(row.residualNote.length > 0, `${row.issue} has residual note`);
    }
    assert(greenfield66ChildRow("#74").state === "closed", "#74 closed");
    assert(greenfield66ChildRow("#72").proofClassFocus === "live-complete-business", "#72 owns live");
    assert(greenfield66ChildRow("#70").state === "open", "#70 open next");
  });

  harness.check("greenfield-66: sequence lock #70→#71→#73→#75→#76→#72; skip #74; next=#70; live=#72", () => {
    assert(greenfield66SequenceIsLocked(), "sequence constants locked");
    assert(sequenceLockHolds(), "boundary sequence lock");
    assert(JSON.stringify([...GREENFIELD_66_U4_REMAINING_SEQUENCE]) === JSON.stringify(["#70", "#71", "#73", "#75", "#76", "#72"]), "exact order");
    assert(GREENFIELD_66_SKIP_CLOSED === "#74", "skip #74");
    assert(skipClosedIssue() === "#74", "boundary skip");
    assert(GREENFIELD_66_NEXT_AFTER_CLOSE === "#70", "next after close");
    assert(nextAfter66() === "#70", "boundary next");
    assert(GREENFIELD_66_LIVE_OWNER === "#72", "live owner");
    assert(liveOwnerIssue() === "#72", "boundary live owner");
    assert(GREENFIELD_66_NO_U5 === "#511", "no U5");
    assert(u4RemainingSequence().length === 6, "six remaining");
    assert(GREENFIELD_66_SEQUENCE_LOCK_NOTE.includes("#72"), "lock note mentions #72");
  });

  harness.check("greenfield-66: three pillars locked; intent ≠ docs padding", () => {
    assert(pillarsLocked(), "pillars locked");
    assert(GREENFIELD_66_PILLARS.length === 3, "three pillars");
    for (const pillar of GREENFIELD_66_PILLARS) {
      assert(GREENFIELD_66_PILLAR_NOTES[pillar].length > 0, `${pillar} note`);
    }
    assert(intentEqualsDocsPadding({ docsPaddingAsIntent: true }) === true, "docs padding rejected");
    assert(intentEqualsDocsPadding({ packetShapeAsIntent: true }) === true, "packet shape rejected");
    assert(intentEqualsDocsPadding({ checklistDensityAsIntent: true }) === true, "checklist density rejected");
    assert(intentEqualsDocsPadding({ structuralOnlyAsSemantic: true }) === true, "structural≠semantic");
    assert(intentEqualsDocsPadding({ structuralOnlyAsRuntime: true }) === true, "structural≠runtime");
    assert(intentEqualsDocsPadding({}) === false, "empty claim ok");
    const refuse = classifyGreenfield66FailSafe({ kind: "intent-claim", docsPaddingAsIntent: true });
    assert(refuse.action === "refuse-docs-padding-as-intent", "fail-safe refuses padding-as-intent");
  });

  harness.check("greenfield-66: overhead measurable; workflow-count alone rejected; Stage A retain", () => {
    assert(overheadSavingsFromWorkflowCountAlone({ workflowCountReduced: true, measuredIntervalPresent: false }) === true, "fake savings");
    assert(overheadSavingsFromWorkflowCountAlone({ workflowCountReduced: true, measuredIntervalPresent: true }) === false, "measured ok");
    assert(stageARetainRequired({ measuredIntervalPresent: false }) === true, "retain required");
    assert(workflowsConsolidatedIn66() === false, "no consolidation");
    assert(greenfield66ConsolidatesWorkflows() === false, "map no consolidation");
    const refuse = classifyGreenfield66FailSafe({
      kind: "overhead-claim",
      workflowCountReduced: true,
      measuredIntervalPresent: false,
    });
    assert(refuse.action === "refuse-fake-overhead-savings", "fail-safe refuses fake savings");
    const consolidation = classifyGreenfield66FailSafe({ kind: "consolidation-request" });
    assert(consolidation.action === "refuse-workflow-consolidation", "refuse consolidation");
  });

  harness.check("greenfield-66: proof classes distinct; non-live ≠ live; delivery classes not collapsed", () => {
    assert(greenfield66ProofClassesRemainDistinct(), "map distinct");
    assert(proofClassesRemainDistinct(), "boundary distinct");
    assert(GREENFIELD_66_PROOF_CLASSES.length === 11, "eleven classes");
    assert(distinctProofNote() === GREENFIELD_66_DISTINCT_PROOF_NOTE, "distinct note");
    assert(proofClassIsLiveCompleteBusiness("live-complete-business") === true, "live class");
    assert(proofClassIsLiveCompleteBusiness("fixture") === false, "fixture not live");
    assert(nonLiveProofClaimsLive("fixture") === true, "fixture is non-live");
    assert(nonLiveProofClaimsLive("screenshot") === true, "screenshot is non-live");
    assert(nonLiveProofClaimsLive("protocol-doc") === true, "protocol is non-live");
    assert(nonLiveProofClaimsLive("live-complete-business") === false, "live is live");
    assert(deliveryClassesCollapsed({ deliveryAccepted: true, submitted: true, treatedAsSame: true }) === true, "collapse detected");
    assert(deliveryClassesCollapsed({ deliveryAccepted: true, submitted: true, treatedAsSame: false }) === false, "distinct ok");
    const refuse = classifyGreenfield66FailSafe({
      kind: "proof-claim",
      deliveryAccepted: true,
      live: true,
      treatedAsSame: true,
    });
    assert(refuse.action === "refuse-proof-class-collapse", "refuse collapse");
  });

  harness.check("greenfield-66: liveLaunchProven never from synthetic; live/publish held for #72", () => {
    assert(liveAllowedIn66() === false, "live not allowed");
    assert(greenfield66AllowsLiveInThisSlice() === false, "map live false");
    assert(liveLaunchProvenFromSynthetic({ liveLaunchProven: true, evidenceClass: "fixture" }) === true, "fixture cannot prove live");
    assert(liveLaunchProvenFromSynthetic({ liveLaunchProven: true, evidenceClass: "synthetic" }) === true, "synthetic cannot prove live");
    assert(liveLaunchProvenFromSynthetic({ liveLaunchProven: true, evidenceClass: "ci-green" }) === true, "ci cannot prove live");
    assert(liveLaunchProvenFromSynthetic({ liveLaunchProven: false, evidenceClass: "fixture" }) === false, "unset ok");
    assert(liveProtectedAllowedByYesFlag(true) === false, "--yes never grants live");
    const liveHold = classifyGreenfield66FailSafe({ kind: "live-request" });
    assert(liveHold.action === "hold-live-for-72", "live → #72");
    assert(liveHold.ownerIssue === "#72", "live owner #72");
    const publishHold = classifyGreenfield66FailSafe({ kind: "publish-request" });
    assert(publishHold.action === "hold-publish-for-72", "publish → #72");
    const synthetic = classifyGreenfield66FailSafe({
      kind: "proof-claim",
      liveLaunchProven: true,
      proofClass: "fixture",
    });
    assert(synthetic.action === "refuse-synthetic-live-proven", "refuse synthetic live");
  });

  harness.check("greenfield-66: siblings not shotgunned; umbrella close does not close children; no U5", () => {
    assert(shotgunOpenChildren(["#70", "#71"]) === true, "shotgun detected");
    assert(shotgunOpenChildren(["#70"]) === false, "single ok");
    assert(implementsSiblingIn66("#70") === true, "open sibling flagged");
    assert(implementsSiblingIn66("#67") === false, "closed not open sibling");
    assert(reopensClosedChild("#74") === true, "reopen closed flagged");
    assert(umbrellaCloseClosesChildren() === false, "umbrella does not close children");
    assert(greenfield66UmbrellaClosesChildren() === false, "map umbrella");
    assert(u5AllowedIn66() === false, "no U5");
    assert(greenfield66AllowsU5() === false, "map no U5");
    assert(secondProofOntologyIntroduced() === false, "no second ontology");
    assert(greenfield66InventedSecondProofOntology() === false, "map no second ontology");
    const shotgun = classifyGreenfield66FailSafe({ kind: "sibling-batch", requestedIssues: ["#70", "#73"] });
    assert(shotgun.action === "refuse-sibling-shotgun", "refuse shotgun");
    const u5 = classifyGreenfield66FailSafe({ kind: "u5-request" });
    assert(u5.action === "refuse-u5", "refuse U5");
    const closeKids = classifyGreenfield66FailSafe({ kind: "umbrella-close", closeChildren: true });
    assert(closeKids.action === "refuse-umbrella-closes-children", "refuse close children");
    const framework = classifyGreenfield66FailSafe({ kind: "framework-only" });
    assert(framework.action === "proceed-framework-only", "framework ok");
  });

  harness.check("greenfield-66: program acceptance residual ownership honest; hard holds present", () => {
    assert(GREENFIELD_66_PROGRAM_ACCEPTANCE.length === 7, "seven acceptance rows");
    const frameworkRows = GREENFIELD_66_PROGRAM_ACCEPTANCE.filter((row) => row.statusOnTip === "framework-in-66");
    const residualRows = GREENFIELD_66_PROGRAM_ACCEPTANCE.filter((row) => row.statusOnTip === "residual-open-child");
    assert(frameworkRows.length === 2, "two framework rows");
    assert(residualRows.length === 5, "five residual rows");
    assert(
      residualRows.some((row) => row.ownerIssue === "#72"),
      "#72 owns live run row",
    );
    assert(
      residualRows.some((row) => row.ownerIssue === "#73"),
      "#73 owns measure/simplify rows",
    );
    assert(hardHoldActive("live-greenfield-benchmark"), "live hold");
    assert(hardHoldActive("publish-of-evidence"), "publish hold");
    assert(hardHoldActive("u5-511"), "u5 hold");
    assert(hardHoldActive("workflow-consolidation"), "consolidation hold");
    assert(GREENFIELD_66_HARD_HOLDS.length >= 10, "hard holds non-empty");
    assert(GREENFIELD_66_STAMP === "0.221.25", "stamp 0.221.25");
    assert(GREENFIELD_66_BASE_MAIN_SHA === "d3bd0b5fba5381bb4787bfeb79e3f3c9cc5dbfeb", "base main pin");
  });

  harness.check("greenfield-66: consumed landed surfaces exist; audit doc present; forbidden claims detected", () => {
    assert(existsSync(MAP_FILE), `map exists: ${GREENFIELD_66_MAP_PATH}`);
    assert(existsSync(AUDIT_DOC), `audit doc exists: ${GREENFIELD_66_AUDIT_DOC}`);
    assert(existsSync(PROOF_STRENGTH), "proof-strength fixtures");
    assert(existsSync(COMPLETE_BUSINESS), "complete-business fixtures");
    assert(existsSync(BENCHMARK), "greenfield-benchmark protocol");
    assert(existsSync(OVERHEAD), "workflow-overhead boundaries");
    assert(existsSync(EVIDENCE), "EVIDENCE.md");
    assert(existsSync(LIFECYCLE), "lifecycle public test");
    assert(existsSync(INITIALIZATION), "initialization public test");
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(audit.includes("#70 → #71 → #73 → #75 → #76 → #72"), "sequence in doc");
    assert(audit.includes("STOP → #70"), "stop gate in doc");
    assert(audit.includes("liveLaunchProven"), "liveLaunchProven honesty");
    assert(!audit.includes("liveLaunchProven=true from fixture"), "doc does not claim forbidden success");
    const hits = sourceClaimsForbiddenSuccess("complete-business from CI alone and U5 started");
    assert(hits.length === 2, "forbidden claim detector");
    assert(GREENFIELD_66_FIXTURE_SUITE.includes("greenfield-delivery-audit-66"), "suite name");
  });
}
