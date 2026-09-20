/**
 * #523 SQ-18 — Explicit semantic-runtime rollout policy inventory (paper).
 *
 * Modes: disabled / shadow / advisory / admitted-execution + rollback.
 * Does NOT rewrite catalog/workflows/index.ts. Does NOT imply live admission
 * by installing a provider key. Consumes #514+#515+#518+#519+#520+#522.
 * NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. Does not implement #526–#529.
 */
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_ISSUE = "#523" as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_EPIC = "#511" as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_PLANNING_ID = "SQ-18" as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_STAMP = "0.221.44" as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_CONSUMES = ["#514", "#515", "#518", "#519", "#520", "#522"] as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_COORDINATES = ["#73", "#74", "#75", "#109"] as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_NO_DEFAULT_REWRITE = true as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_NO_KEY_IMPLIES_LIVE = true as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_NO_METRICS_DAEMON = true as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_NO_523_IMPL = false as const;
export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_NEXT_AFTER_CLOSE = "#526" as const;

/** Explicit staged-rollout modes (docs/semantic-execution.md § Proof and rollout). */
export const SEMANTIC_RUNTIME_MODES = ["disabled", "shadow", "advisory", "admitted-execution"] as const;
export type SemanticRuntimeMode = (typeof SEMANTIC_RUNTIME_MODES)[number];

/** Default stays non-admitted until independent admission criteria are met. */
export const SEMANTIC_RUNTIME_DEFAULT_MODE: SemanticRuntimeMode = "shadow";

/** Docs / inventory hooks this rollout policy cites (do not replace). */
export const SEMANTIC_RUNTIME_SAFETY_DOCS_INVENTORY = [
  "docs/semantic-execution.md",
  "docs/decisions/0016-compiled-semantic-execution.md",
  "docs/plans/2026-09-17-compiled-semantic-execution.md",
  "docs/architecture-conformance.md",
] as const;

/** Existing owners composed for SQ-18 proof (extend; do not invent parallels). */
export const SEMANTIC_RUNTIME_SAFETY_OWNER_MODULES = [
  "kernel/services/feedback-to-work-shadow.ts",
  "kernel/services/inference-receipt-store.ts",
  "kernel/knowledge-service/semantic-graph-views.ts",
  "kernel/services/applicability-path-projection.ts",
  "catalog/workflows/feedback-to-work-shadow.ts",
  "contracts/semantic/receipts.ts",
] as const;

export interface SemanticRuntimeRolloutPolicy {
  readonly defaultMode: SemanticRuntimeMode;
  readonly keyInstalledImpliesLive: false;
  readonly autoProviderFallback: false;
  readonly newMetricsDaemon: false;
  readonly newAuthoritySystem: false;
  readonly modes: readonly SemanticRuntimeMode[];
  readonly docsInventory: readonly (typeof SEMANTIC_RUNTIME_SAFETY_DOCS_INVENTORY)[number][];
  readonly ownerModules: readonly (typeof SEMANTIC_RUNTIME_SAFETY_OWNER_MODULES)[number][];
}

export const SEMANTIC_RUNTIME_SAFETY_ROLLOUT_POLICY: SemanticRuntimeRolloutPolicy = {
  defaultMode: SEMANTIC_RUNTIME_DEFAULT_MODE,
  keyInstalledImpliesLive: false,
  autoProviderFallback: false,
  newMetricsDaemon: false,
  newAuthoritySystem: false,
  modes: [...SEMANTIC_RUNTIME_MODES],
  docsInventory: [...SEMANTIC_RUNTIME_SAFETY_DOCS_INVENTORY],
  ownerModules: [...SEMANTIC_RUNTIME_SAFETY_OWNER_MODULES],
};

/** True only if someone wrongly wired this rollout module into default workflows export. */
export function rolloutPolicyTouchesDefaultIndex(indexSource: string): boolean {
  return indexSource.includes("semantic-runtime-safety-rollout") && /export const workflows\s*=/.test(indexSource);
}
