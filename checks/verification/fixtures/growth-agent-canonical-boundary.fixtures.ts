/**
 * #116 growth-agent canonical-operation boundary fixtures.
 *
 * Deterministic only. No live publish, experiment launch, customer-data query,
 * provider sign-in, or paid service. Fake/synthetic transports are wiring —
 * never independent contract source. Pins: Layers fixtures (no invented
 * tools/list schemas); Postiz #24 postiz-extension.fixtures; PostHog upstream
 * + probe (no new executor).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  GROWTH_AGENT_AUDIT_BUCKET_COMPLETE_NOTE,
  GROWTH_AGENT_CANONICAL_INVENTORY_DOC,
  GROWTH_AGENT_CANONICAL_MAP,
  GROWTH_AGENT_CANONICAL_MAP_PATH,
  GROWTH_AGENT_CANONICAL_MAP_REQUIRED_OP_CLASSES,
  GROWTH_AGENT_DISTINCT_EFFECT_NOTE,
  GROWTH_AGENT_DISTINCT_EVIDENCE_NOTE,
  GROWTH_AGENT_EFFECT_CLASSES,
  GROWTH_AGENT_EVIDENCE_CLASSES,
  GROWTH_AGENT_LOGICAL_SEAMS,
  GROWTH_AGENT_NON_AUTHORITY_FLAGS,
  GROWTH_AGENT_OP_CLASSES,
  GROWTH_AGENT_POSTHOG_EXECUTOR_HOLD,
  GROWTH_AGENT_POSTIZ_LIVE_HOLD,
  GROWTH_AGENT_PROTECTED_EFFECTS,
  LAYERS_ADAPTER_MODULE,
  LAYERS_EXTENSION_OPERATION_IDS,
  LAYERS_EXTENSION_PACKAGE,
  LAYERS_FIXTURE_SUITE,
  LAYERS_SPEND_BOUNDARIES,
  LAYERS_UPSTREAM,
  POSTHOG_CONTEXT_MILL_REVIEWED_REVISION,
  POSTHOG_CONTEXT_MILL_UPSTREAM,
  POSTHOG_PROBE_TOOL,
  POSTHOG_WIZARD_KNOWLEDGE,
  POSTHOG_WIZARD_REVIEWED_REVISION,
  POSTHOG_WIZARD_UPSTREAM,
  POSTIZ_EXTENSION_FIXTURE,
  POSTIZ_EXTENSION_OPERATION_IDS,
  POSTIZ_EXTENSION_PACKAGE,
  POSTIZ_OWNER_ISSUE,
  PROVIDER_INTEGRATION_ADR,
  PROVIDER_INTEGRATIONS_GUIDE,
  getGrowthAgentCanonicalMap,
  growthAgentCanonicalMapRow,
  growthAgentEffectClassesRemainDistinct,
  growthAgentEvidenceClassesRemainDistinct,
  growthAgentExpandsPostizLive,
  growthAgentFlagLooksNoninteractive,
  growthAgentIntroducesGenericMcpRegistry,
  growthAgentIntroducesSecondExecutionStore,
  growthAgentInventedPosthogExecutor,
  growthAgentNoninteractiveGrantsAuthority,
  growthAgentProtectedRows,
  growthAgentRowsForOpClass,
  growthAgentRowsForProvider,
} from "../../../catalog/providers/growth-agent-canonical-map.js";
import {
  GROWTH_AGENT_NATIVE_LEAK_SYMBOLS,
  GROWTH_AGENT_TYPED_CONTRACT_CONSUMERS,
  growthAgentCanonicalMapModulePath,
  growthAgentSeamOwner,
  hostedConsolePosthogAsConsumerProvider,
  knowledgeClaimsExecutionAuthority,
  looksLikeGenericMcpRegistry,
  looksLikeSecondExecutionStore,
  pathIsTypedGrowthAgentConsumer,
  pathMayOwnGrowthAgentNativeTypes,
  postizFakeTransportProvesLiveSupport,
  reviewedPosthogContextMillRevision,
  reviewedPosthogWizardRevision,
  sourceImportsGrowthAgentNativeLeak,
} from "../../../adapters/providers/growth-agent/boundary.js";
import {
  classifyConnectionLoss,
  classifyDiscoveryAutoExpandRefuse,
  classifyEffectCollapseRefuse,
  classifyGrowthAgentFailSafe,
  classifySchemaDriftRefuse,
  classifyStaleAnalyticsWindow,
  classifyUncertainPublishRefuse,
  classifyUncertainScheduleRefuse,
  classifyWrongGrowthProject,
  liveProtectedAllowedByYesFlag,
} from "../../../adapters/providers/growth-agent/fail-safe.js";
import { LAYERS_DELIVER_TOOL, LAYERS_OPERATION_IDS, LAYERS_RECORDED_TOOLS, detectToolDrift } from "../../../adapters/providers/layers/index.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const INVENTORY_DOC = path.join(skillRoot, GROWTH_AGENT_CANONICAL_INVENTORY_DOC);
const LAYERS_FIXTURE = path.join(skillRoot, LAYERS_FIXTURE_SUITE);
const LAYERS_SPEND = path.join(skillRoot, LAYERS_SPEND_BOUNDARIES);
const LAYERS_UPSTREAM_PATH = path.join(skillRoot, LAYERS_UPSTREAM);
const POSTIZ_FIXTURE = path.join(skillRoot, POSTIZ_EXTENSION_FIXTURE);
const POSTIZ_PKG = path.join(skillRoot, POSTIZ_EXTENSION_PACKAGE);
const POSTHOG_WIZARD = path.join(skillRoot, POSTHOG_WIZARD_UPSTREAM);
const POSTHOG_MILL = path.join(skillRoot, POSTHOG_CONTEXT_MILL_UPSTREAM);
const POSTHOG_KNOWLEDGE = path.join(skillRoot, POSTHOG_WIZARD_KNOWLEDGE);
const POSTHOG_PROBE = path.join(skillRoot, POSTHOG_PROBE_TOOL);
const ADR_PATH = path.join(skillRoot, PROVIDER_INTEGRATION_ADR);
const GUIDE_PATH = path.join(skillRoot, PROVIDER_INTEGRATIONS_GUIDE);

export function register(harness: Harness): void {
  harness.check("growth-agent-canonical: map covers every required op class with evidence + authority tags", () => {
    assert(getGrowthAgentCanonicalMap() === GROWTH_AGENT_CANONICAL_MAP, "getter returns authored map");
    assert(growthAgentCanonicalMapModulePath() === GROWTH_AGENT_CANONICAL_MAP_PATH, "stable map path");
    assert(reviewedPosthogWizardRevision() === POSTHOG_WIZARD_REVIEWED_REVISION, "wizard pin");
    assert(reviewedPosthogContextMillRevision() === POSTHOG_CONTEXT_MILL_REVIEWED_REVISION, "context-mill pin");
    for (const opClass of GROWTH_AGENT_CANONICAL_MAP_REQUIRED_OP_CLASSES) {
      const rows = growthAgentRowsForOpClass(opClass);
      assert(rows.length >= 1, `op class ${opClass} has at least one row`);
    }
    assert(GROWTH_AGENT_OP_CLASSES.length === 20, "twenty op classes");
    for (const row of GROWTH_AGENT_CANONICAL_MAP) {
      assert(row.nativeCapability.length > 0, `${row.id} names a native capability`);
      assert(row.implementationPointer.length > 0, `${row.id} has an implementation pointer`);
      assert(GROWTH_AGENT_EVIDENCE_CLASSES.includes(row.evidenceClass), `${row.id} evidence class`);
      assert(row.authorityClass.length > 0, `${row.id} authority`);
      assert(row.fit.length > 0, `${row.id} fit`);
      assert(row.limitations.length > 0, `${row.id} limitations`);
    }
    assert(growthAgentRowsForProvider("posthog-wizard").length >= 1, "wizard rows");
    assert(growthAgentRowsForProvider("layers").length >= 4, "layers rows");
    assert(growthAgentRowsForProvider("postiz").length >= 5, "postiz rows");
  });

  harness.check("growth-agent-canonical: PostHog guidance/operator/held; no invented executor", () => {
    const wizard = growthAgentCanonicalMapRow("posthog-wizard-guidance");
    assert(wizard.disposition === "guidance", "wizard is guidance");
    assert(wizard.authorityClass === "guidance-only", "guidance-only");
    assert(wizard.canonicalOrExtension === "none", "no invented op");
    const mill = growthAgentCanonicalMapRow("posthog-context-mill-hold");
    assert(mill.disposition === "held", "context mill held");
    const hosted = growthAgentCanonicalMapRow("posthog-hosted-console-operator");
    assert(hosted.authorityClass === "operator-service", "operator service");
    const invented = growthAgentCanonicalMapRow("posthog-no-invented-executor");
    assert(invented.disposition === "reject", "invented executor rejected");
    assert(growthAgentInventedPosthogExecutor() === false, "never invent PostHog executor");
    assert(GROWTH_AGENT_POSTHOG_EXECUTOR_HOLD.disposition === "held", "executor hold");
    const experiment = growthAgentCanonicalMapRow("posthog-experiment-launch-held");
    assert(experiment.evidenceClass === "experiment-launch-held", "experiment launch held");
    const protectedRows = growthAgentProtectedRows();
    assert(protectedRows.length >= 6, "protected set is non-empty");
    for (const effect of GROWTH_AGENT_PROTECTED_EFFECTS) {
      assert(
        GROWTH_AGENT_CANONICAL_MAP.some((row) => row.effectClass === effect),
        `protected effect ${effect} appears in map`,
      );
    }
  });

  harness.check("growth-agent-canonical: --yes and noninteractive never grant live-protected authority", () => {
    assert(growthAgentNoninteractiveGrantsAuthority(["--yes"]) === false, "--yes is not authority");
    assert(liveProtectedAllowedByYesFlag(["--yes", "--non-interactive"]) === false, "yes never authorizes live protected");
    for (const flag of GROWTH_AGENT_NON_AUTHORITY_FLAGS) {
      assert(growthAgentFlagLooksNoninteractive(flag), `${flag} recognized`);
    }
    const decision = classifyGrowthAgentFailSafe({
      opClass: "postiz-live-publish",
      effectClass: "public-publish",
      projectMatchesMandate: true,
      staleAnalyticsWindow: false,
      schemaDrift: false,
      newlyExposedUpstreamTool: false,
      uncertainScheduleResult: false,
      uncertainPublishResult: false,
      connectionLost: false,
      paginationPartial: false,
      effectClassCollapsed: false,
      silentDiscoveryExpandAttempted: false,
      authorityGranted: false,
      noninteractiveFlags: ["--yes"],
      liveProtectedAttempted: false,
    });
    assert(decision.action === "fail-closed", "yes without authority fails closed");
    assert(decision.allowLiveProtected === false, "no live protected from flags");
  });

  harness.check("growth-agent-canonical: evidence + effect classes stay distinct; inventory doc present", () => {
    assert(growthAgentEvidenceClassesRemainDistinct([...GROWTH_AGENT_EVIDENCE_CLASSES]), "eight evidence classes");
    assert(growthAgentEffectClassesRemainDistinct([...GROWTH_AGENT_EFFECT_CLASSES]), "nine effect classes");
    assert(GROWTH_AGENT_DISTINCT_EVIDENCE_NOTE.includes("fixture"), "honesty note names fixture");
    assert(GROWTH_AGENT_DISTINCT_EFFECT_NOTE.includes("schedule"), "effect note names schedule");
    assert(GROWTH_AGENT_DISTINCT_EFFECT_NOTE.includes("public-publish"), "effect note names public-publish");
    const doc = readFileSync(INVENTORY_DOC, "utf8");
    assert(doc.includes("#116"), "inventory names #116");
    assert(doc.includes("#24"), "inventory names #24");
    assert(doc.includes("ADR-0013") || doc.includes("0013"), "inventory names ADR");
    assert(doc.includes("fake") && doc.includes("contract"), "fake≠contract");
    assert(doc.includes("held"), "inventory documents holds");
    assert(!doc.includes("live publish: yes"), "inventory does not authorize live publish");
    assert(doc.includes("U4") || doc.includes("COMPLETE"), "audit bucket complete / U4 separate");
    assert(doc.includes("#75"), "preserves #75 retrieval owner");
    assert(doc.includes("#117"), "preserves #117");
    assert(GROWTH_AGENT_AUDIT_BUCKET_COMPLETE_NOTE.includes("COMPLETE"), "bucket complete note");
  });

  harness.check("growth-agent-canonical: independent provenance; fake ≠ contract; Layers/Postiz pins", () => {
    assert(existsSync(LAYERS_FIXTURE), "layers fixture suite present");
    assert(existsSync(LAYERS_SPEND), "layers spend boundaries present");
    assert(existsSync(LAYERS_UPSTREAM_PATH), "layers upstream present");
    assert(existsSync(POSTIZ_FIXTURE), "postiz-extension fixtures present");
    assert(existsSync(POSTIZ_PKG), "postiz extension package present");
    assert(existsSync(POSTHOG_WIZARD), "posthog wizard upstream present");
    assert(existsSync(POSTHOG_MILL), "posthog context mill upstream present");
    assert(existsSync(POSTHOG_PROBE), "probe-posthog present");
    assert(existsSync(ADR_PATH), "ADR-0013 present");
    assert(existsSync(GUIDE_PATH), "provider-integrations guide present");
    const wizardYaml = readFileSync(POSTHOG_WIZARD, "utf8");
    assert(wizardYaml.includes("adapted-method"), "wizard is adapted-method");
    assert(wizardYaml.includes(POSTHOG_WIZARD_REVIEWED_REVISION), "wizard revision pin");
    const millYaml = readFileSync(POSTHOG_MILL, "utf8");
    assert(millYaml.includes("selected-skill-guidance"), "context mill kind");
    assert(millYaml.includes("operations: []") || /operations:\s*\[\s*\]/.test(millYaml), "context mill ops empty");
    assert(millYaml.includes(POSTHOG_CONTEXT_MILL_REVIEWED_REVISION), "context mill revision pin");
    if (existsSync(POSTHOG_KNOWLEDGE)) {
      const knowledge = readFileSync(POSTHOG_KNOWLEDGE, "utf8");
      assert(knowledge.length > 0, "wizard knowledge present");
    }
    const layersFixture = readFileSync(LAYERS_FIXTURE, "utf8");
    assert(layersFixture.includes("createFakeLayersTransport") || layersFixture.includes("fake"), "layers uses fake transport");
    assert(layersFixture.includes("fetch") && layersFixture.includes("throw"), "layers suite disables network");
    const postizFixture = readFileSync(POSTIZ_FIXTURE, "utf8");
    assert(postizFixture.includes("mode === \"manual\"") || postizFixture.includes('mode === "manual"') || postizFixture.includes("manual"), "postiz manual");
    assert(postizFixture.includes("createFakePostizTransport") || postizFixture.includes("fake"), "postiz fake transport");
    for (const op of LAYERS_EXTENSION_OPERATION_IDS) {
      assert(Object.values(LAYERS_OPERATION_IDS).includes(op), `layers op ${op} matches adapter`);
    }
    assert(LAYERS_DELIVER_TOOL === "deliver_content_experiment", "deliver tool name recorded");
    assert(LAYERS_RECORDED_TOOLS.some((t) => t.name === "render_content"), "recorded render_content");
    assert(!LAYERS_RECORDED_TOOLS.some((t) => t.name === "invented_official_tool_xyz"), "no invented tools");
  });

  harness.check("growth-agent-canonical: ADR-0013 logical seams; no registry; no second store; #24 holds", () => {
    assert(GROWTH_AGENT_LOGICAL_SEAMS.length === 5, "five logical seams");
    for (const role of ["definition", "encoder", "transport", "decoder", "reconciler"] as const) {
      const owner = growthAgentSeamOwner(role);
      assert(owner.length > 0, role);
    }
    assert(growthAgentIntroducesGenericMcpRegistry() === false, "no generic MCP registry");
    assert(growthAgentIntroducesSecondExecutionStore() === false, "no second execution store");
    assert(growthAgentExpandsPostizLive() === false, "no #24 live expand");
    assert(GROWTH_AGENT_POSTIZ_LIVE_HOLD.disposition === "held", "postiz live held");
    assert(POSTIZ_OWNER_ISSUE === "#24", "postiz owner");
    assert(pathMayOwnGrowthAgentNativeTypes("adapters/providers/layers/route.ts"), "layers may own native");
    assert(pathMayOwnGrowthAgentNativeTypes("examples/extensions/postiz-social/extension.yaml"), "postiz may own");
    assert(pathMayOwnGrowthAgentNativeTypes(LAYERS_ADAPTER_MODULE + "transport.ts"), "layers transport");
    assert(pathIsTypedGrowthAgentConsumer("catalog/workflows/growth-revenue.ts"), "workflows are typed consumers");
    assert(pathIsTypedGrowthAgentConsumer("contracts/other.ts"), "contracts prefix");
    assert(pathIsTypedGrowthAgentConsumer("kernel/session/executor.ts"), "kernel is typed consumer");
    assert(pathIsTypedGrowthAgentConsumer("entrypoints/mcp/server.ts"), "entrypoints are typed consumers");
    // Detector modules intentionally name forbidden factory symbols in their
    // regex sources; assert against a neutral consumer sample instead.
    const sampleOk = "export function reconcileGrowthObservation() { return { ok: true }; }\n";
    assert(!looksLikeGenericMcpRegistry(sampleOk), "neutral sample is not a registry");
    assert(!looksLikeSecondExecutionStore(sampleOk), "neutral sample is not a second store");
    assert(looksLikeGenericMcpRegistry("function createGenericMcpProviderRegistry() {}"), "detector catches registry");
    assert(looksLikeSecondExecutionStore("function createSecondExecutionStore() {}"), "detector catches second store");
  });

  harness.check("growth-agent-canonical: knowledge≠execution; hosted console ≠ consumer provider", () => {
    const ok = knowledgeClaimsExecutionAuthority({
      surface: "wizard",
      claimsRouteOwnership: false,
      claimsGrantOwnership: false,
      claimsSupportDeclaration: false,
      namesCliOrMcpCommand: true,
    });
    assert(ok.illegal === false, "naming command in guidance ok");
    const bad = knowledgeClaimsExecutionAuthority({
      surface: "wizard",
      claimsRouteOwnership: true,
      claimsGrantOwnership: false,
      claimsSupportDeclaration: false,
      namesCliOrMcpCommand: true,
    });
    assert(bad.illegal === true, "knowledge must not own routes");
    const millBad = knowledgeClaimsExecutionAuthority({
      surface: "context-mill",
      claimsRouteOwnership: false,
      claimsGrantOwnership: false,
      claimsSupportDeclaration: true,
      namesCliOrMcpCommand: false,
    });
    assert(millBad.illegal === true, "context mill must not own support declarations");
    const hostedOk = hostedConsolePosthogAsConsumerProvider({
      hostedAnalyticsPresent: true,
      selectableAsConsumerAppProvider: false,
    });
    assert(hostedOk.illegal === false, "operator ok");
    const hostedBad = hostedConsolePosthogAsConsumerProvider({
      hostedAnalyticsPresent: true,
      selectableAsConsumerAppProvider: true,
    });
    assert(hostedBad.illegal === true, "hosted must not be consumer provider");
  });

  harness.check("growth-agent-canonical: typed consumers do not import provider-native leak symbols", () => {
    const roots = GROWTH_AGENT_TYPED_CONTRACT_CONSUMERS.map((prefix) => path.join(skillRoot, prefix));
    const offenders: string[] = [];
    for (const root of roots) {
      const walk = (dir: string): void => {
        let dirents;
        try {
          dirents = readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const ent of dirents) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) {
            walk(full);
            continue;
          }
          if (!ent.name.endsWith(".ts")) continue;
          const rel = path.relative(skillRoot, full).replace(/\\/g, "/");
          if (!pathIsTypedGrowthAgentConsumer(rel)) continue;
          if (pathMayOwnGrowthAgentNativeTypes(rel)) continue;
          const source = readFileSync(full, "utf8");
          const leaks = sourceImportsGrowthAgentNativeLeak(source);
          if (leaks.length > 0) offenders.push(`${rel}: ${leaks.join(",")}`);
          if (looksLikeGenericMcpRegistry(source)) offenders.push(`${rel}: generic-mcp-registry`);
          if (looksLikeSecondExecutionStore(source)) offenders.push(`${rel}: second-execution-store`);
        }
      };
      walk(root);
    }
    assert(offenders.length === 0, `growth-agent native leakage: ${offenders.join("; ")}`);
    assert(GROWTH_AGENT_NATIVE_LEAK_SYMBOLS.length >= 8, "leak symbol list non-empty");
  });

  harness.check("growth-agent-canonical: Layers + Postiz extension ops; discovery refuse; deliver held", () => {
    const draft = growthAgentCanonicalMapRow("layers-draft-creative");
    assert(draft.canonicalOrExtension === "layers-growth/creative.draft-creative", "draft op");
    assert(draft.effectClass === "spend", "draft is spend");
    assert(draft.disposition === "extension", "layers extension");
    const getJob = growthAgentCanonicalMapRow("layers-get-job");
    assert(getJob.effectClass === "observe", "get-job observe");
    const deliver = growthAgentCanonicalMapRow("layers-deliver-held");
    assert(deliver.disposition === "held", "deliver held");
    assert(deliver.effectClass === "public-publish", "deliver is public-publish effect class");
    const drift = classifySchemaDriftRefuse();
    assert(drift.action === "refuse-schema-drift", drift.reason);
    assert(drift.allowSilentDiscoveryExpand === false, "no auto-expand");
    const neu = classifyDiscoveryAutoExpandRefuse();
    assert(neu.action === "refuse-discovery-expand", neu.reason);
    const observedDrift = detectToolDrift([
      ...LAYERS_RECORDED_TOOLS,
      { name: "brand_new_unreviewed_tool", charged: "unknown" },
    ]);
    assert(observedDrift.added.includes("brand_new_unreviewed_tool"), "new tool reported as added");
    const driftRow = growthAgentCanonicalMapRow("layers-discovery-drift");
    assert(driftRow.disposition === "reject", "discovery drift rejected in map");

    for (const op of POSTIZ_EXTENSION_OPERATION_IDS) {
      assert(
        GROWTH_AGENT_CANONICAL_MAP.some((row) => row.canonicalOrExtension === op),
        `postiz op ${op} in map`,
      );
    }
    const schedule = growthAgentCanonicalMapRow("postiz-schedule");
    assert(schedule.effectClass === "schedule", "schedule effect distinct");
    const live = growthAgentCanonicalMapRow("postiz-live-publish-held");
    assert(live.disposition === "held", "live publish held");
    assert(existsSync(path.join(skillRoot, LAYERS_EXTENSION_PACKAGE, "extension.yaml")), "layers extension yaml");
  });

  harness.check("growth-agent-canonical: wrong/stale/connection/uncertain/partial classifiers", () => {
    const wrong = classifyWrongGrowthProject(
      "layers-draft-creative",
      "spend",
      { providerId: "layers-growth/layers", operation: "layers-growth/creative.draft-creative", projectId: "proj_a" },
      { providerId: "layers-growth/layers", operation: "layers-growth/creative.draft-creative", projectId: "proj_b" },
    );
    assert(wrong.action === "refuse-wrong-project", "wrong project refuses");

    const stale = classifyStaleAnalyticsWindow();
    assert(stale.action === "hold-stale", "stale analytics held");

    const lost = classifyConnectionLoss();
    assert(lost.action === "hold-connection-loss", "connection loss held");

    const uncertainSched = classifyUncertainScheduleRefuse();
    assert(uncertainSched.action === "refuse-uncertain-schedule", uncertainSched.reason);

    const uncertainPub = classifyUncertainPublishRefuse();
    assert(uncertainPub.action === "refuse-uncertain-publish", uncertainPub.reason);

    const partial = classifyGrowthAgentFailSafe({
      opClass: "postiz-list",
      effectClass: "observe",
      projectMatchesMandate: true,
      staleAnalyticsWindow: false,
      schemaDrift: false,
      newlyExposedUpstreamTool: false,
      uncertainScheduleResult: false,
      uncertainPublishResult: false,
      connectionLost: false,
      paginationPartial: true,
      effectClassCollapsed: false,
      silentDiscoveryExpandAttempted: false,
      authorityGranted: true,
      liveProtectedAttempted: false,
    });
    assert(partial.action === "hold-partial", "pagination/partial held");

    const liveAttempt = classifyGrowthAgentFailSafe({
      opClass: "postiz-live-publish",
      effectClass: "public-publish",
      projectMatchesMandate: true,
      staleAnalyticsWindow: false,
      schemaDrift: false,
      newlyExposedUpstreamTool: false,
      uncertainScheduleResult: false,
      uncertainPublishResult: false,
      connectionLost: false,
      paginationPartial: false,
      effectClassCollapsed: false,
      silentDiscoveryExpandAttempted: false,
      authorityGranted: true,
      liveProtectedAttempted: true,
    });
    assert(liveAttempt.action === "fail-closed", "live protected fails closed");
  });

  harness.check("growth-agent-canonical: effect-class distinctness; schedule ≠ public-publish", () => {
    const collapse = classifyEffectCollapseRefuse("schedule", "public-publish");
    assert(collapse.action === "refuse-effect-collapse", collapse.reason);
    assert(collapse.allowEffectCollapse === false, "no effect collapse");
    const schedule = growthAgentCanonicalMapRow("postiz-schedule");
    const publish = growthAgentCanonicalMapRow("postiz-live-publish-held");
    assert(schedule.effectClass !== publish.effectClass, "schedule ≠ public-publish");
    const draft = growthAgentCanonicalMapRow("layers-draft-creative");
    const observe = growthAgentCanonicalMapRow("layers-get-job");
    assert(draft.effectClass !== observe.effectClass, "spend ≠ observe");
    const experiment = growthAgentCanonicalMapRow("posthog-experiment-launch-held");
    assert(experiment.effectClass === "experiment-mutation", "experiment mutation tagged");
    assert((experiment.effectClass as string) !== "analytics-read", "experiment ≠ analytics-read");
  });

  harness.check("growth-agent-canonical: #24 ADR-0013 reconcile; fake ≠ live support", () => {
    const reconcile = growthAgentCanonicalMapRow("postiz-adr-0013-reconcile");
    assert(reconcile.disposition === "implement", "reconcile documented");
    assert(reconcile.ownerIssue === "#24", "preserves #24 owner");
    const honest = postizFakeTransportProvesLiveSupport({
      hasFakeTransportFixtures: true,
      hasLiveAccount: false,
      claimsLiveSupport: false,
    });
    assert(honest.honest === true, "fake wiring only is honest");
    const dishonest = postizFakeTransportProvesLiveSupport({
      hasFakeTransportFixtures: true,
      hasLiveAccount: false,
      claimsLiveSupport: true,
    });
    assert(dishonest.honest === false, "fake must not claim live support");
    const adr = readFileSync(ADR_PATH, "utf8");
    assert(adr.includes("canonical") || adr.includes("Canonical"), "ADR names canonical ops");
    assert(adr.includes("Fake") || adr.includes("fake") || adr.includes("Independent conformance"), "ADR covers independent conformance");
    const guide = readFileSync(GUIDE_PATH, "utf8");
    assert(guide.length > 0, "provider-integrations guide present");
    const ext = readFileSync(path.join(POSTIZ_PKG, "extension.yaml"), "utf8");
    assert(ext.includes("mode: manual"), "postiz implementations remain manual");
    assert(ext.includes("postiz-social/posts.draft"), "draft op declared");
    assert(ext.includes("postiz-social/posts.schedule"), "schedule op declared");
  });

  harness.check("growth-agent-canonical: no public analytics executor surfaces in firstparty/contracts", () => {
    const noRegistry = growthAgentCanonicalMapRow("shared-no-mcp-registry");
    assert(noRegistry.disposition === "reject", "registry rejected");
    const noStore = growthAgentCanonicalMapRow("shared-no-second-store");
    assert(noStore.disposition === "reject", "second store rejected");
    // Spot-check: invented public composition executor ids must not appear as
    // first-party operation registrations in the map as implement dispositions.
    for (const invented of ["b2c/analytics.", "b2c/growth.", "b2c/social."]) {
      assert(
        !GROWTH_AGENT_CANONICAL_MAP.some(
          (row) => typeof row.canonicalOrExtension === "string" && row.canonicalOrExtension.startsWith(invented) && row.disposition === "implement",
        ),
        `no implemented ${invented}* composition executor`,
      );
    }
  });
}
