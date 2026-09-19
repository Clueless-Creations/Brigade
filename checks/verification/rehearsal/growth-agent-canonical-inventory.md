# Growth-agent canonical-operation inventory (#116)

Owner: #116. Status: durable inventory for ADR-0013 proving-provider audit.
Main pin at land: `990f010c3a768047ed70857e49c8e26ee495c369` / `b2c-app-builder@0.221.23` → stamp `0.221.24`.
Fixture pins: Layers `layers.fixtures` + recorded-tool inventory (no invented `tools/list` schemas); Postiz **#24** `postiz-extension.fixtures` + official API shapes; PostHog Wizard `41c12328…` + Context Mill `bbc88864…` upstream/probe only (no new executor).
Typed module: `catalog/providers/growth-agent-canonical-map.ts`.
ADR: `docs/decisions/0013-provider-integration-boundary.md` · Guide: `docs/guides/provider-integrations.md`.

## Authority / evidence holds

| Class | Allowed this slice | Notes |
| --- | --- | --- |
| Independent fixture / reviewed schema pin | Yes | Layers + #24 Postiz + PostHog upstream/probe |
| Synthetic / fake transport wiring | Yes | Routing only; **fake ≠ contract** / ≠ live support |
| Layers spend/boundary fixtures | Yes | Existing; no live credits |
| Postiz #24 extension fixtures | Yes | Manual/fake; no live account |
| PostHog upstream / probe / attribution | Yes | No new executor; no customer-data query |
| Live PostHog / Layers / Postiz observe | **No** (HoE settle) | `live-held` |
| Live social publish / experiment launch / customer-data query / provider sign-in / new paid service | **No** | Issue non-goals |
| Invented `b2c/analytics.*` / `b2c/growth.*` / `b2c/social.*` executors | **No** | Hard non-goal |
| Generic MCP registry / second execution store | **No** | Hard non-goal |

`fixture ≠ synthetic-routing ≠ upstream-guidance ≠ fake-wiring ≠ live-held ≠ customer-data-held ≠ experiment-launch-held ≠ public-publish-held`.
Effect classes: `analytics-read ≠ experiment-mutation ≠ schedule ≠ public-publish ≠ spend ≠ account-connect ≠ guidance ≠ operator-capture ≠ observe`.
`--yes` / `--non-interactive` never grants authority.

## Logical seams (ADR-0013)

