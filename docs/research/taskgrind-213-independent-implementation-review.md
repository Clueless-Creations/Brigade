# Independent implementation review — #213 TaskGrind qualify + optional managed beta

**Reviewed tip intent:** stamp `0.221.61` on base `ee1e358`  
**Date:** 2026-09-20 (CT)  
**Scope:** Architecture / provenance / honesty for U6 #213 only

## Verdict

**Accept for safe source merge** subject to CI green and Shepherd merge. Live human-beta proof is **not** claimed and must remain a separate authorization hold.

## Architecture

- ADR-0013 lifecycle followed: discover → qualify (hold) → map → implement verified mode only.
- No speculative TaskGrind adapter, invented endpoints, or UI scrape.
- Provider-neutral operator-assisted semantics live in `kernel/services/human-beta-recruitment.ts`; provider-native types are absent (correct under hold).
- Selection uses explicit binding prefix; vendor-global flag refused.
- `engineering/APP_QUALITY.md` remains quality summary owner; human-beta guidance is a companion, not a competing ledger.
- Recruitment does not authorize distribution or substitute for release / a11y / crash-free / organic-demand proof.

## Provenance

- Upstream `catalog/upstreams/taskgrind.yaml` is deferred with explicit reconsider_when.
- Observation records homepage inaccessibility and unknowns without fabricating releases.
- Source-registry row is tracking-only.
- Evidence classes (source / fixture / assisted / live) are separated in qualification + rehearsal docs.

## Honesty residuals

- TaskGrind product identity remains unresolved pending authoritative access.
- Operator-assisted brief/handoff is not remote campaign proof.
- Imported observed counts do not lift handoff stage unknowns.
- Cancel ≠ refund; refund semantics stay unknown under hold.
- Next unit #6 must not start without HoE order. npm publish remains #26/CoS.
- No npm publish under this issue.

## Required privacy/failure coverage

Fixtures cover no-beta, other-provider, qualification hold, stale approval invalidation, untrusted tester input, path traversal, executable attachments, unsafe URLs, cross-workspace isolation, uncertain-write no blind retry, cancel/refund distinction, minors refuse, and no count inference.

## Conclusion

Safe implementation meets #213 closure bar for qualification-hold + verified assisted mode. Do **not** merge from executor; Shepherd merges when CI green. Do **not** close #213 from executor. Do **not** start #6.
