/**
 * #515 SQ-04 TypeSafe adapter fixtures (paper; no live).
 *
 * Separates official-source encode/decode conformance from fake-transport wiring,
 * fail-closed modes, availability distinctness, passive zero-inference, and
 * live-not-performed honesty. Never opens a socket or invents credentials.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import {
  TYPESAFE_OFFICIAL_DOC_FIXTURES,
  TYPESAFE_TRANSPORT_RECOMMENDATION,
  TYPESAFE_LIVE_NOT_PERFORMED,
  TYPESAFE_ENV_REQUIRED,
  typesafeDispositionCounts,
} from "../../../catalog/providers/typesafe-qualify-map.js";
import { withQuestionPackContentDigest, type QuestionPack } from "../../../contracts/semantic/question-pack.js";
import {
  TYPESAFE_ADAPTER_STAMP,
  TYPESAFE_ADAPTER_ISSUE,
  TYPESAFE_ADAPTER_EPIC,
  TYPESAFE_ADAPTER_CONSUMES,
  TYPESAFE_AVAILABILITY_STATES,
  typesafeSupportDeclaration,
  resolveTypesafeAvailability,
  typesafeCapabilityEmulationForbidden,
} from "../../../adapters/providers/typesafe/support.js";
import { encodeTypesafeRequest } from "../../../adapters/providers/typesafe/encode.js";
import { decodeTypesafeResponse, mapTypesafeHttpStatus } from "../../../adapters/providers/typesafe/decode.js";
import { createFakeTypesafeTransport } from "../../../adapters/providers/typesafe/transport.js";
import { resolveTypesafeConnection, redactSecrets } from "../../../adapters/providers/typesafe/connection.js";
import {
  assessWithTypesafe,
  typesafePassiveCall,
  TYPESAFE_LIVE_NOT_PERFORMED as ADAPTER_LIVE_NOT_PERFORMED,
} from "../../../adapters/providers/typesafe/assess.js";
import { typesafeSelectedBindingCoverage } from "../../../adapters/providers/typesafe/binding.js";
import { TYPESAFE_DEFAULT_EFFECTS } from "../../../adapters/providers/typesafe/effects.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const emptyEnv = { get: (): string | undefined => undefined };
const configuredEnv = {
  get: (name: string): string | undefined => (name === "TYPESAFE_API_KEY" ? "test-key-not-a-secret" : undefined),
};

function officialPack(): QuestionPack {
  return withQuestionPackContentDigest({
    schemaVersion: 1,
    id: "pack.typesafe.official",
    version: "1.0.0",
    title: "TypeSafe official-doc conformance",
    instructions: "Assess the support ticket.",
    questions: [
      {
        id: "is_urgent",
        kind: "noul",
        instruction: "Does this convey urgency?",
        statePaths: ["ticket.body"],
        vocabulary: { kind: "noul", proposition: "The message conveys urgency." },
      },
      {
        id: "department",
        kind: "choice",
        instruction: "Which department should handle this?",
        statePaths: ["ticket.body"],
        vocabulary: {
          kind: "choice",
          options: [
            { id: "billing", label: "Billing" },
            { id: "technical", label: "Technical" },
            { id: "sales", label: "Sales" },
          ],
        },
      },
      {
        id: "frustration",
        kind: "score",
        instruction: "How frustrated is the customer?",
        statePaths: ["ticket.body"],
        vocabulary: {
          kind: "score",
          levels: [
            { level: 0, label: "Calm" },
            { level: 1, label: "Frustrated" },
            { level: 2, label: "Very angry" },
          ],
        },
      },
    ],
    projections: [{ id: "ticket", statePaths: ["ticket.body"], required: true }],
  });
}

function singleQuestionPack(questionId: string): QuestionPack {
  const pack = officialPack();
  const question = pack.questions.find((entry) => entry.id === questionId);
  assert(question !== undefined, `question ${questionId} present`);
  return withQuestionPackContentDigest({
    ...pack,
    id: `pack.typesafe.${questionId}`,
    questions: [question!],
  });
}

export function register(harness: Harness): void {
  harness.check("typesafe-adapter: support declaration honors #513 dispositions (implement 5 / defer 3 / reject 3)", () => {
    const support = typesafeSupportDeclaration();
    assert(support.issue === "#515", "issue #515");
    assert(TYPESAFE_ADAPTER_ISSUE === "#515", "adapter issue const");
    assert(TYPESAFE_ADAPTER_EPIC === "#511", "epic #511");
    assert(TYPESAFE_ADAPTER_CONSUMES.includes("#512") && TYPESAFE_ADAPTER_CONSUMES.includes("#513"), "consumes 512+513");
    assert(support.transport === TYPESAFE_TRANSPORT_RECOMMENDATION, "transport matches qualify");
    assert(support.transport === "thin-direct-http", "thin-direct-http");
    assert(TYPESAFE_ADAPTER_STAMP === "0.221.34", "stamp 0.221.34");
    assert(support.liveNotPerformed === true, "live not performed");
    const counts = typesafeDispositionCounts();
    assert(counts.implement === 5 && counts.defer === 3 && counts.reject === 3, "disposition counts");
    assert(support.dispositions.implement === 5, "support implement");
    assert(support.implemented.length === 5, "implemented length");
    assert(support.deferred.length === 3, "deferred length");
    assert(support.rejected.length === 3, "rejected length");
    assert(typesafeCapabilityEmulationForbidden("interactive-ultrafast-productize"), "reject not emulated");
    assert(typesafeCapabilityEmulationForbidden("model-alias-pin"), "defer not emulated");
  });

  harness.check("typesafe-adapter: official-source encoder conformance (separate from transport)", () => {
    const pack = officialPack();
    const encoded = encodeTypesafeRequest({
      pack,
      state: TYPESAFE_OFFICIAL_DOC_FIXTURES.noulRequest.state,
      model: TYPESAFE_OFFICIAL_DOC_FIXTURES.noulRequest.model,
    });
    assert(encoded.state === TYPESAFE_OFFICIAL_DOC_FIXTURES.noulRequest.state, "state mapped");
    assert(encoded.model === "jev-latest", "model mapped");
    assert(encoded.questions.is_urgent?.type === "noul", "noul encoded");
    assert(encoded.questions.department?.type === "choice", "choice encoded");
    assert(encoded.questions.frustration?.type === "score", "score encoded");
    const choice = encoded.questions.department;
    assert(choice !== undefined && choice.type === "choice", "choice present");
    if (choice && choice.type === "choice") {
      assert(choice.criteria.billing === "Billing", "billing criteria");
      assert(choice.criteria.technical === "Technical", "technical criteria");
    }
    assert(TYPESAFE_OFFICIAL_DOC_FIXTURES.evidenceClass === "official-public-docs", "evidence class");
    assert(TYPESAFE_OFFICIAL_DOC_FIXTURES.sourceUrl.includes("docs.typesafe.ai"), "source url");
  });

  harness.check("typesafe-adapter: official-source decoder conformance — noul/choice/score", () => {
    const noul = decodeTypesafeResponse({
      pack: singleQuestionPack("is_urgent"),
      response: TYPESAFE_OFFICIAL_DOC_FIXTURES.noulResponse,
      requestedModel: "jev-latest",
    });
    assert(noul.ok, "noul ok");
    if (noul.ok) {
      assert(noul.answers[0]?.kind === "noul", "noul kind");
      assert(noul.answers[0]?.kind === "noul" && noul.answers[0].probability === 0.92, "noul probability");
      assert(noul.observations[0]?.confidence === undefined, "noul confidence not fabricated");
      assert(noul.requestedModel === "jev-latest", "requested model");
      assert(noul.returnedModel === "jev-latest", "returned model");
      assert(noul.usageCost.status === "measured", "usage measured");
    }

    const choice = decodeTypesafeResponse({
      pack: singleQuestionPack("department"),
      response: TYPESAFE_OFFICIAL_DOC_FIXTURES.choiceResponse,
      requestedModel: "jev-latest",
    });
    assert(choice.ok, "choice ok");
    if (choice.ok) {
      assert(choice.answers[0]?.kind === "choice", "choice kind");
      assert(choice.answers[0]?.kind === "choice" && choice.answers[0].selectedOptionId === "technical", "selected");
      assert(choice.observations[0]?.confidence === 0.82, "choice confidence on observation");
    }

    const score = decodeTypesafeResponse({
      pack: singleQuestionPack("frustration"),
      response: TYPESAFE_OFFICIAL_DOC_FIXTURES.scoreResponse,
      requestedModel: "jev-latest",
    });
    assert(score.ok, "score ok");
    if (score.ok) {
      assert(score.answers[0]?.kind === "score", "score kind");
      assert(score.answers[0]?.kind === "score" && score.answers[0].expectation === 1.6, "expectation");
      assert(score.observations[0]?.confidence === 0.78, "score confidence on observation");
    }
  });

  harness.check("typesafe-adapter: fail-closed — missing/extra/NaN/invalid labels/malformed distributions/unsupported version", () => {
    const pack = singleQuestionPack("department");
    const base = TYPESAFE_OFFICIAL_DOC_FIXTURES.choiceResponse;

    const missing = decodeTypesafeResponse({ pack, response: { ...base, answers: {} }, requestedModel: "jev-latest" });
    assert(!missing.ok && missing.code === "missing_answer", "missing answer");

    const extra = decodeTypesafeResponse({
      pack,
      response: {
        ...base,
        answers: {
          ...base.answers,
          ghost: { type: "choice", choice: "billing", probabilities: { billing: 1, technical: 0, sales: 0 } },
        },
      },
      requestedModel: "jev-latest",
    });
    assert(!extra.ok && extra.code === "extra_answer", "extra answer");

    const nan = decodeTypesafeResponse({
      pack,
      response: {
        model: "jev-latest",
        answers: {
          department: {
            type: "choice",
            choice: "technical",
            probabilities: { billing: Number.NaN, technical: 0.85, sales: 0.07 },
          },
        },
      },
      requestedModel: "jev-latest",
    });
    assert(!nan.ok && nan.code === "choice_nan_or_oob", "NaN probability");

    const badLabel = decodeTypesafeResponse({
      pack,
      response: {
        model: "jev-latest",
        answers: {
          department: {
            type: "choice",
            choice: "not-a-department",
            probabilities: { billing: 0.1, technical: 0.8, sales: 0.1 },
          },
        },
      },
      requestedModel: "jev-latest",
    });
    assert(!badLabel.ok && badLabel.code === "choice_invalid_label", "invalid label");

    const malformed = decodeTypesafeResponse({
      pack,
      response: {
        model: "jev-latest",
        answers: {
          department: {
            type: "choice",
            choice: "technical",
            probabilities: { billing: 0.5, technical: 0.5 },
          },
        },
      },
      requestedModel: "jev-latest",
    });
    assert(!malformed.ok && malformed.code === "choice_missing_option", "malformed distribution");

    const unsupported = decodeTypesafeResponse({
      pack,
      response: { ...base, version: "99" },
      requestedModel: "jev-latest",
    });
    assert(!unsupported.ok && unsupported.status === "unsupported" && unsupported.code === "unsupported_version", "unsupported version");

    const scoreNan = decodeTypesafeResponse({
      pack: singleQuestionPack("frustration"),
      response: {
        model: "jev-latest",
        answers: {
          frustration: {
            type: "score",
            score: Number.NaN,
            legend: { "0": "Calm", "1": "Frustrated", "2": "Very angry" },
            probabilities: { "0": 0.05, "1": 0.3, "2": 0.65 },
          },
        },
      },
      requestedModel: "jev-latest",
    });
    assert(!scoreNan.ok && scoreNan.code === "score_nan", "score NaN");
  });

  harness.check("typesafe-adapter: fake-transport wiring separate from encode/decode conformance", async () => {
    const pack = singleQuestionPack("is_urgent");
    const fake = createFakeTypesafeTransport({
      responses: [{ status: 200, body: TYPESAFE_OFFICIAL_DOC_FIXTURES.noulResponse }],
    });
    const result = await assessWithTypesafe({
      pack,
      state: TYPESAFE_OFFICIAL_DOC_FIXTURES.noulRequest.state,
      selected: true,
      env: configuredEnv,
      transport: fake,
    });
    assert(result.ok, "assess ok");
    assert(fake.inferenceCallCount === 1, "one inference call");
    assert(fake.calls.length === 1, "one captured request");
    assert(fake.kind === "fake", "fake kind");
    if (result.ok) {
      assert(result.observation.transportKind === "fake", "transport kind fake");
      assert(result.observation.liveNotPerformed === true, "live not performed");
      assert(result.observation.requestedModel === "jev-latest", "requested model");
      assert(result.observation.returnedModel === "jev-latest", "returned model");
    }
  });

  harness.check("typesafe-adapter: unselected/unconfigured/unavailable remain distinct — no fallback", async () => {
    assert(TYPESAFE_AVAILABILITY_STATES.includes("unselected"), "unselected state");
    assert(TYPESAFE_AVAILABILITY_STATES.includes("unconfigured"), "unconfigured state");
    assert(TYPESAFE_AVAILABILITY_STATES.includes("unavailable"), "unavailable state");
    assert(TYPESAFE_AVAILABILITY_STATES.includes("ready"), "ready state");

    assert(resolveTypesafeAvailability({ selected: false, configured: false, available: true }) === "unselected", "unselected wins");
    assert(resolveTypesafeAvailability({ selected: true, configured: false, available: true }) === "unconfigured", "unconfigured");
    assert(resolveTypesafeAvailability({ selected: true, configured: true, available: false }) === "unavailable", "unavailable");
    assert(resolveTypesafeAvailability({ selected: true, configured: true, available: true }) === "ready", "ready");

    const pack = singleQuestionPack("is_urgent");
    const unselected = await assessWithTypesafe({ pack, state: "x", selected: false, env: emptyEnv });
    assert(!unselected.ok && unselected.availability === "unselected" && unselected.reason === "unselected", "assess unselected");

    const unconfigured = await assessWithTypesafe({ pack, state: "x", selected: true, env: emptyEnv });
    assert(!unconfigured.ok && unconfigured.availability === "unconfigured" && unconfigured.reason === "unconfigured", "assess unconfigured");

    const unavailable = await assessWithTypesafe({
      pack,
      state: "x",
      selected: true,
      available: false,
      env: configuredEnv,
    });
    assert(!unavailable.ok && unavailable.availability === "unavailable" && unavailable.reason === "unavailable", "assess unavailable");

    assert(!unselected.ok && !("results" in unselected), "unselected no results");
    assert(!unconfigured.ok && !("results" in unconfigured), "unconfigured no results");
    assert(!unavailable.ok && !("results" in unavailable), "unavailable no results");
  });

  harness.check("typesafe-adapter: deadline/cancel/rate-limit/oversized/uncertain — no secret leak, no invalid receipts", async () => {
    const pack = singleQuestionPack("is_urgent");
    const secret = "super-secret-key-do-not-leak";
    const env = { get: (name: string) => (name === "TYPESAFE_API_KEY" ? secret : undefined) };

    const timeout = await assessWithTypesafe({
      pack,
      state: "x",
      selected: true,
      env,
      transport: createFakeTypesafeTransport({ responses: [{ error: "timeout", afterDispatch: true }] }),
    });
    assert(!timeout.ok && timeout.reason === "transport-failed", "timeout fails");
    assert(!timeout.ok && timeout.code === "deadline_exceeded", "timeout code");
    assert(!timeout.ok && timeout.exactlyOnceBillingClaimed === false, "no exactly-once on timeout");
    assert(!JSON.stringify(timeout).includes(secret), "timeout no leak");

    const cancelled = await assessWithTypesafe({
      pack,
      state: "x",
      selected: true,
      env,
      transport: createFakeTypesafeTransport({ responses: [{ error: "abort", afterDispatch: true }] }),
    });
    assert(!cancelled.ok && cancelled.reason === "transport-failed", "cancel fails");
    assert(!cancelled.ok && cancelled.code === "cancelled", "cancel code");
    assert(!JSON.stringify(cancelled).includes(secret), "cancel no leak");

    const rated = await assessWithTypesafe({
      pack,
      state: "x",
      selected: true,
      env,
      transport: createFakeTypesafeTransport({ responses: [{ status: 429, body: { error: "rate_limited" } }] }),
    });
    assert(!rated.ok && rated.reason === "transport-failed", "429 fails");
    assert(mapTypesafeHttpStatus(429).code === "rate_limited", "429 map");
    assert(!JSON.stringify(rated).includes(secret), "429 no leak");

    const oversized = await assessWithTypesafe({
      pack,
      state: "x",
      selected: true,
      env,
      transport: createFakeTypesafeTransport({
        responses: [
          {
            status: 200,
            body: {
              model: "jev-latest",
              answers: { is_urgent: { type: "noul", noul: 0.5 } },
              pad: "x".repeat(600_000),
            },
          },
        ],
      }),
      effects: { ...TYPESAFE_DEFAULT_EFFECTS, allowedBaseUrl: "https://api.typesafe.ai", maxResponseBytes: 1024 },
    });
    assert(!oversized.ok, "oversized fails");
    assert(!JSON.stringify(oversized).includes(secret), "oversized no leak");

    const uncertain = await assessWithTypesafe({
      pack,
      state: "x",
      selected: true,
      env,
      transport: createFakeTypesafeTransport({ responses: [{ error: "uncertain", afterDispatch: true }] }),
    });
    assert(!uncertain.ok && uncertain.reason === "transport-failed", "uncertain fails");
    assert(!uncertain.ok && uncertain.code === "uncertain_dispatch", "uncertain code");
    assert(!uncertain.ok && uncertain.exactlyOnceBillingClaimed === false, "no exactly-once on uncertain");
    assert(!JSON.stringify(uncertain).includes(secret), "uncertain no leak");

    const redacted = redactSecrets(`Bearer ${secret} and TYPESAFE_API_KEY=${secret}`, secret);
    assert(!redacted.includes(secret), "redact strips");
    assert(redacted.includes("[REDACTED]"), "redact marker");

    const invalid = await assessWithTypesafe({
      pack,
      state: "x",
      selected: true,
      env,
      transport: createFakeTypesafeTransport({
        responses: [{ status: 200, body: { model: "jev-latest", answers: { is_urgent: { type: "noul", noul: 2 } } } }],
      }),
    });
    assert(!invalid.ok && invalid.reason === "decode-failed", "invalid noul rejected");
  });

  harness.check("typesafe-adapter: passive status/plan/knowledge execute zero inference requests", () => {
    const fake = createFakeTypesafeTransport({
      responses: [{ status: 200, body: TYPESAFE_OFFICIAL_DOC_FIXTURES.noulResponse }],
    });
    for (const kind of ["status", "plan", "knowledge"] as const) {
      const result = typesafePassiveCall({ kind }, { selected: true, env: configuredEnv });
      assert(result.inferenceRequests === 0, `${kind} zero inference`);
      assert(result.liveNotPerformed === true, `${kind} live not performed`);
    }
    assert(fake.inferenceCallCount === 0, "fake untouched");
  });

  harness.check("typesafe-adapter: selected-binding coverage + live-not-performed + module presence", () => {
    const binding = typesafeSelectedBindingCoverage();
    assert(binding.authorityClass === "selected-binding", "selected-binding");
    assert(binding.architectureOwnerIssue === "#109", "coordinates #109");
    assert(binding.doesNotReplaceProviderArchitecture === true, "does not replace #109");
    assert(binding.autoSelectForbidden === true, "no auto-select");
    assert(binding.liveNotPerformed === true, "binding live not performed");
    assert(binding.stamp === "0.221.34", "binding stamp");
    assert(ADAPTER_LIVE_NOT_PERFORMED === true, "adapter live flag");
    assert(TYPESAFE_LIVE_NOT_PERFORMED === true, "qualify live flag");
    assert(TYPESAFE_ENV_REQUIRED[0] === "TYPESAFE_API_KEY", "env name only");
    assert(existsSync(path.join(skillRoot, "adapters/providers/typesafe/index.ts")), "index");
    assert(existsSync(path.join(skillRoot, "adapters/providers/typesafe/encode.ts")), "encode");
    assert(existsSync(path.join(skillRoot, "adapters/providers/typesafe/decode.ts")), "decode");
    assert(existsSync(path.join(skillRoot, "adapters/providers/typesafe/transport.ts")), "transport");
    assert(existsSync(path.join(skillRoot, "adapters/providers/typesafe/assess.ts")), "assess");
    assert(existsSync(path.join(skillRoot, "adapters/providers/typesafe/binding.ts")), "binding");
    const connection = resolveTypesafeConnection({ selected: false, env: emptyEnv });
    assert(connection.availability === "unselected", "connection unselected");
    assert(connection.apiKeyPresent === false, "empty env key absent");
  });

  harness.check("typesafe-adapter: HTTP error map (M5) + batch encode (M4)", () => {
    assert(mapTypesafeHttpStatus(429).code === "rate_limited", "429");
    assert(mapTypesafeHttpStatus(401).code === "auth_rejected" || mapTypesafeHttpStatus(401).failureStatus === "unsupported", "401");
    assert(mapTypesafeHttpStatus(422).code === "validation_rejected" || mapTypesafeHttpStatus(422).failureStatus === "invalid-response", "422");
    assert(mapTypesafeHttpStatus(529).code === "upstream_unavailable" || mapTypesafeHttpStatus(529).retryable === true, "529");
    const encoded = encodeTypesafeRequest({ pack: officialPack(), state: "batch state" });
    assert(Object.keys(encoded.questions).length === 3, "batch encodes three questions");
  });
}
