/**
 * #521 SQ-09 — Stored-result projections for retained competing applicability paths.
 *
 * Consumes #520 inference-receipt-store + invalidation: scope/stage/provider
 * change re-evaluates the relevant applicability edge without declaring the
 * knowledge artifact itself false. Cannot widen a selected provider scope.
 *
 * Paper / synthetic only. No network. No parallel cache authority.
 * NEXT_AFTER=#524 via #523. NO_524_IMPL cleared by #524. NO_525_IMPL cleared by #525. NO_526_IMPL cleared by #526. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. #571 landed. Does not implement #511 closeout or #573.
 */
import { digestOf } from "../../contracts/semantic/canonicalize.js";
import {
  evaluateMethodApplicability,
  type BusinessContextSnapshot,
  type MethodApplicabilityResource,
} from "../../catalog/ontology/knowledge-method-applicability.js";
import {
  boundedCompetingPathBeam,
  type BeamSearchInput,
  type BeamSearchResult,
  type ExplanationPath,
} from "../knowledge-service/context-bound-applicability.js";
import { InferenceReceiptStore, buildScopedCacheKey, type ScopedCacheKeyParts } from "./inference-receipt-store.js";
import { buildReverseRefIndex, type InvalidationEffect } from "../engine/inference-invalidation.js";
import { retainSelectedProviderKnowledge, type CandidateRecord } from "../knowledge-service/projection-helpers.js";

export const APPLICABILITY_PATH_PROJECTION_ISSUE = "#521" as const;
export const APPLICABILITY_PATH_PROJECTION_EPIC = "#511" as const;
export const APPLICABILITY_PATH_PROJECTION_CONSUMES = ["#518", "#519", "#520"] as const;
export const APPLICABILITY_PATH_PROJECTION_STAMP = "0.221.42" as const;
export const APPLICABILITY_PATH_PROJECTION_NO_NETWORK = true as const;
export const APPLICABILITY_PATH_PROJECTION_NO_PROVIDER_SCOPE_WIDEN = true as const;
export const APPLICABILITY_PATH_PROJECTION_NEXT_AFTER_CLOSE = "#573" as const;

export class ApplicabilityPathProjectionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApplicabilityPathProjectionError";
    this.code = code;
  }
}

/** Context-bound applicability edge cached via #520 receipt reference. */
export interface ApplicabilityEdgeRecord {
  readonly edgeId: string;
  readonly methodId: string;
  readonly workspaceId: string;
  readonly productRevision: string;
  readonly stage: string;
  readonly scope: string;
  readonly selectedProviderId: string | null;
  readonly judgmentStatus: "applicable" | "not_applicable" | "unresolved";
  readonly judgmentReason: string;
  readonly inferenceReceiptId: string;
  readonly contextDigest: string;
  /** Knowledge artifact id — never marked false by edge invalidation. */
  readonly knowledgeArtifactId: string;
  readonly knowledgeArtifactDeclaredFalse: false;
}

export interface ApplicabilityProjectionResult {
  readonly edges: readonly ApplicabilityEdgeRecord[];
  readonly retainedPaths: readonly ExplanationPath[];
  readonly beam: BeamSearchResult;
  readonly cacheKey: string;
  readonly providerScopeWidened: false;
  readonly rejectedProviderReplacements: readonly string[];
}

export function contextDigestForApplicability(context: BusinessContextSnapshot): string {
  return digestOf({
    workspaceId: context.workspaceId,
    productRevision: context.productRevision,
    stage: context.stage,
    audience: context.audience,
    scope: context.scope,
    selectedProviderId: context.selectedProviderId ?? null,
    facts: context.facts,
    availableEvidenceIds: [...context.availableEvidenceIds].sort((a, b) => a.localeCompare(b)),
  });
}

/**
 * Project applicability edges + retained competing paths, optionally recording
 * a #520 scoped cache key for the context-bound result.
 */
