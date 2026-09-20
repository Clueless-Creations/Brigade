/**
 * #527 SQ-15 — Source-backed opportunity research / semantic map-reduce
 * fixtures (paper; synthetic; no-network).
 *
 * Proves all five Acceptance criteria + tip stamps / hard bans / NO_527 cleared.
 * Import identifiers are locked to live exports.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  OPPORTUNITY_RESEARCH_OWNER_MODULES,
  OPPORTUNITY_RESEARCH_RECIPE_CONSUMES,
  OPPORTUNITY_RESEARCH_RECIPE_COORDINATES,
  OPPORTUNITY_RESEARCH_RECIPE_EPIC,
  OPPORTUNITY_RESEARCH_RECIPE_ISSUE,
  OPPORTUNITY_RESEARCH_RECIPE_NEXT_AFTER_CLOSE,
  OPPORTUNITY_RESEARCH_RECIPE_NO_527_IMPL,
  OPPORTUNITY_RESEARCH_RECIPE_NO_DEFAULT_REWRITE,
  OPPORTUNITY_RESEARCH_RECIPE_NO_NETWORK,
  OPPORTUNITY_RESEARCH_RECIPE_NO_PRODUCT_PICK,
  OPPORTUNITY_RESEARCH_RECIPE_NO_SCRAPE,
  OPPORTUNITY_RESEARCH_RECIPE_PAGE_COUNTS_ARE_NOT_CUSTOMERS,
  OPPORTUNITY_RESEARCH_RECIPE_PLANNING_ID,
  OPPORTUNITY_RESEARCH_RECIPE_POLICY,
  OPPORTUNITY_RESEARCH_RECIPE_REPETITION_IS_NOT_DEMAND,
  OPPORTUNITY_RESEARCH_RECIPE_STAMP,
  opportunityResearchTouchesDefaultIndex,
} from "../../../catalog/workflows/opportunity-research-map-reduce.js";
import {
  OPPORTUNITY_RESEARCH_AC,
  OPPORTUNITY_RESEARCH_BASE_MAIN_SHA,
  OPPORTUNITY_RESEARCH_CONSUMES,
  OPPORTUNITY_RESEARCH_COORDINATES,
  OPPORTUNITY_RESEARCH_EPIC,
  OPPORTUNITY_RESEARCH_FIXTURE,
  OPPORTUNITY_RESEARCH_HOSTED_KEY_OWNER,
  OPPORTUNITY_RESEARCH_ISSUE,
  OPPORTUNITY_RESEARCH_LIVE_NOT_PERFORMED,
  OPPORTUNITY_RESEARCH_MAP_PATH,
  OPPORTUNITY_RESEARCH_NEXT_AFTER_CLOSE,
  OPPORTUNITY_RESEARCH_NO_527_IMPL,
  OPPORTUNITY_RESEARCH_NO_CUSTOMER_PII,
  OPPORTUNITY_RESEARCH_NO_FOUNDER_BUSINESS_SELECTION,
  OPPORTUNITY_RESEARCH_NO_MARKET_SUCCESS_PREDICTION,
  OPPORTUNITY_RESEARCH_NO_NETWORK,
  OPPORTUNITY_RESEARCH_NO_NEW_RESEARCH_DB,
  OPPORTUNITY_RESEARCH_NO_PRODUCT_PICK,
  OPPORTUNITY_RESEARCH_NO_SCRAPE,
  OPPORTUNITY_RESEARCH_NO_UNSOURCED_TAM,
  OPPORTUNITY_RESEARCH_PLANNING_ID,
  OPPORTUNITY_RESEARCH_REPETITION_IS_NOT_DEMAND,
  OPPORTUNITY_RESEARCH_STAMP,
  opportunityResearchAcEvidence,
} from "../../../catalog/providers/opportunity-research-map-reduce-map.js";
import {
  OPPORTUNITY_RESEARCH_CONSUMES as SERVICE_CONSUMES,
  OPPORTUNITY_RESEARCH_COORDINATES as SERVICE_COORDINATES,
  OPPORTUNITY_RESEARCH_EPIC as SERVICE_EPIC,
  OPPORTUNITY_RESEARCH_ISSUE as SERVICE_ISSUE,
  OPPORTUNITY_RESEARCH_NEXT_AFTER_CLOSE as SERVICE_NEXT_AFTER,
  OPPORTUNITY_RESEARCH_NO_527_IMPL as SERVICE_NO_527,
  OPPORTUNITY_RESEARCH_NO_NETWORK as SERVICE_NO_NETWORK,
  OPPORTUNITY_RESEARCH_NO_PRODUCT_PICK as SERVICE_NO_PRODUCT_PICK,
  OPPORTUNITY_RESEARCH_NO_SCRAPE as SERVICE_NO_SCRAPE,
  OPPORTUNITY_RESEARCH_PAGE_COUNTS_ARE_NOT_CUSTOMERS as SERVICE_NO_PAGE_CUSTOMERS,
  OPPORTUNITY_RESEARCH_REPETITION_IS_NOT_DEMAND as SERVICE_NO_REP_DEMAND,
  OPPORTUNITY_RESEARCH_SEEDED_FIXTURE,
  OPPORTUNITY_RESEARCH_STAMP as SERVICE_STAMP,
  assessIndependence,
  assessSeededOpportunityResearchFixture,
  assertAuthorityBoundary,
  countIndependentDemand,
  flagConcepts,
  mapPassagesToObservations,
  runOpportunityResearchMapReduce,
} from "../../../kernel/services/opportunity-research-map-reduce.js";

export function register(harness: Harness): void {
  harness.check("opportunity-research-map-reduce: stamp/issue/consumes + AC map + hard bans + NO_527 cleared", () => {
    assert(OPPORTUNITY_RESEARCH_ISSUE === "#527", "map issue");
    assert(SERVICE_ISSUE === "#527", "service issue");
    assert(OPPORTUNITY_RESEARCH_RECIPE_ISSUE === "#527", "recipe issue");
    assert(OPPORTUNITY_RESEARCH_EPIC === "#511" && SERVICE_EPIC === "#511" && OPPORTUNITY_RESEARCH_RECIPE_EPIC === "#511", "epic");
    assert(OPPORTUNITY_RESEARCH_PLANNING_ID === "SQ-15" && OPPORTUNITY_RESEARCH_RECIPE_PLANNING_ID === "SQ-15", "planning id");
    assert(OPPORTUNITY_RESEARCH_STAMP === "0.221.48" && SERVICE_STAMP === "0.221.48" && OPPORTUNITY_RESEARCH_RECIPE_STAMP === "0.221.48", "stamp");
    assert(OPPORTUNITY_RESEARCH_NO_527_IMPL === false && SERVICE_NO_527 === false && OPPORTUNITY_RESEARCH_RECIPE_NO_527_IMPL === false, "NO_527 cleared");
    assert(
      OPPORTUNITY_RESEARCH_NEXT_AFTER_CLOSE === "#511" && SERVICE_NEXT_AFTER === "#511" && OPPORTUNITY_RESEARCH_RECIPE_NEXT_AFTER_CLOSE === "#511",
      "NEXT_AFTER=#511",
    );
    assert(JSON.stringify([...OPPORTUNITY_RESEARCH_CONSUMES]) === JSON.stringify(["#514", "#518", "#519", "#521", "#520", "#523"]), "map consumes");
    assert(JSON.stringify([...SERVICE_CONSUMES]) === JSON.stringify(["#514", "#518", "#519", "#521", "#520", "#523"]), "service consumes");
    assert(JSON.stringify([...OPPORTUNITY_RESEARCH_RECIPE_CONSUMES]) === JSON.stringify(["#514", "#518", "#519", "#521", "#520", "#523"]), "recipe consumes");
    assert(JSON.stringify([...OPPORTUNITY_RESEARCH_COORDINATES]) === JSON.stringify(["#75", "#74"]), "map coordinates");
    assert(JSON.stringify([...SERVICE_COORDINATES]) === JSON.stringify(["#75", "#74"]), "service coordinates");
    assert(JSON.stringify([...OPPORTUNITY_RESEARCH_RECIPE_COORDINATES]) === JSON.stringify(["#75", "#74"]), "recipe coordinates");
    assert(OPPORTUNITY_RESEARCH_NO_NETWORK && SERVICE_NO_NETWORK && OPPORTUNITY_RESEARCH_RECIPE_NO_NETWORK, "no network");
    assert(OPPORTUNITY_RESEARCH_NO_SCRAPE && SERVICE_NO_SCRAPE && OPPORTUNITY_RESEARCH_RECIPE_NO_SCRAPE, "no scrape");
    assert(OPPORTUNITY_RESEARCH_NO_PRODUCT_PICK && SERVICE_NO_PRODUCT_PICK && OPPORTUNITY_RESEARCH_RECIPE_NO_PRODUCT_PICK, "no product pick");
    assert(OPPORTUNITY_RESEARCH_NO_NEW_RESEARCH_DB, "no new research db");
    assert(OPPORTUNITY_RESEARCH_NO_MARKET_SUCCESS_PREDICTION, "no market-success prediction");
    assert(OPPORTUNITY_RESEARCH_NO_UNSOURCED_TAM, "no unsourced TAM");
    assert(OPPORTUNITY_RESEARCH_NO_CUSTOMER_PII, "no customer PII");
    assert(OPPORTUNITY_RESEARCH_NO_FOUNDER_BUSINESS_SELECTION, "no founder business selection");
    assert(
      OPPORTUNITY_RESEARCH_REPETITION_IS_NOT_DEMAND && SERVICE_NO_REP_DEMAND && OPPORTUNITY_RESEARCH_RECIPE_REPETITION_IS_NOT_DEMAND,
      "repetition ≠ demand",
    );
    assert(SERVICE_NO_PAGE_CUSTOMERS && OPPORTUNITY_RESEARCH_RECIPE_PAGE_COUNTS_ARE_NOT_CUSTOMERS, "pages ≠ customers");
    assert(OPPORTUNITY_RESEARCH_LIVE_NOT_PERFORMED, "live not performed");
    assert(OPPORTUNITY_RESEARCH_HOSTED_KEY_OWNER.includes("Eduardo"), "key owner");
    assert(OPPORTUNITY_RESEARCH_BASE_MAIN_SHA === "9f109e4ab114af26100faafe61b0830337e88cfd", "base sha");
    assert(OPPORTUNITY_RESEARCH_AC.length === 5 && opportunityResearchAcEvidence().every((row) => row.covered), "AC covered");
    assert(OPPORTUNITY_RESEARCH_MAP_PATH.includes("opportunity-research-map-reduce-map"), "map path");
    assert(OPPORTUNITY_RESEARCH_FIXTURE.includes("opportunity-research-map-reduce.fixtures"), "fixture path");
    assert(OPPORTUNITY_RESEARCH_RECIPE_POLICY.repetitionProvesDemand === false, "policy repetition");
    assert(OPPORTUNITY_RESEARCH_RECIPE_POLICY.incompleteCorpusYieldsCompleteMarketClaim === false, "policy incomplete");
    assert(OPPORTUNITY_RESEARCH_RECIPE_POLICY.hypothesisChangesScope === false, "policy scope");
    assert(OPPORTUNITY_RESEARCH_RECIPE_POLICY.hypothesisAllocatesSpend === false, "policy spend");
    assert(OPPORTUNITY_RESEARCH_RECIPE_POLICY.hypothesisStartsCollection === false, "policy collection");
    assert(OPPORTUNITY_RESEARCH_RECIPE_NO_DEFAULT_REWRITE, "no default rewrite");
    assert(OPPORTUNITY_RESEARCH_OWNER_MODULES.includes("contracts/research/observation.ts"), "observation owner");
    assert(OPPORTUNITY_RESEARCH_OWNER_MODULES.includes("kernel/services/research-decision.ts"), "decision owner");
    const indexSource = readFileSync(path.join(skillRoot, "catalog/workflows/index.ts"), "utf8");
    assert(!opportunityResearchTouchesDefaultIndex(indexSource), "must not touch default workflows index");
  });

  harness.check("opportunity-research-map-reduce: AC1 three syndicated = one source chain", () => {
    const seeded = OPPORTUNITY_RESEARCH_SEEDED_FIXTURE;
    const syndicated = seeded.passages.filter((p) => p.sourceChainId === seeded.syndicatedChainId);
    assert(syndicated.length === 3, "three syndicated passages");
    const observations = mapPassagesToObservations(syndicated);
    const independence = assessIndependence(syndicated, observations);
    assert(
      independence.every((i) => i.mark === "syndicated_same_chain"),
      "all syndicated_same_chain",
    );
    const counts = countIndependentDemand(independence, observations);
    assert(counts.sourceChainCount === 1, "one source chain");
    assert(counts.independentDemandObservationCount === 1, "one demand observation after collapse (not three)");
    const pageSum = syndicated.reduce((n, p) => n + (p.pageCount ?? 0), 0);
    assert(pageSum > counts.independentDemandObservationCount, "page counts exceed demand count");
  });

  harness.check("opportunity-research-map-reduce: AC2 paraphrase links while contradictory contexts stay visible", () => {
    const result = assessSeededOpportunityResearchFixture();
    const paraphrase = result.observations.find((o) => o.passageId === "pass.paraphrase-link");
    const contradictory = result.observations.find((o) => o.passageId === "pass.contradictory-context");
    assert(paraphrase !== undefined && contradictory !== undefined, "both contexts present");
    assert(paraphrase!.problemKey === contradictory!.problemKey, "paraphrased problems link via problemKey");
    assert(paraphrase!.mechanismKey === contradictory!.mechanismKey, "shared mechanism");
    assert(paraphrase!.context !== contradictory!.context, "contexts remain distinct");
    assert(/contradict|however|opposite/i.test(contradictory!.context), "contradictory context visible");
    const cell = result.matrix.find((c) => c.mechanismKey === paraphrase!.mechanismKey && c.problemKey === paraphrase!.problemKey);
    assert(cell !== undefined, "matrix cell exists");
    assert(cell!.supportingObservationIds.includes(paraphrase!.observationId), "paraphrase in support");
    assert(
      cell!.conflictingObservationIds.includes(contradictory!.observationId) || cell!.supportingObservationIds.includes(contradictory!.observationId),
      "contradictory observation retained in matrix",
    );
    const join = result.joins.find((j) => j.mechanismKey === paraphrase!.mechanismKey);
    assert(join !== undefined && join.originalsPreserved === true, "originals preserved");
    assert(
      join!.counterexampleObservationIds.includes(contradictory!.observationId) || join!.observationIds.includes(contradictory!.observationId),
      "contradictory kept as counterexample or original",
    );
  });

  harness.check("opportunity-research-map-reduce: AC3 recreating undesirable compromise is flagged", () => {
    const seeded = OPPORTUNITY_RESEARCH_SEEDED_FIXTURE;
    const observations = mapPassagesToObservations(seeded.passages);
    const flags = flagConcepts(seeded.concepts, observations);
    const compromiseFlags = flags.filter((f) => f.kind === "recreates_undesirable_compromise");
    assert(compromiseFlags.length >= 1, "at least one compromise flag");
    const spreadsheet = compromiseFlags.find((f) => f.conceptId === "concept.spreadsheet-sync");
    assert(spreadsheet !== undefined, "spreadsheet concept flagged");
    assert(spreadsheet!.evidenceObservationIds.length > 0, "flag carries evidence");
    assert(spreadsheet!.summary.includes("manual spreadsheet double-entry"), "summary names compromise");
    const bridgeFlags = flags.filter((f) => f.conceptId === "concept.native-bridge" && f.kind === "recreates_undesirable_compromise");
    assert(bridgeFlags.length === 0, "native bridge does not recreate compromise");
  });

  harness.check("opportunity-research-map-reduce: AC4 incomplete corpus ≠ complete market claim; unknowns stay unknown", () => {
    const result = assessSeededOpportunityResearchFixture();
    assert(result.corpus.completeness === "incomplete", "corpus incomplete");
    assert(result.corpus.completeMarketClaimAllowed === false, "complete market claim forbidden");
    assert(result.corpus.missingDatesRemainUnknown === true, "missing dates remain unknown");
    assert(result.corpus.missingPopulationsRemainUnknown === true, "missing populations remain unknown");
    const incomplete = result.observations.find((o) => o.passageId === "pass.incomplete-unknowns");
    assert(incomplete !== undefined, "incomplete observation present");
    assert(incomplete!.date === null, "date stays null/unknown");
    assert(incomplete!.population === null, "population stays null/unknown");
    assert(incomplete!.inferredWtp === false && incomplete!.inferredDemographics === false, "no inferred WTP/demographics");
    assert(
      result.hypotheses.every((h) => h.completeMarketClaim === false),
      "hypotheses are not complete market claims",
    );
    assert(
      result.hypotheses.every((h) => /not a complete market|provisional|incomplete/i.test(h.coverageNote)),
      "coverage notes refuse complete market claim",
    );
  });

  harness.check("opportunity-research-map-reduce: AC5 hypotheses do not change scope/spend/collection", () => {
    const result = assessSeededOpportunityResearchFixture();
    const boundary = assertAuthorityBoundary();
    assert(boundary.changesAcceptedScope === false, "boundary: no scope change");
    assert(boundary.allocatesTrafficOrSpend === false, "boundary: no spend");
    assert(boundary.startsExternalCollection === false, "boundary: no collection");
    assert(boundary.productPickAuthority === false, "boundary: no product pick");
    assert(boundary.scrape === false, "boundary: no scrape");
    for (const h of result.hypotheses) {
      assert(h.changesAcceptedScope === false, "hypothesis: no scope change");
      assert(h.allocatesTrafficOrSpend === false, "hypothesis: no spend");
      assert(h.startsExternalCollection === false, "hypothesis: no collection");
      assert(h.productPickAuthority === false, "hypothesis: no product pick");
      assert(h.decisionPath === "existing_research_product_decision", "uses existing decision path");
    }
    assert(result.authority.changesAcceptedScope === false, "result authority scope");
    assert(result.repetitionProvesDemand === false, "repetition ≠ demand");
    assert(result.networkCalls === 0, "no network");
  });

  harness.check("opportunity-research-map-reduce: seeded e2e + no inferred WTP + page counts ignored", () => {
    const full = runOpportunityResearchMapReduce({
      passages: OPPORTUNITY_RESEARCH_SEEDED_FIXTURE.passages,
      concepts: OPPORTUNITY_RESEARCH_SEEDED_FIXTURE.concepts,
    });
    assert(full.observations.length === 6, "six observations");
    assert(
      full.observations.every((o) => o.inferredWtp === false && o.inferredDemographics === false),
      "no inferences",
    );
    assert(
      full.observations.every((o) => o.pageCountAsCustomers === false),
      "pages not customers",
    );
    assert(full.sourceChainCount === 4, "four source chains");
    assert(full.independentDemandObservationCount === 4, "collapsed independent demand");
    assert(full.independentDemandObservationCount < full.observations.length, "collapsed below raw observation count");
    assert(
      full.conceptFlags.some((f) => f.kind === "recreates_undesirable_compromise"),
      "compromise flagged in e2e",
    );
    assert(full.hypotheses.length >= 1, "at least one hypothesis");
    assert(
      full.hypotheses.every((h) => h.decisionPath === "existing_research_product_decision"),
      "decision path",
    );
  });
}
