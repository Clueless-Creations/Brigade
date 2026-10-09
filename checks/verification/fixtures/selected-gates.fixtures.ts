import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { definition, author } from "./binding-resolution.fixtures.js";
import { resolveRecipeBindings } from "../../../kernel/composition/resolve.js";
import { bindCatalogOperations } from "../../../kernel/composition/compile-bindings.js";
import { compilePlan, type CatalogInput } from "../../../kernel/engine/compile.js";
import { refreshPendingRevenueVerification, runDeterministicGates, assertGateProviderBindings } from "../../../kernel/session/deterministic-gates.js";
import { beginAttempt, reconcileEnvironmentalArtifacts, reconcilePatch, seedRunState } from "../../../kernel/engine/runstate.js";
import { workspaceArtifactFingerprint } from "../../../kernel/engine/review-evidence.js";
import {
  hasCurrentDeterministicVerification,
  listPendingFreshContext,
  recordDeterministicVerification,
  refuseFreshContextAcceptance,
  REVENUE_ACCEPTANCE_EVIDENCE,
} from "../../../kernel/engine/verification.js";
import { assert, skillRoot, type Harness } from "./_harness.js";
import { writeOfferTestFixture, writeProductFixture } from "./product-fixture.js";

function revenueWorkspace(h: Harness): string {
  const root = h.makeTempDir(`revenue-acceptance-${randomUUID()}`);
  writeProductFixture(root, "Habit recovery fixture");
  writeOfferTestFixture(root);
  for (const directory of ["state", "revenue", "engineering", "operations"]) mkdirSync(path.join(root, directory), { recursive: true });
  const state = JSON.parse(readFileSync(path.join(skillRoot, "examples/workspace/business/state/business-state.json"), "utf8"));
  state.lanes.revenue.status = "running";
  writeFileSync(path.join(root, "state/business-state.json"), JSON.stringify(state));
  writeFileSync(
    path.join(root, "revenue/REVENUE_OPS.md"),
    [
      "# Revenue operations",
      "Current offering ID: recovery",
      "RevenueCat proof artifact path: revenue/revenuecat-proof.json",
      "| Store Product ID | RC Product ID | RC Product Type | Entitlement | Package ID | MISSING_METADATA cleared? |",
      "| --- | --- | --- | --- | --- | --- |",
      "| app.habits.annual | habits_annual | auto_renewable_subscription | recovery | annual | yes |",
      "## Trial And Pricing Decision",
      "Founder approved: 2026-07-21",
      "### Competitor Anchor",
      "| Competitor | Annual price |",
      "| --- | --- |",
      "| Comparison app | 30 |",
      "## Paywall",
      "Model: hard_paywall. Trial duration: 7 days. Annual plan is highlighted.",
    ].join("\n"),
  );
  const proof = JSON.parse(readFileSync(path.join(skillRoot, "examples/workspace/business/revenue/revenuecat-proof.example.json"), "utf8"));
  Object.assign(proof, { probed_at: new Date().toISOString(), offering_id: "recovery", entitlement_ids: ["recovery"], synthetic: true });
  writeFileSync(path.join(root, "revenue/revenuecat-proof.json"), JSON.stringify(proof, null, 2));
  writeFileSync(path.join(root, "engineering/PRODUCTION_READINESS.md"), "Synthetic fixture: restore purchases tested without duplicate access.");
  writeFileSync(
    path.join(root, "operations/PROVIDER_PROOF.md"),
    [
      "# Provider proof",
      "| Provider | Current status | Proof command | Evidence path | Founder-only gate |",
      "| --- | --- | --- | --- | --- |",
      "| RevenueCat | captured synthetic catalog observation | fixture | revenue/revenuecat-proof.json | none |",
    ].join("\n"),
  );
  return root;
}
function setup(h: Harness) {
  const extension = definition();
  extension.implementations[0]!.validationContract = { id: "revenuecat", version: "1.0.0", kind: "billing" };
  extension.recipes[0]!.workflows = ["workflow.build"];
  extension.recipes[0]!.operations = [extension.recipes[0]!.operations[0]!];
  extension.recipes[0]!.operations[0]!.workflowContexts = [
    {
      workflowId: "workflow.build",
      instructions: "neutral",
      roleInstructions: "neutral",
      neutralReferenceIds: [],
      providerReferenceIds: [],
      neutralContextPackIds: [],
      providerContextPackIds: [],
    },
  ];
  const snapshot = author({ ...h, makeTempDir: (name) => h.makeTempDir(`${name}-${randomUUID()}`) }, extension);
  const resolved = resolveRecipeBindings({
    packages: [snapshot],
    recipe: { packageId: extension.id, packageVersion: extension.version, recipeId: extension.recipes[0]!.id },
    target: { platform: "ios", runtime: "swiftui" },
  });
  const source: CatalogInput = {
    version: "gates",
    artifacts: [],
    workflows: [
      {
        id: "workflow.build",
        title: "Build",
        domainId: "domain.code",
        actionClass: "draft",
        dependencies: [],
        outputPaths: [],
        providerIds: [],
        laneIds: [],
        founderOnlyActions: [],
        gateCommands: ["check:revenue"],
        idempotent: true,
      },
    ],
  };
  return bindCatalogOperations(source, resolved);
}
function refuses(action: () => unknown, code: string) {
  let message = "";
  try {
    action();
  } catch (error) {
    message = String(error);
  }
  assert(message.includes(code), message || "did not refuse");
}
export function register(h: Harness): void {
  h.check("pending legacy revenue receipts refresh strict proof without rewriting completed history or changed work", () => {
    const workspace = revenueWorkspace(h);
    const artifactPath = "revenue/REVENUE_OPS.md";
    const original = readFileSync(path.join(workspace, artifactPath), "utf8");
    const plan = compilePlan({
      version: "legacy-revenue",
      artifacts: [
        { id: "artifact.revenue-ops", path: artifactPath },
        { id: "artifact.offer", path: "strategy/OFFER_TEST.md" },
      ],
      workflows: [
        {
          id: "workflow.revenue-check",
          title: "Revenue check",
          domainId: "domain.money",
          actionClass: "draft",
          dependencies: [],
          reads: ["strategy/OFFER_TEST.md"],
          outputPaths: [artifactPath],
          providerIds: [],
          laneIds: ["revenue"],
          founderOnlyActions: [],
          gateCommands: ["check:revenue"],
          idempotent: true,
          requiresIndependentReview: true,
        },
      ],
    });
    const now = new Date().toISOString();
    const node = plan.nodes[0]!;
    const run = seedRunState(plan, JSON.parse(readFileSync(path.join(workspace, "state/business-state.json"), "utf8")), {
      ownerSessionId: "producer",
      ttlSeconds: 300,
      wallClockCapSeconds: 600,
      now,
    });
    reconcileEnvironmentalArtifacts(plan, run, workspace, now);
    const attempt = beginAttempt(plan, run, node.id, "producer", now);
    attempt.proofSource = "workspace";
    reconcilePatch(
      plan,
      run,
      {
        nodeId: node.id,
        attemptId: attempt.id,
        outputs: [
          {
            artifactId: "artifact.revenue-ops",
            path: artifactPath,
            fingerprint: workspaceArtifactFingerprint(workspace, artifactPath),
            evidence: ["produced"],
          },
        ],
      },
      now,
    );
    recordDeterministicVerification(plan, run, node.id, { allPassed: true, evidence: ["gate:check:revenue=passed", REVENUE_ACCEPTANCE_EVIDENCE] }, now);
    // Persisted receipts from the old runner had no strict-mode marker.
    attempt.deterministicVerification!.evidence = ["gate:check:revenue=passed"];
    const legacy = structuredClone(run);
    assert(!hasCurrentDeterministicVerification(plan, run, node.id), "legacy pending receipt admitted");
    const beforeList = JSON.stringify(run);
    assert(!listPendingFreshContext(plan, run).includes(node.id), "passive listing exposed legacy receipt as review-ready");
    assert(JSON.stringify(run) === beforeList, "passive listing mutated pending state");
    assert(refuseFreshContextAcceptance(plan, run, node.id, "reviewer")?.code === "gates_required", "direct acceptance bypassed strict mode");
    assert(refreshPendingRevenueVerification(plan, run, node.id, workspace, now) === "refreshed", "current legacy work did not refresh");
    assert(hasCurrentDeterministicVerification(plan, run, node.id), "strict refreshed proof is not current");
    assert(!refuseFreshContextAcceptance(plan, run, node.id, "reviewer"), "current strict proof blocked independent review");
    assert(
      run.nodes[node.id]!.attempts.length === 1 && readFileSync(path.join(workspace, artifactPath), "utf8") === original,
      "refresh reran the producer or rewrote its work",
    );

    const changed = structuredClone(legacy);
    writeFileSync(path.join(workspace, artifactPath), `${original}\nChanged after production.\n`);
    assert(refreshPendingRevenueVerification(plan, changed, node.id, workspace, now) === "repair", "changed output was stranded instead of repaired");
    assert(
      changed.nodes[node.id]!.status === "stale" &&
        !changed.nodes[node.id]!.attempts.at(-1)!.deterministicVerification!.evidence.includes(REVENUE_ACCEPTANCE_EVIDENCE),
      "changed output reran strict gates as the old attempt",
    );
    assert(!hasCurrentDeterministicVerification(plan, changed, node.id), "changed output retained acceptance");
    writeFileSync(path.join(workspace, artifactPath), original);
    for (const field of ["inputFingerprint", "authorityContextFingerprint"] as const) {
      const stale = structuredClone(legacy);
      stale.nodes[node.id]!.attempts.at(-1)!.deterministicVerification![field] = "changed-context";
      assert(refreshPendingRevenueVerification(plan, stale, node.id, workspace, now) === "repair", `changed ${field} was stranded`);
      assert(!hasCurrentDeterministicVerification(plan, stale, node.id), `changed ${field} admitted`);
    }
    const offerPath = path.join(workspace, "strategy/OFFER_TEST.md");
    const offerBytes = readFileSync(offerPath, "utf8");
    const changedInput = structuredClone(legacy);
    delete changedInput.nodes[node.id]!.attempts.at(-1)!.proofSource;
    writeFileSync(offerPath, `${offerBytes}\nChanged input after production.\n`);
    assert(
      refreshPendingRevenueVerification(plan, changedInput, node.id, workspace, now) === "repair",
      "unknown legacy proof source skipped changed input bytes",
    );
    assert(
      !changedInput.nodes[node.id]!.attempts.at(-1)!.deterministicVerification!.evidence.includes(REVENUE_ACCEPTANCE_EVIDENCE),
      "changed environmental input reran strict gates",
    );
    assert(readFileSync(offerPath, "utf8").endsWith("Changed input after production.\n"), "repair rewrote the changed input");
    writeFileSync(offerPath, offerBytes);
    const completed = structuredClone(legacy);
    completed.nodes[node.id]!.status = "succeeded";
    completed.nodes[node.id]!.attempts.at(-1)!.status = "succeeded";
    const completedBytes = JSON.stringify(completed);
    assert(hasCurrentDeterministicVerification(plan, completed, node.id), "completed legacy history was retroactively invalidated");
    assert(
      refreshPendingRevenueVerification(plan, completed, node.id, workspace, now) === "unchanged" && JSON.stringify(completed) === completedBytes,
      "completed history mutated",
    );

    const failed = structuredClone(legacy);
    rmSync(path.join(workspace, "revenue/revenuecat-proof.json"));
    assert(refreshPendingRevenueVerification(plan, failed, node.id, workspace, now) === "repair", "missing strict proof did not enter normal repair");
    assert(
      failed.nodes[node.id]!.status === "stale" && failed.nodes[node.id]!.attempts.at(-1)!.status === "failed",
      "failure was stranded instead of queued for bounded repair",
    );
    assert(readFileSync(path.join(workspace, artifactPath), "utf8") === original, "failed refresh removed produced work");
    assert(refreshPendingRevenueVerification(plan, failed, node.id, workspace, now) === "unchanged", "failed refresh reran without a new producer attempt");
  });
  h.check("selected validation contract compiles exact gate argv and rejects forged adapter/version/argument identity", () => {
    const catalog = setup(h),
      plan = compilePlan(catalog),
      node = plan.nodes[0]!;
    assert(
      JSON.stringify(node.verification.gateArguments?.["check:revenue"]) ===
        JSON.stringify(["--provider-contract", "revenuecat", "--provider-contract-version", "1.0.0"]),
      "arguments missing",
    );
    assertGateProviderBindings(
      node.verification.gateIds,
      { gateArguments: node.verification.gateArguments, selectedOperation: node.selectedOperation },
      skillRoot,
    );
    for (const args of [["--provider-contract", "other"], ["--provider-contract revenuecat"], [], ["--provider-contract", "revenuecat", "--root", "/tmp"]]) {
      const tampered = structuredClone(catalog);
      tampered.workflows[0]!.gateArguments = { "check:revenue": args };
      refuses(() => compilePlan(tampered), "binding.gate_arguments_mismatch");
    }
    const tampered = structuredClone(catalog);
    tampered.workflows[0]!.selectedOperation!.implementation.validationContract!.version = "2.0.0";
    refuses(() => compilePlan(tampered), "binding.implementation_contract_mismatch");
    const removed = structuredClone(catalog);
    delete removed.workflows[0]!.gateArguments;
    refuses(() => compilePlan(removed), "binding.gate_arguments_mismatch");
    const shell = structuredClone(catalog);
    shell.workflows[0]!.gateCommands = ["check:revenue --provider-contract revenuecat"];
    refuses(() => compilePlan(shell), "binding.invalid_gate_id");
  });
  h.check("deterministic gate uses separate argv and refuses invalid selected contract before spawning", () => {
    const node = compilePlan(setup(h)).nodes[0]!,
      workspace = h.makeTempDir(`selected-gate-${randomUUID()}`),
      bin = path.join(workspace, "bin"),
      capture = path.join(workspace, "argv.txt");
    mkdirSync(bin);
    const npm = path.join(bin, "npm");
    writeFileSync(npm, '#!/bin/sh\nprintf \'%s\\n\' "$@" > "$B2C_GATE_TEST_CAPTURE"\nexit 0\n');
    chmodSync(npm, 0o755);
    const priorPath = process.env.PATH,
      priorCapture = process.env.B2C_GATE_TEST_CAPTURE;
    process.env.PATH = `${bin}:${priorPath}`;
    process.env.B2C_GATE_TEST_CAPTURE = capture;
    try {
      const result = runDeterministicGates(node.verification.gateIds, workspace, {
        gateArguments: node.verification.gateArguments,
        selectedOperation: node.selectedOperation,
      });
      assert(result.allPassed, "synthetic subprocess did not run");
      const argv = readFileSync(capture, "utf8").trim().split("\n");
      assert(
        argv.includes("check:revenue") &&
          argv.includes("--") &&
          argv.includes("--require-done") &&
          argv.at(-4) === "--provider-contract" &&
          argv.at(-3) === "revenuecat" &&
          argv.at(-2) === "--provider-contract-version" &&
          argv.at(-1) === "1.0.0",
        "provider args were not separate tokens",
      );
      runDeterministicGates(["check:catalog"], workspace);
      assert(!readFileSync(capture, "utf8").includes("--require-done"), "revenue acceptance mode leaked into an unrelated gate");
      writeFileSync(capture, "untouched");
      const unregistered = runDeterministicGates(["check:catalog", "build"], workspace);
      assert(!unregistered.allPassed && unregistered.issueCodes.includes("gate.unregistered_host_command"), "non-gate script was accepted");
      assert(readFileSync(capture, "utf8") === "untouched", "preflight started a valid gate before rejecting a later command");
      const invalid = runDeterministicGates(node.verification.gateIds, workspace, {
        gateArguments: { "check:revenue": ["--provider-contract", "other"] },
        selectedOperation: node.selectedOperation,
      });
      assert(
        !invalid.allPassed && invalid.issueCodes.includes("gate.provider_binding_invalid") && readFileSync(capture, "utf8") === "untouched",
        "invalid binding spawned a process",
      );
    } finally {
      process.env.PATH = priorPath;
      if (priorCapture === undefined) delete process.env.B2C_GATE_TEST_CAPTURE;
      else process.env.B2C_GATE_TEST_CAPTURE = priorCapture;
    }
  });
  h.check("revenue acceptance enforces existing proof before lane success while passive setup remains allowed", () => {
    const workspace = revenueWorkspace(h);
    const statePath = path.join(workspace, "state/business-state.json");
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    const node = compilePlan(setup(h)).nodes[0]!;
    const context = { gateArguments: node.verification.gateArguments, selectedOperation: node.selectedOperation };
    const accepted = runDeterministicGates(node.verification.gateIds, workspace, context);
    assert(accepted.allPassed, `complete running revenue rejected: ${accepted.issueCodes.join(", ")}`);
    assert(JSON.parse(readFileSync(statePath, "utf8")).lanes.revenue.status === "running", "gate mutated the authoritative lane state");
    rmSync(path.join(workspace, "revenue/revenuecat-proof.json"));
    for (const status of ["running", "not_needed", "deferred"]) {
      state.lanes.revenue.status = status;
      const bytes = JSON.stringify(state);
      writeFileSync(statePath, bytes);
      const passive = spawnSync(
        process.execPath,
        ["--import", "tsx", path.join(skillRoot, "checks/validation/business/money/check-revenue.ts"), "--root", workspace],
        {
          cwd: skillRoot,
          encoding: "utf8",
        },
      );
      assert(passive.status === 0, `${status} passive inspection blocked setup: ${passive.stdout}${passive.stderr}`);
      const rejected = runDeterministicGates(node.verification.gateIds, workspace, context);
      assert(!rejected.allPassed && rejected.issueCodes.includes("revenue.proof_json.missing"), `${status} skipped selected acceptance proof`);
      assert(readFileSync(statePath, "utf8") === bytes, "strict gate changed reducer-owned state");
    }
  });
}
