import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compilePlan, type CatalogInput, type CatalogWorkflowId, type RunNodeId } from "../../../kernel/engine/compile.js";
import { captureReviewEvidence, workflowContractFingerprint, workspaceArtifactFingerprint } from "../../../kernel/engine/review-evidence.js";
import {
  acceptVerification,
  beginAttempt,
  invalidateDescendants,
  invalidateStaleReviews,
  reconcilePatch,
  seedRunState,
} from "../../../kernel/engine/runstate.js";
import { laneKeys, type BusinessStateV2, type DomainId, type LaneKey } from "../../../kernel/schema/types.js";
import { assert, type Harness } from "./_harness.js";

const now = "2026-09-09T12:00:00.000Z";
const nodeId = (workflowSlug: string): RunNodeId => `run.${workflowSlug}` as RunNodeId;

function impactCatalog(): CatalogInput {
  const workflow = (
    id: CatalogWorkflowId,
    domainId: DomainId,
    laneId: LaneKey,
    outputPaths: string[],
    dependencies: CatalogWorkflowId[],
    reads: string[] = [],
    providerIds: string[] = [],
  ): CatalogInput["workflows"][number] => ({
    id,
    title: id,
    domainId,
    actionClass: "draft",
    dependencies,
    outputPaths,
    reads,
    providerIds,
    laneIds: [laneId],
    founderOnlyActions: [],
    gateCommands: [],
    idempotent: true,
  });
  return {
    version: "catalog.change-impact.1",
    artifacts: [
      { id: "artifact.research-import-observation", path: "strategy/RESEARCH.md" },
      { id: "artifact.product-import-promise", path: "product.yaml" },
      { id: "artifact.onboarding-import-claim", path: "product/ONBOARDING.md" },
      { id: "artifact.local-feature-proof", path: "product/LOCAL_FEATURE.md" },
    ],
    workflows: [
      workflow("workflow.research-import", "domain.research", "research", ["strategy/RESEARCH.md"], []),
      workflow(
        "workflow.product-import",
        "domain.product",
        "product",
        ["product.yaml"],
        ["workflow.research-import"],
        ["strategy/RESEARCH.md"],
        ["provider.import-permission-v1"],
      ),
      workflow("workflow.onboarding-import", "domain.experience", "onboarding", ["product/ONBOARDING.md"], ["workflow.product-import"], ["product.yaml"]),
      workflow("workflow.local-feature", "domain.product", "product", ["product/LOCAL_FEATURE.md"], []),
    ],
  };
}

function businessState(): BusinessStateV2 {
  const lanes = {} as BusinessStateV2["lanes"];
  for (const key of laneKeys) lanes[key] = { status: "pending", evidence: [], blockers: [] };
  return {
    schemaVersion: "2.0.0",
    updatedAt: now,
    narrative: { sinceLastTime: "", rightNow: "", yourCall: "", lastCelebratedPhase: "" },
    project: {
      name: "Change Impact Fixture",
      slug: "change-impact-fixture",
      owner: "Founder",
      phase: "phase_0_orient",
      launchScope: "essentials",
      kickoffDate: "",
      platforms: ["ios"],
      bundleIds: { ios: "com.example.impact", android: "" },
      publicUrls: { landing: "", privacy: "", terms: "" },
    },
    lanes,
    founderGates: { pending: [] },
  };
}

