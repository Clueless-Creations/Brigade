# Jev active build loop (#573)

**Stamp:** 0.221.52  
**Mode:** paper / synthetic — live assessment **not** performed  
**Consumes:** #524 ranking slice · #523 staged safety/rollout · #571 Jev qualification handoff  
**Coord:** #574 decision-router architecture docs remain **proposed** until review (not a shipped public API; no imaginary commands)  
**Epic:** epic 511 remains open

## What this path is

An admitted build uses **qualified** semantic decisions to **choose and execute** the next useful work, context, worker/tool route, observation or repair. A meaningful result requests the next decision. This is **active build routing**, not only ranking or final validation.

Jev (TypeSafe System One) is reached only through the existing provider-neutral semantic binding and stays **swappable**. Jev is neither the authority owner nor the source of product truth.

## Fresh-agent entry

| Artifact                    | Path                                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| Recipe / policy             | `catalog/workflows/jev-active-build-loop.ts`                                      |
| AC → evidence map           | `catalog/providers/jev-active-build-loop-map.ts`                                  |
| Service                     | `kernel/services/jev-active-build-loop.ts`                                        |
| Fixtures                    | `checks/verification/fixtures/jev-active-build-loop.fixtures.ts`                  |
| Prior qualification handoff | `kernel/services/jev-active-routing-qualification.ts` (`JEV_573_HANDOFF_SURFACE`) |

No pasted architecture prompt is required. No new public CLI/MCP command is invented while implementation is pending review of #574.

## Guarantees this paper proof establishes

1. A **changed observation** changes the next **executed** action (not only a displayed rank).
2. Build-level and within-task checkpoints **share ownership and receipts**.
3. An **admitted** active policy continues reversible work **without frontier re-approval** of each Jev answer (executor still rechecks freshness/authority before dispatch).
4. New/unknown problems reach **bounded** evidence gathering or generative fallback — never arbitrary effects; PATH credentials do not activate routes.
5. **Passive reads** issue zero inference requests; **stale** selections refuse dispatch.
6. **Real async** covers independent/dependent rounds, concurrency/rate/deadline limits, cancellation, late results and partial failures via existing `#518` batch/ownership owners.
7. Wrong binding, unsupported modality, missing grant, contradictory evidence and **no-match** stay explicit.
8. Loop / no-progress / fairness cases terminate within declared bounds.
9. **Independent review** and required provider/device evidence remain mandatory.
10. Fresh installed agents can find this path from catalog markers and this doc.
11. Frozen baseline reports completed outcomes, cost honesty (actual/estimated/unknown), correction effort and limitations (missing haptic proof stays **unknown**).

## What this does **not** claim

- No authenticated live Jev request, key provision, or spend on this path.
- Live paid Jev qualification remains separately authorized under #571.
- `#574` architecture is proposed — not product code and not a public command surface.
- A Choice winner is not proof any candidate applies.
- Confidence is not calibrated truth; strict shape is not product truth.
- epic 511 remains open after this unit; NEXT_AFTER is `#574` docs coordination only.

## Hard bans

No second router/compiler/scheduler/state store · no rewrite of #524 · no recreate of #571 · no nested supervisory sessions · no self-editing live policy · no generated commands/paths/credentials/authority passed to execution · kernel does not import nested `adapters/providers/typesafe/` (flat `typesafe-semantic.ts` only if needed).
