/**
 * #521 SQ-09 — Manifest-backed method context / counterconditions / evidence /
 * intended intervention for context-bound knowledge applicability.
 *
 * Extends existing catalog recipe/capability/knowledge resource shapes — does
 * NOT invent a universal new document format or a second knowledge registry.
 * Coordinates closed #75 retrieval-eval posture; pure data + helpers only
 * (no filesystem, network, clock, or workspace I/O).
 *
 * Distinct from design-surface / onboarding applicability (U4 #70 lineage):
 * this is method-in-business-context applicability for semantic graph traversal.
 *
 * Consumes #518–#520. Does not implement #522–#529.
 * Jev decides (Choice/Score/Noul); LLM writes; code owns applicability checks.
 */

export const KNOWLEDGE_METHOD_APPLICABILITY_ISSUE = "#521" as const;
export const KNOWLEDGE_METHOD_APPLICABILITY_EPIC = "#511" as const;
export const KNOWLEDGE_METHOD_APPLICABILITY_STAMP = "0.221.42" as const;
export const KNOWLEDGE_METHOD_APPLICABILITY_SCHEMA_VERSION = 1 as const;
export const KNOWLEDGE_METHOD_APPLICABILITY_NO_NETWORK = true as const;
export const KNOWLEDGE_METHOD_APPLICABILITY_NO_REGISTRY = true as const;
export const KNOWLEDGE_METHOD_APPLICABILITY_COORDINATES_75 = true as const;

/** Permitted relation types for bounded beam expansion (narrow inventory). */
export const APPLICABILITY_RELATION_TYPES = ["applicableUnder", "evidenceSupports", "evidenceContradicts", "explainsAs", "requiresEvidence"] as const;
export type ApplicabilityRelationType = (typeof APPLICABILITY_RELATION_TYPES)[number];

/** Explanation families retained as competing paths (issue examples). */
export const EXPLANATION_FAMILIES = ["value-delay", "unexpected-offer", "wrong-journey", "implementation-defect", "unknown"] as const;
export type ExplanationFamily = (typeof EXPLANATION_FAMILIES)[number];

export type ProductStage = "discovery" | "activation" | "retention" | "monetization" | "post-purchase";

/**
 * Method resource pinned to existing catalog ownership (capability / recipe /
 * knowledge reference id). Fields encode context, counterconditions, necessary
 * evidence, and intended intervention without a new universal doc format.
 */
export interface MethodApplicabilityResource {
  readonly methodId: string;
  /** Catalog resource id this method attaches to (capability.*, recipe, or reference.*). */
  readonly catalogResourceId: string;
  readonly topic: string;
  readonly title: string;
  /** Stages / audiences / scopes where the method may apply. */
  readonly context: {
    readonly stages: readonly ProductStage[];
    readonly audiences: readonly string[];
    readonly scopes: readonly string[];
  };
  /**
   * When any countercondition holds in the query context, the method is
   * NOT applicable — even if the topic matches.
   */
  readonly counterconditions: readonly {
    readonly id: string;
    readonly description: string;
    /** Context key that, when present and equal to `equals`, violates. */
    readonly whenContextKey: string;
    readonly equals: string;
  }[];
  /** Evidence ids that must exist (via scoped selectors) before endorsement. */
  readonly necessaryEvidence: readonly string[];
  readonly intendedIntervention: {
    readonly kind: ExplanationFamily | "observation-request" | "retain-guidance";
    readonly summary: string;
  };
  /** Provider scope this method may speak for — never widens a selected binding. */
  readonly providerScope: {
    readonly selectedProviderIds: readonly string[];
    /** If true, method may only apply when query.selectedProviderId is in selectedProviderIds. */
    readonly bindToSelectedOnly: boolean;
  };
  readonly permittedRelationTypes: readonly ApplicabilityRelationType[];
}

/** Query-time business context snapshot (paper / synthetic). */
export interface BusinessContextSnapshot {
  readonly workspaceId: string;
  readonly productRevision: string;
  readonly stage: ProductStage;
  readonly audience: string;
  readonly scope: string;
  readonly selectedProviderId?: string;
  /** Key/value facts used to evaluate counterconditions (deterministic). */
  readonly facts: Readonly<Record<string, string>>;
  /** Evidence ids available via existing scoped selectors. */
  readonly availableEvidenceIds: readonly string[];
}

export type ApplicabilityJudgment =
  | {
      readonly status: "applicable";
      readonly methodId: string;
      readonly reason: string;
      readonly missingEvidence: readonly string[];
    }
  | {
      readonly status: "not_applicable";
      readonly methodId: string;
      readonly reason: "countercondition_violated" | "topic_mismatch" | "stage_mismatch" | "provider_scope_denied" | "audience_mismatch" | "scope_mismatch";
      readonly detail: string;
    }
  | {
      readonly status: "unresolved";
      readonly methodId: string;
      readonly reason: "unknown_applicability" | "missing_necessary_evidence" | "no_candidates";
      readonly detail: string;
      /** Required guidance stays unresolved — never excluded as least-bad endorsement. */
      readonly retainRequiredGuidance: true;
    };

