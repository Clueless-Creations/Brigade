/**
 * #527 SQ-15 — Source-backed opportunity research via semantic map-reduce.
 *
 * Map authorized passages → explicit observations (source id, date, context,
 * population if stated, workaround, reported cost/frustration). Never infer
 * WTP or demographics. Bounded joins for shared mechanisms; keep originals +
 * counterexamples. Deterministic exact-dup / syndicated-quote detection;
 * uncertain independence marks; page counts ≠ independent customers.
 * Mechanism×problem matrices; concept proposals; flag fit / unresolved
 * assumptions / recreating undesirable compromises / counterconditions.
 * Source-backed hypotheses via existing research/product-decision path —
 * no product-pick authority. Incomplete corpus ≠ complete market claim.
 * Hypotheses never change scope, allocate spend, or start collection.
 *
 * Paper / synthetic. Consumes #514+#518+#519+#521+#520+#523.
 * Coordinates #75/#74. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. Does not implement #511 closeout or #573.
 */
import {
  CONCEPT_FLAG_KINDS,
  INDEPENDENCE_MARKS,
  OPPORTUNITY_RESEARCH_RECIPE_POLICY,
  type ConceptFlagKind,
  type CorpusCompleteness,
  type IndependenceMark,
  type OpportunityResearchRecipePolicy,
} from "../../catalog/workflows/opportunity-research-map-reduce.js";

export const OPPORTUNITY_RESEARCH_ISSUE = "#527" as const;
export const OPPORTUNITY_RESEARCH_EPIC = "#511" as const;
export const OPPORTUNITY_RESEARCH_PLANNING_ID = "SQ-15" as const;
export const OPPORTUNITY_RESEARCH_CONSUMES = ["#514", "#518", "#519", "#521", "#520", "#523"] as const;
export const OPPORTUNITY_RESEARCH_COORDINATES = ["#75", "#74"] as const;
export const OPPORTUNITY_RESEARCH_STAMP = "0.221.48" as const;
export const OPPORTUNITY_RESEARCH_SCHEMA_VERSION = 1 as const;
export const OPPORTUNITY_RESEARCH_NO_NETWORK = true as const;
export const OPPORTUNITY_RESEARCH_NO_SCRAPE = true as const;
export const OPPORTUNITY_RESEARCH_NO_NEW_RESEARCH_DB = true as const;
export const OPPORTUNITY_RESEARCH_NO_PRODUCT_PICK = true as const;
export const OPPORTUNITY_RESEARCH_NO_MARKET_SUCCESS_PREDICTION = true as const;
export const OPPORTUNITY_RESEARCH_NO_UNSOURCED_TAM = true as const;
export const OPPORTUNITY_RESEARCH_NO_CUSTOMER_PII = true as const;
export const OPPORTUNITY_RESEARCH_NO_FOUNDER_BUSINESS_SELECTION = true as const;
export const OPPORTUNITY_RESEARCH_REPETITION_IS_NOT_DEMAND = true as const;
export const OPPORTUNITY_RESEARCH_PAGE_COUNTS_ARE_NOT_CUSTOMERS = true as const;
export const OPPORTUNITY_RESEARCH_NO_527_IMPL = false as const;
export const OPPORTUNITY_RESEARCH_NEXT_AFTER_CLOSE = "#511" as const;

export { CONCEPT_FLAG_KINDS, INDEPENDENCE_MARKS, OPPORTUNITY_RESEARCH_RECIPE_POLICY };
export type { ConceptFlagKind, CorpusCompleteness, IndependenceMark, OpportunityResearchRecipePolicy };

export class OpportunityResearchError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "OpportunityResearchError";
    this.code = code;
  }
}

/** Authorized corpus passage — already collected; this slice does not scrape. */
export interface ResearchPassage {
  readonly passageId: string;
  readonly sourceId: string;
  readonly sourceChainId: string;
  readonly text: string;
  readonly date: string | null;
  readonly context: string;
  readonly population: string | null;
  readonly workaround: string | null;
  readonly reportedCostOrFrustration: string | null;
  readonly quotedText: string | null;
  readonly pageCount: number | null;
  readonly problemKey: string;
  readonly mechanismKey: string;
}

