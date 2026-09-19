/**
 * #513 SQ-02 TypeSafe qualification map (paper; no live).
 *
 * Native Choice/Score/Noul (+ batch/auth/limits) → SQ-01 contracts/semantic/
 * with implement | defer | reject dispositions. No adapter transport, no
 * credentials, no Brigade package dependency activation.
 */
export const TYPESAFE_QUALIFY_MAP_PATH = "catalog/providers/typesafe-qualify-map.ts" as const;
export const TYPESAFE_QUALIFY_DOC = "docs/upstreams/typesafe-qualification.md" as const;
export const TYPESAFE_QUALIFY_FIXTURE = "checks/verification/fixtures/typesafe-qualify.fixtures.ts" as const;
export const TYPESAFE_UPSTREAM_MANIFEST = "catalog/upstreams/typesafe-ai.yaml" as const;
export const TYPESAFE_UPSTREAM_NOTICE = "catalog/upstreams/notices/typesafe-ai.txt" as const;
export const TYPESAFE_UPSTREAM_OBSERVATION = "catalog/upstreams/observations/typesafe-ai.json" as const;
export const SEMANTIC_CONTRACTS_DIR = "contracts/semantic" as const;

export const TYPESAFE_QUALIFY_ISSUE = "#513" as const;
export const TYPESAFE_QUALIFY_EPIC = "#511" as const;
export const TYPESAFE_QUALIFY_CONSUMES = "#512" as const;
export const TYPESAFE_QUALIFY_NEXT = "#515" as const;
export const TYPESAFE_QUALIFY_STAMP = "0.221.33" as const;
export const TYPESAFE_QUALIFY_BASE_MAIN_SHA = "38f7b6fb123606940c811c40f02073fc8f73bbed" as const;

export const TYPESAFE_DOCS_OBSERVED_AT = "2026-09-19" as const;
export const TYPESAFE_PYTHON_SDK_VERSION = "0.7.0" as const;
export const TYPESAFE_PYTHON_SDK_COMMIT = "2ce5c65f13646cab6e6f782328194c9d85f3300a" as const;
export const TYPESAFE_NPM_SDK_VERSION = "0.6.0" as const;
export const TYPESAFE_LICENSE_SHA256 = "002c2696d92b5c8cf956c11072baa58eaf9f6ade995c031ea635c6a1ee342ad1" as const;
export const TYPESAFE_FREE_UNTIL = "2026-09-25" as const;

export const TYPESAFE_ENV_REQUIRED = ["TYPESAFE_API_KEY"] as const;
export const TYPESAFE_ENV_OPTIONAL = ["JEV_API_KEY", "TYPESAFE_BASE_URL", "TYPESAFE_DEFAULT_MODEL", "TYPESAFE_LOG_LEVEL"] as const;
export const TYPESAFE_CONFIRM_WITHOUT_PRINT = 'test -n "$TYPESAFE_API_KEY" && echo set || echo unset' as const;

export const TYPESAFE_DOCS_URL = "https://docs.typesafe.ai" as const;
export const TYPESAFE_HOW_TO_BUILD_URL = "https://docs.typesafe.ai/concepts/how-to-build-with-system-one" as const;
export const TYPESAFE_API_DOCS_URL = "https://docs.typesafe.ai/api" as const;
export const TYPESAFE_LEGAL_URL = "https://docs.typesafe.ai/legal" as const;
export const TYPESAFE_API_BASE_DEFAULT = "https://api.typesafe.ai" as const;
export const TYPESAFE_MODEL_DEFAULT = "jev-latest" as const;

export const TYPESAFE_JEV_OPS_NOTES = [
  "/workspace/jev-ops/notes/01-quickstart.md",
  "/workspace/jev-ops/notes/02-primitives.md",
  "/workspace/jev-ops/notes/04-how-to-build.md",
  "/workspace/jev-ops/notes/06-agent-skill.md",
  "/workspace/jev-ops/notes/08-sdk-env-smoke.md",
] as const;
export const TYPESAFE_ULTRAFAST_NOTE_POST_515 = "/workspace/jev-ops/notes/12-jev-ultrafast-browser-use.md" as const;