/**
 * Pure applicability check over a single method + context.
 * Best Choice ≠ proof of applicability; unknown → unresolved (not least-bad).
 */
export function evaluateMethodApplicability(
  method: MethodApplicabilityResource,
  context: BusinessContextSnapshot,
  options?: { readonly topicQuery?: string },
): ApplicabilityJudgment {
  const topicQuery = options?.topicQuery?.trim().toLowerCase();
  if (topicQuery && !method.topic.toLowerCase().includes(topicQuery) && !topicQuery.includes(method.topic.toLowerCase())) {
    return {
      status: "not_applicable",
      methodId: method.methodId,
      reason: "topic_mismatch",
      detail: `topic ${method.topic} does not match query ${topicQuery}`,
    };
  }

  if (!method.context.stages.includes(context.stage)) {
    return {
      status: "not_applicable",
      methodId: method.methodId,
      reason: "stage_mismatch",
      detail: `stage ${context.stage} not in [${method.context.stages.join(",")}]`,
    };
  }

  if (method.context.audiences.length > 0 && !method.context.audiences.includes(context.audience)) {
    return {
      status: "not_applicable",
      methodId: method.methodId,
      reason: "audience_mismatch",
      detail: `audience ${context.audience} not in method audiences`,
    };
  }

  if (method.context.scopes.length > 0 && !method.context.scopes.includes(context.scope)) {
    return {
      status: "not_applicable",
      methodId: method.methodId,
      reason: "scope_mismatch",
      detail: `scope ${context.scope} not in method scopes`,
    };
  }

  // Counterconditions: matching topic still not applicable when violated.
  for (const cc of method.counterconditions) {
    const fact = context.facts[cc.whenContextKey];
    if (fact !== undefined && fact === cc.equals) {
      return {
        status: "not_applicable",
        methodId: method.methodId,
        reason: "countercondition_violated",
        detail: `${cc.id}: ${cc.description}`,
      };
    }
  }

  // Selected-provider procedures must not be replaced by unselected-provider guidance.
  if (method.providerScope.bindToSelectedOnly) {
    const selected = context.selectedProviderId;
    if (!selected) {
      return {
        status: "unresolved",
        methodId: method.methodId,
        reason: "unknown_applicability",
        detail: "selectedProviderId absent; cannot bind method to provider scope",
        retainRequiredGuidance: true,
      };
    }
    if (!method.providerScope.selectedProviderIds.includes(selected)) {
      return {
        status: "not_applicable",
        methodId: method.methodId,
        reason: "provider_scope_denied",
        detail: `method providerScope [${method.providerScope.selectedProviderIds.join(",")}] excludes selected ${selected}`,
      };
    }
  }

  const missingEvidence = method.necessaryEvidence.filter((id) => !context.availableEvidenceIds.includes(id));
  if (missingEvidence.length > 0) {
    return {
      status: "unresolved",
      methodId: method.methodId,
      reason: "missing_necessary_evidence",
      detail: `missing evidence: ${missingEvidence.join(",")}`,
      retainRequiredGuidance: true,
    };
  }

  return {
    status: "applicable",
    methodId: method.methodId,
    reason: "context and counterconditions satisfied; necessary evidence present",
    missingEvidence: [],
  };
}

/**
 * Evaluate a bounded candidate set. No-match → none/unknown (never least-bad endorsement).
 */
export function evaluateBoundedCandidates(input: {
  readonly methods: readonly MethodApplicabilityResource[];
  readonly context: BusinessContextSnapshot;
  readonly topicQuery?: string;
  readonly maxCandidates?: number;
}): {
  readonly applicable: readonly ApplicabilityJudgment[];
  readonly notApplicable: readonly ApplicabilityJudgment[];
  readonly unresolved: readonly ApplicabilityJudgment[];
  readonly endorsement: "none" | "unknown" | "applicable_set";
  readonly leastBadRejected: true;
} {
  const cap = input.maxCandidates ?? input.methods.length;
  const bounded = input.methods.slice(0, Math.max(0, cap));
  const applicable: ApplicabilityJudgment[] = [];
  const notApplicable: ApplicabilityJudgment[] = [];
  const unresolved: ApplicabilityJudgment[] = [];

  for (const method of bounded) {
    const judgment = evaluateMethodApplicability(method, input.context, { topicQuery: input.topicQuery });
    if (judgment.status === "applicable") applicable.push(judgment);
    else if (judgment.status === "not_applicable") notApplicable.push(judgment);
    else unresolved.push(judgment);
  }

  let endorsement: "none" | "unknown" | "applicable_set" = "none";
  if (applicable.length > 0) endorsement = "applicable_set";
  else if (unresolved.length > 0 || bounded.length === 0) endorsement = "unknown";
  else endorsement = "none";

  return {
    applicable,
    notApplicable,
    unresolved,
    endorsement,
    leastBadRejected: true,
  };
}