| Role | Owner |
| --- | --- |
| definition | growth-agent-canonical-map + layers-growth/postiz-social extension + posthog upstreams |
| encoder | adapters/providers/layers + postiz-social (PostHog: none — not composition executor) |
| transport | createFakeLayersTransport \| Postiz fake (#24) \| PostHog probe (founder-gated) |
| decoder | Layers job/result normalize + postiz schemas; probe proof artifact only |
| reconciler | OperationRouteRegistry via existing Layers routes + Postiz extension; no second store |

No generic MCP registry. No second execution store / scheduler.

## Native → canonical/extension → fit/limits → evidence (summary)

| Seam | Native (examples) | Canonical or extension | Fit | Evidence | Disposition |
| --- | --- | --- | --- | --- | --- |
| PostHog Wizard | adapted-method setup/audit | none | guidance | upstream-guidance | **guidance** (≠ executor) |
| PostHog Context Mill | selected-skill-guidance; ops [] | none | unsupported | upstream-guidance | **held** (rights) |
| Hosted console PostHog | builder-console analytics | none | n/a | fixture | implement (operator only) |
| Consumer probe/SDK | probe-posthog + posthog-js | none | partial | fixture / customer-data-held | held (no public execute ops) |
| PostHog experiment launch | experiment / flag mutate | none | unsupported | experiment-launch-held | **held** |
| Invented analytics executor | `b2c/analytics.*` etc. | none | n/a | fixture | **reject** |
| Layers | `render_content` draft | `layers-growth/creative.draft-creative` | extension | fixture | extension (spend) |
| Layers | job / result reads | `…get-job` / `…get-result` | extension | fixture | extension (observe) |
| Layers | `deliver_content_experiment` | none | unsupported | public-publish-held | **held** |
| Layers | tools/list drift / new tools | none | n/a | fixture | **reject** (no auto-expand) |
| Postiz #24 | draft / schedule / list / delete | `postiz-social/posts.*` | extension | fixture | extension (manual; no live) |
| Postiz live publish | account/OAuth/live publish | none | unsupported | public-publish-held | **held** (do not reopen #24) |
| Shared | generic MCP registry / second store | none | n/a | fixture | **reject** |

## #24 ADR-0013 lifecycle reconcile

Postiz (#24 CLOSED via #419) follows ADR-0013 + `docs/guides/provider-integrations.md` + #110 conformance:

- Source/fixture + independent native fixtures are required.
- **Fake transport only is not sufficient proof of live support.**
- Live account connect / OAuth / schedule / publish / delete stays out of #24 and #116 scope.
- This audit reconciles wording only — **does not reopen #24** as live work.

## KTDs locked

- Knowledge/skills ≠ execution/authority (Wizard / Context Mill / growth skills).
- Workflows ≠ MCP/API/CLI native types (prose may cite `provider.posthog`).
- Fake MCP/API ≠ contract.
- Discovery ≠ auto-expand.
- Effect classes remain distinct.
- #24 reconciled with ADR lifecycle — no live expand.
- No generic MCP/provider registry; no second execution store.
- PostHog is not a composition executor (default).
- Layers is the primary executable growth seam; no invented official schemas.
- After #116 close: **provider-audit bucket (#113–#116) COMPLETE** — do not invent U4.

## Owners preserved

| Issue | Role |
| --- | --- |
| #24 | Postiz adoption (CLOSED) — consume extension + fixtures; reconcile lifecycle only |
| #75 | Knowledge retrieval (OPEN) — **not** stolen |
| #117 | Shared inventory (CLOSED) — consume |
| #113–#115 | Prior provider audits (CLOSED) — not reopened |
| #116 | Growth/agent canonical-operation boundary audit (this inventory) |
| U4 | Program next — **separate** deepen; not invented here |

## Fail-safe classes (deterministic)

Covered by `adapters/providers/growth-agent/fail-safe.ts` + `growth-agent-canonical-boundary` fixtures:

1. Wrong project/connection → refuse
2. Stale analytics window → hold
3. Schema drift → refuse (no auto-expand)
4. Newly exposed upstream tool / silent discovery expand → refuse
5. Uncertain schedule result → refuse (reconcile before retry)
6. Uncertain publish result → refuse (reconcile before retry)
7. Connection loss → hold
8. Pagination / partial output → hold
9. Effect-class collapse → refuse
10. `--yes` without authority → fail-closed; live protected never authorized by flags
11. Knowledge claiming routes/grants → illegal
12. Hosted console as consumer provider → illegal
13. Fake Postiz transport claiming live support → dishonest

## Architecture review checklist (ADR-0013)

- [x] Executable behavior maps to canonical ops or explicit extensions (Layers + Postiz); PostHog stays guidance/operator/probe
- [x] Knowledge/skills subordinate; not execution/authority owners
- [x] Core workflows do not import/provider-branch on MCP/API/CLI native types
- [x] Independent fixtures; fake ≠ contract; no invented Layers schemas; no PostHog executor
- [x] Remote discovery cannot silently widen support
- [x] Read / experiment mutation / schedule / public publish / spend / account-connect distinct
- [x] #24 reconciled with ADR-0013 lifecycle (no live expand)
- [x] No generic MCP/provider registry or second execution store
- [x] Live publish / experiment / customer-data / sign-in held
- [x] U4 not started; after close audit bucket COMPLETE

## Next

After #116 closes: **STOP — provider-audit sequence #113–#116 COMPLETE.**
Next program unit = **U4 greenfield/proof** deepen SEPARATE when HoE dispatches — do not invent here.
