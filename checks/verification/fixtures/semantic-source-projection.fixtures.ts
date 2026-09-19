/**
 * #517 SQ-06 — scoped source projections + candidate generation fixtures (paper; no network).
 *
 * Proves all five Acceptance criteria + pinned-integrity stale/missing → unresolved:
 * 1. Private/out-of-scope never reaches projection / cache key / diagnostic / provider request
 * 2. Absent required source → insufficient_context (not confident no-match)
 * 3. Unicode spans/offsets recover evidence; bounded omissions → continuation or hold
 * 4. Selected-provider knowledge retained; unselected cannot replace
 * 5. Candidate volume bounded+stable with case-level missed-candidate reporting
 */
import { sha256Hex } from "../../../contracts/semantic/canonicalize.js";
import { codePointLength, recoverSpan, verifyPinnedExcerpt } from "../../../kernel/knowledge-service/projection-helpers.js";
import {
  SEMANTIC_SOURCE_PROJECTION_CONSUMES,
  SEMANTIC_SOURCE_PROJECTION_EPIC,
  SEMANTIC_SOURCE_PROJECTION_ISSUE,
  SEMANTIC_SOURCE_PROJECTION_STAMP,
  projectAuthorizedSources,
  tryProjectAuthorizedSources,
  type CandidateRecord,
  type DeclaredSourceSelector,
  type PinnedSourceRecord,
  type ProjectSourcesInput,
} from "../../../kernel/services/source-projection.js";
import {
  DECLARED_SOURCE_SELECTORS,
  SEMANTIC_SOURCE_PROJECTION_AC,
  SEMANTIC_SOURCE_PROJECTION_BASE_MAIN_SHA,
  SEMANTIC_SOURCE_PROJECTION_FIXTURE,
  SEMANTIC_SOURCE_PROJECTION_LIVE_NOT_PERFORMED,
  SEMANTIC_SOURCE_PROJECTION_MAP_PATH,
  SEMANTIC_SOURCE_PROJECTION_NEXT_AFTER_CLOSE,
  SEMANTIC_SOURCE_PROJECTION_NO_518,
  SEMANTIC_SOURCE_PROJECTION_NO_EMBEDDINGS,
  getDeclaredSelector,
  semanticSourceProjectionAcEvidence,
} from "../../../catalog/providers/semantic-source-projection-map.js";
import { assert, type Harness } from "./_harness.js";

function pin(content: string): Pick<PinnedSourceRecord, "content" | "contentSha256"> {
  return { content, contentSha256: sha256Hex(content) };
}

function publicReports(): PinnedSourceRecord {
  const content = "Observation: payment surprise after long setup. Journey: onboarding→paywall. emoji: 😀🚀 café";
  return {
    sourceId: "src.reports",
    workspaceId: "ws.demo",
    ...pin(content),
    privacyClass: "workspace",
    fields: {
      summary: "Observation: payment surprise after long setup.",
      journey: "Journey: onboarding→paywall.",
      unicode: "emoji: 😀🚀 café",
    },
    providerId: "typesafe/systemone",
  };
}

function journeySource(): PinnedSourceRecord {
  const content = "Authored journey binding for onboarding paywall.";
  return {
    sourceId: "src.journey",
    workspaceId: "ws.demo",
    ...pin(content),
    privacyClass: "public",
    fields: { summary: "Authored journey binding for onboarding paywall." },
    providerId: "typesafe/systemone",
  };
}

function privateCustomer(): PinnedSourceRecord {
  const content = "PRIVATE_PAYLOAD customer-email=secret@example.com OUT_OF_SCOPE_SECRET=sk-live-ABCDEFGH12345678";
  return {
    sourceId: "src.private-customer",
    workspaceId: "ws.demo",
    ...pin(content),
    privacyClass: "private",
    fields: {
      summary: "PRIVATE_PAYLOAD customer-email=secret@example.com",
      secret: "OUT_OF_SCOPE_SECRET=sk-live-ABCDEFGH12345678",
    },
    providerId: "other/provider",
  };
}

function foreignWorkspace(): PinnedSourceRecord {
  const content = "Cross-workspace note that must never project.";
  return {
    sourceId: "src.reports",
    workspaceId: "ws.other",
    ...pin(content),
    privacyClass: "workspace",
    fields: { summary: "Cross-workspace note that must never project." },
  };
}

