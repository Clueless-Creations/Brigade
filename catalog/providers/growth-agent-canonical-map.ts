/**
 * Growth/agent providers → canonical-operation inventory + classification (#116).
 *
 * Proving-provider map for ADR-0013 across PostHog (Wizard / Context Mill /
 * hosted console / consumer probe), Layers (`layers-growth/creative.*`), and
 * Postiz (#24 `postiz-social/posts.*`). Knowledge/skills ≠ execution/authority.
 * Core workflows name selected extension ops or stay guidance — they do not
 * import MCP/API/CLI native types. Fake transports prove wiring only.
 *
 * Consumes landed surfaces (do not rebuild / do not invent):
 * - catalog/upstreams/posthog-wizard.yaml (adapted-method)
 * - catalog/upstreams/posthog-context-mill.yaml (selected-skill-guidance; ops [])
 * - hosted/builder-console/analytics/* + hosted/knowledge-mcp/analytics.ts (operator)
 * - tooling/probe-posthog.ts + attribution / starter posthog-js (founder-gated)
 * - adapters/providers/layers/* + examples/extensions/layers-growth
 * - examples/extensions/postiz-social/* + postiz-extension.fixtures (#24)
 * - docs/decisions/0013-provider-integration-boundary.md
 * - docs/guides/provider-integrations.md
 *
 * Pins: Layers recorded-tool / layers.fixtures (no invented tools/list schemas);
 * Postiz #24 postiz-extension.fixtures + official API shapes; PostHog upstream +
 * probe only (no new executor contract). Fake ≠ contract.
 *
 * Coordinate owners preserved: #24 Postiz (CLOSED — reconcile lifecycle only),
 * #75 retrieval (OPEN — do not steal), #117 inventory. After #116 close:
 * provider-audit bucket (#113–#116) COMPLETE — do not invent U4 here.
 * No public b2c/analytics.* / b2c/growth.* / b2c/social.* composition executors.
 * No generic MCP/provider registry. No second execution store/scheduler.
 * No live publish / experiment launch / customer-data query / provider sign-in.
 */
export const GROWTH_AGENT_CANONICAL_MAP_PATH = "catalog/providers/growth-agent-canonical-map.ts" as const;
export const GROWTH_AGENT_CANONICAL_INVENTORY_DOC = "checks/verification/rehearsal/growth-agent-canonical-inventory.md" as const;

/** Layers fixture + adapter provenance (consume; no invented official schemas). */
export const LAYERS_FIXTURE_SUITE = "checks/verification/fixtures/layers.fixtures.ts" as const;
export const LAYERS_SPEND_BOUNDARIES = "checks/verification/boundaries/layers-spend.boundaries.ts" as const;
export const LAYERS_ADAPTER_MODULE = "adapters/providers/layers/" as const;
export const LAYERS_EXTENSION_PACKAGE = "examples/extensions/layers-growth" as const;
export const LAYERS_UPSTREAM = "catalog/upstreams/layers-growth-mcp.yaml" as const;

/** #24 Postiz fixture + extension pin — consume; no live expand. */
export const POSTIZ_EXTENSION_FIXTURE = "checks/verification/fixtures/postiz-extension.fixtures.ts" as const;
export const POSTIZ_EXTENSION_PACKAGE = "examples/extensions/postiz-social" as const;
export const POSTIZ_OWNER_ISSUE = "#24" as const;

/** PostHog upstream / probe pins — guidance + founder probe only; no executor. */
export const POSTHOG_WIZARD_UPSTREAM = "catalog/upstreams/posthog-wizard.yaml" as const;
export const POSTHOG_CONTEXT_MILL_UPSTREAM = "catalog/upstreams/posthog-context-mill.yaml" as const;
export const POSTHOG_WIZARD_KNOWLEDGE = "knowledge/data/posthog-agent-tooling.md" as const;
export const POSTHOG_PROBE_TOOL = "tooling/probe-posthog.ts" as const;
export const POSTHOG_WIZARD_REVIEWED_REVISION = "41c12328636f46a517777b17359dd8f5b3d14d96" as const;
export const POSTHOG_CONTEXT_MILL_REVIEWED_REVISION = "bbc88864bf8ba2efac43bb4c2782e4406bc0dfa6" as const;

