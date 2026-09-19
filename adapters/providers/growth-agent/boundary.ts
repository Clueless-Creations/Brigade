/**
 * Growth-agent adapter-boundary guards (#116 / ADR-0013).
 *
 * Core workflows, recipes, kernel, and evidence semantics must not import or
 * branch on PostHog/Layers/Postiz MCP/API/CLI native types. Provider-native
 * types terminate at adapters/providers/layers, examples/extensions/postiz-social,
 * PostHog upstream/knowledge/probe, and this growth-agent boundary pack.
 *
 * Instruction prose may cite providers for founder-facing clarity where already
 * authorized (e.g. provider.posthog in workflow provider lists). Typed contracts
 * and executable branching must not construct MCP tool argv / API envelopes
 * outside adapter/extension owners.
 *
 * Knowledge/skills (Wizard, Context Mill) ≠ routes/grants/completion.
 * PostHog is not a composition executor. No generic MCP registry. No second
 * execution store. #24 reconcile only — no live expand. Does not start U4.
 */
import {
  GROWTH_AGENT_LOGICAL_SEAMS,
  GROWTH_AGENT_CANONICAL_MAP_PATH,
  POSTHOG_WIZARD_REVIEWED_REVISION,
  POSTHOG_CONTEXT_MILL_REVIEWED_REVISION,
  type GrowthAgentSeamRole,
} from "../../../catalog/providers/growth-agent-canonical-map.js";

/** Module path prefixes that may own provider-native growth/agent types. */
export const GROWTH_AGENT_NATIVE_TYPE_OWNERS = [
  "adapters/providers/layers/",
  "adapters/providers/growth-agent/",
  "examples/extensions/layers-growth/",
  "examples/extensions/postiz-social/",
  "catalog/upstreams/posthog-",
  "catalog/upstreams/layers-",
  "knowledge/data/posthog-",
  "hosted/builder-console/analytics/",
  "hosted/knowledge-mcp/analytics.ts",
  "tooling/probe-posthog.ts",
  "tooling/provision-posthog-platform.ts",
  "tooling/prune-posthog-persons.ts",
  "checks/verification/fixtures/",
  "checks/verification/boundaries/",
  "checks/verification/rehearsal/",
  "catalog/providers/",
  "docs/upstreams/",
  "docs/decisions/0013-",
  "docs/guides/provider-integrations.md",
] as const;

/**
 * Consumer surfaces that must not import provider-native MCP/API/CLI types as
 * typed branching. Selected-provider instruction strings remain allowed in
 * workflow prose.
 */
export const GROWTH_AGENT_TYPED_CONTRACT_CONSUMERS = ["catalog/workflows/", "contracts/", "entrypoints/", "kernel/"] as const;

export function growthAgentSeamOwner(role: GrowthAgentSeamRole): string {
  const seam = GROWTH_AGENT_LOGICAL_SEAMS.find((entry) => entry.role === role);
  if (!seam) throw new Error(`unknown growth-agent seam role: ${role}`);
  return seam.owner;
}

export function pathMayOwnGrowthAgentNativeTypes(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return GROWTH_AGENT_NATIVE_TYPE_OWNERS.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix) || (prefix.endsWith(".ts") && normalized === prefix) || (prefix.endsWith(".md") && normalized === prefix),
  );
}