function sampleCandidates(): CandidateRecord[] {
  return [
    {
      id: "c.report.a",
      sourceId: "src.reports",
      key: "payment-surprise",
      mechanism: "onboarding-effort",
      contextTags: ["paywall", "onboarding"],
      evidenceChars: 40,
      bindingId: "bind.feedback",
      providerId: "typesafe/systemone",
    },
    {
      id: "c.report.b",
      sourceId: "src.reports",
      key: "payment-surprise",
      mechanism: "onboarding-effort",
      contextTags: ["paywall"],
      evidenceChars: 36,
      bindingId: "bind.feedback",
      providerId: "typesafe/systemone",
    },
    {
      id: "c.report.c",
      sourceId: "src.journey",
      key: "journey-bind",
      mechanism: "journey",
      contextTags: ["onboarding"],
      evidenceChars: 20,
      bindingId: "bind.journey",
      providerId: "typesafe/systemone",
    },
    {
      id: "c.other.similar",
      sourceId: "src.other",
      key: "payment-surprise",
      mechanism: "onboarding-effort",
      contextTags: ["paywall", "onboarding"],
      evidenceChars: 38,
      bindingId: "bind.other",
      providerId: "other/provider",
    },
    {
      id: "c.neg.control",
      sourceId: "src.reports",
      key: "unrelated-topic",
      mechanism: "other",
      contextTags: ["billing-unrelated"],
      evidenceChars: 10,
      bindingId: "bind.neg",
      providerId: "typesafe/systemone",
    },
    {
      id: "c.para.alt",
      sourceId: "src.reports",
      key: "pay-shock-paraphrase",
      mechanism: "onboarding-effort",
      contextTags: ["paywall"],
      evidenceChars: 28,
      bindingId: "bind.feedback",
      providerId: "typesafe/systemone",
    },
  ];
}

function baseInput(overrides: Partial<ProjectSourcesInput> & { selector: DeclaredSourceSelector }): ProjectSourcesInput {
  return {
    registeredSelectors: DECLARED_SOURCE_SELECTORS,
    pinnedSources: [publicReports(), journeySource()],
    requiredSourceIds: ["src.reports"],
    fieldPaths: ["summary"],
    maxFieldChars: 512,
    ...overrides,
  };
}

function assertNoLeak(text: string): void {
  assert(!text.includes("PRIVATE_PAYLOAD"), "PRIVATE_PAYLOAD must not leak");
  assert(!text.includes("OUT_OF_SCOPE_SECRET"), "OUT_OF_SCOPE_SECRET must not leak");
  assert(!text.includes("sk-live-"), "secret token must not leak");
  assert(!text.includes("secret@example.com"), "private email must not leak");
}