export interface ExplicitObservation {
  readonly observationId: string;
  readonly passageId: string;
  readonly sourceId: string;
  readonly sourceChainId: string;
  readonly date: string | null;
  readonly context: string;
  readonly population: string | null;
  readonly workaround: string | null;
  readonly reportedCostOrFrustration: string | null;
  readonly problemKey: string;
  readonly mechanismKey: string;
  readonly inferredWtp: false;
  readonly inferredDemographics: false;
  readonly pageCountAsCustomers: false;
}

export interface IndependenceAssessment {
  readonly observationId: string;
  readonly mark: IndependenceMark;
  readonly pairedWith: readonly string[];
  readonly reason: string;
}

export interface MechanismJoin {
  readonly joinId: string;
  readonly mechanismKey: string;
  readonly problemKey: string;
  readonly observationIds: readonly string[];
  readonly counterexampleObservationIds: readonly string[];
  readonly originalsPreserved: true;
}

export interface MechanismProblemCell {
  readonly mechanismKey: string;
  readonly problemKey: string;
  readonly supportingObservationIds: readonly string[];
  readonly conflictingObservationIds: readonly string[];
  readonly independentDemandCount: number;
  readonly syndicatedChainCount: number;
}

export interface ProposedConcept {
  readonly conceptId: string;
  readonly label: string;
  readonly mechanismKey: string;
  readonly problemKey: string;
  readonly recreatesCompromises: readonly string[];
  readonly assumptions: readonly string[];
  readonly counterconditions: readonly string[];
}

export interface ConceptFlag {
  readonly flagId: string;
  readonly conceptId: string;
  readonly kind: ConceptFlagKind;
  readonly evidenceObservationIds: readonly string[];
  readonly summary: string;
}

export interface OpportunityHypothesis {
  readonly hypothesisId: string;
  readonly statement: string;
  readonly supportingObservationIds: readonly string[];
  readonly conflictingObservationIds: readonly string[];
  readonly coverageNote: string;
  readonly nextTest: string;
  readonly decisionPath: "existing_research_product_decision";
  readonly productPickAuthority: false;
  readonly changesAcceptedScope: false;
  readonly allocatesTrafficOrSpend: false;
  readonly startsExternalCollection: false;
  readonly completeMarketClaim: false;
}

export interface CorpusAssessment {
  readonly completeness: CorpusCompleteness;
  readonly missingDatesRemainUnknown: true;
  readonly missingPopulationsRemainUnknown: true;
  readonly completeMarketClaimAllowed: false;
  readonly reason: string;
}

export interface AuthorityBoundary {
  readonly changesAcceptedScope: false;
  readonly allocatesTrafficOrSpend: false;
  readonly startsExternalCollection: false;
  readonly productPickAuthority: false;
  readonly scrape: false;
  readonly reason: string;
}

export interface MapReduceResult {
  readonly observations: readonly ExplicitObservation[];
  readonly independence: readonly IndependenceAssessment[];
  readonly joins: readonly MechanismJoin[];
  readonly matrix: readonly MechanismProblemCell[];
  readonly conceptFlags: readonly ConceptFlag[];
  readonly hypotheses: readonly OpportunityHypothesis[];
  readonly corpus: CorpusAssessment;
  readonly authority: AuthorityBoundary;
  readonly independentDemandObservationCount: number;
  readonly sourceChainCount: number;
  readonly repetitionProvesDemand: false;
  readonly networkCalls: 0;
}