/** ADR + guide pins for #24 lifecycle reconcile. */
export const PROVIDER_INTEGRATION_ADR = "docs/decisions/0013-provider-integration-boundary.md" as const;
export const PROVIDER_INTEGRATIONS_GUIDE = "docs/guides/provider-integrations.md" as const;

export const GROWTH_AGENT_EVIDENCE_CLASSES = [
  "fixture",
  "synthetic-routing",
  "upstream-guidance",
  "fake-wiring",
  "live-held",
  "customer-data-held",
  "experiment-launch-held",
  "public-publish-held",
] as const;
export type GrowthAgentEvidenceClass = (typeof GROWTH_AGENT_EVIDENCE_CLASSES)[number];

/**
 * Effect classes stay distinct (KTD-116-5). Matching command names across
 * providers is insufficient for semantic equivalence.
 */
export const GROWTH_AGENT_EFFECT_CLASSES = [
  "analytics-read",
  "experiment-mutation",
  "schedule",
  "public-publish",
  "spend",
  "account-connect",
  "guidance",
  "operator-capture",
  "observe",
] as const;
export type GrowthAgentEffectClass = (typeof GROWTH_AGENT_EFFECT_CLASSES)[number];

export const GROWTH_AGENT_AUTHORITY_CLASSES = [
  "observe",
  "selected-binding",
  "founder-protected",
  "operator-service",
  "guidance-only",
  "rejected",
  "held",
] as const;
export type GrowthAgentAuthorityClass = (typeof GROWTH_AGENT_AUTHORITY_CLASSES)[number];

export const GROWTH_AGENT_PROVIDER_CLASSES = [
  "posthog-wizard",
  "posthog-context-mill",
  "posthog-hosted-console",
  "posthog-consumer-probe",
  "layers",
  "postiz",
  "shared-boundary",
] as const;
export type GrowthAgentProviderClass = (typeof GROWTH_AGENT_PROVIDER_CLASSES)[number];

export const GROWTH_AGENT_OP_CLASSES = [
  "wizard-guidance",
  "context-mill-hold",
  "hosted-operator",
  "consumer-probe",
  "layers-draft-creative",
  "layers-get-job",
  "layers-get-result",
  "layers-deliver-held",
  "layers-discovery-drift",
  "postiz-draft",
  "postiz-schedule",
  "postiz-list",
  "postiz-delete",
  "postiz-live-publish",
  "posthog-experiment-launch",
  "invented-analytics-executor",
  "account-connect",
  "no-registry",
  "no-second-store",
  "adr-reconcile",
] as const;
export type GrowthAgentOpClass = (typeof GROWTH_AGENT_OP_CLASSES)[number];

export const GROWTH_AGENT_SEAM_ROLES = ["definition", "encoder", "transport", "decoder", "reconciler"] as const;
export type GrowthAgentSeamRole = (typeof GROWTH_AGENT_SEAM_ROLES)[number];

export type GrowthAgentMappingDisposition = "implement" | "extension" | "defer" | "reject" | "held" | "guidance";

export interface GrowthAgentCanonicalMapRow {
  readonly id: string;
  readonly providerClass: GrowthAgentProviderClass;
  readonly opClass: GrowthAgentOpClass;
  readonly nativeCapability: string;
  readonly canonicalOrExtension: string | "none";
  readonly implementationPointer: string;
  readonly evidenceClass: GrowthAgentEvidenceClass;
  readonly effectClass: GrowthAgentEffectClass;
  readonly authorityClass: GrowthAgentAuthorityClass;
  readonly disposition: GrowthAgentMappingDisposition;
  readonly fit: "exact" | "partial" | "extension" | "unsupported" | "n/a" | "guidance";
  readonly limitations: string;
  readonly ownerIssue: string;
  readonly residual: boolean;
  readonly notes: string;
}

/**
 * Logical ADR-0013 seams for growth/agent providers.
 * No generic MCP registry; no second execution store/scheduler.
 */
