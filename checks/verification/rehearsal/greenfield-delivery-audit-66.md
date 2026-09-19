# Greenfield delivery-audit framework (#66 / U4-1 umbrella)

Owner: **#66**. Status: tip framework + residual map + sequence lock.
Main pin at land: `d3bd0b5fba5381bb4787bfeb79e3f3c9cc5dbfeb` / `b2c-app-builder@0.221.24` → stamp **0.221.25**.
Typed module: `catalog/providers/greenfield-delivery-audit-map.ts`.
Boundary: `adapters/greenfield/`.
Fixtures: `checks/verification/fixtures/greenfield-delivery-audit-66.fixtures.ts`.

This slice establishes the umbrella **framework** only. It does **not** implement
sibling issues, run a live greenfield benchmark, consolidate workflows, invent
search/vector infra, or start U5/#511.

## Three pillars

| Pillar | Honesty rule | Consume (do not rebuild) |
| --- | --- | --- |
| Intent preservation | Intent ≠ docs padding / packet shape / checklist density | #74 proof-strength (`structural ≠ semantic ≠ runtime`) |
| Overhead measurable | Workflow-count reduction alone ≠ savings; Stage A retain | #73 `workflow-overhead-boundaries.md` |
| E2E proof framework | delivery ≠ submission-readiness ≠ submitted ≠ released ≠ live; fixture/screenshot/protocol-alone ≠ live | #72 protocol + complete-business authoring + lifecycle/init public tests + EVIDENCE.md |

`fixture ≠ screenshot ≠ protocol-doc ≠ lifecycle-public-test ≠ criteria-frozen-authoring ≠ delivery-accepted ≠ submission-readiness ≠ submitted ≠ released ≠ live-complete-business ≠ publish-of-evidence`.

`liveLaunchProven` must **not** flip from synthetic / CI / Tuck / protocol success.

## Landed vs residual (Program acceptance ownership)

### Closed children (consume; do not reopen)

| Issue | State | Note |
| --- | --- | --- |
| #67 | CLOSED | Onboarding funnel / billing follow accepted product |
| #68 | CLOSED | Actionable blockers / dispatch briefs / founder questions |
| #69 | CLOSED | DESIGN.md ownership / platform scope |
| #74 | CLOSED | Proof-strength structural/semantic/runtime — **skip** |
| #77 | CLOSED | Graph responsibilities / agent-overlay derivation |
| #78 | CLOSED | Complexity earns its keep via observed failures |

### Open children (residual owners; stay open after #66)

| Issue | Residual | Pillar touch |
| --- | --- | --- |
| #70 | Surface / applicability deepen — **next after #66** | intent |
| #71 | Planning→execution handoff + authorized stop lines | intent + e2e |
| #73 | Measured overhead; consolidation only after interval | overhead |
| #75 | Retrieval eval before search infra | overhead |
| #76 | Change-impact propagation | intent |
| #72 | Live complete-business benchmark + publish-of-evidence — **last** | e2e |

### Program acceptance rows

| Row | Tip status | Owner |
| --- | --- | --- |
| Audit points map to child/owner | framework-in-66 | #66-framework |
| Child handoffs with entry points | framework-in-66 | #66-framework |
| Defects fixed or rejected with evidence | residual-open-child | #70 |
| Recommendations measured, not compulsory architecture | residual-open-child | #73 |
| Real business run separates delivery / submission / release / live | residual-open-child | #72 |
| Founder decisions vs avoidable builder rescues | residual-open-child | #71 |
| Simplification preserves scope/craft/authority/evidence/recovery/review | residual-open-child | #73 |

Closing **#66** closes the **umbrella framework**, not the open children.

## U4 remaining sequence lock

```
#70 → #71 → #73 → #75 → #76 → #72 last
```

- Skip **#74 CLOSED**
- **No U5 / #511** until HoE orders
- One-issue deepen / WIP
- Live + publish-of-evidence → **#72** only
- After #66: **STOP → #70 deepen separate**

## Hard holds (this slice)

- Live greenfield benchmark / publish-of-evidence
- `liveLaunchProven` from synthetic success
- Sibling implementations (#70/#71/#72/#73/#75/#76)
- Workflow consolidation / recipe merges
- New search/vector/embeddings infra
- Second planner / scheduler / execution store / proof ontology
- Formation / App Review / prices / credentials
- Reopening closed children
- Claiming complete-business from CI / fixtures / Tuck / protocol alone

## Consumed surfaces (pointers)

- `checks/verification/fixtures/proof-strength.fixtures.ts`
- `checks/verification/fixtures/complete-business-benchmark.fixtures.ts`
- `checks/verification/rehearsal/greenfield-benchmark.md`
- `checks/verification/rehearsal/workflow-overhead-boundaries.md`
- `checks/verification/rehearsal/EVIDENCE.md`
- `checks/verification/public-api/lifecycle.test.ts`
- `checks/verification/public-api/initialization.test.ts`

## Next

Parent Shepherd: merge PR → handoff comment → **close #66** → **STOP → #70 deepen separate**.