export function register(harness: Harness): void {
  harness.check("semantic-source-projection: stamp/issue/consumes + AC map present", () => {
    assert(SEMANTIC_SOURCE_PROJECTION_ISSUE === "#517", "issue #517");
    assert(SEMANTIC_SOURCE_PROJECTION_EPIC === "#511", "epic #511");
    assert(SEMANTIC_SOURCE_PROJECTION_STAMP === "0.221.37", "stamp 0.221.37");
    assert(
      SEMANTIC_SOURCE_PROJECTION_CONSUMES.includes("#512") &&
        SEMANTIC_SOURCE_PROJECTION_CONSUMES.includes("#516") &&
        SEMANTIC_SOURCE_PROJECTION_CONSUMES.length === 5,
      "consumes #512–#516",
    );
    assert(SEMANTIC_SOURCE_PROJECTION_AC.length === 5, "five AC rows");
    assert(SEMANTIC_SOURCE_PROJECTION_MAP_PATH.includes("semantic-source-projection-map"), "map path");
    assert(SEMANTIC_SOURCE_PROJECTION_FIXTURE.includes("semantic-source-projection.fixtures"), "fixture path");
    assert(SEMANTIC_SOURCE_PROJECTION_BASE_MAIN_SHA.startsWith("a15a93f"), "base main sha");
    assert(SEMANTIC_SOURCE_PROJECTION_LIVE_NOT_PERFORMED === true, "live not performed");
    assert(SEMANTIC_SOURCE_PROJECTION_NO_EMBEDDINGS === true, "no embeddings");
    assert(SEMANTIC_SOURCE_PROJECTION_NO_518 === true, "no #518");
    assert(SEMANTIC_SOURCE_PROJECTION_NEXT_AFTER_CLOSE === "#518", "next after close");
    assert(DECLARED_SOURCE_SELECTORS.length >= 2, "declared selectors present");
    assert(getDeclaredSelector("sel.feedback.workspace-public") !== undefined, "selector lookup");
    const evidence = semanticSourceProjectionAcEvidence();
    assert(
      evidence.every((row) => row.covered),
      "all AC covered by fixtures",
    );
  });

  harness.check("AC1: private/out-of-scope never reaches projection/cache/diagnostic/provider", () => {
    const selector = getDeclaredSelector("sel.feedback.workspace-public")!;
    // workspace selector + private source present — must omit, never leak.
    const result = projectAuthorizedSources(
      baseInput({
        selector,
        pinnedSources: [publicReports(), journeySource(), privateCustomer()],
        requiredSourceIds: ["src.reports"],
        fieldPaths: ["summary", "secret"],
      }),
    );
    assert(result.projection.outcome === "ok", `expected ok, got ${result.projection.outcome}`);
    const blobs = [
      JSON.stringify(result.projection.fields),
      result.projection.cacheKeyPayload,
      JSON.stringify(result.projection.publicDiagnostic),
      JSON.stringify(result.projection.providerRequestPayload),
    ];
    for (const blob of blobs) assertNoLeak(blob);

    // Required private under workspace selector → insufficient_context, still no leak.
    const requiredPrivate = projectAuthorizedSources(
      baseInput({
        selector,
        pinnedSources: [publicReports(), privateCustomer()],
        requiredSourceIds: ["src.reports", "src.private-customer"],
        fieldPaths: ["summary"],
      }),
    );
    assert(requiredPrivate.projection.outcome === "insufficient_context", "private required under workspace → insufficient_context");
    assertNoLeak(JSON.stringify(requiredPrivate.projection));
    assert(
      requiredPrivate.projection.fields.every((f) => !f.fieldPath.includes("private")),
      "no private fields projected",
    );

    // Cross-workspace refused fail-closed before read/project.
    const cross = tryProjectAuthorizedSources(
      baseInput({
        selector,
        pinnedSources: [foreignWorkspace()],
        requiredSourceIds: ["src.reports"],
      }),
    );
    assert(cross.ok === false && cross.code === "scope_violation", `cross-workspace refused: ${JSON.stringify(cross)}`);

    // Escaping path selector rejected.
    const escaping = tryProjectAuthorizedSources(
      baseInput({
        selector: {
          ...selector,
          selectorId: "sel.escape",
          allowedSourceIds: ["../etc/passwd"],
        },
        registeredSelectors: [
          ...DECLARED_SOURCE_SELECTORS,
          {
            ...selector,
            selectorId: "sel.escape",
            allowedSourceIds: ["../etc/passwd"],
          },
        ],
        pinnedSources: [publicReports()],
      }),
    );
    assert(escaping.ok === false && escaping.code === "selector_rejected", `escape rejected: ${JSON.stringify(escaping)}`);

    // Unregistered selector rejected.
    const unreg = tryProjectAuthorizedSources(
      baseInput({
        selector: { ...selector, selectorId: "sel.unknown" },
      }),
    );
    assert(unreg.ok === false && unreg.code === "selector_rejected", "unregistered rejected");
  });

  harness.check("AC2: absent required source yields insufficient_context not confident no-match", () => {
    const selector = getDeclaredSelector("sel.feedback.workspace-public")!;
    const result = projectAuthorizedSources(
      baseInput({
        selector,
        pinnedSources: [journeySource()], // reports absent
        requiredSourceIds: ["src.reports"],
        fieldPaths: ["summary"],
      }),
    );
    assert(result.projection.outcome === "insufficient_context", `got ${result.projection.outcome}`);
    assert(result.projection.fields.length === 0, "no fields when required absent");
    assert(result.projection.publicDiagnostic.outcome === "insufficient_context", "diagnostic outcome");
    // Must not look like a confident empty/no-match success.
    assert(result.projection.publicDiagnostic.coverageComplete === false, "not confident complete/no-match");
    assert(
      result.projection.coverage.omitted.some((o) => o.reason === "absent"),
      "omission reason absent",
    );
  });

  harness.check("AC3: Unicode spans recover evidence; bounded omissions → continuation or hold", () => {
    const selector = getDeclaredSelector("sel.feedback.workspace-public")!;
    const reports = publicReports();
    const unicodeField = reports.fields.unicode!;
    // Surrogate-pair emoji must survive code-point recovery.
    const fullLen = codePointLength(unicodeField);
    const recovered = recoverSpan(unicodeField, 0, fullLen);
    assert(recovered === unicodeField, "full unicode recover");
    assert(recovered.includes("😀"), "grinning emoji intact");
    assert(recovered.includes("🚀"), "rocket emoji intact");
    assert(recovered.includes("café"), "combining-safe café intact");

    // Mid-string slice by code points (not UTF-16).
    const emojiStart = codePointLength("emoji: ");
    const mid = recoverSpan(unicodeField, emojiStart, emojiStart + 2);
    assert(mid === "😀🚀", `mid span got ${JSON.stringify(mid)}`);

    // Bounded omission with tight budget → partial + nextOffset continuation.
    const result = projectAuthorizedSources(
      baseInput({
        selector,
        pinnedSources: [reports],
        requiredSourceIds: ["src.reports"],
        fieldPaths: ["unicode", "summary"],
        maxFieldChars: 8,
      }),
    );
    assert(result.projection.outcome === "ok", "ok with partial");
    const unicodeProj = result.projection.fields.find((f) => f.fieldPath.endsWith(".unicode"));
    assert(unicodeProj !== undefined, "unicode field present");
    assert(codePointLength(unicodeProj!.value) <= 8, "bounded length");
    const partial = result.projection.coverage.entries.find((e) => e.fieldPath === "unicode" && e.status === "partial");
    assert(partial !== undefined, "partial coverage entry");
    assert(partial!.nextOffset === 8, "continuation offset");
    // Provenance spans are code-point based.
    assert(unicodeProj!.provenance.spanEnd > unicodeProj!.provenance.spanStart, "span ordered");

    // Explicit hold path: empty dataScope → nothing admitted (held/insufficient).
    const held = tryProjectAuthorizedSources(
      baseInput({
        selector: {
          ...selector,
          selectorId: "sel.held-empty-scope",
          dataScope: [],
        },
        registeredSelectors: [...DECLARED_SOURCE_SELECTORS, { ...selector, selectorId: "sel.held-empty-scope", dataScope: [] }],
        pinnedSources: [reports],
        requiredSourceIds: ["src.reports"],
      }),
    );
    assert(held.ok === true, "empty scope projects with omission");
    assert(held.result.projection.outcome === "insufficient_context", "explicit hold/insufficient");
  });

  harness.check("AC4: selected-provider knowledge retained; unselected cannot replace", () => {
    const selector = getDeclaredSelector("sel.feedback.workspace-public")!;
    assert(selector.selectedProviderId === "typesafe/systemone", "selected provider");
    const result = projectAuthorizedSources(
      baseInput({
        selector,
        pinnedSources: [publicReports(), journeySource()],
        requiredSourceIds: ["src.reports"],
        fieldPaths: ["summary"],
        candidates: sampleCandidates(),
        candidateOptions: {
          caseId: "ac4-retention",
          exactKeys: ["payment-surprise", "journey-bind", "pay-shock-paraphrase"],
          maxPairs: 32,
        },
      }),
    );
    assert(result.selectedProviderRetention !== undefined, "retention present");
    const { retained, rejectedReplacements } = result.selectedProviderRetention!;
    assert(
      retained.every((r) => r.providerId === "typesafe/systemone"),
      "only selected provider retained",
    );
    assert(
      retained.some((r) => r.id === "c.report.a"),
      "selected record kept",
    );
    assert(rejectedReplacements.includes("c.other.similar"), "similar unselected rejected as replacement");
    assert(!retained.some((r) => r.id === "c.other.similar"), "unselected similar not in retained set");
  });

  harness.check("AC5: candidate volume bounded+stable with case-level missed-candidate reporting", () => {
    const selector = getDeclaredSelector("sel.feedback.workspace-public")!;
    const candidates = sampleCandidates();
    const a = projectAuthorizedSources(
      baseInput({
        selector,
        candidates,
        candidateOptions: {
          caseId: "ac5-budget",
          maxPairs: 2,
          minEvidenceChars: 1,
          exactKeys: ["payment-surprise", "journey-bind", "pay-shock-paraphrase", "unrelated-topic"],
          expectedRecoverableIds: ["c.missing.recoverable"],
        },
      }),
    );
    const b = projectAuthorizedSources(
      baseInput({
        selector,
        candidates,
        candidateOptions: {
          caseId: "ac5-budget",
          maxPairs: 2,
          minEvidenceChars: 1,
          exactKeys: ["payment-surprise", "journey-bind", "pay-shock-paraphrase", "unrelated-topic"],
          expectedRecoverableIds: ["c.missing.recoverable"],
        },
      }),
    );
    assert(a.candidates !== undefined && b.candidates !== undefined, "candidates present");
    assert(a.candidates!.pairs.length <= 2, "bounded volume");
    assert(a.candidates!.volumeBound === 2, "volume bound recorded");
    assert(a.candidates!.stableOrderDigest === b.candidates!.stableOrderDigest, "stable digest");
    assert(JSON.stringify(a.candidates!.pairs) === JSON.stringify(b.candidates!.pairs), "byte-stable pairs");
    // Missed reporting: budget truncation and/or expected recoverable.
    assert(a.candidates!.missed.length >= 1, "missed candidates reported");
    assert(
      a.candidates!.missed.every((m) => m.caseId === "ac5-budget"),
      "case-level missed ids",
    );
    assert(
      a.candidates!.missed.some((m) => m.reason === "budget_truncation" || m.reason === "filter_excluded"),
      "truncation or filter miss reason",
    );
    assert(
      a.candidates!.missed.some((m) => m.missedId === "c.missing.recoverable" && m.recoverableByAssessor),
      "expected recoverable miss reported",
    );
    // Predicates remain separate on pairs.
    for (const pair of a.candidates!.pairs) {
      assert(pair.predicates.length >= 1, "predicates present");
      for (const pred of pair.predicates) {
        assert(pred === "identity" || pred === "same-mechanism" || pred === "related-context" || pred === "evidence-sufficiency", `known predicate ${pred}`);
      }
    }
  });

  harness.check("pinned integrity: stale hash / missing → unresolved (never silent refresh)", () => {
    const selector = getDeclaredSelector("sel.feedback.workspace-public")!;
    const reports = publicReports();
    const stale: PinnedSourceRecord = {
      ...reports,
      contentSha256: "0".repeat(64), // wrong hash under same identity
    };
    const result = projectAuthorizedSources(
      baseInput({
        selector,
        pinnedSources: [stale],
        requiredSourceIds: ["src.reports"],
        fieldPaths: ["summary"],
      }),
    );
    assert(result.projection.outcome === "unresolved", `got ${result.projection.outcome}`);
    assert(
      result.projection.pinVerifications.some((p) => p.result.status === "unresolved" && p.result.reason === "stale_hash"),
      "stale_hash recorded",
    );
    assert(result.projection.fields.length === 0, "no silent refresh fields");

    // Direct helper: missing span → unresolved.
    const missing = verifyPinnedExcerpt({
      pinnedContent: reports.content,
      expectedContentSha256: reports.contentSha256,
      spanStart: 0,
      spanEnd: codePointLength(reports.content) + 10,
    });
    assert(missing.status === "unresolved" && missing.reason === "missing_content", "missing_content");

    // Matching pin recovers excerpt.
    const ok = verifyPinnedExcerpt({
      pinnedContent: reports.content,
      expectedContentSha256: reports.contentSha256,
      spanStart: 0,
      spanEnd: codePointLength("Observation"),
      expectedExcerpt: "Observation",
    });
    assert(ok.status === "ok" && ok.recovered === "Observation", "pin ok recovers");
  });

  harness.check("semantic-source-projection: no network/secrets/embeddings/#518 in API surface", () => {
    const source = projectAuthorizedSources.toString();
    assert(!source.includes("fetch("), "no fetch");
    assert(!source.includes("process.env"), "no process.env");
    assert(!source.includes("Date.now"), "no Date.now");
    assert(!source.includes("embedding"), "no embeddings");
    assert(!source.includes("mapReduce") && !source.includes("map-reduce"), "no map-reduce");
    assert(!source.includes("speculativeBatch"), "no speculative batch");
    assert(SEMANTIC_SOURCE_PROJECTION_NO_518 === true, "map flags no #518");
    assert(SEMANTIC_SOURCE_PROJECTION_NO_EMBEDDINGS === true, "map flags no embeddings");
  });
}