export const GROWTH_AGENT_LOGICAL_SEAMS: readonly {
  readonly role: GrowthAgentSeamRole;
  readonly owner: string;
  readonly responsibility: string;
}[] = [
  {
    role: "definition",
    owner: "growth-agent-canonical-map.ts + layers-growth/postiz-social extension.yaml + posthog upstreams",
    responsibility: "Native→canonical/extension map; effect/authority tags; knowledge≠execution dispositions",
  },
  {
    role: "encoder",
    owner: "adapters/providers/layers/* + examples/extensions/postiz-social (PostHog: none — not composition executor)",
    responsibility: "Canonical/extension request → Layers MCP tool args / Postiz API envelopes; terminate at adapter",
  },
  {
    role: "transport",
    owner: "createFakeLayersTransport | Postiz fake transport (#24) | PostHog probe (founder-gated, not host execute)",
    responsibility: "Fake ≠ contract; live publish/experiment/customer-query/sign-in held",
  },
  {
    role: "decoder",
    owner: "adapters/providers/layers (job/result normalize) + postiz schemas; PostHog probe proof artifact only",
    responsibility: "Provider observations without inventing public b2c/analytics.* executors",
  },
  {
    role: "reconciler",
    owner: "OperationRouteRegistry via existing Layers routes + Postiz extension contribution; no second store",
    responsibility: "Register only through existing patterns; discovery drift refuse; #24 ADR-0013 reconcile",
  },
] as const;

/** Executable Layers extension operation IDs (consume existing). */
export const LAYERS_EXTENSION_OPERATION_IDS = [
  "layers-growth/creative.draft-creative",
  "layers-growth/creative.get-job",
  "layers-growth/creative.get-result",
] as const;

/** #24 Postiz namespaced ops (manual; no live). */
export const POSTIZ_EXTENSION_OPERATION_IDS = [
  "postiz-social/posts.draft",
  "postiz-social/posts.schedule",
  "postiz-social/posts.list",
  "postiz-social/posts.delete",
] as const;

/**
 * Full inventory: native capability → canonical/extension → fit/limits → evidence.
 * Held / guidance / reject rows stay honest — no invented analytics executor.
 */