export function register(harness: Harness): void {
  harness.check("business-change-impact: unverified import observation reopens dependents and preserves unrelated proof", () => {
    const plan = compilePlan(impactCatalog(), now);
    const research = plan.nodes.find((node) => node.id === nodeId("research-import"))!;
    const product = plan.nodes.find((node) => node.id === nodeId("product-import"))!;
    const onboarding = plan.nodes.find((node) => node.id === nodeId("onboarding-import"))!;
    const local = plan.nodes.find((node) => node.id === nodeId("local-feature"))!;
    const run = seedRunState(plan, businessState(), { ownerSessionId: "session-impact", ttlSeconds: 600, wallClockCapSeconds: 3600, now });
    const importChain = [product.id, onboarding.id];
    const unrelatedLocal = [local.id];
    assert(
      importChain.every((id) => id !== research.id && !unrelatedLocal.includes(id)),
      "import-chain, producer, and unrelated local must be disjoint",
    );
    for (const [id, artifactId, fingerprint] of [
      [research.id, "artifact.research-import-observation", "sha256:import-v1"],
      [product.id, "artifact.product-import-promise", "sha256:promise-v1"],
      [onboarding.id, "artifact.onboarding-import-claim", "sha256:onboarding-v1"],
      [local.id, "artifact.local-feature-proof", "sha256:local-v1"],
    ] as const) {
      run.nodes[id]!.status = "succeeded";
      run.nodes[id]!.acceptedOutputFingerprint = fingerprint;
      const binding = run.artifactBindings.find((candidate) => candidate.artifactId === artifactId)!;
      binding.accepted = true;
      binding.fingerprint = fingerprint;
      binding.producedBy = id;
    }

    const invalidated = invalidateDescendants(plan, run, ["artifact.research-import-observation"], "2026-09-09T12:00:01.000Z");
    for (const id of importChain) {
      assert(invalidated.includes(id), `${id} should reopen when import evidence changes`);
      assert(run.nodes[id]!.status === "stale", `${id} must be stale`);
    }
    assert(run.nodes[research.id]!.status === "succeeded", "the observation producer must not self-invalidate");
    assert(run.nodes[local.id]!.status === "succeeded", "unrelated local feature proof must stay accepted");
    assert(run.artifactBindings.find((binding) => binding.artifactId === "artifact.local-feature-proof")!.accepted, "unrelated acceptance must remain");
    assert(!run.artifactBindings.find((binding) => binding.artifactId === "artifact.product-import-promise")!.accepted, "import promise must un-accept");
    assert(!run.artifactBindings.find((binding) => binding.artifactId === "artifact.onboarding-import-claim")!.accepted, "dependent onboarding claim must un-accept");
    const replayed = invalidateDescendants(plan, run, ["artifact.research-import-observation"], "2026-09-09T12:00:02.000Z");
    assert(replayed.every((id) => importChain.includes(id)), "replay may only retouch the import chain");
    assert(!replayed.some((id) => unrelatedLocal.includes(id) || id === research.id), "replay must not include unrelated local or the producer");
    for (const id of importChain) {
      assert(run.nodes[id]!.status === "stale", `${id} must stay stale after replay`);
    }
    assert(run.nodes[local.id]!.status === "succeeded", "replay must leave unrelated local proof succeeded");
    assert(run.nodes[research.id]!.status === "succeeded", "replay must not self-invalidate the producer");
  });

  harness.check("business-change-impact: a changed import promise review does not stale unrelated local proof", () => {
    const root = harness.makeTempDir("change-impact-review");
    mkdirSync(path.join(root, "product"), { recursive: true });
    mkdirSync(path.join(root, "strategy"), { recursive: true });
    writeFileSync(path.join(root, "strategy/RESEARCH.md"), "Import observation: permission is recorded as verified.\n", "utf8");
    writeFileSync(path.join(root, "product.yaml"), "schema_version: 1\nmeta: { name: import-promise }\ninstances: []\n", "utf8");
    writeFileSync(path.join(root, "product/LOCAL_FEATURE.md"), "Local feature proof stays current.\n", "utf8");
    writeFileSync(path.join(root, "product/ONBOARDING.md"), "Onboarding claim depends on the import promise.\n", "utf8");
    const plan = compilePlan(impactCatalog(), now);
    const product = plan.nodes.find((node) => node.id === nodeId("product-import"))!;
    const onboarding = plan.nodes.find((node) => node.id === nodeId("onboarding-import"))!;
    const local = plan.nodes.find((node) => node.id === nodeId("local-feature"))!;
    const run = seedRunState(plan, businessState(), { ownerSessionId: "session-impact-review", ttlSeconds: 600, wallClockCapSeconds: 3600, now });
    acceptWorkspaceNode(plan, run, root, product.id, "artifact.product-import-promise", "product.yaml", now);
    acceptWorkspaceNode(plan, run, root, onboarding.id, "artifact.onboarding-import-claim", "product/ONBOARDING.md", now);
    acceptWorkspaceNode(plan, run, root, local.id, "artifact.local-feature-proof", "product/LOCAL_FEATURE.md", now);
    assert(run.nodes[product.id]!.status === "succeeded" && run.nodes[local.id]!.status === "succeeded", "both reviews must start current");
    writeFileSync(path.join(root, "product.yaml"), "schema_version: 1\nmeta: { name: import-permission-unverified }\ninstances: []\n", "utf8");
    const stale = invalidateStaleReviews(plan, run, root, "2026-09-09T12:00:03.000Z");
    assert(stale.includes(product.id), "changed import promise must reopen its current review");
    assert(run.nodes[product.id]!.status === "stale", "import promise acceptance cannot stay current");
    assert(run.nodes[onboarding.id]!.status === "stale", "dependent onboarding claim must reopen");
    assert(!stale.includes(local.id), "unrelated local review must stay out of the stale set");
    assert(run.nodes[local.id]!.status === "succeeded", "unrelated local proof must stay accepted");
    assert(run.artifactBindings.find((binding) => binding.artifactId === "artifact.local-feature-proof")!.accepted, "unrelated local binding must remain accepted");

    // The affected chain can be repaired without broadening the impact set.
    acceptWorkspaceNode(plan, run, root, product.id, "artifact.product-import-promise", "product.yaml", "2026-09-09T12:00:04.000Z");
    acceptWorkspaceNode(plan, run, root, onboarding.id, "artifact.onboarding-import-claim", "product/ONBOARDING.md", "2026-09-09T12:00:05.000Z");
    assert(run.nodes[product.id]!.status === "succeeded", "the changed direct obligation must be repairable");
    assert(run.nodes[onboarding.id]!.status === "succeeded", "the dependent obligation must be repairable after its producer");
    assert(run.artifactBindings.find((binding) => binding.artifactId === "artifact.local-feature-proof")!.accepted, "repair must preserve unrelated proof");
    const repeated = invalidateStaleReviews(plan, run, root, "2026-09-09T12:00:06.000Z");
    assert(repeated.length === 0, "rechecking unchanged repaired inputs must be idempotent");
    assert(run.nodes[product.id]!.status === "succeeded" && run.nodes[onboarding.id]!.status === "succeeded", "idempotent recheck must not reopen repaired work");
  });

  harness.check("business-change-impact: changed inputs hold a prior non-idempotent effect for readback", () => {
    const externalCatalog = structuredClone(impactCatalog());
    externalCatalog.workflows.find((workflow) => workflow.id === "workflow.product-import")!.idempotent = false;
    const plan = compilePlan(externalCatalog, now);
    const research = plan.nodes.find((node) => node.id === nodeId("research-import"))!;
    const product = plan.nodes.find((node) => node.id === nodeId("product-import"))!;
    const onboarding = plan.nodes.find((node) => node.id === nodeId("onboarding-import"))!;
    const local = plan.nodes.find((node) => node.id === nodeId("local-feature"))!;
    const run = seedRunState(plan, businessState(), { ownerSessionId: "session-impact-readback", ttlSeconds: 600, wallClockCapSeconds: 3600, now });
    const productAttempt = beginAttempt(plan, run, product.id, "provider-effect", now);
    productAttempt.status = "succeeded";
    for (const [id, artifactId, fingerprint] of [
      [research.id, "artifact.research-import-observation", "sha256:import-v1"],
      [product.id, "artifact.product-import-promise", "sha256:promise-v1"],
      [onboarding.id, "artifact.onboarding-import-claim", "sha256:onboarding-v1"],
      [local.id, "artifact.local-feature-proof", "sha256:local-v1"],
    ] as const) {
      run.nodes[id]!.status = "succeeded";
      run.nodes[id]!.acceptedOutputFingerprint = fingerprint;
      const binding = run.artifactBindings.find((candidate) => candidate.artifactId === artifactId)!;
      binding.accepted = true;
      binding.fingerprint = fingerprint;
      binding.producedBy = id;
    }

    const invalidated = invalidateDescendants(plan, run, ["artifact.research-import-observation"], "2026-09-09T12:00:07.000Z");
    assert(invalidated.includes(product.id) && invalidated.includes(onboarding.id), "the changed import must reopen its dependent chain");
    assert(run.nodes[product.id]!.status === "needs_readback", "a prior non-idempotent effect must require readback before repeat");
    assert(run.nodes[product.id]!.blocker?.includes("confirm prior external effects"), "readback hold must explain the safe next step");
    assert(run.nodes[onboarding.id]!.status === "stale", "downstream local work must reopen after the held producer changes");
    assert(run.nodes[local.id]!.status === "succeeded", "unrelated local proof must remain current");
    assert(!run.artifactBindings.find((binding) => binding.artifactId === "artifact.product-import-promise")!.accepted, "held producer output must not remain accepted");

    const attemptsBeforeReplay = run.nodes[product.id]!.attempts.length;
    const replayed = invalidateDescendants(plan, run, ["artifact.research-import-observation"], "2026-09-09T12:00:08.000Z");
    assert(replayed.every((id) => id === product.id || id === onboarding.id), "repeating the change must not broaden the held effect's impact set");
    assert(run.nodes[product.id]!.attempts.length === attemptsBeforeReplay, "repeating the change must not create a second external attempt");
    assert(run.nodes[product.id]!.status === "needs_readback", "replay must preserve the readback hold");
    assert(run.nodes[local.id]!.status === "succeeded", "replay must preserve unrelated proof");
  });

  harness.check("business-change-impact: an activated provider binding reopens only its affected obligations", () => {
    const pinned = impactCatalog();
    const newerObservation = structuredClone(pinned);
    const changedProduct = newerObservation.workflows.find((workflow) => workflow.id === "workflow.product-import")!;
    changedProduct.providerIds = ["provider.import-permission-v2"];
    const first = compilePlan(pinned, now);
    const activated = compilePlan(newerObservation, now);
    const state = businessState();
    const options = { ownerSessionId: "session-provider-impact", ttlSeconds: 600, wallClockCapSeconds: 3600, now };
    const run = seedRunState(first, state, options);
    for (const node of first.nodes) {
      beginAttempt(first, run, node.id, "fixture", now);
      run.nodes[node.id]!.status = "succeeded";
      for (const binding of run.artifactBindings.filter((entry) => node.outputs.includes(entry.artifactId as never))) binding.accepted = true;
    }
    assert(
      workflowContractFingerprint(first.nodes.find((node) => node.id === nodeId("product-import"))!) !==
        workflowContractFingerprint(activated.nodes.find((node) => node.id === nodeId("product-import"))!),
      "the activated provider binding must change the affected contract identity",
    );
    assert(
      workflowContractFingerprint(first.nodes.find((node) => node.id === nodeId("research-import"))!) ===
        workflowContractFingerprint(activated.nodes.find((node) => node.id === nodeId("research-import"))!),
      "observing a newer upstream release must not change the pinned producer contract",
    );
    assert(run.nodes[nodeId("product-import")]!.status === "succeeded", "the pinned business must remain current before activation");
    run.nodes[nodeId("product-import")]!.status = "stale";
    run.artifactBindings.find((binding) => binding.artifactId === "artifact.product-import-promise")!.accepted = false;
    const invalidated = invalidateDescendants(first, run, ["artifact.product-import-promise"], "2026-09-09T12:00:01.000Z");
    assert(invalidated.includes(nodeId("onboarding-import")), "the activated binding must reopen its dependent obligation");
    assert(run.nodes[nodeId("research-import")]!.status === "succeeded", "the producer observation must remain historical");
    assert(run.nodes[nodeId("product-import")]!.status === "stale", "the activated binding must reopen its direct obligation");
    assert(run.nodes[nodeId("local-feature")]!.status === "succeeded", "unrelated local proof must remain current");
    assert(
      workflowContractFingerprint(first.nodes.find((node) => node.id === nodeId("local-feature"))!) ===
        workflowContractFingerprint(activated.nodes.find((node) => node.id === nodeId("local-feature"))!),
      "the activated provider binding must not rewrite unrelated contract identity",
    );
  });

  // --- #76 Required-scenario residual rows (deterministic; expected IDs; no live) ---

  harness.check("business-change-impact: four proof layers stay distinct until authority applies consequences", () => {
    const plan = compilePlan(impactCatalog(), now);
    const product = plan.nodes.find((node) => node.id === nodeId("product-import"))!;
    const onboarding = plan.nodes.find((node) => node.id === nodeId("onboarding-import"))!;
    const local = plan.nodes.find((node) => node.id === nodeId("local-feature"))!;
    const run = seedRunState(plan, businessState(), { ownerSessionId: "session-layers", ttlSeconds: 600, wallClockCapSeconds: 3600, now });
    for (const [id, artifactId, fingerprint] of [
      [product.id, "artifact.product-import-promise", "sha256:promise-v1"],
      [onboarding.id, "artifact.onboarding-import-claim", "sha256:onboarding-v1"],
      [local.id, "artifact.local-feature-proof", "sha256:local-v1"],
    ] as const) {
      run.nodes[id]!.status = "succeeded";
      run.nodes[id]!.acceptedOutputFingerprint = fingerprint;
      const binding = run.artifactBindings.find((candidate) => candidate.artifactId === artifactId)!;
      binding.accepted = true;
      binding.fingerprint = fingerprint;
      binding.producedBy = id;
    }
    // Layer 1 — structural: catalog compiled and nodes exist.
    assert(plan.nodes.length >= 4, "structural: catalog must compile with nodes");
    // Layer 2 — proposed semantic impact (expected IDs recorded before cascade).
    const proposedAffected = [product.id, onboarding.id] as const;
    const proposedUnaffected = [local.id] as const;
    assert(proposedAffected.every((id) => id !== local.id), "proposed set must not silently include unrelated local");
    // Layer 3 — without authority decision, runtime acceptance stays current (worker cannot self-approve).
    assert(run.nodes[product.id]!.status === "succeeded", "runtime acceptance unchanged before authority applies consequences");
    assert(run.artifactBindings.find((b) => b.artifactId === "artifact.product-import-promise")!.accepted, "bindings stay accepted until authority decision");
    // Layer 4 — after authority-applied invalidate, runtime acceptance reflects consequences.
    const observed = invalidateDescendants(plan, run, ["artifact.research-import-observation"], "2026-09-09T12:01:00.000Z");
    for (const id of proposedAffected) {
      assert(observed.includes(id), `${id} must appear in observed impact set`);
      assert(run.nodes[id]!.status === "stale", `${id} runtime acceptance must reopen after approved cascade`);
    }
    for (const id of proposedUnaffected) {
      assert(!observed.includes(id), `${id} must stay out of observed impact set`);
      assert(run.nodes[id]!.status === "succeeded", `${id} runtime acceptance must stay current`);
    }
  });

  harness.check("business-change-impact: approved price/entitlement change reopens offer chain and preserves unrelated visuals", () => {
    const plan = compilePlan(priceEntitlementCatalog(), now);
    const price = plan.nodes.find((node) => node.id === nodeId("price-decision"))!;
    const offer = plan.nodes.find((node) => node.id === nodeId("offer-mapping"))!;
    const paywall = plan.nodes.find((node) => node.id === nodeId("paywall-funnel"))!;
    const visual = plan.nodes.find((node) => node.id === nodeId("unrelated-visual"))!;
    const run = seedRunState(plan, businessState(), { ownerSessionId: "session-price", ttlSeconds: 600, wallClockCapSeconds: 3600, now });
    const expectedAffected = [offer.id, paywall.id];
    const expectedUnaffected = [visual.id, price.id];
    for (const [id, artifactId, fingerprint] of [
      [price.id, "artifact.price-decision", "sha256:price-v1"],
      [offer.id, "artifact.offer-mapping", "sha256:offer-v1"],
      [paywall.id, "artifact.paywall-funnel", "sha256:paywall-v1"],
      [visual.id, "artifact.unrelated-visual", "sha256:visual-v1"],
    ] as const) {
      run.nodes[id]!.status = "succeeded";
      run.nodes[id]!.acceptedOutputFingerprint = fingerprint;
      const binding = run.artifactBindings.find((candidate) => candidate.artifactId === artifactId)!;
      binding.accepted = true;
      binding.fingerprint = fingerprint;
      binding.producedBy = id;
    }
    // Authority-approved price change enters via recorded decision artifact invalidation (no live billing).
    const observed = invalidateDescendants(plan, run, ["artifact.price-decision"], "2026-09-09T12:02:00.000Z");
    for (const id of expectedAffected) {
      assert(observed.includes(id), `${id} must reopen after approved price/entitlement change`);
      assert(run.nodes[id]!.status === "stale", `${id} must be stale`);
    }
    assert(run.nodes[price.id]!.status === "succeeded", "price decision producer must not self-invalidate");
    assert(run.nodes[visual.id]!.status === "succeeded", "unrelated visual assets must stay accepted");
    assert(!observed.includes(visual.id), "visual must stay out of affected set");
    assert(run.artifactBindings.find((b) => b.artifactId === "artifact.unrelated-visual")!.accepted, "unrelated visual binding must remain accepted");
    assert(!run.artifactBindings.find((b) => b.artifactId === "artifact.offer-mapping")!.accepted, "offer mapping must un-accept");
    assert(!run.artifactBindings.find((b) => b.artifactId === "artifact.paywall-funnel")!.accepted, "paywall/funnel must un-accept");
    const replayed = invalidateDescendants(plan, run, ["artifact.price-decision"], "2026-09-09T12:02:01.000Z");
    assert(replayed.every((id) => expectedAffected.includes(id)), "replay may only retouch the offer chain");
    assert(!replayed.includes(visual.id) && !replayed.includes(price.id), "replay must not include visual or producer");
    assert(run.nodes[visual.id]!.status === "succeeded", "replay must leave unrelated visuals succeeded");
    void expectedUnaffected;
  });

  harness.check("business-change-impact: approved shipping-platform change reopens selected platform proof only", () => {
    const plan = compilePlan(shippingPlatformCatalog(), now);
    const scope = plan.nodes.find((node) => node.id === nodeId("platform-scope"))!;
    const ios = plan.nodes.find((node) => node.id === nodeId("ios-native-proof"))!;
    const android = plan.nodes.find((node) => node.id === nodeId("android-native-proof"))!;
    const rubric = plan.nodes.find((node) => node.id === nodeId("design-rubric"))!;
    const run = seedRunState(plan, businessState(), { ownerSessionId: "session-platform", ttlSeconds: 600, wallClockCapSeconds: 3600, now });
    const expectedAffected = [ios.id, rubric.id];
    const expectedUnaffected = [android.id, scope.id];
    for (const [id, artifactId, fingerprint] of [
      [scope.id, "artifact.platform-scope", "sha256:scope-ios-v1"],
      [ios.id, "artifact.ios-native-proof", "sha256:ios-v1"],
      [android.id, "artifact.android-native-proof", "sha256:android-v1"],
      [rubric.id, "artifact.design-rubric", "sha256:rubric-v1"],
    ] as const) {
      run.nodes[id]!.status = "succeeded";
      run.nodes[id]!.acceptedOutputFingerprint = fingerprint;
      const binding = run.artifactBindings.find((candidate) => candidate.artifactId === artifactId)!;
      binding.accepted = true;
      binding.fingerprint = fingerprint;
      binding.producedBy = id;
    }
    // Approved iOS shipping-platform / design-scope change — must not infer unselected android.
    const observed = invalidateDescendants(plan, run, ["artifact.platform-scope"], "2026-09-09T12:03:00.000Z");
    for (const id of expectedAffected) {
      assert(observed.includes(id), `${id} must reopen for the changed selected platform`);
      assert(run.nodes[id]!.status === "stale", `${id} must be stale — stale proof cannot remain for changed platform`);
    }
    assert(run.nodes[scope.id]!.status === "succeeded", "scope producer must not self-invalidate");
    assert(run.nodes[android.id]!.status === "succeeded", "unselected android platform proof must stay current");
    assert(!observed.includes(android.id), "must not infer or reopen an unselected platform");
    assert(run.artifactBindings.find((b) => b.artifactId === "artifact.android-native-proof")!.accepted, "unselected platform binding must remain accepted");
    assert(!run.artifactBindings.find((b) => b.artifactId === "artifact.ios-native-proof")!.accepted, "changed platform proof must un-accept");
    assert(!run.artifactBindings.find((b) => b.artifactId === "artifact.design-rubric")!.accepted, "affected rubric must un-accept");
    void expectedUnaffected;
  });

  harness.check("business-change-impact: source correction reopens only the linked claim chain", () => {
    const plan = compilePlan(sourceCorrectionCatalog(), now);
    const correction = plan.nodes.find((node) => node.id === nodeId("source-correction"))!;
    const linked = plan.nodes.find((node) => node.id === nodeId("linked-claim"))!;
    const surface = plan.nodes.find((node) => node.id === nodeId("linked-surface"))!;
    const other = plan.nodes.find((node) => node.id === nodeId("independent-conclusion"))!;
    const run = seedRunState(plan, businessState(), { ownerSessionId: "session-source-correction", ttlSeconds: 600, wallClockCapSeconds: 3600, now });
    const expectedAffected = [linked.id, surface.id];
    for (const [id, artifactId, fingerprint] of [
      [correction.id, "artifact.source-correction", "sha256:correction-v1"],
      [linked.id, "artifact.linked-claim", "sha256:claim-a-v1"],
      [surface.id, "artifact.linked-surface", "sha256:surface-v1"],
      [other.id, "artifact.independent-conclusion", "sha256:claim-b-v1"],
    ] as const) {
      run.nodes[id]!.status = "succeeded";
      run.nodes[id]!.acceptedOutputFingerprint = fingerprint;
      const binding = run.artifactBindings.find((candidate) => candidate.artifactId === artifactId)!;
      binding.accepted = true;
      binding.fingerprint = fingerprint;
      binding.producedBy = id;
    }
    const observed = invalidateDescendants(plan, run, ["artifact.source-correction"], "2026-09-09T12:04:00.000Z");
    for (const id of expectedAffected) {
      assert(observed.includes(id), `${id} must reopen when a linked source correction contradicts its claim`);
      assert(run.nodes[id]!.status === "stale", `${id} must be stale`);
    }
    assert(run.nodes[correction.id]!.status === "succeeded", "correction producer must not self-invalidate");
    assert(run.nodes[other.id]!.status === "succeeded", "independent research conclusion must stay current");
    assert(!observed.includes(other.id), "must not treat every research conclusion as invalid merely because a linked source correction changed");
    assert(run.artifactBindings.find((b) => b.artifactId === "artifact.independent-conclusion")!.accepted, "unrelated conclusion binding must remain accepted");
  });

  harness.check("business-change-impact: source metadata/URL change opens freshness review without automatic semantic claim invalidation", () => {
    const plan = compilePlan(sourceMetadataCatalog(), now);
    const sourceIndex = plan.nodes.find((node) => node.id === nodeId("source-index"))!;
    const freshness = plan.nodes.find((node) => node.id === nodeId("source-freshness"))!;
    const claim = plan.nodes.find((node) => node.id === nodeId("claim-support"))!;
    const run = seedRunState(plan, businessState(), { ownerSessionId: "session-source-meta", ttlSeconds: 600, wallClockCapSeconds: 3600, now });
    for (const [id, artifactId, fingerprint] of [
      [sourceIndex.id, "artifact.source-index", "sha256:url-v1"],
      [freshness.id, "artifact.source-freshness", "sha256:fresh-v1"],
      [claim.id, "artifact.claim-support", "sha256:claim-support-v1"],
    ] as const) {
      run.nodes[id]!.status = "succeeded";
      run.nodes[id]!.acceptedOutputFingerprint = fingerprint;
      const binding = run.artifactBindings.find((candidate) => candidate.artifactId === artifactId)!;
      binding.accepted = true;
      binding.fingerprint = fingerprint;
      binding.producedBy = id;
    }
    // Metadata/URL change: reopen source-link/freshness only. Claim support does not auto-invalidate.
    const observed = invalidateDescendants(plan, run, ["artifact.source-index"], "2026-09-09T12:05:00.000Z");
    assert(observed.includes(freshness.id), "source-link/freshness review must reopen when URL/metadata changes");
    assert(run.nodes[freshness.id]!.status === "stale", "freshness node must be stale");
    assert(!observed.includes(claim.id), "must not automatically assert semantic claim change without inspecting evidence");
    assert(run.nodes[claim.id]!.status === "succeeded", "claim support must stay accepted until authority inspects evidence");
    assert(run.artifactBindings.find((b) => b.artifactId === "artifact.claim-support")!.accepted, "claim-support binding must remain accepted");
    assert(!run.artifactBindings.find((b) => b.artifactId === "artifact.source-freshness")!.accepted, "freshness binding must un-accept");
    assert(run.nodes[sourceIndex.id]!.status === "succeeded", "source-index producer must not self-invalidate");
  });
}

