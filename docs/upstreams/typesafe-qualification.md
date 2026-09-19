# TypeSafe / Jev qualification (SQ-02 / #513)

**Status:** Paper qualification only. **Live assessment not performed.**  
**Consumes:** landed SQ-01 contracts under `contracts/semantic/` (#512 / PR #550).  
**Does not:** install a Brigade dependency, invent credentials, implement the #515 adapter, or claim marketing latency/cost as a Brigade SLA.  
**Upstream identity:** `catalog/upstreams/typesafe-ai.yaml`  
**Typed map:** `catalog/providers/typesafe-qualify-map.ts`  
**Fixtures:** `checks/verification/fixtures/typesafe-qualify.fixtures.ts`

This document is Brigade qualification evidence. Public pages at [docs.typesafe.ai](https://docs.typesafe.ai) are upstream patterns, not proof that Brigade has an executable provider.

## 1. Identity and baselines (distinct version facts)

| Fact | Value | Notes |
| --- | --- | --- |
| Service | TypeSafe System One (`POST https://api.typesafe.ai/v1/systemone`) | Bearer API key; remote assessment |
| Docs observation | Public docs read **2026-09-19** (CT) | Not an immutable git pin; page set recorded below |
| Python SDK release | **v0.7.0** / commit `2ce5c65f13646cab6e6f782328194c9d85f3300a` | MIT LICENSE notice retained; **not** installed in Brigade |
| npm JS SDK | **@typesafe-ai/sdk@0.6.0** (npm latest observed 2026-09-19) | Distinct from Python v0.7.0; **not** installed |
| Model aliases (docs) | `jev-latest` (default), `jev-preview` also listed in ops notes | Alias resolution / pin behavior **unconfirmed** for live |
| Box ops SDK (non-tip) | `/workspace/jev-ops` previously recorded `typesafe-sdk==0.6.0` | Ops knowledge only; does not pin Brigade |

A newer discovered release does **not** silently repin a workspace or mark this evidence invalid. Record new observations separately.

Reviewed public pages (2026-09-19): [llms.txt](https://docs.typesafe.ai/llms.txt), [API](https://docs.typesafe.ai/api), [Primitives](https://docs.typesafe.ai/primitives), [How to build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one), [Legal](https://docs.typesafe.ai/legal), [Python SDK](https://docs.typesafe.ai/sdk/python), [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript).

## 2. Native → SQ-01 mapping matrix

Target shapes: `contracts/semantic/` (`ChoiceAnswer` / `ScoreAnswer` / `NoulAnswer`, question-pack, receipts, failures).  
Native shapes: TypeSafe System One request/response per public API docs (sanitized examples in fixtures).

| # | Native | SQ-01 target | Fit | Auth / network / spend | Effects | Limitations | Fixture provenance | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M1 | Choice (`type:choice`, criteria map, answer `choice` + `probabilities` + `confidence`) | `choiceAnswerSchema` (`options[]` with id/label/probability, optional `selectedOptionId`) | **partial** — map criteria keys→option ids; probability object→array; native `confidence` has no field on SQ-01 ChoiceAnswer (carry via receipt/observation in #515, do not invent into answer) | Bearer; egress to api.typesafe.ai; **spend possible** | Remote inference; no local graph mutate from qualify | Confidence placement deferred to adapter receipt design | Official API doc Choice example (2026-09-19) | **implement** (#515 encodes/decodes) |
| M2 | Score (`type:score`, criteria array, answer `score` + `legend` + `probabilities` + `confidence`) | `scoreAnswerSchema` (`levels[]`, optional `expectation`) | **partial** — 0-based legend keys→level ints; `score` float→optional `expectation`; confidence not on SQ-01 ScoreAnswer | same | same | Level indexing and between-level scores need explicit decode rules | Official API doc Score example | **implement** |
| M3 | Noul (`type:noul`, answer `noul` ∈ [0,1], **no** native confidence) | `noulAnswerSchema` (`probability`, optional `confidence`) | **exact** for probability; absent confidence matches SQ-01 “never fabricate confidence” | same | same | Do not invent Noul confidence | Official API doc Noul example | **implement** |
| M4 | Batch: many questions, one `state`, parallel answers under ids | Question-pack / multi-result composition in code | **exact** pattern fit (fan-out); pack resource still Brigade-owned | same; token budget shared (~32k docs) | One remote call may answer many questions | Budget/rate unknowns block unbounded fan-out in live | Primitives + parallel-questions cookbook (cite) | **implement** |
| M5 | HTTP errors `401` / `422` / `429` / `529` | `SEMANTIC_FAILURE_STATUSES` (`invalid-response`, `timeout`, `cancelled`, `unsupported`, …) | **partial** — status→failure mapping table for adapter; not 1:1 | Auth failures vs validation vs rate limit | Fail closed; retries are host policy | Idempotency of retries **unconfirmed** | Official API errors table | **implement** (map) / live verify **defer** |
| M6 | Model field `jev-latest` (alias) | Receipt / observation model identity | **partial** | — | Version drift if alias moves | Alias→immutable model identity **unconfirmed** → blocks live claims that pin a model | Models docs cite | **defer** (confirm before live pin) |
| M7 | Auth via `TYPESAFE_API_KEY` (optional org alias `JEV_API_KEY`) | Out of SQ-01 answer contracts; binding concern | n/a | **Required for live**; secrets host-owned | Credential disclosure risk | Inventing/committing keys **rejected** | Wiring recipe (names only) | **defer** binding to #515 + CoS→Eduardo hosted path |
| M8 | Retention / training / deletion / ZDR | Out of answer contracts; live-data gate | **absent** settled fact | Customer payload transfer | Privacy effect | Legal pages cited; **unreviewed** for Brigade → **block live customer data** | docs.typesafe.ai/legal | **reject** live customer-payload until terms settled |
| M9 | Advertised ~100ms / cost ratios | Not a contract field | n/a | — | — | Marketing ≠ Brigade SLA | how-to-build docs | **reject** (as SLA) |
| M10 | Interactive / browser / jev-ultrafast | Not SQ-01 assessment boundary | n/a | — | — | Post-#515 only | cite jev-ops note 12 | **reject** (this unit) |
| M11 | Install `typesafe-sdk` / `@typesafe-ai/sdk` into Brigade `package.json` | Provider activation | n/a | — | Dependency / supply chain | Qualify without install is valid | package.json absence check | **defer** to #515 (may still choose thin API) |

**Disposition counts (this qualification):** implement **5** · defer **3** · reject **3**.

## 3. SDK vs thin direct API (recommendation only — no transport)

| Option | Pros | Cons | Host control |
| --- | --- | --- | --- |
| Official JS `@typesafe-ai/sdk` | Typed questions/answers; documented retries | Brigade would take a dependency in #515; abort/deadline hooks must be verified | Prefer only if deadline, cancellation, custom fetch, and response validation remain host-overridable |
| Official Python `typesafe-sdk` | Mature docs examples | Wrong runtime for Brigade TS kernel | Ops/local recipe only unless a Python worker is explicitly chosen later |
| Thin `POST /v1/systemone` | Minimal surface; host owns fetch, AbortSignal, timeouts, secret injection, Zod validation against SQ-01 | Reimplement retry/backoff already in SDKs | **Default recommendation** for #515 unless SDK hooks are proven sufficient |

**Recommendation for #515:** start from **thin direct HTTP** with host-controlled deadline/cancel/secrets/validation decoding into `contracts/semantic/`; optionally wrap official SDK later if it clearly preserves those controls. **Do not** bake SDK types into policy.

## 4. Independent fixtures and evidence class

| Artifact | Evidence class | Source revision |
| --- | --- | --- |
| Sanitized Choice/Score/Noul request+response JSON in qualify fixtures | **official-public-docs** | docs.typesafe.ai/api observed 2026-09-19 |
| Mapping disposition table (this doc + typed map) | **brigade-authored qualification** | tip after #513 |
| Live capture / paid response | **not performed** | — |

Fixtures assert dispositions, version-fact distinctness, unknowns-block-live, qualify-without-install, and wiring-recipe presence. They do **not** call the network and are **not** adapter-authored expected-native outputs.

## 5. Service behavior unknowns (block live where required)

| Topic | Public signal | Brigade stance |
| --- | --- | --- |
| Model version / alias | `jev-latest`, `jev-preview` named | **Unconfirmed** pin behavior → block live “pinned model” claims |
| Retention / training | Legal index: no-train statement; DPA/MCA linked; ZDR for enterprise | **Unreviewed** → block live customer payloads |
| Deletion support | Not confirmed in this read | **Unknown** → block assumptions |
| Rate limits | `429` / `529` documented; budgets not quantified here | **Unknown** budgets → bound live with explicit authority |
| Usage / cost reporting | `usage.input_tokens` / `output_tokens` in examples | Cost≠tokens; paid plan terms **unconfirmed** → no SLA; spend needs authority |
| Retries | SDK RetryPolicy; HTTP backoff guidance | Host must own retry/idempotency policy |
| Request correlation / idempotency | Not confirmed | **Unknown** → do not assume safe replay |
| Replay semantics | Docs emphasize self-consistency; not a Brigade guarantee | Do not claim bit-identical replay |

**Live-not-performed honesty:** this PR CI path makes **no** authenticated TypeSafe call and provisions **no** hosted key.

## 6. Eduardo local wiring recipe (required — no secrets)

For local experimentation **outside** Brigade package activation. Hosted production key remains **CoS→Eduardo** (env + Vercel/project). Jev free window documented residual → **2026-09-25**.

1. Read upstream how-to: [How to build with TypeSafe](https://docs.typesafe.ai/concepts/how-to-build-with-system-one) (also [fan-out](https://docs.typesafe.ai/patterns/fan-out), cookbooks as needed). Index: [docs.typesafe.ai](https://docs.typesafe.ai).
2. Optional install paths (ops/local only — **not** a Brigade dependency from #513):
   - `pip install typesafe-sdk` or `uv add typesafe-sdk`
   - `npm install @typesafe-ai/sdk` (Node ≥20)
   - Agent skill: `npx skills add typesafe-ai/skills --skill typesafe-ai`
3. Box ops notes (pointers only; **do not** copy `.env.local` secrets into the repo):
   - `/workspace/jev-ops/notes/01-quickstart.md`
   - `/workspace/jev-ops/notes/02-primitives.md`
   - `/workspace/jev-ops/notes/04-how-to-build.md`
   - `/workspace/jev-ops/notes/06-agent-skill.md`
   - `/workspace/jev-ops/notes/08-sdk-env-smoke.md`
4. Environment **names only** (never print values):
   - **Required by SDK:** `TYPESAFE_API_KEY`
   - **Optional org alias:** `JEV_API_KEY`
   - **Optional:** `TYPESAFE_BASE_URL` (docs default `https://api.typesafe.ai`), `TYPESAFE_DEFAULT_MODEL` (docs default `jev-latest`), `TYPESAFE_LOG_LEVEL`
5. Confirm without printing:

```bash
test -n "$TYPESAFE_API_KEY" && echo set || echo unset
```

6. Hosted key path: **CoS→Eduardo** provisions project/Vercel env when #515 live smoke or later proof needs it. Free → **2026-09-25** residual; this unit does **not** provision.
7. Interactive ultrafast ([browser-use/jev-ultrafast](https://github.com/browser-use/jev-ultrafast) + `/workspace/jev-ops/notes/12-jev-ultrafast-browser-use.md`): **cite only — post-#515**, not authorized here.

## 7. Acceptance map (#513)

| Acceptance | Evidence |
| --- | --- |
| Every mapping has effects, limitations, provenance, implement/defer/reject | §2 table + `typesafe-qualify-map.ts` |
| Version facts distinct | §1 + observation JSON + fixtures |
| Privacy/cost/version unknowns block live | §5 + unsupported_operations in upstream YAML |
| Qualify may defer/reject without install | M11 defer; no package dependency; fixtures |
| Contribution/upstream/credits/notice checks | `catalog/upstreams/typesafe-ai.yaml` + notice + render:credits |

## 8. Explicit non-claims

- Architecture docs / ADR-0016 ≠ qualification done (this package is the qualify evidence).
- `#512` contracts ≠ TypeSafe adopted.
- Fixtures ≠ live provider.
- No Formation / App Review / prices.
- After #513 closes: **STOP** — next deepen is **#515** (separate). Epic #511 stays open.