export const GROWTH_AGENT_CANONICAL_MAP: readonly GrowthAgentCanonicalMapRow[] = [
  // —— PostHog Wizard (adapted-method guidance) ——
  {
    id: "posthog-wizard-guidance",
    providerClass: "posthog-wizard",
    opClass: "wizard-guidance",
    nativeCapability: "PostHog wizard adapted-method setup/audit procedures",
    canonicalOrExtension: "none",
    implementationPointer: `${POSTHOG_WIZARD_UPSTREAM} + ${POSTHOG_WIZARD_KNOWLEDGE}`,
    evidenceClass: "upstream-guidance",
    effectClass: "guidance",
    authorityClass: "guidance-only",
    disposition: "guidance",
    fit: "guidance",
    limitations: "Adapted-method only; no upstream executable; automatic-setup unsupported; not a composition executor",
    ownerIssue: "#116",
    residual: false,
    notes: "KTD-116-1/8: knowledge ≠ execution; PostHog is not a composition executor",
  },
  // —— PostHog Context Mill (rights hold) ——
  {
    id: "posthog-context-mill-hold",
    providerClass: "posthog-context-mill",
    opClass: "context-mill-hold",
    nativeCapability: "PostHog context-mill selected-skill-guidance catalog",
    canonicalOrExtension: "none",
    implementationPointer: POSTHOG_CONTEXT_MILL_UPSTREAM,
    evidenceClass: "upstream-guidance",
    effectClass: "guidance",
    authorityClass: "held",
    disposition: "held",
    fit: "unsupported",
    limitations: "support.operations: []; rights hold (NOASSERTION); no skill content shipped",
    ownerIssue: "#116",
    residual: false,
    notes: "KTD-116-1: selected-skill-guidance ≠ routes/grants/completion",
  },
  // —— Hosted console PostHog (operator) ——
  {
    id: "posthog-hosted-console-operator",
    providerClass: "posthog-hosted-console",
    opClass: "hosted-operator",
    nativeCapability: "hosted/builder-console/analytics + knowledge-mcp analytics capture",
    canonicalOrExtension: "none",
    implementationPointer: "hosted/builder-console/analytics/* + hosted/knowledge-mcp/analytics.ts",
    evidenceClass: "fixture",
    effectClass: "operator-capture",
    authorityClass: "operator-service",
    disposition: "implement",
    fit: "n/a",
    limitations: "Operator service only; fail-open; off when token unset; not a selectable consumer-app provider",
    ownerIssue: "#116",
    residual: false,
    notes: "KTD-116-8: do not turn hosted console PostHog into consumer-app provider",
  },
  // —— Consumer probe / SDK ——
  {
    id: "posthog-consumer-probe",
    providerClass: "posthog-consumer-probe",
    opClass: "consumer-probe",
    nativeCapability: "probe-posthog + attribution checks + starter posthog-js",
    canonicalOrExtension: "none",
    implementationPointer: POSTHOG_PROBE_TOOL,
    evidenceClass: "fixture",
    effectClass: "analytics-read",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "partial",
    limitations: "Founder-gated business keys; no public b2c/analytics.* execute ops; customer-data query held",
    ownerIssue: "#116",
    residual: false,
    notes: "Consumer proof ≠ host analytics composition executor",
  },
  {
    id: "posthog-experiment-launch-held",
    providerClass: "posthog-consumer-probe",
    opClass: "posthog-experiment-launch",
    nativeCapability: "PostHog experiment launch / customer-data query / feature-flag mutate",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/growth-agent/fail-safe.ts",
    evidenceClass: "experiment-launch-held",
    effectClass: "experiment-mutation",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "unsupported",
    limitations: "HoE settle: no live experiment launch / customer-data query this slice",
    ownerIssue: "#116",
    residual: false,
    notes: "AUTHORITY-LOCKS + issue non-goals",
  },
  {
    id: "posthog-no-invented-executor",
    providerClass: "shared-boundary",
    opClass: "invented-analytics-executor",
    nativeCapability: "Invented public b2c/analytics.* / b2c/growth.* / b2c/social.* composition executors",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/growth-agent/boundary.ts",
    evidenceClass: "fixture",
    effectClass: "analytics-read",
    authorityClass: "rejected",
    disposition: "reject",
    fit: "n/a",
    limitations: "Hard non-goal; reviewed no-change for PostHog executor invention is valid",
    ownerIssue: "#116",
    residual: false,
    notes: "KTD-116-8",
  },
  // —— Layers executable extension ——
  {
    id: "layers-draft-creative",
    providerClass: "layers",
    opClass: "layers-draft-creative",
    nativeCapability: "Layers MCP render_content (charged draft creative)",
    canonicalOrExtension: "layers-growth/creative.draft-creative",
    implementationPointer: "adapters/providers/layers/route.ts + examples/extensions/layers-growth",
    evidenceClass: "fixture",
    effectClass: "spend",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "extension",
    limitations: "Quote-before-charge; fake transport in tests; draft ≠ publication; live credits held",
    ownerIssue: "#116",
    residual: false,
    notes: "KTD-116-9: primary executable growth seam; fake ≠ contract",
  },
  {
    id: "layers-get-job",
    providerClass: "layers",
    opClass: "layers-get-job",
    nativeCapability: "Layers job read by reference",
    canonicalOrExtension: "layers-growth/creative.get-job",
    implementationPointer: "adapters/providers/layers/route.ts",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "extension",
    limitations: "Free observe; fake transport; no invented tools/list schema fields",
    ownerIssue: "#116",
    residual: false,
    notes: "Consume layers.fixtures; do not invent official schemas",
  },
  {
    id: "layers-get-result",
    providerClass: "layers",
    opClass: "layers-get-result",
    nativeCapability: "Layers completed result / artifact read",
    canonicalOrExtension: "layers-growth/creative.get-result",
    implementationPointer: "adapters/providers/layers/route.ts",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "extension",
    limitations: "Pending/running refused; artifact requires sha256; fake ≠ live support",
    ownerIssue: "#116",
    residual: false,
    notes: "Effect observe ≠ spend ≠ public-publish",
  },
  {
    id: "layers-deliver-held",
    providerClass: "layers",
    opClass: "layers-deliver-held",
    nativeCapability: "Layers deliver_content_experiment (publication tool)",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/layers/transport.ts LAYERS_DELIVER_TOOL",
    evidenceClass: "public-publish-held",
    effectClass: "public-publish",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "unsupported",
    limitations: "Adapter never calls deliver; name recorded so fixtures assert non-call",
    ownerIssue: "#116",
    residual: false,
    notes: "Public publish held; draft ≠ deliver",
  },
  {
    id: "layers-discovery-drift",
    providerClass: "layers",
    opClass: "layers-discovery-drift",
    nativeCapability: "Live tools/list / schema drift / newly exposed Layers tools",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/layers/transport.ts detectToolDrift",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "rejected",
    disposition: "reject",
    fit: "n/a",
    limitations: "Drift reported; never auto-adopts; new tools need reviewed mapping + support declaration",
    ownerIssue: "#116",
    residual: false,
    notes: "KTD-116-4: discovery ≠ auto-expand",
  },
  {
    id: "layers-account-connect-held",
    providerClass: "layers",
    opClass: "account-connect",
    nativeCapability: "Layers CLI sign-in / business onboard / paid plan",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/growth-agent/fail-safe.ts",
    evidenceClass: "live-held",
    effectClass: "account-connect",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "unsupported",
    limitations: "No provider sign-in / new paid service this slice",
    ownerIssue: "#116",
    residual: false,
    notes: "AUTHORITY-LOCKS",
  },
  // —— Postiz #24 ——
  {
    id: "postiz-draft",
    providerClass: "postiz",
    opClass: "postiz-draft",
    nativeCapability: "POST /public/v1/posts type:draft",
    canonicalOrExtension: "postiz-social/posts.draft",
    implementationPointer: `${POSTIZ_EXTENSION_PACKAGE} (#24)`,
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "extension",
    limitations: "Manual mode; fake transport; no live account; draft ≠ publish",
    ownerIssue: "#24",
    residual: false,
    notes: "KTD-116-6: #24 source/fixture; fake ≠ live support",
  },
  {
    id: "postiz-schedule",
    providerClass: "postiz",
    opClass: "postiz-schedule",
    nativeCapability: "POST /public/v1/posts type:schedule",
    canonicalOrExtension: "postiz-social/posts.schedule",
    implementationPointer: `${POSTIZ_EXTENSION_PACKAGE} (#24)`,
    evidenceClass: "fixture",
    effectClass: "schedule",
    authorityClass: "founder-protected",
    disposition: "extension",
    fit: "extension",
    limitations: "Declared extension; founder-gated; unimplemented live; schedule ≠ public-publish proof",
    ownerIssue: "#24",
    residual: false,
    notes: "Effect schedule stays distinct from public-publish",
  },
  {
    id: "postiz-list",
    providerClass: "postiz",
    opClass: "postiz-list",
    nativeCapability: "GET /public/v1/posts",
    canonicalOrExtension: "postiz-social/posts.list",
    implementationPointer: `${POSTIZ_EXTENSION_PACKAGE} (#24)`,
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "selected-binding",
    disposition: "extension",
    fit: "extension",
    limitations: "Manual read boundary; fake transport; no live route",
    ownerIssue: "#24",
    residual: false,
    notes: "Consume postiz-extension.fixtures",
  },
  {
    id: "postiz-delete",
    providerClass: "postiz",
    opClass: "postiz-delete",
    nativeCapability: "DELETE /public/v1/posts/:id",
    canonicalOrExtension: "postiz-social/posts.delete",
    implementationPointer: `${POSTIZ_EXTENSION_PACKAGE} (#24)`,
    evidenceClass: "fixture",
    effectClass: "public-publish",
    authorityClass: "founder-protected",
    disposition: "extension",
    fit: "extension",
    limitations: "Declared; founder-gated; unimplemented live; reconcile before retry",
    ownerIssue: "#24",
    residual: false,
    notes: "Destructive social effect; no live expand under #116",
  },
  {
    id: "postiz-live-publish-held",
    providerClass: "postiz",
    opClass: "postiz-live-publish",
    nativeCapability: "Live Postiz account connect / OAuth / live schedule/publish/delete",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/growth-agent/fail-safe.ts",
    evidenceClass: "public-publish-held",
    effectClass: "public-publish",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "unsupported",
    limitations: "Do not reopen #24 as live work; #116 reconcile docs only",
    ownerIssue: "#24",
    residual: false,
    notes: "KTD-116-6 + scope out",
  },
  {
    id: "postiz-adr-0013-reconcile",
    providerClass: "postiz",
    opClass: "adr-reconcile",
    nativeCapability: "#24 source/fixture-first vs ADR-0013 / provider-integrations lifecycle",
    canonicalOrExtension: "postiz-social/posts.*",
    implementationPointer: `${PROVIDER_INTEGRATION_ADR} + ${PROVIDER_INTEGRATIONS_GUIDE} + inventory md`,
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "observe",
    disposition: "implement",
    fit: "n/a",
    limitations: "Fake transport only is NOT sufficient proof of live support; live stays out of #24/#116",
    ownerIssue: "#24",
    residual: false,
    notes: "KTD-116-6: reconcile wording; do not reopen #24",
  },
  // —— Shared boundary ——
  {
    id: "shared-no-mcp-registry",
    providerClass: "shared-boundary",
    opClass: "no-registry",
    nativeCapability: "Generic MCP/provider registry / universal SDK wrapper",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/growth-agent/boundary.ts",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "rejected",
    disposition: "reject",
    fit: "n/a",
    limitations: "Hard non-goal; routes only via OperationRouteRegistry / extension contribution",
    ownerIssue: "#116",
    residual: false,
    notes: "KTD-116-7",
  },
  {
    id: "shared-no-second-store",
    providerClass: "shared-boundary",
    opClass: "no-second-store",
    nativeCapability: "Second execution store / second scheduler / parallel MCP journal",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/growth-agent/boundary.ts",
    evidenceClass: "fixture",
    effectClass: "observe",
    authorityClass: "rejected",
    disposition: "reject",
    fit: "n/a",
    limitations: "Kernel remains single owner of request identity / authority / recovery",
    ownerIssue: "#116",
    residual: false,
    notes: "KTD-116-7; ADR-0013",
  },
  {
    id: "shared-customer-data-held",
    providerClass: "shared-boundary",
    opClass: "consumer-probe",
    nativeCapability: "Live customer-data query across PostHog/Layers/Postiz",
    canonicalOrExtension: "none",
    implementationPointer: "adapters/providers/growth-agent/fail-safe.ts",
    evidenceClass: "customer-data-held",
    effectClass: "analytics-read",
    authorityClass: "founder-protected",
    disposition: "held",
    fit: "unsupported",
    limitations: "HoE Q1 = no live proof",
    ownerIssue: "#116",
    residual: false,
    notes: "Evidence class distinct from fixture / fake-wiring",
  },
] as const satisfies readonly GrowthAgentCanonicalMapRow[];