export const TYPESAFE_DISPOSITIONS = ["implement", "defer", "reject"] as const;
export type TypesafeDisposition = (typeof TYPESAFE_DISPOSITIONS)[number];

export const TYPESAFE_FIT = ["exact", "partial", "absent", "n_a"] as const;
export type TypesafeFit = (typeof TYPESAFE_FIT)[number];

export interface TypesafeMappingRow {
  readonly id: string;
  readonly native: string;
  readonly sq01: string;
  readonly fit: TypesafeFit;
  readonly effects: string;
  readonly limitations: string;
  readonly provenance: string;
  readonly disposition: TypesafeDisposition;
}

/** Official public API doc examples (sanitized) — evidence class official-public-docs. */
export const TYPESAFE_OFFICIAL_DOC_FIXTURES = {
  evidenceClass: "official-public-docs" as const,
  sourceUrl: TYPESAFE_API_DOCS_URL,
  sourceRevision: `docs.typesafe.ai/api observed ${TYPESAFE_DOCS_OBSERVED_AT}`,
  noulRequest: {
    state: "Help! My payouts have been failing for 3 days.",
    model: "jev-latest",
    questions: {
      is_urgent: {
        type: "noul",
        instructions: "Does this convey urgency?",
        criteria: { true: "Explicitly time-sensitive", false: "No urgency expressed" },
      },
    },
  },
  noulResponse: {
    model: "jev-latest",
    answers: { is_urgent: { type: "noul", noul: 0.92 } },
    usage: { input_tokens: 312, output_tokens: 48 },
  },
  choiceResponse: {
    model: "jev-latest",
    answers: {
      department: {
        type: "choice",
        choice: "technical",
        probabilities: { billing: 0.08, technical: 0.85, sales: 0.07 },
        confidence: 0.82,
      },
    },
    usage: { input_tokens: 312, output_tokens: 48 },
  },
  scoreResponse: {
    model: "jev-latest",
    answers: {
      frustration: {
        type: "score",
        score: 1.6,
        legend: { "0": "Calm", "1": "Frustrated", "2": "Very angry" },
        probabilities: { "0": 0.05, "1": 0.3, "2": 0.65 },
        confidence: 0.78,
      },
    },
    usage: { input_tokens: 312, output_tokens: 48 },
  },
} as const;

