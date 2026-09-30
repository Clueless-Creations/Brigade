import assert from "node:assert/strict";
import { compilePlan } from "../../../kernel/engine/compile.js";
import { allowAllAutonomyEvaluator, computeFrontier } from "../../../kernel/engine/frontier.js";
import { beginAttempt, seedRunState, requestExecutionRepair, reconcilePatch, acceptVerification } from "../../../kernel/engine/runstate.js";
import { isRetryableWorkerFailure } from "../../../kernel/session/attempt-failure.js";
import type { BusinessStateV2 } from "../../../kernel/schema/types.js";
import { currentPin } from "./run-persistence.fixtures.js";
import type { Harness } from "./_harness.js";

const now = "2026-09-28T12:00:00.000Z";
function setup() {
  const catalog = structuredClone(currentPin.catalog);
  const workflow = catalog.workflows[0]!;
  workflow.maxAttempts = 2;
  workflow.idempotent = true;
  workflow.actionClass = "draft";
  workflow.protectedCategory = undefined;
  const plan = compilePlan(catalog, now);
  const node = plan.nodes[0]!;
  const business = { lanes: {} } as BusinessStateV2;
  const run = seedRunState(plan, business, { ownerSessionId: "producer", runId: "run.recovery", ttlSeconds: 300, wallClockCapSeconds: 1800, now });
  for (const approval of node.approvals) run.approvals[approval.id] = "approved";
  const fail = () => {
    const attempt = beginAttempt(plan, run, node.id, "producer", now);
    attempt.status = "failed";
    attempt.error = "codex worker exited 2: interrupted";
    attempt.finishedAt = now;
    run.nodes[node.id]!.status = "failed";
    return attempt;
  };
  return { catalog, plan, node, business, run, fail };
}