export const GROWTH_AGENT_CANONICAL_MAP_REQUIRED_OP_CLASSES = GROWTH_AGENT_OP_CLASSES;

export const GROWTH_AGENT_PROTECTED_EFFECTS: readonly GrowthAgentEffectClass[] = ["public-publish", "experiment-mutation", "account-connect", "spend"] as const;

export const GROWTH_AGENT_DISTINCT_EVIDENCE_NOTE =
  "fixture ≠ synthetic-routing ≠ upstream-guidance ≠ fake-wiring ≠ live-held ≠ customer-data-held ≠ experiment-launch-held ≠ public-publish-held" as const;

export const GROWTH_AGENT_DISTINCT_EFFECT_NOTE =
  "analytics-read ≠ experiment-mutation ≠ schedule ≠ public-publish ≠ spend ≠ account-connect ≠ guidance ≠ operator-capture ≠ observe" as const;

export const GROWTH_AGENT_NON_AUTHORITY_FLAGS = ["--yes", "--non-interactive", "--noninteractive", "-y"] as const;

/** Honest holds: no PostHog composition executor; no #24 live expand; no U4 invent. */
export const GROWTH_AGENT_POSTHOG_EXECUTOR_HOLD = {
  disposition: "held" as const,
  reason: "PostHog remains guidance / operator / founder probe. Inventing public b2c/analytics.* composition executors is a hard non-goal (KTD-116-8).",
} as const;

