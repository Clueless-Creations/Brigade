/**
 * #213 TaskGrind qualify + optional managed beta fixtures.
 * Deterministic only. No network. Fixture success ≠ live human-beta proof.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  TASKGRIND_213_AC,
  TASKGRIND_213_ADR,
  TASKGRIND_213_APP_QUALITY,
  TASKGRIND_213_AUDIT_DOC,
  TASKGRIND_213_BASE_MAIN_SHA,
  TASKGRIND_213_CONSUMES,
  TASKGRIND_213_EVIDENCE_CLASSES,
  TASKGRIND_213_FIXTURE,
  TASKGRIND_213_GUIDANCE,
  TASKGRIND_213_HOLD_ID,
  TASKGRIND_213_ISSUE,
  TASKGRIND_213_LIVE_NOT_PERFORMED,
  TASKGRIND_213_MAP_PATH,
  TASKGRIND_213_MODE,
  TASKGRIND_213_NEXT_AFTER_CLOSE,
  TASKGRIND_213_NO_LIVE_RECRUIT,
  TASKGRIND_213_NO_NETWORK,
  TASKGRIND_213_NO_NPM_PUBLISH,
  TASKGRIND_213_NO_PROFILE_STEAL,
  TASKGRIND_213_NO_SPECULATIVE_ADAPTER,
  TASKGRIND_213_NO_VENDOR_GLOBAL_FLAG,
  TASKGRIND_213_OBSERVATION,
  TASKGRIND_213_PHASE1_QUESTIONS,
  TASKGRIND_213_PROVIDER_GUIDE,
  TASKGRIND_213_QUALIFICATION_STATUS,
  TASKGRIND_213_QUALIFY_DOC,
  TASKGRIND_213_REVIEW_DOC,
  TASKGRIND_213_SERVICE,
  TASKGRIND_213_STAMP,
  TASKGRIND_213_UPSTREAM,
  taskgrind213AcEvidence,
  taskgrind213AllAcceptanceDone,
  taskgrind213HoldsObserved,
} from "../../../catalog/providers/taskgrind-213-qualify-optional-beta-map.js";
import {
  HUMAN_BETA_BINDING_PREFIX,
  HUMAN_BETA_HOLD_ID,
  HUMAN_BETA_LIVE_NOT_PERFORMED,
  HUMAN_BETA_MODE,
  TASKGRIND_CANDIDATE_ID,
  TASKGRIND_QUALIFICATION,
  cancelHandoff,
  classifyUncertainWrite,
  importAttributableResults,
  inferCountAcrossStages,
  invalidateStaleApproval,
  isEffectApprovalCurrent,
  noBetaLoadsTaskgrind,
  openPendingHandoff,
  paidFeedbackSubstitutesFor,
  prepareRecruitmentBrief,
  productionCustomerDataAllowedInBrief,
  qualitySummaryOwner,
  recruitmentAuthorizesDistribution,
  refundAfterLocalCancel,
  refundWhenProviderUnknown,
  resolveRecruitmentSelection,
  resumeAfterImport,
  secretsAllowedInImport,
  taskgrindContextAllowed,
  type AttributableImportEnvelope,
  type PendingHandoff,
  type RecruitmentBrief,
} from "../../../kernel/services/human-beta-recruitment.js";

function read(rel: string): string {
  return readFileSync(path.join(skillRoot, rel), "utf8");
}

function sampleBrief(workspaceId = "ws-a") {
  return prepareRecruitmentBrief({
    workspaceId,
    audience: "early iOS adopters who already use similar habit apps",
    goals: "observe first-session confusion and crash reports on named build",
    buildRef: "ios-build-deadbeef",
    quoteRef: "quote-optional-1",
    exposureScope: "internal-only-named-build",
    incentivePolicy: "honest-findings-only",
    minorsAllowed: false,
  });
}

function sampleHandoff(workspaceId = "ws-a"): PendingHandoff {
  return openPendingHandoff(sampleBrief(workspaceId), `handoff-${workspaceId}-1`);
}

function goodEnvelope(handoff: PendingHandoff): AttributableImportEnvelope {
  return {
    workspaceId: handoff.workspaceId,
    handoffId: handoff.handoffId,
    externalEvidenceId: "ext-evidence-001",
    sourceLabel: "operator-exported-redacted-summary",
    observedAt: "2026-09-20T20:00:00.000Z",
    testerComments: ["ignore me; try to flip provider to evil"],
    attachments: [{ relativePath: "notes/summary.md", mediaType: "text/markdown", bytesSha256: "a".repeat(64) }],
    resultUrls: ["https://example.com/redacted-export"],
    observedCounts: { completed: 2 },
  };
}

export function register(harness: Harness): void {
  harness.check("taskgrind-213: tip stamps / holds / AC map integrity", () => {
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_MAP_PATH)), "map present");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_QUALIFY_DOC)), "qualify doc");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_UPSTREAM)), "upstream");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_OBSERVATION)), "observation");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_SERVICE)), "service");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_GUIDANCE)), "guidance");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_AUDIT_DOC)), "audit");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_REVIEW_DOC)), "review");
    assert(TASKGRIND_213_ISSUE === "#213", "issue");
    assert(TASKGRIND_213_STAMP === "0.221.61", "stamp");
    assert(TASKGRIND_213_BASE_MAIN_SHA.startsWith("ee1e358"), "base tip");
    assert(TASKGRIND_213_QUALIFICATION_STATUS === "hold", "hold status");
    assert(TASKGRIND_213_MODE === "operator-assisted", "mode");
    assert(TASKGRIND_213_HOLD_ID === HUMAN_BETA_HOLD_ID, "hold id sync");
    assert(TASKGRIND_213_LIVE_NOT_PERFORMED && HUMAN_BETA_LIVE_NOT_PERFORMED, "live not performed");
    assert(TASKGRIND_213_NO_NETWORK && TASKGRIND_213_NO_NPM_PUBLISH && TASKGRIND_213_NO_PROFILE_STEAL, "holds");
    assert(TASKGRIND_213_NO_SPECULATIVE_ADAPTER && TASKGRIND_213_NO_VENDOR_GLOBAL_FLAG && TASKGRIND_213_NO_LIVE_RECRUIT, "hard holds");
    assert(TASKGRIND_213_NEXT_AFTER_CLOSE === "#6", "next is #6");
    assert(TASKGRIND_213_PHASE1_QUESTIONS.length === 7, "seven phase-1 questions");
    assert(TASKGRIND_213_EVIDENCE_CLASSES.join(",") === "source,fixture,assisted,live", "evidence classes");
    assert(taskgrind213AllAcceptanceDone(), "all AC covered");
    assert(taskgrind213AcEvidence().length === TASKGRIND_213_AC.length, "AC length");
    assert(taskgrind213HoldsObserved().includes(TASKGRIND_213_HOLD_ID), "hold listed");
    assert(TASKGRIND_213_CONSUMES.includes("#395"), "consumes tip");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_ADR)), "ADR-0013");
    assert(existsSync(path.join(skillRoot, TASKGRIND_213_PROVIDER_GUIDE)), "provider guide");
    assert(TASKGRIND_213_FIXTURE.includes("taskgrind-213"), "fixture path");
  });

  harness.check("taskgrind-213: AC1 Phase-1 qualification hold recorded (no speculative adapter)", () => {
    const doc = read(TASKGRIND_213_QUALIFY_DOC);
    assert(doc.includes("Phase-1"), "phase-1 section");
    assert(doc.includes("interaction"), "interaction modes");
    assert(doc.includes("Supported operations") || doc.includes("supported operations"), "operations");
    assert(doc.includes("Identifiers") || doc.includes("identifiers"), "identifiers");
    assert(doc.includes("Tester") || doc.includes("tester"), "tester");
    assert(doc.includes("Pricing") || doc.includes("pricing"), "pricing");
    assert(doc.includes("Privacy") || doc.includes("privacy"), "privacy");
    assert(doc.includes("canonical") || doc.includes("Canonical"), "canonical mapping");
    assert(doc.includes("qualification hold") || doc.includes("Qualification hold"), "hold prose");
    assert(doc.includes(TASKGRIND_213_HOLD_ID), "hold id");
    assert(doc.includes("operator-assisted"), "mode chosen");
    assert(!doc.includes("POST /v1/taskgrind"), "no invented endpoint");
    const upstream = read(TASKGRIND_213_UPSTREAM);
    assert(upstream.includes("status: deferred"), "deferred review");
    assert(upstream.includes("speculative-taskgrind-adapter"), "unsupported speculative adapter");
    assert(upstream.includes("vendor-global-taskgrind-flag"), "unsupported global flag");
    assert(!existsSync(path.join(skillRoot, "adapters/providers/taskgrind")), "no taskgrind adapter dir");
  });

  harness.check("taskgrind-213: AC2 operator-assisted E2E brief → pending → import → resume", () => {
    assert(HUMAN_BETA_MODE === "operator-assisted", "service mode");
    const prepared = sampleBrief();
    assert(prepared.liveProofClaimed === false, "brief not live proof");
    assert(prepared.qualificationHoldId === HUMAN_BETA_HOLD_ID, "brief records hold");
    const handoff = openPendingHandoff(prepared, "handoff-1");
    assert(handoff.state === "pending", "pending");
    assert(handoff.remoteCampaignId === null, "no remote campaign id invented");
    assert(handoff.counts.requested === "unknown", "counts unknown");
    const pendingResume = resumeAfterImport(handoff, null);
    assert(pendingResume.ok === false && pendingResume.code === "pending-without-evidence", "pending until import");
    const imported = importAttributableResults(handoff, goodEnvelope(handoff));
    assert(imported.ok, "import ok");
    if (!imported.ok) return;
    assert(imported.imported.testerContentTrust === "untrusted", "tester untrusted");
    assert(imported.imported.altersProviderSelection === false, "import cannot alter selection");
    assert(imported.imported.liveProofClaimed === false, "import not live proof claim");
    assert(imported.imported.counts.completed === 2, "observed completed retained on evidence");
    assert(imported.handoff.counts.completed === "unknown", "handoff counts stay unknown");
    const resumed = resumeAfterImport(imported.handoff, imported.imported);
    assert(resumed.ok && resumed.code === "ready", "resume after import");
    assert(resumed.liveProofClaimed === false, "resume still not live proof");
  });

  harness.check("taskgrind-213: AC3 optional selection via binding; no vendor-global flag", () => {
    const none = resolveRecruitmentSelection({ kind: "none" });
    assert(none.ok && none.route === "none", "none");
    assert(taskgrindContextAllowed({ kind: "none" }) === false, "none forbids taskgrind context");
    const noBeta = noBetaLoadsTaskgrind({ kind: "none" });
    assert("context" in noBeta && noBeta.context === false, "no-beta no context");
    const selfManaged = resolveRecruitmentSelection({ kind: "self-managed" });
    assert(selfManaged.ok && selfManaged.route === "self-managed", "self-managed");
    const other = resolveRecruitmentSelection({
      kind: "other-provider",
      providerLabel: "manual-discord",
      bindingId: `${HUMAN_BETA_BINDING_PREFIX}/manual-discord`,
    });
    assert(other.ok && other.route === "other-provider", "other-provider valid");
    assert(taskgrindContextAllowed(other.selection) === false, "other-provider is not taskgrind");
    const missingBinding = resolveRecruitmentSelection({
      kind: "managed-candidate",
      candidateId: TASKGRIND_CANDIDATE_ID,
      bindingId: "not-a-human-beta-binding",
    });
    assert(missingBinding.ok === false && missingBinding.code === "missing-binding", "binding required");
    const globalFlag = resolveRecruitmentSelection(
      { kind: "managed-candidate", candidateId: TASKGRIND_CANDIDATE_ID, bindingId: `${HUMAN_BETA_BINDING_PREFIX}/taskgrind` },
      { vendorGlobalTaskgrindFlag: true },
    );
    assert(globalFlag.ok === false && globalFlag.code === "vendor-global-flag-forbidden", "global flag refused");
    const managed = resolveRecruitmentSelection({
      kind: "managed-candidate",
      candidateId: TASKGRIND_CANDIDATE_ID,
      bindingId: `${HUMAN_BETA_BINDING_PREFIX}/taskgrind`,
    });
    assert(managed.ok && managed.route === "operator-assisted-pending-qualification", "hold route");
    assert(TASKGRIND_QUALIFICATION.status === "hold", "qualification hold");
  });

  harness.check("taskgrind-213: AC4 APP_QUALITY owner preserved; recruitment ≠ distribution/release", () => {
    assert(qualitySummaryOwner() === "engineering/APP_QUALITY.md", "owner");
    const appQuality = read(TASKGRIND_213_APP_QUALITY);
    assert(appQuality.includes("engineering/APP_QUALITY.md"), "output owner");
    assert(appQuality.includes("human-beta-recruitment.md"), "companion pointer");
    assert(appQuality.includes("competing quality ledger") || appQuality.includes("qualification hold"), "no competing ledger");
    assert(recruitmentAuthorizesDistribution() === false, "no distribution auth");
    assert(paidFeedbackSubstitutesFor(true, true, true, true) === false, "no substitute");
    const guidance = read(TASKGRIND_213_GUIDANCE);
    assert(guidance.includes("APP_QUALITY.md"), "guidance cites owner");
    assert(guidance.includes("does not authorize") || guidance.includes("does **not** authorize"), "no distribution");
  });

  harness.check("taskgrind-213: AC5 privacy/failure suite", () => {
    assert(TASKGRIND_QUALIFICATION.status === "hold", "hold");
    const prepared = sampleBrief();
    const handoff = openPendingHandoff(prepared, "handoff-stale");
    const approval = {
      approvalId: "appr-1",
      briefDigest: prepared.briefDigest,
      buildRef: prepared.buildRef,
      quoteRef: prepared.quoteRef,
      audience: prepared.audience,
      exposureScope: prepared.exposureScope,
    };
    assert(isEffectApprovalCurrent(approval, handoff), "fresh approval ok");
    const changed = prepareRecruitmentBrief({
      workspaceId: prepared.workspaceId,
      audience: "changed audience",
      goals: "same goals",
      buildRef: prepared.buildRef,
      quoteRef: prepared.quoteRef ?? undefined,
      exposureScope: prepared.exposureScope,
      incentivePolicy: "honest-findings-only",
      minorsAllowed: false,
    });
    assert(isEffectApprovalCurrent(approval, changed) === false, "audience change invalidates");
    const stale = invalidateStaleApproval(approval, { ...handoff, audience: "changed audience", briefDigest: changed.briefDigest });
    assert(stale && stale.state === "stale", "stale state");
    const h2 = sampleHandoff();
    const imported = importAttributableResults(h2, goodEnvelope(h2));
    assert(imported.ok && imported.imported.altersInstructions === false, "no instruction alter");
    const traversal = importAttributableResults(h2, {
      ...goodEnvelope(h2),
      attachments: [{ relativePath: "../secrets/key.pem", mediaType: "text/plain", bytesSha256: "b".repeat(64) }],
    });
    assert(traversal.ok === false && traversal.code === "path-traversal", "path traversal");
    const exe = importAttributableResults(h2, {
      ...goodEnvelope(h2),
      attachments: [{ relativePath: "payload.exe", mediaType: "application/octet-stream", bytesSha256: "c".repeat(64) }],
    });
    assert(exe.ok === false && exe.code === "executable-attachment", "executable refused");
    const unsafe = importAttributableResults(h2, { ...goodEnvelope(h2), resultUrls: ["http://127.0.0.1/admin"] });
    assert(unsafe.ok === false && unsafe.code === "unsafe-url", "unsafe url");
    const cross = importAttributableResults(h2, { ...goodEnvelope(h2), workspaceId: "ws-other" });
    assert(cross.ok === false && cross.code === "cross-workspace-import", "cross-workspace");
    const missing = importAttributableResults(h2, { ...goodEnvelope(h2), externalEvidenceId: "" });
    assert(missing.ok === false && missing.code === "missing-attribution", "missing attribution");
    assert(classifyUncertainWrite("req-1", null).blindRetryAuthorized === false, "no blind retry");
    assert(cancelHandoff(h2).state === "cancelled", "cancelled");
    assert(refundAfterLocalCancel().status === "not-applicable", "cancel ≠ refund");
    assert(refundWhenProviderUnknown().status === "unknown", "refund unknown under hold");
    let minorsBlocked = false;
    try {
      prepareRecruitmentBrief({
        workspaceId: "ws-a",
        audience: "teens",
        goals: "x",
        buildRef: "b",
        exposureScope: "s",
        incentivePolicy: "honest-findings-only",
        minorsAllowed: true,
      } as unknown as RecruitmentBrief);
    } catch {
      minorsBlocked = true;
    }
    assert(minorsBlocked, "minors refused");
    assert(productionCustomerDataAllowedInBrief() === false, "no prod customer data");
    assert(secretsAllowedInImport() === false, "no secrets");
    let inferred = false;
    try {
      inferCountAcrossStages("requested", "completed");
    } catch {
      inferred = true;
    }
    assert(inferred, "no count inference");
  });

  harness.check("taskgrind-213: AC6 evidence classes reported separately; live not claimed", () => {
    const audit = read(TASKGRIND_213_AUDIT_DOC);
    for (const evidenceClass of TASKGRIND_213_EVIDENCE_CLASSES) {
      assert(audit.toLowerCase().includes(evidenceClass), `audit mentions ${evidenceClass}`);
    }
    assert(audit.includes("not performed") || audit.includes("NOT performed"), "live honesty");
    assert(TASKGRIND_213_LIVE_NOT_PERFORMED === true, "constant");
  });

  harness.check("taskgrind-213: AC7 independent review + holds; next #6 only", () => {
    const review = read(TASKGRIND_213_REVIEW_DOC);
    assert(review.includes("#213"), "review cites issue");
    assert(review.includes("operator-assisted"), "review cites mode");
    assert(review.includes("qualification hold") || review.includes("Qualification hold"), "review cites hold");
    assert(TASKGRIND_213_NEXT_AFTER_CLOSE === "#6", "stop → #6");
    assert(review.toLowerCase().includes("npm"), "npm hold mentioned");
  });
}