export const TYPESAFE_MAPPINGS: readonly TypesafeMappingRow[] = [
  {
    id: "M1-choice",
    native: "Choice criteria map + choice/probabilities/confidence",
    sq01: "contracts/semantic choiceAnswerSchema",
    fit: "partial",
    effects: "Remote inference; spend possible; no graph mutate from qualify",
    limitations: "Native confidence not a ChoiceAnswer field; decode into receipt/observation in #515",
    provenance: "official-public-docs: docs.typesafe.ai/api Choice example 2026-09-19",
    disposition: "implement",
  },
  {
    id: "M2-score",
    native: "Score criteria array + score/legend/probabilities/confidence",
    sq01: "contracts/semantic scoreAnswerSchema",
    fit: "partial",
    effects: "Remote inference; spend possible",
    limitations: "0-based legend→levels; score float→expectation; confidence off-answer",
    provenance: "official-public-docs: docs.typesafe.ai/api Score example 2026-09-19",
    disposition: "implement",
  },
  {
    id: "M3-noul",
    native: "Noul probability only (no native confidence)",
    sq01: "contracts/semantic noulAnswerSchema",
    fit: "exact",
    effects: "Remote inference; spend possible",
    limitations: "Must not fabricate Noul confidence",
    provenance: "official-public-docs: docs.typesafe.ai/api Noul example 2026-09-19",
    disposition: "implement",
  },
  {
    id: "M4-batch",
    native: "Many questions one state (parallel fan-out)",
    sq01: "question-pack / multi-result composition",
    fit: "exact",
    effects: "One remote call; shared token budget",
    limitations: "Unbounded fan-out blocked until rate/budget confirmed",
    provenance: "official-public-docs: primitives + parallel questions cookbook cite",
    disposition: "implement",
  },
  {
    id: "M5-errors",
    native: "HTTP 401/422/429/529",
    sq01: "SEMANTIC_FAILURE_STATUSES",
    fit: "partial",
    effects: "Fail closed; host owns retry policy",
    limitations: "Idempotency of retries unconfirmed",
    provenance: "official-public-docs: docs.typesafe.ai/api errors table",
    disposition: "implement",
  },
  {
    id: "M6-model-alias",
    native: "jev-latest / jev-preview aliases",
    sq01: "receipt/observation model identity",
    fit: "partial",
    effects: "Alias drift risk",
    limitations: "Immutable model pin unconfirmed",
    provenance: "docs models + api examples",
    disposition: "defer",
  },
  {
    id: "M7-auth-binding",
    native: "TYPESAFE_API_KEY (+ optional JEV_API_KEY)",
    sq01: "out of answer contracts; binding",
    fit: "n_a",
    effects: "Credential disclosure if mishandled",
    limitations: "No invent/commit/print secrets",
    provenance: "wiring recipe env names only",
    disposition: "defer",
  },
  {
    id: "M8-privacy-live-payload",
    native: "Retention/training/deletion/ZDR terms",
    sq01: "live-data gate (not answer schema)",
    fit: "absent",
    effects: "Customer payload privacy",
    limitations: "Legal unreviewed for Brigade",
    provenance: "docs.typesafe.ai/legal",
    disposition: "reject",
  },
  {
    id: "M9-marketing-sla",
    native: "Advertised ~100ms / cost ratios",
    sq01: "not a contract field",
    fit: "n_a",
    effects: "None if rejected as SLA",
    limitations: "Marketing ≠ Brigade SLA",
    provenance: "how-to-build docs",
    disposition: "reject",
  },
  {
    id: "M10-interactive-ultrafast",
    native: "browser-use/jev-ultrafast",
    sq01: "not SQ-01 assessment boundary",
    fit: "n_a",
    effects: "Out of scope interactive proof",
    limitations: "Post-#515 only",
    provenance: "jev-ops note 12 cite",
    disposition: "reject",
  },
  {
    id: "M11-install-dependency",
    native: "Add SDK to Brigade package.json",
    sq01: "provider activation",
    fit: "n_a",
    effects: "Supply-chain dependency",
    limitations: "Qualify without install is valid",
    provenance: "package.json absence",
    disposition: "defer",
  },
] as const;

export function typesafeDispositionCounts(): Readonly<Record<TypesafeDisposition, number>> {
  const counts: Record<TypesafeDisposition, number> = { implement: 0, defer: 0, reject: 0 };
  for (const row of TYPESAFE_MAPPINGS) counts[row.disposition] += 1;
  return counts;
}

export function typesafeVersionFactsDistinct(): boolean {
  const python = String(TYPESAFE_PYTHON_SDK_VERSION);
  const npm = String(TYPESAFE_NPM_SDK_VERSION);
  return python !== npm && TYPESAFE_DOCS_OBSERVED_AT.length === 10 && TYPESAFE_PYTHON_SDK_COMMIT.length === 40;
}

export function typesafeLiveAllowedByDefault(): boolean {
  return false;
}

export function typesafeUnknownsBlockLive(): boolean {
  return !typesafeLiveAllowedByDefault();
}

export const TYPESAFE_TRANSPORT_RECOMMENDATION = "thin-direct-http" as const;
export const TYPESAFE_LIVE_NOT_PERFORMED = true as const;
export const TYPESAFE_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