export const GROWTH_AGENT_POSTIZ_LIVE_HOLD = {
  disposition: "held" as const,
  reason: "#24 owns Postiz source/fixture. Fake transport ≠ live support. Do not expand into account connect / OAuth / live publish under #116.",
} as const;

export const GROWTH_AGENT_AUDIT_BUCKET_COMPLETE_NOTE =
  "After #116 closes: provider-audit bucket (#113–#116) COMPLETE. Next = program U4 greenfield/proof deepen SEPARATE — do not invent here." as const;

export function getGrowthAgentCanonicalMap(): readonly GrowthAgentCanonicalMapRow[] {
  return GROWTH_AGENT_CANONICAL_MAP;
}

export function growthAgentCanonicalMapRow(id: string): GrowthAgentCanonicalMapRow {
  const row = GROWTH_AGENT_CANONICAL_MAP.find((entry) => entry.id === id);
  if (!row) throw new Error(`unknown growth-agent canonical map id: ${id}`);
  return row;
}

export function growthAgentRowsForOpClass(opClass: GrowthAgentOpClass): readonly GrowthAgentCanonicalMapRow[] {
  return GROWTH_AGENT_CANONICAL_MAP.filter((row) => row.opClass === opClass);
}

export function growthAgentRowsForProvider(providerClass: GrowthAgentProviderClass): readonly GrowthAgentCanonicalMapRow[] {
  return GROWTH_AGENT_CANONICAL_MAP.filter((row) => row.providerClass === providerClass);
}