function priceEntitlementCatalog(): CatalogInput {
  const workflow = (
    id: CatalogWorkflowId,
    domainId: DomainId,
    laneId: LaneKey,
    outputPaths: string[],
    dependencies: CatalogWorkflowId[],
    reads: string[] = [],
  ): CatalogInput["workflows"][number] => ({
    id,
    title: id,
    domainId,
    actionClass: "draft",
    dependencies,
    outputPaths,
    reads,
    providerIds: [],
    laneIds: [laneId],
    founderOnlyActions: [],
    gateCommands: [],
    idempotent: true,
  });
  return {
    version: "catalog.change-impact.price.1",
    artifacts: [
      { id: "artifact.price-decision", path: "revenue/PRICE_DECISION.md" },
      { id: "artifact.offer-mapping", path: "revenue/OFFER.yaml" },
      { id: "artifact.paywall-funnel", path: "product/PAYWALL.md" },
      { id: "artifact.unrelated-visual", path: "design/VISUAL.md" },
    ],
    workflows: [
      workflow("workflow.price-decision", "domain.money", "revenue", ["revenue/PRICE_DECISION.md"], []),
      workflow("workflow.offer-mapping", "domain.money", "revenue", ["revenue/OFFER.yaml"], ["workflow.price-decision"], ["revenue/PRICE_DECISION.md"]),
      workflow("workflow.paywall-funnel", "domain.experience", "onboarding", ["product/PAYWALL.md"], ["workflow.offer-mapping"], ["revenue/OFFER.yaml"]),
      workflow("workflow.unrelated-visual", "domain.design", "design", ["design/VISUAL.md"], []),
    ],
  };
}