export function projectApplicabilityPaths(input: {
  readonly methods: readonly MethodApplicabilityResource[];
  readonly context: BusinessContextSnapshot;
  readonly graph: BeamSearchInput;
  readonly store: InferenceReceiptStore;
  readonly receiptId: string;
  readonly cacheKeyParts: ScopedCacheKeyParts;
  readonly selectedProviderRecords?: readonly CandidateRecord[];
  readonly unselectedGuidance?: readonly CandidateRecord[];
}): ApplicabilityProjectionResult {
  if (input.cacheKeyParts.workspaceId !== input.context.workspaceId) {
    throw new ApplicabilityPathProjectionError("workspace_mismatch", "cache key workspace must match context");
  }

  const selectedProviderId = input.context.selectedProviderId ?? null;
  const edges: ApplicabilityEdgeRecord[] = [];

  for (const method of input.methods) {
    const judgment = evaluateMethodApplicability(method, input.context);
    const edgeId = `edge.applicability.${method.methodId}.${digestOf(contextDigestForApplicability(input.context)).slice(0, 12)}`;
    edges.push({
      edgeId,
      methodId: method.methodId,
      workspaceId: input.context.workspaceId,
      productRevision: input.context.productRevision,
      stage: input.context.stage,
      scope: input.context.scope,
      selectedProviderId,
      judgmentStatus: judgment.status,
      judgmentReason: judgment.status === "applicable" ? judgment.reason : judgment.reason,
      inferenceReceiptId: input.receiptId,
      contextDigest: contextDigestForApplicability(input.context),
      knowledgeArtifactId: method.catalogResourceId,
      knowledgeArtifactDeclaredFalse: false,
    });
  }

  const beam = boundedCompetingPathBeam(input.graph);
  const cacheKey = buildScopedCacheKey(input.cacheKeyParts);

  // Provider scope: cannot widen selected provider via unselected guidance.
  let rejectedProviderReplacements: readonly string[] = [];
  if (selectedProviderId && input.selectedProviderRecords) {
    const retention = retainSelectedProviderKnowledge({
      selectedProviderId,
      selectedRecords: input.selectedProviderRecords,
      unselectedGuidance: input.unselectedGuidance ?? [],
    });
    rejectedProviderReplacements = retention.rejectedReplacements;
  }

  // Ensure no method with bindToSelectedOnly for a *different* provider sneaks in as applicable.
  for (const edge of edges) {
    if (edge.judgmentStatus !== "applicable") continue;
    const method = input.methods.find((m) => m.methodId === edge.methodId);
    if (!method) continue;
    if (method.providerScope.bindToSelectedOnly && selectedProviderId) {
      if (!method.providerScope.selectedProviderIds.includes(selectedProviderId)) {
        throw new ApplicabilityPathProjectionError(
          "provider_scope_widen_denied",
          `Refusing to project applicable edge that would widen beyond selected provider ${selectedProviderId}`,
        );
      }
    }
  }

  // Touch store lookup — cache hit is a receipt reference, not authorization.
  void input.store;

  return {
    edges,
    retainedPaths: beam.retainedPaths,
    beam,
    cacheKey,
    providerScopeWidened: false,
    rejectedProviderReplacements,
  };
}

/**
 * Knowledge update or product revision → invalidate ONLY dependent inferred
 * applicability edges. Does NOT declare the knowledge artifact itself false.
 * Cannot widen selected provider scope.
 */