export function register(h: Harness): void {
  h.check("execution recovery: repair returns through admission and independent acceptance without erasing the failed attempt", () => {
    const f = setup();
    const failed = structuredClone(f.fail());
    assert(requestExecutionRepair(f.plan, f.run, f.node.id, failed.error!, now));
    assert.equal(f.run.nodes[f.node.id]!.status, "stale");
    assert(f.run.artifactBindings.every((binding) => !binding.accepted));
    assert(computeFrontier(f.plan, f.run, f.business, allowAllAutonomyEvaluator).ready.includes(f.node.id));
    const repaired = beginAttempt(f.plan, f.run, f.node.id, "producer", now);
    reconcilePatch(f.plan, f.run, {
      nodeId: f.node.id,
      attemptId: repaired.id,
      outputs: [{ artifactId: "artifact.saved-method", path: "research/method.md", fingerprint: "repaired-bytes", evidence: ["Synthetic repaired output"] }],
    }, now);
    assert.notEqual(f.run.nodes[f.node.id]!.status, "succeeded");
    acceptVerification(f.plan, f.run, f.node.id, ["Independent synthetic review"], now, "reviewer");
    assert.equal(f.run.nodes[f.node.id]!.status, "succeeded");
    assert.deepEqual(f.run.nodes[f.node.id]!.attempts[0], failed);
  });
  h.check("execution recovery: exhausted retries stay blocked and cannot acquire another allowance", () => {
    const f = setup();
    f.fail();
    assert(requestExecutionRepair(f.plan, f.run, f.node.id, "interrupted", now));
    f.fail();
    assert.equal(requestExecutionRepair(f.plan, f.run, f.node.id, "interrupted again", now), false);
    assert.equal(f.run.nodes[f.node.id]!.status, "blocked");
    assert.equal(requestExecutionRepair(f.plan, f.run, f.node.id, "another session", now), false);
    assert.equal(f.run.nodes[f.node.id]!.attempts.length, 2);
  });
  h.check("execution recovery: a failed reviewer preserves the accepted producer on its feedback edge", () => {
    const f = setup();
    const producer = f.catalog.workflows[0]!;
    producer.consults = ["review.md"];
    f.catalog.artifacts.push({ id: "artifact.review", path: "review.md" });
    f.catalog.workflows.push({ ...producer, id: "workflow.review", outputPaths: ["review.md"], consults: [], reviewOf: [producer.id] });
    const plan = compilePlan(f.catalog, now);
    const run = seedRunState(plan, f.business, { ownerSessionId: "producer", runId: "run.review-recovery", ttlSeconds: 300, wallClockCapSeconds: 1800, now });
    const producerNode = plan.nodes.find((node) => node.workflowId === producer.id)!;
    const reviewer = plan.nodes.find((node) => node.workflowId === "workflow.review")!;
    run.nodes[producerNode.id]!.status = "succeeded";
    run.nodes[producerNode.id]!.acceptedOutputFingerprint = "accepted-producer";
    run.artifactBindings.find((binding) => binding.artifactId === "artifact.saved-method")!.accepted = true;
    const attempt = beginAttempt(plan, run, reviewer.id, "reviewer", now);
    attempt.status = "failed";
    attempt.error = "codex worker execution deadline exceeded";
    run.nodes[reviewer.id]!.status = "failed";
    assert(requestExecutionRepair(plan, run, reviewer.id, attempt.error, now));
    assert.equal(run.nodes[producerNode.id]!.status, "succeeded");
    assert.equal(run.nodes[producerNode.id]!.acceptedOutputFingerprint, "accepted-producer");
    assert.equal(run.artifactBindings.find((binding) => binding.artifactId === "artifact.saved-method")!.accepted, true);
  });
  h.check("execution recovery: protected, non-idempotent and shared-resource effects require reconciliation", () => {
    for (const change of [
      (f: ReturnType<typeof setup>) => { f.node.idempotent = false; },
      (f: ReturnType<typeof setup>) => { f.node.actionClass = "publish"; },
      (f: ReturnType<typeof setup>) => { f.node.protectedCategory = "credentials_access"; },
      (f: ReturnType<typeof setup>) => { f.node.sharedResources = ["device:simulator" as never]; },
    ]) {
      const f = setup();
      f.fail();
      change(f);
      assert.equal(requestExecutionRepair(f.plan, f.run, f.node.id, "interrupted", now), false);
      assert.equal(f.run.nodes[f.node.id]!.status, "needs_readback");
      assert.equal(f.run.nodes[f.node.id]!.attempts.at(-1)!.readbackRequired, true);
      assert(!computeFrontier(f.plan, f.run, f.business, allowAllAutonomyEvaluator).ready.includes(f.node.id));
    }
  });
  h.check("execution recovery: a reopened task still needs current grants and approvals", () => {
    const f = setup();
    f.fail();
    requestExecutionRepair(f.plan, f.run, f.node.id, "interrupted", now);
    assert.equal(computeFrontier(f.plan, f.run, f.business, { evaluate: () => ({ allowed: false, parkReason: "grant revoked" }) }).ready.length, 0);
    assert.equal(f.run.nodes[f.node.id]!.status, "blocked");
  });
  h.check("execution recovery: configuration and scope failures do not trigger blind retry", () => {
    for (const error of ["binding.execution_route_unavailable", "binding.worker_mutated_undeclared_workspace: src/other.ts", "required worker task artifact is missing", "no path binding for declared output", "codex worker exited 1: not logged in"]) {
      assert.equal(isRetryableWorkerFailure(error), false, error);
    }
    for (const error of ["codex worker execution deadline exceeded", "codex worker exited 2: interrupted", "worker exited successfully but declared output is missing: result.md", "worker knowledge receipt rejected: missing reference"]) {
      assert.equal(isRetryableWorkerFailure(error), true, error);
    }
  });
  h.check("execution deadline: default lease stays short while explicit task limits retain contract identity", () => {
    const f = setup();
    delete f.catalog.workflows[0]!.ttlSeconds;
    const defaults = compilePlan(f.catalog, now);
    assert.equal(defaults.nodes[0]!.ttlSeconds, 300);
    assert.equal(defaults.nodes[0]!.executionTimeoutSeconds, undefined);
    f.catalog.workflows[0]!.ttlSeconds = 300;
    const explicit = compilePlan(f.catalog, now);
    assert.equal(explicit.nodes[0]!.executionTimeoutSeconds, 300);
    assert.notEqual(defaults.planId, explicit.planId);
  });
}