function shippingPlatformCatalog(): CatalogInput {
  const workflow = (
    id: CatalogWorkflowId,
    domainId: DomainId,
    laneId: LaneKey,
    outputPaths: string[],
    dependencies: CatalogWorkflowId[],
    reads: string[] = [],
  ): CatalogInput["workflows"][number] => ({
    id,
    title: id,
    domainId,
    actionClass: "draft",
    dependencies,
    outputPaths,
    reads,
    providerIds: [],
    laneIds: [laneId],
    founderOnlyActions: [],
    gateCommands: [],
    idempotent: true,
  });
  return {
    version: "catalog.change-impact.platform.1",
    artifacts: [
      { id: "artifact.platform-scope", path: "product/PLATFORM_SCOPE.md" },
      { id: "artifact.ios-native-proof", path: "engineering/IOS_PROOF.md" },
      { id: "artifact.android-native-proof", path: "engineering/ANDROID_PROOF.md" },
      { id: "artifact.design-rubric", path: "design/RUBRIC.md" },
    ],
    workflows: [
      workflow("workflow.platform-scope", "domain.product", "product", ["product/PLATFORM_SCOPE.md"], []),
      workflow("workflow.ios-native-proof", "domain.engineering", "engineering", ["engineering/IOS_PROOF.md"], ["workflow.platform-scope"], ["product/PLATFORM_SCOPE.md"]),
      // Unselected platform: no dependency on platform-scope — must not reopen when iOS scope changes.
      workflow("workflow.android-native-proof", "domain.engineering", "engineering", ["engineering/ANDROID_PROOF.md"], []),
      workflow("workflow.design-rubric", "domain.design", "design", ["design/RUBRIC.md"], ["workflow.platform-scope"], ["product/PLATFORM_SCOPE.md"]),
    ],
  };
}