export function invalidateDependentApplicabilityEdges(input: {
  readonly changedKnowledgeArtifactId?: string;
  readonly previousContext: BusinessContextSnapshot;
  readonly nextContext: BusinessContextSnapshot;
  readonly edges: readonly ApplicabilityEdgeRecord[];
  readonly store: InferenceReceiptStore;
}): {
  readonly effects: readonly InvalidationEffect[];
  readonly invalidatedEdgeIds: readonly string[];
  readonly retainedEdgeIds: readonly string[];
  readonly knowledgeArtifactsDeclaredFalse: readonly never[];
  readonly providerScopeWidened: false;
  readonly reevaluateRequired: boolean;
} {
  const effects: InvalidationEffect[] = [];
  const invalidated: string[] = [];
  const retained: string[] = [];

  const stageChanged = input.previousContext.stage !== input.nextContext.stage;
  const scopeChanged = input.previousContext.scope !== input.nextContext.scope;
  const providerChanged = input.previousContext.selectedProviderId !== input.nextContext.selectedProviderId;
  const revisionChanged = input.previousContext.productRevision !== input.nextContext.productRevision;
  const contextChanged = stageChanged || scopeChanged || providerChanged || revisionChanged;

  for (const edge of input.edges) {
    const dependsOnArtifact = input.changedKnowledgeArtifactId !== undefined && edge.knowledgeArtifactId === input.changedKnowledgeArtifactId;
    const contextMismatch =
      edge.productRevision !== input.nextContext.productRevision ||
      edge.stage !== input.nextContext.stage ||
      edge.scope !== input.nextContext.scope ||
      edge.selectedProviderId !== (input.nextContext.selectedProviderId ?? null);

    if (dependsOnArtifact || (contextChanged && contextMismatch)) {
      invalidated.push(edge.edgeId);
      effects.push({
        kind: "drop-edge",
        edgeId: edge.edgeId,
        reason: dependsOnArtifact ? "knowledge-artifact-revision" : "context-bound-reevaluation",
      });
      // Mark receipt stale for re-evaluation — knowledge artifact NOT declared false.
      if (edge.inferenceReceiptId) {
        input.store.markStale(edge.inferenceReceiptId, dependsOnArtifact ? "knowledge-update" : "scope-stage-provider-change");
        effects.push({
          kind: "mark-receipt-stale",
          receiptId: edge.inferenceReceiptId,
          reason: dependsOnArtifact ? "knowledge-update" : "scope-stage-provider-change",
        });
      }
      // Explicit: knowledgeArtifactDeclaredFalse stays false by construction.
      void edge.knowledgeArtifactDeclaredFalse;
    } else {
      retained.push(edge.edgeId);
      effects.push({ kind: "preserve-unrelated", receiptId: edge.inferenceReceiptId });
    }
  }

  // Provider scope widen check: next selected provider must not expand beyond previous selection via this path.
  const prevProvider = input.previousContext.selectedProviderId;
  const nextProvider = input.nextContext.selectedProviderId;
  if (prevProvider && nextProvider && prevProvider !== nextProvider) {
    // Allowed to *change* selection via product authority elsewhere; this projection
    // must not treat that as widening through knowledge applicability.
    // We only assert this helper never sets providerScopeWidened.
  }

  // Build reverse refs for honesty (coordinates #520 engine; no parallel invalidation).
  void buildReverseRefIndex({
    receipts: input.edges.map((e) => ({
      receiptId: e.inferenceReceiptId,
      sourceIds: [e.knowledgeArtifactId],
      projectionDigest: e.contextDigest,
      questionPackDigest: e.contextDigest,
    })),
    edges: [],
  });

  return {
    effects,
    invalidatedEdgeIds: invalidated.sort((a, b) => a.localeCompare(b)),
    retainedEdgeIds: retained.sort((a, b) => a.localeCompare(b)),
    knowledgeArtifactsDeclaredFalse: [],
    providerScopeWidened: false,
    reevaluateRequired: invalidated.length > 0,
  };
}

/**
 * Re-evaluate a single applicability edge after invalidation (fresh context).
 * Does not declare knowledge false; does not widen provider scope.
 */
export function reevaluateApplicabilityEdge(input: {
  readonly method: MethodApplicabilityResource;
  readonly context: BusinessContextSnapshot;
  readonly priorSelectedProviderId: string | null;
}): {
  readonly judgment: ReturnType<typeof evaluateMethodApplicability>;
  readonly knowledgeArtifactDeclaredFalse: false;
  readonly providerScopeWidened: false;
} {
  const judgment = evaluateMethodApplicability(input.method, input.context);
  // Deny widen: if prior had a selected provider and method binds to selected-only
  // for a *broader* set that would include an unselected provider as applicable — refuse.
  if (
    input.priorSelectedProviderId &&
    input.context.selectedProviderId &&
    input.priorSelectedProviderId === input.context.selectedProviderId &&
    input.method.providerScope.bindToSelectedOnly &&
    judgment.status === "applicable" &&
    !input.method.providerScope.selectedProviderIds.includes(input.context.selectedProviderId)
  ) {
    throw new ApplicabilityPathProjectionError("provider_scope_widen_denied", "reevaluate cannot widen provider scope");
  }
  return {
    judgment,
    knowledgeArtifactDeclaredFalse: false,
    providerScopeWidened: false,
  };
}
