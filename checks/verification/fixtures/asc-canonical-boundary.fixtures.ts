/**
 * #113 ASC canonical-operation boundary fixtures.
 *
 * Deterministic only. No live `asc`, no App Review submit/release, no sandbox
 * account. Fake runners are wiring — never independent contract source.
 * Fixture pin: ASC CLI 5.1.0.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  APPLE_ASC_CANONICAL_MAP,
  APPLE_ASC_CANONICAL_INVENTORY_DOC,
  APPLE_ASC_CANONICAL_MAP_PATH,
  APPLE_ASC_CANONICAL_MAP_REQUIRED_OP_CLASSES,
  APPLE_ASC_DISTINCT_EVIDENCE_NOTE,
  APPLE_ASC_PROTECTED_EFFECTS,
  APPLE_STORE_MEDIA_STANDING_ENVELOPE,
  ASC_CLI_AUTOMATION_WORKFLOW,
  ASC_CLI_COOKBOOK_DIR,
  ASC_CLI_REVIEWED_REVISION,
  ASC_CLI_REVIEWED_VERSION,
  ASC_EVIDENCE_CLASSES,
  ASC_LOGICAL_SEAMS,
  ASC_NON_AUTHORITY_FLAGS,
  ASC_OP_CLASSES,
  appleAscCanonicalMapRow,
  appleAscProtectedRows,
  appleAscRowsForOpClass,
  ascFlagLooksNoninteractive,
  ascNoninteractiveGrantsAuthority,
  evidenceClassesRemainDistinct,
  getAppleAscCanonicalMap,
  mediaIsPrerequisiteOfAscCliAutomation,
} from "../../../catalog/providers/apple-asc-canonical-map.js";
import {
  ASC_NATIVE_LEAK_SYMBOLS,
  ASC_TYPED_CONTRACT_CONSUMERS,
  canonicalMapModulePath,
  pathIsTypedAscConsumer,
  pathMayOwnAscNativeTypes,
  reviewedAscCliVersion,
  sourceImportsAscNativeLeak,
  ascSeamOwner,
} from "../../../adapters/app-review/asc-boundary.js";
import {
  classifyAscUncertainExecution,
  classifyPartialProviderOutput,
  classifyTimeoutAfterMutation,
  classifyWrongTarget,
  targetsMatch,
} from "../../../adapters/app-review/uncertain-execution.js";
import { workflows as buildReleaseWorkflows } from "../../../catalog/workflows/build-release.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const COOKBOOK_README = path.join(skillRoot, ASC_CLI_COOKBOOK_DIR, "README.md");
const INVENTORY_DOC = path.join(skillRoot, APPLE_ASC_CANONICAL_INVENTORY_DOC);
const CONFORMANCE = path.join(skillRoot, "checks/verification/fixtures/asc-observe-conformance.fixtures.ts");

function workflowById(id: string) {
  const row = buildReleaseWorkflows.find((workflow) => workflow.id === id);
  assert(row !== undefined, `missing workflow ${id}`);
  return row!;
}

export function register(harness: Harness): void {
  harness.check("asc-canonical: map covers every required op class with evidence + authority tags", () => {
    assert(getAppleAscCanonicalMap() === APPLE_ASC_CANONICAL_MAP, "getter returns authored map");
    assert(canonicalMapModulePath() === APPLE_ASC_CANONICAL_MAP_PATH, "stable map path");
    assert(reviewedAscCliVersion() === "5.1.0", "fixture pin is 5.1.0");
    for (const opClass of APPLE_ASC_CANONICAL_MAP_REQUIRED_OP_CLASSES) {
      const rows = appleAscRowsForOpClass(opClass);
      assert(rows.length >= 1, `op class ${opClass} has at least one row`);
    }
    assert(ASC_OP_CLASSES.length === 10, "ten op classes: observe…readback");
    for (const row of APPLE_ASC_CANONICAL_MAP) {
      assert(row.nativeCapability.length > 0, `${row.id} names a native capability`);
      assert(row.implementationPointer.length > 0, `${row.id} has an implementation pointer`);
      assert(ASC_EVIDENCE_CLASSES.includes(row.evidenceClass), `${row.id} evidence class`);
      assert(row.authorityClass.length > 0, `${row.id} authority`);
    }
  });

  harness.check("asc-canonical: submit/release/credentials/create stay protected or rejected", () => {
    const submit = appleAscCanonicalMapRow("review-submit");
    assert(submit.authorityClass === "founder-protected", "submit is founder-protected");
    assert(submit.evidenceClass === "review-held", "submit evidence is review-held, not fixture-greenwashed");
    const release = appleAscCanonicalMapRow("release-publish");
    assert(release.disposition === "reject", "publish --submit stays rejected");
    assert(release.authorityClass === "rejected", "publish authority rejected");
    const create = appleAscCanonicalMapRow("create-app-record");
    assert(create.disposition === "held", "app create held");
    assert(create.effectClass === "create", "create effect class");
    assert(create.authorityClass === "founder-protected", "create founder-protected");
    const accept = appleAscCanonicalMapRow("credentials-agreements-accept");
    assert(accept.disposition === "reject", "agreements accept rejected");
    assert(accept.effectClass === "credential", "credential effect");
    const protectedRows = appleAscProtectedRows();
    assert(protectedRows.length >= 5, "protected set is non-empty");
    for (const effect of APPLE_ASC_PROTECTED_EFFECTS) {
      assert(
        APPLE_ASC_CANONICAL_MAP.some((row) => row.effectClass === effect),
        `protected effect ${effect} appears in map`,
      );
    }
  });

  harness.check("asc-canonical: --yes and noninteractive never grant authority", () => {
    assert(ascNoninteractiveGrantsAuthority(["--yes"]) === false, "--yes is not authority");
    assert(ascNoninteractiveGrantsAuthority(["--non-interactive", "--yes"]) === false, "noninteractive is not authority");
    for (const flag of ASC_NON_AUTHORITY_FLAGS) {
      assert(ascFlagLooksNoninteractive(flag), `${flag} recognized`);
    }
    const decision = classifyAscUncertainExecution({
      opClass: "review-submit",
      phase: "failure-before-dispatch",
      mutationConfirmed: false,
      localReceiptMissing: false,
      verifyFailed: false,
      duplicateRequest: false,
      targetMatchesMandate: true,
      outputTruncatedOrPartial: false,
      authorityGranted: false,
      noninteractiveFlags: ["--yes", "--non-interactive"],
    });
    assert(decision.action === "fail-closed", "yes without authority fails closed");
    assert(decision.allowMutationReplay === false, "no mutation replay from flags");
  });

  harness.check("asc-canonical: evidence classes stay distinct; inventory doc present", () => {
    assert(evidenceClassesRemainDistinct([...ASC_EVIDENCE_CLASSES]), "five evidence classes");
    assert(APPLE_ASC_DISTINCT_EVIDENCE_NOTE.includes("fixture"), "honesty note names fixture");
    const doc = readFileSync(INVENTORY_DOC, "utf8");
    assert(doc.includes("#113"), "inventory names #113");
    assert(doc.includes("5.1.0"), "inventory pins 5.1.0");
    assert(doc.includes(APPLE_STORE_MEDIA_STANDING_ENVELOPE), "inventory names #38 media envelope");
    assert(doc.includes("#114"), "inventory names next sibling without implementing it");
    assert(!doc.includes("live sandbox: yes"), "inventory does not authorize live sandbox");
  });

  harness.check("asc-canonical: independent cookbook provenance; fake ≠ contract", () => {
    const readme = readFileSync(COOKBOOK_README, "utf8");
    assert(readme.includes("5.1.0"), "cookbook README pins 5.1.0");
    assert(readme.includes(ASC_CLI_REVIEWED_REVISION) || readme.includes("ca759a3"), "cookbook names reviewed revision");
    assert(readme.includes("not from the builder encoder") || readme.includes("not from the builder"), "cookbook denies encoder as source");
    const conformance = readFileSync(CONFORMANCE, "utf8");
    assert(conformance.includes("Adapter-built resubmit argv"), "conformance rejects adapter argv as independent evidence");
    assert(conformance.includes(ASC_CLI_REVIEWED_VERSION) || conformance.includes("5.1.0"), "conformance pins 5.1.0");
    const cookbookFiles = readdirSync(path.join(skillRoot, ASC_CLI_COOKBOOK_DIR)).filter((name) => name.endsWith(".json"));
    assert(cookbookFiles.length >= 10, `expected cookbook stems, got ${cookbookFiles.length}`);
  });

  harness.check("asc-canonical: ADR-0013 logical seams named without a framework", () => {
    assert(ASC_LOGICAL_SEAMS.length === 5, "five logical seams");
    for (const role of ["definition", "encoder", "transport", "decoder", "reconciler"] as const) {
      const owner = ascSeamOwner(role);
      assert(owner.includes("adapters/app-review") || owner.includes("catalog/providers") || owner.includes("standing-envelope"), owner);
    }
    assert(pathMayOwnAscNativeTypes("adapters/app-review/asc-provider.ts"), "adapter may own native types");
    assert(pathIsTypedAscConsumer("catalog/workflows/build-release.ts"), "workflows are typed consumers");
    assert(pathIsTypedAscConsumer("kernel/session/run.ts"), "kernel is typed consumer");
  });

  harness.check("asc-canonical: typed consumers do not import ASC-native leak symbols", () => {
    const roots = ASC_TYPED_CONTRACT_CONSUMERS.map((prefix) => path.join(skillRoot, prefix));
    const offenders: string[] = [];
    for (const root of roots) {
      const walk = (dir: string): void => {
        let dirents;
        try {
          dirents = readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const name of dirents) {
          const full = path.join(dir, name.name);
          if (name.isDirectory()) {
            if (name.name === "node_modules" || name.name === "generated") continue;
            walk(full);
            continue;
          }
          if (!name.name.endsWith(".ts") && !name.name.endsWith(".js")) continue;
          const rel = path.relative(skillRoot, full).replace(/\\/g, "/");
          if (!pathIsTypedAscConsumer(rel)) continue;
          // Kernel ingress may construct the live provider — allow AscCommandRunner only via index re-export usage in session; check for native *Result envelope names.
          const source = readFileSync(full, "utf8");
          const leaks = sourceImportsAscNativeLeak(source).filter((symbol) => {
            if (rel.startsWith("kernel/session/") && (symbol === "AscCommandRunner" || symbol === "spawnAscCommand")) {
              // Composition root may wire the provider; envelope Result types must still not appear.
              return false;
            }
            return ASC_NATIVE_LEAK_SYMBOLS.includes(symbol as (typeof ASC_NATIVE_LEAK_SYMBOLS)[number]);
          });
          const envelopeLeaks = leaks.filter(
            (symbol) =>
              symbol.endsWith("Result") ||
              symbol === "PushPlanResult" ||
              symbol === "ValidateResult" ||
              symbol === "reviewStatusResult" ||
              symbol === "reviewSubmitResult",
          );
          if (envelopeLeaks.length > 0) {
            offenders.push(`${rel}: ${envelopeLeaks.join(",")}`);
          }
        }
      };
      walk(root);
    }
    assert(offenders.length === 0, `ASC-native envelope leakage: ${offenders.join("; ")}`);
  });

  harness.check("asc-canonical #38: media maps to standing envelope; not a prerequisite of asc-cli-automation", () => {
    const media = workflowById(APPLE_STORE_MEDIA_STANDING_ENVELOPE);
    const automation = workflowById(ASC_CLI_AUTOMATION_WORKFLOW);
    assert(media.id === APPLE_STORE_MEDIA_STANDING_ENVELOPE, "media workflow id");
    assert(media.dependencies.includes("workflow.store.store-screenshots-production"), "media depends on screenshot production");
    assert(media.dependencies.includes("workflow.store.store-console-workflow"), "media depends on store console");
    assert(!media.dependencies.includes(ASC_CLI_AUTOMATION_WORKFLOW), "media does not depend on broad asc-cli-automation");
    assert(!mediaIsPrerequisiteOfAscCliAutomation(automation.dependencies), "asc-cli-automation must not require media standing envelope");
    assert(!automation.dependencies.includes(APPLE_STORE_MEDIA_STANDING_ENVELOPE), "no graph edge: media prerequisite of all ASC automation");
    const mediaRows = appleAscRowsForOpClass("media");
    assert(
      mediaRows.every((row) => row.canonicalOperation === APPLE_STORE_MEDIA_STANDING_ENVELOPE),
      "all media rows map to #38 envelope",
    );
    assert(
      mediaRows.every((row) => row.ownerIssue === "#38"),
      "media rows keep #38 owner",
    );
  });

  harness.check("asc-uncertain: timeout after mutation resumes verify (all mutating op classes)", () => {
    for (const opClass of ["metadata", "media", "upload", "testflight", "review-submit"] as const) {
      const decision = classifyTimeoutAfterMutation(opClass);
      assert(decision.action === "resume-verify", `${opClass} timeout → resume-verify`);
      assert(decision.allowMutationReplay === false, `${opClass} timeout refuses blind replay`);
    }
  });

  harness.check("asc-uncertain: remote accept before local receipt resumes verify", () => {
    const decision = classifyAscUncertainExecution({
      opClass: "metadata",
      phase: "remotely-accepted",
      mutationConfirmed: true,
      localReceiptMissing: true,
      verifyFailed: false,
      duplicateRequest: false,
      targetMatchesMandate: true,
      outputTruncatedOrPartial: false,
      authorityGranted: true,
    });
    assert(decision.action === "resume-verify", "remote accept without local receipt → verify");
    assert(decision.allowMutationReplay === false, "no blind replay");
  });

  harness.check("asc-uncertain: failed verify-after-mutate resumes verify not blind replay", () => {
    const decision = classifyAscUncertainExecution({
      opClass: "review-submit",
      phase: "verification-pending",
      mutationConfirmed: true,
      localReceiptMissing: false,
      verifyFailed: true,
      duplicateRequest: false,
      targetMatchesMandate: true,
      outputTruncatedOrPartial: false,
      authorityGranted: true,
    });
    assert(decision.action === "resume-verify", "failed verify resumes observation");
    assert(decision.allowMutationReplay === false, "never blind mutation replay");
    assert(decision.reason.includes("resume") || decision.reason.includes("failed-verify"), decision.reason);
  });

  harness.check("asc-uncertain: duplicate request holds without re-dispatch", () => {
    const decision = classifyAscUncertainExecution({
      opClass: "review-submit",
      phase: "verification-pending",
      mutationConfirmed: true,
      localReceiptMissing: true,
      verifyFailed: false,
      duplicateRequest: true,
      targetMatchesMandate: true,
      outputTruncatedOrPartial: false,
      authorityGranted: true,
    });
    assert(decision.action === "hold-duplicate", "duplicate held");
    assert(decision.allowMutationReplay === false, "duplicate is not a new mutation");
  });

  harness.check("asc-uncertain: wrong app/account/env fail closed before protected effects", () => {
    const mandate = { appId: "app-1", appleTeamId: "TEAM1", appStoreVersionId: "asv-1", environment: "production" };
    assert(targetsMatch(mandate, { ...mandate }) === true, "identical targets match");
    const wrongApp = classifyWrongTarget("review-submit", mandate, { ...mandate, appId: "app-other" });
    assert(wrongApp.action === "fail-closed", "wrong app fails closed");
    assert(wrongApp.allowMutationReplay === false, "wrong app no mutation");
    const wrongTeam = classifyWrongTarget("release", mandate, { ...mandate, appleTeamId: "TEAM2" });
    assert(wrongTeam.action === "fail-closed", "wrong account fails closed");
    const wrongEnv = classifyWrongTarget("upload", mandate, { ...mandate, environment: "sandbox" });
    assert(wrongEnv.action === "fail-closed", "wrong env fails closed");
    const wrongVersion = classifyWrongTarget("metadata", mandate, { ...mandate, appStoreVersionId: "asv-other" });
    assert(wrongVersion.action === "fail-closed", "wrong version fails closed");
  });

  harness.check("asc-uncertain: pagination/partial/truncated output holds without inventing completeness", () => {
    const partial = classifyPartialProviderOutput("observe", true);
    assert(partial.action === "hold-partial-output", "truncated → hold-partial-output");
    assert(partial.allowMutationReplay === false, "partial output is not mutation authority");
    const complete = classifyPartialProviderOutput("observe", false);
    assert(complete.action === "resume-verify" || complete.action === "no-op", `complete path ${complete.action}`);
  });

  harness.check("asc-canonical: portfolio and first-run owners preserved; no second store", () => {
    const portfolio = appleAscCanonicalMapRow("observe-portfolio-apps-list");
    assert(portfolio.ownerIssue.includes("#23") || portfolio.ownerIssue.includes("#60"), "portfolio owners");
    assert(portfolio.canonicalOperation === "workflow.operations.live-app-store-portfolio", "portfolio workflow");
    assert(portfolio.notes.includes("not a second"), "no second App Store state store");
  });
}