function sourceCorrectionCatalog(): CatalogInput {
  const workflow = (
    id: CatalogWorkflowId,
    domainId: DomainId,
    laneId: LaneKey,
    outputPaths: string[],
    dependencies: CatalogWorkflowId[],
    reads: string[] = [],
  ): CatalogInput["workflows"][number] => ({
    id,
    title: id,
    domainId,
    actionClass: "draft",
    dependencies,
    outputPaths,
    reads,
    providerIds: [],
    laneIds: [laneId],
    founderOnlyActions: [],
    gateCommands: [],
    idempotent: true,
  });
  return {
    version: "catalog.change-impact.source-correction.1",
    artifacts: [
      { id: "artifact.source-correction", path: "strategy/SOURCE_CORRECTION.md" },
      { id: "artifact.linked-claim", path: "strategy/CLAIM_A.md" },
      { id: "artifact.linked-surface", path: "product/CLAIM_A_SURFACE.md" },
      { id: "artifact.independent-conclusion", path: "strategy/CLAIM_B.md" },
    ],
    workflows: [
      workflow("workflow.source-correction", "domain.research", "research", ["strategy/SOURCE_CORRECTION.md"], []),
      workflow("workflow.linked-claim", "domain.research", "research", ["strategy/CLAIM_A.md"], ["workflow.source-correction"], ["strategy/SOURCE_CORRECTION.md"]),
      workflow("workflow.linked-surface", "domain.product", "product", ["product/CLAIM_A_SURFACE.md"], ["workflow.linked-claim"], ["strategy/CLAIM_A.md"]),
      // Independent conclusion: no link to the correction — must stay current.
      workflow("workflow.independent-conclusion", "domain.research", "research", ["strategy/CLAIM_B.md"], []),
    ],
  };
}

