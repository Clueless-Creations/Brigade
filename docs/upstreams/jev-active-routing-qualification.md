# Jev active routing qualification (#571)

**Stamp:** `0.221.51`  
**Epic:** #511 (remains open)  
**Next after close:** #573 (do not start until HoE orders)  
**Mode:** paper / synthetic — **live not performed**

## What this unit proves

Jev can be selected through the existing provider-neutral semantic binding for
_assessment_ of build-routing questions. The supported tuple is assembled from
#513 (qualify map) and #515 (adapter), not from a parallel Jev runtime:

| Dimension          | Value (paper)                              | Owner       |
| ------------------ | ------------------------------------------ | ----------- |
| Model alias        | `jev-latest` (pin unconfirmed)             | #513        |
| Endpoint / gateway | `https://api.typesafe.ai` + SystemOne path | #513 / #515 |
| SDK / API versions | npm `0.6.0`, python `0.7.0`, envelope `1`  | #513        |
| Adapter revision   | `0.221.34`                                 | #515        |

Selection states stay distinct: `unselected` / `unconfigured` / `unavailable` /
`ready`. Host selection is explicit; auto-select is forbidden. Exact identity,
arithmetic, authorization, hashes and deterministic schema checks never reach a
model.

## Evidence classes (kept separate)

- **Official public docs** — sanitized SystemOne envelopes from docs.typesafe.ai
  (#513 fixtures) decoded by the #515 strict decoder.
- **Fake wiring** — encoder/decoder round-trips authored here; proves plumbing,
  not the provider.
- **Authorized live provider proof** — **not performed** on this path.

Malformed / missing / duplicate / unsupported responses fail by named class.
Unknown / unconfigured / unselected remain distinct from those failure classes.

## Frozen routing eval + async fanout

A frozen family-specific corpus (true no-match, candidate omission, confidently
wrong, injection, escalation, …) is evaluated before any threshold tuning. No
accuracy, latency or reliability claim is made from nine synthetic cases.

Async fanout reuses #518 admission / concurrency / rate / deadline / cancel /
recovery. Synchronous barrier-only fixtures are not treated as live parallel
proof.

## Handoff for #573 (interface only)

`kernel/services/jev-active-routing-qualification.ts` exports a consumable
qualified-decision surface (`JEV_573_HANDOFF_SURFACE`, `seededQualifiedDecisions`,
`toQualifiedRoutingDecision`, …). #573 can import decisions without a frontier
agent reinterpretation wrapper. This unit does **not** implement the active
loop. Executor freshness and authority rechecks remain mandatory.

## Product Profile consumer

`productProfileValidationConsumer` proves a Profile validation consumer when a
contract version is supplied (#565/#566). While the contract is pending, the
consumer reports `pending-contract` and does **not** become the sole definition
of Jev support.

## Passive reads and authority

Passive status / plan / discovery / profile-query / knowledge-query surfaces
issue zero inference requests and mutate no run state. Active decisions keep
inference and policy receipts. Release and acceptance authority, source-proof
invalidation and required independent review stay with existing owners — Jev
does not grant authority and is not product truth. A cache hit is not a grant.

## Coordination

- Reuses #512–#524; does not rewrite #524 ranking.
- Coordinates with architecture docs #574; does not replace them as product code.
- Does **not** epic 511 remains open. Does **not** implement #573.
- Box npm publish: HOLD. No App Review / prices / Formation.

## Supported public statement (performed proof only)

Jev is selectable through the existing provider-neutral binding with a
documented four-dimension tuple; official envelopes decode; wiring round-trips;
live authenticated behaviour and family promotion past shadow are **unproven**
here.
