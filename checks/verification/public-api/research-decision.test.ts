import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { parse, stringify } from "yaml";
import { callPublicOperation } from "../../../kernel/services/business.js";
import { recordResearchDecision } from "../../../kernel/services/research-decision.js";
import { workspaceRevision } from "../../../kernel/session/workspace-revision.js";
import { loadProductInstanceDocument, productYamlPath } from "../../../catalog/ontology/instance-load.js";
import { renderProductMarkdown } from "../../../catalog/ontology/render-product.js";

function setup() {
  const temp = mkdtempSync(path.join(tmpdir(), "b2c-research-decision-"));
  return { temp, home: path.join(temp, "registry"), directory: path.join(temp, "app") };
}

test("research decision previews, applies once, and replays without duplicating the decision", () => {
  const env = setup();
  const previousHome = process.env.B2C_APP_BUILDER_HOME;
  process.env.B2C_APP_BUILDER_HOME = env.home;
  try {
    const created = callPublicOperation("business.create", {
      workspaceId: "app",
      directory: env.directory,
      name: "Useful Habit",
      hypothesis: "A repeated consumer need",
    });
    assert(created.ok, JSON.stringify(created));
    writeFileSync(
      path.join(env.directory, "strategy/RED_TEAM_FINDINGS.md"),
      "# Red-team findings\n\n| Finding ID | Severity | Finding |\n| --- | --- | --- |\n| finding-a | medium | Narrow the audience. |\n",
    );
    const input = {
      workspaceId: "app",
      expectedRevision: workspaceRevision(env.directory),
      decisionId: "pivot-001",
      verdict: "Pivot" as const,
      rationale: "The wedge needs a narrower audience before any build work.",
      findingIds: ["finding-a"],
      apply: false,
    };
    const productBefore = readFileSync(path.join(env.directory, "product.yaml"), "utf8");
    const renderedBefore = readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8");
    const unresolved = callPublicOperation("business.research.decision", { ...input, findingIds: ["finding-missing"] });
    assert(!unresolved.ok && unresolved.error.message.includes("finding_id_unresolved"), JSON.stringify(unresolved));
    assert.equal(readFileSync(path.join(env.directory, "product.yaml"), "utf8"), productBefore);
    writeFileSync(
      path.join(env.directory, "strategy/RED_TEAM_FINDINGS.md"),
      "# Red-team findings\n\n| Finding ID | Severity | Finding |\n| --- | --- | --- |\n| finding-a | medium | Narrow the audience. |\n| finding-a | high | The same ID was authored twice. |\n",
    );
    const ambiguous = callPublicOperation("business.research.decision", { ...input, expectedRevision: workspaceRevision(env.directory) });
    assert(!ambiguous.ok && ambiguous.error.message.includes("finding_id_ambiguous"), JSON.stringify(ambiguous));
    assert.equal(readFileSync(path.join(env.directory, "product.yaml"), "utf8"), productBefore);
    assert.equal(readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8"), renderedBefore);
    writeFileSync(
      path.join(env.directory, "strategy/RED_TEAM_FINDINGS.md"),
      "# Red-team findings\n\n| Finding ID | Severity | Finding |\n| --- | --- | --- |\n| finding-a | medium | Narrow the audience. |\n",
    );
    const preview = callPublicOperation("business.research.decision", input);
    assert(preview.ok, JSON.stringify(preview));
    assert.equal(preview.data.applied, false);
    assert.equal(preview.data.initializationEligible, false);
    assert.equal(readFileSync(path.join(env.directory, "product.yaml"), "utf8"), productBefore);
    assert.equal(readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8"), renderedBefore);

    writeFileSync(
      path.join(env.directory, "strategy/RED_TEAM_FINDINGS.md"),
      "# Red-team findings\n\n| Finding ID | Severity | Finding |\n| --- | --- | --- |\n| finding-a | high | The audience claim changed after review. |\n",
    );
    const staleFindingApply = callPublicOperation("business.research.decision", { ...input, apply: true });
    assert(!staleFindingApply.ok && staleFindingApply.error.message.includes("stale_revision"), JSON.stringify(staleFindingApply));
    assert.equal(readFileSync(path.join(env.directory, "product.yaml"), "utf8"), productBefore);
    assert.equal(readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8"), renderedBefore);

    assert.throws(
      () =>
        recordResearchDecision({
          ...input,
          expectedRevision: workspaceRevision(env.directory),
          apply: true,
          afterWrite: (boundary) => {
            if (boundary === "journal") throw new Error("fixture journal interruption");
          },
        }),
      /fixture journal interruption/,
    );
    const journalPath = path.join(env.directory, "strategy/.b2c-research-decision-journal.json");
    assert(existsSync(journalPath), "journal-boundary interruption must leave the recovery journal");
    assert.equal(readFileSync(path.join(env.directory, "product.yaml"), "utf8"), productBefore);
    assert.equal(readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8"), renderedBefore);

    const currentRevision = workspaceRevision(env.directory);
    const currentInput = { ...input, expectedRevision: currentRevision };
    const applied = callPublicOperation("business.research.decision", { ...currentInput, apply: true });
    assert(applied.ok, JSON.stringify(applied));
    assert.equal(applied.data.applied, false);
    assert.equal(applied.data.replayed, true);
    assert(!existsSync(journalPath), "journal recovery must clear the completed journal");
    const changedProduct = readFileSync(path.join(env.directory, "product.yaml"), "utf8");
    const renderedApplied = readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8");
    assert(changedProduct.includes("b2c-research-decision:v1:pivot-001:"));
    assert(renderedApplied.includes("narrower audience"));

    const replay = callPublicOperation("business.research.decision", {
      ...input,
      expectedRevision: applied.data.revision,
      apply: true,
    });
    assert(replay.ok, JSON.stringify(replay));
    assert.equal(replay.data.replayed, true);
    assert.equal(replay.data.applied, false);
    assert.equal(readFileSync(path.join(env.directory, "product.yaml"), "utf8"), changedProduct);
    assert.equal((changedProduct.match(/b2c-research-decision:v1:pivot-001:/g) ?? []).length, 1);

    const interruptedInput = { ...input, decisionId: "pivot-003", expectedRevision: applied.data.revision, apply: true };
    assert.throws(
      () =>
        recordResearchDecision({
          ...interruptedInput,
          afterWrite: (boundary) =>
            boundary === "product" &&
            (() => {
              throw new Error("fixture interruption");
            })(),
        }),
      /fixture interruption/,
    );
    const thirdPartyPath = path.join(env.directory, "strategy/third-party-note.md");
    const thirdPartyEdit = "# Independent note\n\nThis edit must survive decision recovery.\n";
    writeFileSync(thirdPartyPath, thirdPartyEdit);
    assert.throws(() => recordResearchDecision(interruptedInput), /stale_revision/);
    const recovered = recordResearchDecision({ ...interruptedInput, expectedRevision: workspaceRevision(env.directory) });
    assert.equal(recovered.replayed, true);
    assert(readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8").includes("pivot-003"));
    assert.equal(readFileSync(thirdPartyPath, "utf8"), thirdPartyEdit, "recovery must preserve an unrelated third-party edit");

    assert.throws(
      () =>
        recordResearchDecision({
          ...input,
          expectedRevision: recovered.revision,
          rationale: "A changed payload must not reuse the old decision identity.",
          apply: true,
        }),
      /research_decision_id_reused/,
    );

    const renderedBoundaryInput = { ...input, decisionId: "pivot-004", expectedRevision: recovered.revision, apply: true };
    assert.throws(
      () =>
        recordResearchDecision({
          ...renderedBoundaryInput,
          afterWrite: (boundary) => {
            if (boundary === "rendered") throw new Error("fixture rendered interruption");
          },
        }),
      /fixture rendered interruption/,
    );
    assert(existsSync(journalPath), "rendered-boundary interruption must leave the recovery journal");
    const recoveredRenderedBoundary = recordResearchDecision({ ...renderedBoundaryInput, expectedRevision: workspaceRevision(env.directory) });
    assert.equal(recoveredRenderedBoundary.replayed, true);
    assert.equal(recoveredRenderedBoundary.applied, false);
    assert(!existsSync(journalPath), "recovery must remove the completed journal");
    assert(readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8").includes("pivot-004"));

    assert.throws(() => recordResearchDecision({ ...input, expectedRevision: applied.data.revision, apply: true }), /stale_revision/);

    writeFileSync(path.join(env.directory, "product.yaml"), `${productBefore}\nmeta: {}\n`);
    assert.throws(
      () =>
        recordResearchDecision({
          ...input,
          expectedRevision: workspaceRevision(env.directory),
          decisionId: "pivot-002",
          apply: true,
        }),
      /research_decision_product_invalid/,
    );
    const recoveredRendered = readFileSync(path.join(env.directory, "PRODUCT.md"), "utf8");
    assert(recoveredRendered.includes("b2c-research-decision:v1:pivot-003:"));
  } finally {
    if (previousHome === undefined) delete process.env.B2C_APP_BUILDER_HOME;
    else process.env.B2C_APP_BUILDER_HOME = previousHome;
    assert(!existsSync(path.join(env.directory, "control", "control.json")));
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("a Pivot checkpoint holds initialization until an explicit Go continuation is accepted", () => {
  const env = setup();
  const previousHome = process.env.B2C_APP_BUILDER_HOME;
  process.env.B2C_APP_BUILDER_HOME = env.home;
  try {
    const created = callPublicOperation("business.create", {
      workspaceId: "app",
      directory: env.directory,
      name: "Useful Habit",
      hypothesis: "A repeated consumer need",
    });
    assert(created.ok, JSON.stringify(created));

    const pivot = callPublicOperation("business.research.decision", {
      workspaceId: "app",
      expectedRevision: workspaceRevision(env.directory),
      decisionId: "pivot-hold",
      verdict: "Pivot",
      rationale: "Narrow the audience before accepting a build direction.",
      findingIds: [],
      apply: true,
    });
    assert(pivot.ok, JSON.stringify(pivot));
    const held = callPublicOperation("business.plan", { workspaceId: "app" });
    assert(held.ok, JSON.stringify(held));
    assert.equal(held.data.status, "not_initialized");
    assert.equal(held.data.completion.deliveryAccepted, false);
    assert(!callPublicOperation("business.initialize", { workspaceId: "app", expectedRevision: held.data.revision }).ok);

    const go = callPublicOperation("business.research.decision", {
      workspaceId: "app",
      expectedRevision: held.data.revision,
      decisionId: "go-after-pivot",
      verdict: "Go",
      rationale: "The narrower audience now has a clear, testable wedge.",
      findingIds: [],
      apply: true,
    });
    assert(go.ok, JSON.stringify(go));
    const productPath = productYamlPath(env.directory);
    const product = parse(readFileSync(productPath, "utf8"));
    product.meta.status = "accepted";
    writeFileSync(productPath, stringify(product));
    writeFileSync(path.join(env.directory, "PRODUCT.md"), renderProductMarkdown(loadProductInstanceDocument(productPath)));
    const initialized = callPublicOperation("business.initialize", {
      workspaceId: "app",
      expectedRevision: workspaceRevision(env.directory),
    });
    assert(initialized.ok, JSON.stringify(initialized));
    assert.equal(initialized.data.status, "initialized");
    assert(existsSync(path.join(env.directory, "control", "control.json")));
  } finally {
    if (previousHome === undefined) delete process.env.B2C_APP_BUILDER_HOME;
    else process.env.B2C_APP_BUILDER_HOME = previousHome;
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("an explicit Kill checkpoint remains held without silently restarting or becoming Go", () => {
  const env = setup();
  const previousHome = process.env.B2C_APP_BUILDER_HOME;
  process.env.B2C_APP_BUILDER_HOME = env.home;
  try {
    const created = callPublicOperation("business.create", {
      workspaceId: "app",
      directory: env.directory,
      name: "Useful Habit",
      hypothesis: "A repeated consumer need",
    });
    assert(created.ok, JSON.stringify(created));

    const killed = callPublicOperation("business.research.decision", {
      workspaceId: "app",
      expectedRevision: workspaceRevision(env.directory),
      decisionId: "kill-checkpoint",
      verdict: "Kill",
      rationale: "The tested wedge does not justify continuing this business direction.",
      findingIds: [],
      apply: true,
    });
    assert(killed.ok, JSON.stringify(killed));

    const planned = callPublicOperation("business.plan", { workspaceId: "app" });
    assert(planned.ok, JSON.stringify(planned));
    assert.equal(planned.data.status, "not_initialized");
    assert.equal(planned.data.completion.deliveryAccepted, false);
    assert(!callPublicOperation("business.initialize", { workspaceId: "app", expectedRevision: planned.data.revision }).ok);

    const product = readFileSync(path.join(env.directory, "product.yaml"), "utf8");
    const decisionLog = parse(product).copy.decision_log as string;
    assert.match(decisionLog, /\| Kill \|/);
    assert.doesNotMatch(decisionLog, /\| Go \|/);
    assert.equal((decisionLog.match(/b2c-research-decision:v1:kill-checkpoint:/g) ?? []).length, 1);

    const replayPlan = callPublicOperation("business.plan", { workspaceId: "app" });
    assert(replayPlan.ok, JSON.stringify(replayPlan));
    assert.equal(replayPlan.data.status, "not_initialized");
    assert.equal(replayPlan.data.completion.deliveryAccepted, false);
  } finally {
    if (previousHome === undefined) delete process.env.B2C_APP_BUILDER_HOME;
    else process.env.B2C_APP_BUILDER_HOME = previousHome;
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("Pivot hold surfaces a precise next action and refuses forged path / concurrent lock / protected broaden", () => {
  const env = setup();
  const previousHome = process.env.B2C_APP_BUILDER_HOME;
  process.env.B2C_APP_BUILDER_HOME = env.home;
  try {
    const created = callPublicOperation("business.create", {
      workspaceId: "app",
      directory: env.directory,
      name: "Useful Habit",
      hypothesis: "A repeated consumer need",
    });
    assert(created.ok, JSON.stringify(created));
    writeFileSync(
      path.join(env.directory, "strategy/RED_TEAM_FINDINGS.md"),
      "# Red-team findings\n\n| Finding ID | Severity | Finding |\n| --- | --- | --- |\n| finding-risk | medium | Pricing and release obligations remain open. |\n",
    );

    const pivot = callPublicOperation("business.research.decision", {
      workspaceId: "app",
      expectedRevision: workspaceRevision(env.directory),
      decisionId: "pivot-precise",
      verdict: "Pivot",
      rationale: "Hold build until the audience wedge and unrun offer test are resolved.",
      findingIds: ["finding-risk"],
      apply: true,
    });
    assert(pivot.ok, JSON.stringify(pivot));
    assert.equal(pivot.data.initializationEligible, false);
    assert.equal(pivot.data.authorityGranted, false);
    assert(pivot.data.unresolvedObligations.some((row: string) => /independent review/i.test(row)));

    const planned = callPublicOperation("business.plan", { workspaceId: "app" });
    assert(planned.ok, JSON.stringify(planned));
    assert.equal(planned.data.status, "not_initialized");
    assert(planned.data.resume, "planning resume required while not initialized");
    assert.equal(planned.data.resume.researchCheckpoint.verdict, "Pivot");
    assert.equal(planned.data.resume.researchCheckpoint.recordedVia, "product_decision_log");
    assert.equal(planned.data.resume.researchCheckpoint.initializationEligible, false);
    assert.match(planned.data.nextAction, /Pivot/);
    assert.match(planned.data.nextAction, /research-decision/);
    assert.match(planned.data.nextAction, /unrun experiment as waived|not invent Go/i);
    assert(!callPublicOperation("business.initialize", { workspaceId: "app", expectedRevision: planned.data.revision }).ok);

    // Local permitted work (another preview) can continue without accepting protected obligations.
    const localPreview = callPublicOperation("business.research.decision", {
      workspaceId: "app",
      expectedRevision: planned.data.revision,
      decisionId: "pivot-local-note",
      verdict: "Pivot",
      rationale: "Record a second held checkpoint without broadening release authority.",
      findingIds: ["finding-risk"],
      apply: false,
    });
    assert(localPreview.ok, JSON.stringify(localPreview));
    assert.equal(localPreview.data.applied, false);
    assert.equal(localPreview.data.initializationEligible, false);
    assert.equal(localPreview.data.authorityGranted, false);

    // Symlink / escaping path refused at the owning boundary.
    const findingsPath = path.join(env.directory, "strategy/RED_TEAM_FINDINGS.md");
    const backup = readFileSync(findingsPath, "utf8");
    rmSync(findingsPath);
    writeFileSync(path.join(env.temp, "escaped-findings.md"), backup);
    symlinkSync(path.join(env.temp, "escaped-findings.md"), findingsPath);
    assert.throws(
      () =>
        recordResearchDecision({
          workspaceId: "app",
          expectedRevision: workspaceRevision(env.directory),
          decisionId: "pivot-symlink",
          verdict: "Pivot",
          rationale: "Symlinked findings must be refused.",
          findingIds: ["finding-risk"],
          apply: true,
        }),
      /research_decision_unsafe_path|unsafe_planning_artifact|unsafe_workspace_file|stale_revision|finding_id/,
    );
    rmSync(findingsPath);
    writeFileSync(findingsPath, backup);

    // Concurrent writer: lock held by another session refuses before writes.
    const lockPath = path.join(env.directory, "control/session.lock");
    const now = new Date().toISOString();
    writeFileSync(
      lockPath,
      `${JSON.stringify(
        {
          ownerSessionId: "foreign-writer",
          acquiredAt: now,
          heartbeatAt: now,
          ttlSeconds: 120,
          pendingInteractiveRequest: false,
        },
        null,
        2,
      )}\n`,
    );
    const productBeforeLock = readFileSync(path.join(env.directory, "product.yaml"), "utf8");
    assert.throws(
      () =>
        recordResearchDecision({
          workspaceId: "app",
          expectedRevision: workspaceRevision(env.directory),
          decisionId: "pivot-concurrent",
          verdict: "Pivot",
          rationale: "Concurrent writers must not append a second decision.",
          findingIds: ["finding-risk"],
          apply: true,
        }),
      /session_lock_unavailable/,
    );
    assert.equal(readFileSync(path.join(env.directory, "product.yaml"), "utf8"), productBeforeLock);
  } finally {
    if (previousHome === undefined) delete process.env.B2C_APP_BUILDER_HOME;
    else process.env.B2C_APP_BUILDER_HOME = previousHome;
    rmSync(env.temp, { recursive: true, force: true });
  }
});