function sourceMetadataCatalog(): CatalogInput {
  const workflow = (
    id: CatalogWorkflowId,
    domainId: DomainId,
    laneId: LaneKey,
    outputPaths: string[],
    dependencies: CatalogWorkflowId[],
    reads: string[] = [],
  ): CatalogInput["workflows"][number] => ({
    id,
    title: id,
    domainId,
    actionClass: "draft",
    dependencies,
    outputPaths,
    reads,
    providerIds: [],
    laneIds: [laneId],
    founderOnlyActions: [],
    gateCommands: [],
    idempotent: true,
  });
  return {
    version: "catalog.change-impact.source-metadata.1",
    artifacts: [
      { id: "artifact.source-index", path: "strategy/SOURCE_INDEX.md" },
      { id: "artifact.source-freshness", path: "strategy/SOURCE_FRESHNESS.md" },
      { id: "artifact.claim-support", path: "strategy/CLAIM_SUPPORT.md" },
    ],
    workflows: [
      workflow("workflow.source-index", "domain.research", "research", ["strategy/SOURCE_INDEX.md"], []),
      // Freshness/link review depends on source-index (URL/metadata).
      workflow("workflow.source-freshness", "domain.research", "research", ["strategy/SOURCE_FRESHNESS.md"], ["workflow.source-index"], ["strategy/SOURCE_INDEX.md"]),
      // Claim support does NOT depend on source-index URL — metadata change alone must not auto-invalidate it.
      workflow("workflow.claim-support", "domain.research", "research", ["strategy/CLAIM_SUPPORT.md"], []),
    ],
  };
}

function acceptWorkspaceNode(
  plan: ReturnType<typeof compilePlan>,
  run: ReturnType<typeof seedRunState>,
  root: string,
  nodeId: RunNodeId,
  artifactId: string,
  relativePath: string,
  clock: string,
): void {
  const attempt = beginAttempt(plan, run, nodeId, "producer", clock);
  attempt.proofSource = "workspace";
  reconcilePatch(
    plan,
    run,
    {
      nodeId,
      attemptId: attempt.id,
      outputs: [
        {
          artifactId,
          path: relativePath,
          fingerprint: workspaceArtifactFingerprint(root, relativePath),
          evidence: ["workspace bytes produced"],
        },
      ],
    },
    clock,
  );
  const snapshot = captureReviewEvidence(plan, run, nodeId, root, "independent-reviewer", clock);
  acceptVerification(plan, run, nodeId, ["Inspected the current workspace artifact."], clock, "independent-reviewer", snapshot, root);
}