/** Synthetic paper catalog methods used by fixtures (not a live registry). */
export const FIXTURE_METHOD_CATALOG: readonly MethodApplicabilityResource[] = [
  {
    methodId: "method.value-delay-activation",
    catalogResourceId: "capability.retention-intervention",
    topic: "activation-dropoff",
    title: "Value delay after activation",
    context: {
      stages: ["activation", "retention"],
      audiences: ["consumer"],
      scopes: ["onboarding", "first-session"],
    },
    counterconditions: [
      {
        id: "cc.paywall-already-shown",
        description: "Hard paywall already shown this session — value-delay framing does not apply",
        whenContextKey: "paywallShown",
        equals: "true",
      },
    ],
    necessaryEvidence: ["evidence.first-value-event", "evidence.session-timeline"],
    intendedIntervention: {
      kind: "value-delay",
      summary: "Bring first value earlier in the journey",
    },
    providerScope: { selectedProviderIds: [], bindToSelectedOnly: false },
    permittedRelationTypes: ["applicableUnder", "explainsAs", "evidenceSupports", "requiresEvidence"],
  },
  {
    methodId: "method.unexpected-offer",
    catalogResourceId: "capability.retention-intervention",
    topic: "activation-dropoff",
    title: "Unexpected offer mid-journey",
    context: {
      stages: ["activation", "monetization"],
      audiences: ["consumer"],
      scopes: ["onboarding", "paywall"],
    },
    counterconditions: [
      {
        id: "cc.no-monetization-selected",
        description: "No monetization binding selected",
        whenContextKey: "monetizationSelected",
        equals: "false",
      },
    ],
    necessaryEvidence: ["evidence.offer-impression", "evidence.session-timeline"],
    intendedIntervention: {
      kind: "unexpected-offer",
      summary: "Delay or contextualize the offer relative to first value",
    },
    providerScope: {
      selectedProviderIds: ["b2c/revenuecat"],
      bindToSelectedOnly: true,
    },
    permittedRelationTypes: ["applicableUnder", "explainsAs", "evidenceSupports", "requiresEvidence"],
  },
  {
    methodId: "method.wrong-journey",
    catalogResourceId: "capability.product-experience",
    topic: "activation-dropoff",
    title: "Wrong journey path",
    context: {
      stages: ["activation", "discovery"],
      audiences: ["consumer"],
      scopes: ["onboarding"],
    },
    counterconditions: [],
    necessaryEvidence: ["evidence.journey-graph", "evidence.session-timeline"],
    intendedIntervention: {
      kind: "wrong-journey",
      summary: "Realign onboarding path to the acquisition promise",
    },
    providerScope: { selectedProviderIds: [], bindToSelectedOnly: false },
    permittedRelationTypes: ["applicableUnder", "explainsAs", "evidenceSupports", "evidenceContradicts"],
  },
  {
    methodId: "method.implementation-defect",
    catalogResourceId: "capability.product-experience",
    topic: "activation-dropoff",
    title: "Implementation defect",
    context: {
      stages: ["activation", "retention"],
      audiences: ["consumer"],
      scopes: ["onboarding", "first-session"],
    },
    counterconditions: [],
    necessaryEvidence: ["evidence.error-receipt", "evidence.session-timeline"],
    intendedIntervention: {
      kind: "implementation-defect",
      summary: "Repair a concrete implementation defect blocking first value",
    },
    providerScope: { selectedProviderIds: [], bindToSelectedOnly: false },
    permittedRelationTypes: ["applicableUnder", "explainsAs", "evidenceSupports", "evidenceContradicts"],
  },
  {
    methodId: "method.unrelated-aso",
    catalogResourceId: "capability.store-presence",
    topic: "aso-keyword-density",
    title: "ASO keyword method (unrelated topic)",
    context: {
      stages: ["discovery"],
      audiences: ["consumer"],
      scopes: ["store-listing"],
    },
    counterconditions: [],
    necessaryEvidence: ["evidence.aso-corpus"],
    intendedIntervention: {
      kind: "retain-guidance",
      summary: "ASO guidance — not an activation explanation",
    },
    providerScope: { selectedProviderIds: [], bindToSelectedOnly: false },
    permittedRelationTypes: ["applicableUnder", "requiresEvidence"],
  },
] as const;