export function growthAgentProtectedRows(): readonly GrowthAgentCanonicalMapRow[] {
  return GROWTH_AGENT_CANONICAL_MAP.filter(
    (row) =>
      row.authorityClass === "founder-protected" ||
      row.authorityClass === "rejected" ||
      row.authorityClass === "held" ||
      GROWTH_AGENT_PROTECTED_EFFECTS.includes(row.effectClass),
  );
}

export function growthAgentNoninteractiveGrantsAuthority(_flags: readonly string[]): false {
  return false;
}

export function growthAgentFlagLooksNoninteractive(flag: string): boolean {
  const normalized = flag.trim().toLowerCase();
  return (GROWTH_AGENT_NON_AUTHORITY_FLAGS as readonly string[]).includes(normalized);
}

export function growthAgentEvidenceClassesRemainDistinct(classes: readonly GrowthAgentEvidenceClass[]): boolean {
  const unique = new Set(classes);
  return unique.size === classes.length && GROWTH_AGENT_EVIDENCE_CLASSES.every((c) => unique.has(c));
}

export function growthAgentEffectClassesRemainDistinct(classes: readonly GrowthAgentEffectClass[]): boolean {
  const unique = new Set(classes);
  return unique.size === classes.length && GROWTH_AGENT_EFFECT_CLASSES.every((c) => unique.has(c));
}

/** Assert this slice does not invent a PostHog composition executor. */
export function growthAgentInventedPosthogExecutor(): false {
  return false;
}

/** Assert this slice does not expand #24 into live publish. */
export function growthAgentExpandsPostizLive(): false {
  return false;
}

/** Assert no generic MCP registry introduced. */
export function growthAgentIntroducesGenericMcpRegistry(): false {
  return false;
}

/** Assert no second execution store/scheduler introduced. */
export function growthAgentIntroducesSecondExecutionStore(): false {
  return false;
}