function normalizeQuote(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapPassagesToObservations(passages: readonly ResearchPassage[]): ExplicitObservation[] {
  return passages.map((p) => ({
    observationId: `obs.${p.passageId}`,
    passageId: p.passageId,
    sourceId: p.sourceId,
    sourceChainId: p.sourceChainId,
    date: p.date,
    context: p.context,
    population: p.population,
    workaround: p.workaround,
    reportedCostOrFrustration: p.reportedCostOrFrustration,
    problemKey: p.problemKey,
    mechanismKey: p.mechanismKey,
    inferredWtp: false as const,
    inferredDemographics: false as const,
    pageCountAsCustomers: false as const,
  }));
}

export function assessIndependence(passages: readonly ResearchPassage[], observations: readonly ExplicitObservation[]): IndependenceAssessment[] {
  const byPassage = new Map(passages.map((p) => [p.passageId, p]));
  const quoteIndex = new Map<string, string[]>();
  for (const p of passages) {
    if (!p.quotedText) continue;
    const key = normalizeQuote(p.quotedText);
    if (!key) continue;
    const list = quoteIndex.get(key) ?? [];
    list.push(p.passageId);
    quoteIndex.set(key, list);
  }
  const chainGroups = new Map<string, string[]>();
  for (const obs of observations) {
    const list = chainGroups.get(obs.sourceChainId) ?? [];
    list.push(obs.observationId);
    chainGroups.set(obs.sourceChainId, list);
  }
  return observations.map((obs) => {
    const passage = byPassage.get(obs.passageId)!;
    const chainPeers = (chainGroups.get(obs.sourceChainId) ?? []).filter((id) => id !== obs.observationId);
    if (chainPeers.length > 0) {
      return {
        observationId: obs.observationId,
        mark: "syndicated_same_chain" as const,
        pairedWith: chainPeers,
        reason: `Same source chain ${obs.sourceChainId}; repetition is not independent demand.`,
      };
    }
    if (passage.quotedText) {
      const key = normalizeQuote(passage.quotedText);
      const quotePeers = (quoteIndex.get(key) ?? []).filter((pid) => pid !== passage.passageId).map((pid) => `obs.${pid}`);
      if (quotePeers.length > 0) {
        return {
          observationId: obs.observationId,
          mark: "exact_duplicate" as const,
          pairedWith: quotePeers,
          reason: "Identical syndicated/quoted evidence detected deterministically.",
        };
      }
    }
    return {
      observationId: obs.observationId,
      mark: "independent" as const,
      pairedWith: [],
      reason: "No syndication/dup signal; page counts (if any) are ignored as customer evidence.",
    };
  });
}

export function joinSharedMechanisms(
  observations: readonly ExplicitObservation[],
  maxFanout: number = OPPORTUNITY_RESEARCH_RECIPE_POLICY.maxJoinFanout,
): MechanismJoin[] {
  const groups = new Map<string, ExplicitObservation[]>();
  for (const obs of observations) {
    const key = `${obs.mechanismKey}::${obs.problemKey}`;
    const list = groups.get(key) ?? [];
    list.push(obs);
    groups.set(key, list);
  }
  const joins: MechanismJoin[] = [];
  for (const [key, members] of [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const [mechanismKey, problemKey] = key.split("::") as [string, string];
    const primary = members.slice(0, maxFanout);
    const counterexamples = observations.filter(
      (o) =>
        o.mechanismKey === mechanismKey &&
        (o.problemKey !== problemKey || /contradict|opposite|however|but not/i.test(o.context)) &&
        !primary.some((p) => p.observationId === o.observationId),
    );
    joins.push({
      joinId: `join.${mechanismKey}.${problemKey}`,
      mechanismKey,
      problemKey,
      observationIds: primary.map((o) => o.observationId),
      counterexampleObservationIds: counterexamples.map((o) => o.observationId),
      originalsPreserved: true,
    });
  }
  return joins;
}

export function compileMechanismProblemMatrix(
  observations: readonly ExplicitObservation[],
  independence: readonly IndependenceAssessment[],
): MechanismProblemCell[] {
  const markByObs = new Map(independence.map((i) => [i.observationId, i.mark]));
  const cells = new Map<string, MechanismProblemCell>();
  for (const obs of observations) {
    const key = `${obs.mechanismKey}::${obs.problemKey}`;
    const existing = cells.get(key) ?? {
      mechanismKey: obs.mechanismKey,
      problemKey: obs.problemKey,
      supportingObservationIds: [] as string[],
      conflictingObservationIds: [] as string[],
      independentDemandCount: 0,
      syndicatedChainCount: 0,
    };
    const mark = markByObs.get(obs.observationId) ?? "uncertain_independence";
    const conflicting = observations
      .filter(
        (o) =>
          o.mechanismKey === obs.mechanismKey &&
          o.problemKey === obs.problemKey &&
          o.context !== obs.context &&
          /contradict|opposite|however|but not/i.test(o.context),
      )
      .map((o) => o.observationId);
    cells.set(key, {
      mechanismKey: obs.mechanismKey,
      problemKey: obs.problemKey,
      supportingObservationIds: [...existing.supportingObservationIds, obs.observationId],
      conflictingObservationIds: [...new Set([...existing.conflictingObservationIds, ...conflicting])],
      independentDemandCount: existing.independentDemandCount + (mark === "independent" ? 1 : 0),
      syndicatedChainCount: existing.syndicatedChainCount + (mark === "syndicated_same_chain" || mark === "exact_duplicate" ? 1 : 0),
    });
  }
  return [...cells.values()].sort((a, b) => `${a.mechanismKey}:${a.problemKey}`.localeCompare(`${b.mechanismKey}:${b.problemKey}`));
}

export function flagConcepts(concepts: readonly ProposedConcept[], observations: readonly ExplicitObservation[]): ConceptFlag[] {
  const flags: ConceptFlag[] = [];
  for (const concept of concepts) {
    for (const compromise of concept.recreatesCompromises) {
      const evidence = observations.filter(
        (o) =>
          (o.workaround !== null && o.workaround.toLowerCase().includes(compromise.toLowerCase())) ||
          (o.reportedCostOrFrustration !== null && o.reportedCostOrFrustration.toLowerCase().includes(compromise.toLowerCase())),
      );
      if (evidence.length > 0) {
        flags.push({
          flagId: `flag.${concept.conceptId}.compromise`,
          conceptId: concept.conceptId,
          kind: "recreates_undesirable_compromise",
          evidenceObservationIds: evidence.map((e) => e.observationId),
          summary: `Concept recreates reported undesirable compromise "${compromise}".`,
        });
      }
    }
    for (const [idx, assumption] of concept.assumptions.entries()) {
      flags.push({
        flagId: `flag.${concept.conceptId}.assumption.${idx}`,
        conceptId: concept.conceptId,
        kind: "unresolved_assumption",
        evidenceObservationIds: [],
        summary: `Unresolved assumption: ${assumption}`,
      });
    }
    for (const [idx, counter] of concept.counterconditions.entries()) {
      const evidence = observations.filter((o) => o.context.toLowerCase().includes(counter.toLowerCase()));
      flags.push({
        flagId: `flag.${concept.conceptId}.counter.${idx}`,
        conceptId: concept.conceptId,
        kind: "countercondition",
        evidenceObservationIds: evidence.map((e) => e.observationId),
        summary: `Countercondition present in corpus: ${counter}`,
      });
    }
    const fitObs = observations.filter((o) => o.mechanismKey === concept.mechanismKey && o.problemKey === concept.problemKey);
    if (fitObs.length === 0) {
      flags.push({
        flagId: `flag.${concept.conceptId}.fit`,
        conceptId: concept.conceptId,
        kind: "fit",
        evidenceObservationIds: [],
        summary: "No supporting observations for claimed mechanism×problem fit.",
      });
    }
  }
  return flags;
}

export function assessCorpus(observations: readonly ExplicitObservation[]): CorpusAssessment {
  const missingDates = observations.some((o) => o.date === null);
  const missingPopulations = observations.some((o) => o.population === null);
  const empty = observations.length === 0;
  if (empty || missingDates || missingPopulations) {
    return {
      completeness: empty ? "unknown" : "incomplete",
      missingDatesRemainUnknown: true,
      missingPopulationsRemainUnknown: true,
      completeMarketClaimAllowed: false,
      reason: empty
        ? "Empty corpus cannot support a complete market claim."
        : "Missing dates and/or populations remain unknown; incomplete corpus cannot yield a complete market claim.",
    };
  }
  return {
    completeness: "complete_enough_for_hypotheses",
    missingDatesRemainUnknown: true,
    missingPopulationsRemainUnknown: true,
    completeMarketClaimAllowed: false,
    reason: "Corpus is complete enough for source-backed hypotheses; still not a complete market claim.",
  };
}

export function buildHypotheses(
  independence: readonly IndependenceAssessment[],
  matrix: readonly MechanismProblemCell[],
  corpus: CorpusAssessment,
): OpportunityHypothesis[] {
  const markByObs = new Map(independence.map((i) => [i.observationId, i.mark]));
  return matrix.map((cell) => {
    const independentSupport = cell.supportingObservationIds.filter((id) => markByObs.get(id) === "independent");
    const support = independentSupport.length > 0 ? independentSupport : cell.supportingObservationIds.slice(0, 1);
    return {
      hypothesisId: `hyp.${cell.mechanismKey}.${cell.problemKey}`,
      statement: `Mechanism "${cell.mechanismKey}" may address problem "${cell.problemKey}" (source-backed; repetition ≠ demand).`,
      supportingObservationIds: support,
      conflictingObservationIds: cell.conflictingObservationIds,
      coverageNote:
        corpus.completeness === "complete_enough_for_hypotheses"
          ? "Partial coverage of authorized corpus; not a complete market claim."
          : "Corpus incomplete; hypothesis is provisional and cannot claim a complete market.",
      nextTest: "Design a bounded validation that cites supporting + conflicting observations without new scrape authority.",
      decisionPath: "existing_research_product_decision" as const,
      productPickAuthority: false as const,
      changesAcceptedScope: false as const,
      allocatesTrafficOrSpend: false as const,
      startsExternalCollection: false as const,
      completeMarketClaim: false as const,
    };
  });
}

export function assertAuthorityBoundary(): AuthorityBoundary {
  return {
    changesAcceptedScope: false,
    allocatesTrafficOrSpend: false,
    startsExternalCollection: false,
    productPickAuthority: false,
    scrape: false,
    reason:
      "Hypotheses are advisory packets for the existing research/product-decision path; they do not change accepted product scope, allocate traffic/spend, start external collection, pick a product, or scrape.",
  };
}

export function countIndependentDemand(
  independence: readonly IndependenceAssessment[],
  observations: readonly ExplicitObservation[],
): { independentDemandObservationCount: number; sourceChainCount: number } {
  const chains = new Set(observations.map((o) => o.sourceChainId));
  const obsById = new Map(observations.map((o) => [o.observationId, o]));
  const independent = independence.filter((i) => i.mark === "independent").length;
  const syndicatedChains = new Set<string>();
  for (const i of independence) {
    if (i.mark === "syndicated_same_chain" || i.mark === "exact_duplicate") {
      const chain = obsById.get(i.observationId)?.sourceChainId;
      if (chain) syndicatedChains.add(chain);
    }
  }
  return {
    independentDemandObservationCount: independent + syndicatedChains.size,
    sourceChainCount: chains.size,
  };
}

export function runOpportunityResearchMapReduce(input: {
  readonly passages: readonly ResearchPassage[];
  readonly concepts?: readonly ProposedConcept[];
}): MapReduceResult {
  if (input.passages.some((p) => !p.sourceId || !p.sourceChainId)) {
    throw new OpportunityResearchError("corpus.unauthorized_shape", "Passages require sourceId + sourceChainId (authorized corpus only).");
  }
  const observations = mapPassagesToObservations(input.passages);
  const independence = assessIndependence(input.passages, observations);
  const joins = joinSharedMechanisms(observations);
  const matrix = compileMechanismProblemMatrix(observations, independence);
  const conceptFlags = flagConcepts(input.concepts ?? [], observations);
  const corpus = assessCorpus(observations);
  const hypotheses = buildHypotheses(independence, matrix, corpus);
  const authority = assertAuthorityBoundary();
  const counts = countIndependentDemand(independence, observations);
  return {
    observations,
    independence,
    joins,
    matrix,
    conceptFlags,
    hypotheses,
    corpus,
    authority,
    independentDemandObservationCount: counts.independentDemandObservationCount,
    sourceChainCount: counts.sourceChainCount,
    repetitionProvesDemand: false,
    networkCalls: 0,
  };
}

export const OPPORTUNITY_RESEARCH_SEEDED_FIXTURE = {
  revision: "paper.527.seeded.v1",
  syndicatedChainId: "chain.wire-report-2024",
  passages: [
    {
      passageId: "pass.syndicated-a",
      sourceId: "src.outlet-a",
      sourceChainId: "chain.wire-report-2024",
      text: "Parents struggle to track shared custody calendars across apps.",
      date: "2024-03-01",
      context: "consumer parenting forums summarizing a wire report",
      population: "US parents with shared custody",
      workaround: "manual spreadsheet double-entry",
      reportedCostOrFrustration: "missed handoffs; high frustration",
      quotedText: "Shared custody calendars break when parents use different apps.",
      pageCount: 12000,
      problemKey: "shared_custody_calendar_chaos",
      mechanismKey: "cross_app_calendar_sync",
    },
    {
      passageId: "pass.syndicated-b",
      sourceId: "src.outlet-b",
      sourceChainId: "chain.wire-report-2024",
      text: "Reprint: Parents struggle to track shared custody calendars across apps.",
      date: "2024-03-02",
      context: "syndicated reprint of the same wire report",
      population: "US parents with shared custody",
      workaround: "manual spreadsheet double-entry",
      reportedCostOrFrustration: "missed handoffs; high frustration",
      quotedText: "Shared custody calendars break when parents use different apps.",
      pageCount: 8000,
      problemKey: "shared_custody_calendar_chaos",
      mechanismKey: "cross_app_calendar_sync",
    },
    {
      passageId: "pass.syndicated-c",
      sourceId: "src.outlet-c",
      sourceChainId: "chain.wire-report-2024",
      text: "Another outlet reprints the custody calendar wire report.",
      date: "2024-03-03",
      context: "third syndication of the same wire report",
      population: "US parents with shared custody",
      workaround: "manual spreadsheet double-entry",
      reportedCostOrFrustration: "missed handoffs; high frustration",
      quotedText: "Shared custody calendars break when parents use different apps.",
      pageCount: 5000,
      problemKey: "shared_custody_calendar_chaos",
      mechanismKey: "cross_app_calendar_sync",
    },
    {
      passageId: "pass.paraphrase-link",
      sourceId: "src.interview-1",
      sourceChainId: "chain.interview-1",
      text: "Co-parents say coordinating school events across two phone calendars is exhausting.",
      date: "2024-04-10",
      context: "interview; urban dual-household",
      population: "dual-household co-parents in cities",
      workaround: "text message reminders",
      reportedCostOrFrustration: "missed school events",
      quotedText: null,
      pageCount: null,
      problemKey: "shared_custody_calendar_chaos",
      mechanismKey: "cross_app_calendar_sync",
    },
    {
      passageId: "pass.contradictory-context",
      sourceId: "src.interview-2",
      sourceChainId: "chain.interview-2",
      text: "However, rural co-parents report the opposite: a single paper calendar on the fridge works fine.",
      date: "2024-04-12",
      context: "contradictory context: rural single-fridge calendar works; however digital sync is unwanted",
      population: "rural co-parents",
      workaround: "paper fridge calendar",
      reportedCostOrFrustration: "none reported for paper",
      quotedText: null,
      pageCount: null,
      problemKey: "shared_custody_calendar_chaos",
      mechanismKey: "cross_app_calendar_sync",
    },
    {
      passageId: "pass.incomplete-unknowns",
      sourceId: "src.fragment-1",
      sourceChainId: "chain.fragment-1",
      text: "Someone mentioned calendar sync pain.",
      date: null,
      context: "undated fragment without population",
      population: null,
      workaround: "manual spreadsheet double-entry",
      reportedCostOrFrustration: "tedious double-entry compromise",
      quotedText: null,
      pageCount: 3,
      problemKey: "shared_custody_calendar_chaos",
      mechanismKey: "cross_app_calendar_sync",
    },
  ] as const satisfies readonly ResearchPassage[],
  concepts: [
    {
      conceptId: "concept.spreadsheet-sync",
      label: "Auto-synced shared spreadsheet",
      mechanismKey: "cross_app_calendar_sync",
      problemKey: "shared_custody_calendar_chaos",
      recreatesCompromises: ["manual spreadsheet double-entry"],
      assumptions: ["Both parents will adopt the same spreadsheet tool"],
      counterconditions: ["rural single-fridge calendar works"],
    },
    {
      conceptId: "concept.native-bridge",
      label: "Read-only cross-app calendar bridge",
      mechanismKey: "cross_app_calendar_sync",
      problemKey: "shared_custody_calendar_chaos",
      recreatesCompromises: [],
      assumptions: [],
      counterconditions: [],
    },
  ] as const satisfies readonly ProposedConcept[],
} as const;

export function assessSeededOpportunityResearchFixture(): MapReduceResult {
  return runOpportunityResearchMapReduce({
    passages: OPPORTUNITY_RESEARCH_SEEDED_FIXTURE.passages,
    concepts: OPPORTUNITY_RESEARCH_SEEDED_FIXTURE.concepts,
  });
}