export function pathIsTypedGrowthAgentConsumer(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  return GROWTH_AGENT_TYPED_CONTRACT_CONSUMERS.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Symbols that indicate provider-native tool/API leakage into consumer
 * TypeScript (typed branching / transport construction). Adapter-local use is
 * fine; workflow/contract/kernel/entrypoint imports are boundary smells.
 *
 * Note: instruction *string* prose citing "PostHog" or "provider.posthog" is
 * allowed; this list targets executable code patterns.
 */
export const GROWTH_AGENT_NATIVE_LEAK_SYMBOLS = [
  "createFakeLayersTransport",
  "createLiveLayersTransport",
  "LAYERS_OPERATION_IDS",
  "detectToolDrift(",
  "createFakePostizTransport",
  'spawn("layers"',
  "layers CLI stdio",
  "b2c/analytics.",
  "b2c/growth.",
  "b2c/social.",
  "createPosthogCompositionExecutor",
  "createGenericMcpProviderRegistry",
  "createSecondExecutionStore",
] as const;

export function sourceImportsGrowthAgentNativeLeak(source: string): readonly string[] {
  return GROWTH_AGENT_NATIVE_LEAK_SYMBOLS.filter((symbol) => source.includes(symbol));
}

export function reviewedPosthogWizardRevision(): typeof POSTHOG_WIZARD_REVIEWED_REVISION {
  return POSTHOG_WIZARD_REVIEWED_REVISION;
}

export function reviewedPosthogContextMillRevision(): typeof POSTHOG_CONTEXT_MILL_REVIEWED_REVISION {
  return POSTHOG_CONTEXT_MILL_REVIEWED_REVISION;
}

export function growthAgentCanonicalMapModulePath(): typeof GROWTH_AGENT_CANONICAL_MAP_PATH {
  return GROWTH_AGENT_CANONICAL_MAP_PATH;
}

/**
 * Knowledge ≠ execution: Wizard / Context Mill adapted methods and skills do
 * not own routes, grants, completion, or support declarations merely by naming
 * CLI/MCP commands.
 */
export function knowledgeClaimsExecutionAuthority(input: {
  readonly surface: "wizard" | "context-mill" | "growth-skill" | "other";
  readonly claimsRouteOwnership: boolean;
  readonly claimsGrantOwnership: boolean;
  readonly claimsSupportDeclaration: boolean;
  readonly namesCliOrMcpCommand: boolean;
}): { readonly illegal: boolean; readonly reason: string } {
  if (input.surface === "other") {
    return { illegal: false, reason: "not-knowledge-surface" };
  }
  if (input.claimsRouteOwnership || input.claimsGrantOwnership || input.claimsSupportDeclaration) {
    return {
      illegal: true,
      reason: input.namesCliOrMcpCommand ? "knowledge-naming-command-must-not-own-execution" : "knowledge-must-not-own-routes-grants-support",
    };
  }
  return { illegal: false, reason: "knowledge-subordinate-guidance-ok" };
}

/**
 * Hosted console PostHog must not become a selectable consumer-app provider.
 */
export function hostedConsolePosthogAsConsumerProvider(input: {
  readonly hostedAnalyticsPresent: boolean;
  readonly selectableAsConsumerAppProvider: boolean;
}): { readonly illegal: boolean; readonly reason: string } {
  if (input.hostedAnalyticsPresent && input.selectableAsConsumerAppProvider) {
    return { illegal: true, reason: "hosted-console-posthog-is-operator-not-consumer-provider" };
  }
  return { illegal: false, reason: "operator-service-ok" };
}

/**
 * Count patterns that look like a generic MCP registry or second execution
 * store/scheduler. Forbidden under KTD-116-7.
 */
export function looksLikeGenericMcpRegistry(source: string): boolean {
  return /createGenericMcpProviderRegistry|UniversalProviderRegistry|createMcpToolAutoRegistry|registerAllDiscoveredMcpTools/.test(source);
}

export function looksLikeSecondExecutionStore(source: string): boolean {
  return /createSecondExecutionStore|createParallelOperationJournal|new SecondScheduler|createGrowthExecutionStore/.test(source);
}

/**
 * #24 ADR-0013 reconcile: fake transport alone never proves live support.
 */
export function postizFakeTransportProvesLiveSupport(input: {
  readonly hasFakeTransportFixtures: boolean;
  readonly hasLiveAccount: boolean;
  readonly claimsLiveSupport: boolean;
}): { readonly honest: boolean; readonly reason: string } {
  if (input.claimsLiveSupport && !input.hasLiveAccount) {
    return { honest: false, reason: "fake-transport-must-not-claim-live-support" };
  }
  if (input.hasFakeTransportFixtures && !input.claimsLiveSupport) {
    return { honest: true, reason: "fake-equals-wiring-only-adr-0013-ok" };
  }
  return { honest: true, reason: "reconcile-ok" };
}
