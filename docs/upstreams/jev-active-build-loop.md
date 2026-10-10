# Jev active build loop (#573)

**Stamp:** 0.221.52  
**Mode:** paper / synthetic — live assessment **not** performed  
**Consumes:** #524 ranking slice · #523 staged safety/rollout · #571 Jev qualification handoff  
**Coord:** #574 decision-router architecture docs remain **proposed** until review (not a shipped public API; no imaginary commands)  
**Epic:** epic 511 remains open

## What this path is

The target is an admitted build that uses qualified decisions to choose work, observations, and repairs. The current helper models that selection with synthetic observations and decisions. `runOfflineObservationStep` returns a description of an action; it does not execute a worker or change app source.

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

## What the local checks cover

1. Changed observations produce different selected-action descriptions.
2. Checkpoint values retain supplied source revisions, ownership identifiers, and synthetic receipt identifiers.
3. Policy helpers refuse stale selections, missing grants, wrong bindings, unsupported modalities, and no-match results.
4. Route helpers retain bounded fallback and prevent PATH presence from activating a route.
5. No-network asynchronous work exercises the existing batch settlement and ownership helpers.
6. Cancellation and deadlines retain one outcome per candidate, including candidates that never dispatched.
7. Round counts and paper cost estimates include only dispatched work. Failed and cancelled requests remain counted.
8. Loop helpers enforce iteration, no-progress, and fairness bounds.
9. Review helpers refuse missing independent review or required device evidence.

Run the checks with `npm run test:fixtures -- jev-active-build-loop`. The runner waits for asynchronous checks before reporting results or removing temporary files.

The frozen baseline reports modeled outcomes and unknown live cost. It does not measure repaired source, customer success, or human time saved. File-presence checks establish discoverable repository references; they do not establish fresh installed-agent behavior.

## What this does **not** claim

- No authenticated live Jev request, key provision, or spend on this path.
- Live paid Jev qualification remains separately authorized under #571.
- `#574` architecture is proposed — not product code and not a public command surface.
- A Choice winner is not proof any candidate applies.
- Confidence is not calibrated truth; strict shape is not product truth.
- epic 511 remains open after this unit; NEXT_AFTER is `#574` docs coordination only.

## Hard bans

No second router/compiler/scheduler/state store · no rewrite of #524 · no recreate of #571 · no nested supervisory sessions · no self-editing live policy · no generated commands/paths/credentials/authority passed to execution · kernel does not import nested `adapters/providers/typesafe/` (flat `typesafe-semantic.ts` only if needed).
