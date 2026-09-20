# TaskGrind qualification (#213)

**Status:** Explicit **qualification hold**. Authoritative first-party access unavailable.  
**Dated:** 2026-09-20 (CT)  
**Issue:** #213 — Qualify TaskGrind, then optional managed beta recruitment via provider boundary  
**Stamp at land:** `0.221.61` · tip base `ee1e358`  
**Mode chosen under hold:** **operator-assisted handoff + attributable import/resume** (provider-neutral)  
**Live human-beta / account / spend / recruit:** **not performed** and **not authorized** by this issue

This document is Brigade Phase-1 qualification evidence. It does **not** invent TaskGrind endpoints, JSON, SDK types, or a speculative adapter. Public web research on 2026-09-20 did not establish an independently reviewable TaskGrind managed-beta product surface.

## 1. Phase-1 questions (binding)

| # | Question | Finding (2026-09-20) | Disposition |
| --- | --- | --- | --- |
| 1 | First-party interaction modes (API / SDK / export-import / permitted browser / operator-assisted) | No authoritative API, SDK, MCP, webhook, CLI, or permitted browser automation docs located. Homepage `https://www.taskgrind.com/` returned HTTP 500 to the fetch provider. Unrelated “Taskgrind” hits (coding guardrails; Valgrind tool) are **not** this candidate. | **hold** — only **operator-assisted** is truthfully available as a Brigade-owned mode |
| 2 | Supported operations (create/request recruitment, observe status, collect results, cancel/close, retrieve costs) | Unknown. No first-party operation list established. | **unknown** — do not invent operations |
| 3 | Identifiers / readback to reconcile uncertain writes | Unknown. No remote ID / readback contract established. | **unknown** — unpaid/uncertain writes must not auto-retry |
| 4 | Tester / platform / region / device / eligibility constraints | Unknown. | **unknown** |
| 5 | Pricing / fees / incentive semantics | Unknown. No public pricing or incentive terms established. | **unknown** — spend blocked |
| 6 | Privacy, recording, retention/deletion, automation terms | Unknown. No reviewed terms. | **unknown** — block personal/customer data and live recruit |
| 7 | Map to existing canonical operations vs additive contract | Provider-neutral managed recruitment maps to existing quality + execution/evidence owners via **operator-assisted handoff**. No new vendor-native adapter. APP_QUALITY remains quality summary owner. Distribution stays TestFlight/Play/web. | **implement** provider-neutral assisted path only |

## 2. Evidence classes (kept separate)

| Class | What this unit contains | What it is not |
| --- | --- | --- |
| **source** | This qualification record, upstream deferred manifest, AC map, human-beta guidance, operator-assisted service | Live TaskGrind integration |
| **fixture** | Deterministic synthetic selection / privacy / import / stale-approval / isolation cases | Provider conformance |
| **assisted** | Brief prep → pending handoff → attributable import → resume (labeled) | Remote proof that a campaign ran |
| **live** | **Not performed** | Do not claim human-beta proof |

## 3. Mode selection (ADR-0013 order)

1. Official API/SDK — **unavailable** (hold)  
2. Permitted browser-assisted — **unavailable** (no explicit provider permission / compatible boundary proven)  
3. **Operator-assisted handoff + attributable import/resume** — **chosen** and implemented as provider-neutral Brigade surface

Preparing a brief or showing a selection checkbox is **not** remote proof. A handoff stays `pending` until attributable external evidence is imported under workspace binding.

## 4. Native → canonical mapping (under hold)

| Native (TaskGrind) | Canonical / Brigade owner | Fit | Disposition |
| --- | --- | --- | --- |
| Unknown recruitment create | Operator-assisted brief + pending handoff (`kernel/services/human-beta-recruitment.ts`) | absent native | **defer** automated; **implement** assisted |
| Unknown status observe | Pending handoff state machine (unknown stays unknown) | absent | **defer** remote; local pending/imported only |
| Unknown result collect | Attributable import envelope (untrusted tester content) | absent | **implement** import boundary |
| Unknown cancel / refund | Distinct local cancel vs refund-unknown (no invent) | absent | **implement** distinction honesty |
| Unknown cost retrieve | Cost fields remain unknown unless imported with attribution | absent | **defer** |
| Vendor-global “enable TaskGrind” | Forbidden — selection via product/recipe/binding only | n/a | **reject** |

## 5. Architecture contract (preserved)

- Managed recruitment is **optional**; self-managed and other-provider remain valid.  
- TaskGrind is a **candidate**, selected only through existing binding mechanisms — never a vendor-global flag.  
- `engineering/APP_QUALITY.md` remains the quality summary owner — no competing TaskGrind ledger.  
- Recruitment does **not** authorize distribution (TestFlight/Play/web owners stay separate).  
- Paid feedback ≠ release approval / organic demand / a11y cert / crash-free proof.  
- Provider-native types terminate at provider boundary; none are invented here.  
- Never infer requested/enrolled/started/completed counts from each other.  
- Never blind-retry uncertain paid/recruitment writes.

## 6. Qualification hold — precise

**Hold id:** `taskgrind.qualification-authoritative-access-unavailable`  
**Reason:** No independently reviewable first-party TaskGrind API/SDK/docs/pricing/privacy/automation surface was established on 2026-09-20; homepage fetch failed (HTTP 500).  
**Blocks:** speculative TaskGrind adapter; live account/sign-in/terms; credits/spend; real tester contact/invite/recruit/pay; campaign publish; distributing real/private builds to externals; sending personal/customer data; creating external credentials; claiming live human-beta proof.  
**Reconsider when:** Founder supplies redacted walkthrough/export **or** authoritative first-party docs/API/SDK are available for re-qualification under ADR-0013.  
**Safe path that may land now:** provider-neutral operator-assisted planning + fixtures + optional binding selection + explicit hold.

## 7. Research notes (non-authoritative)

Attempted public lookups (2026-09-20 CT): `TaskGrind` beta/recruitment/API; `taskgrind.com` / `www.taskgrind.com` (HTTP 500); alternate spellings. Results did not yield a reviewable managed-beta product. Unrelated homonyms were discarded. No similarly named service was substituted.

## 8. Supported public statement (performed proof only)

Brigade records an explicit TaskGrind qualification hold, implements optional provider-neutral operator-assisted human-beta recruitment handoff/import on existing quality/execution owners, and does **not** claim live TaskGrind recruitment or human-beta proof under #213.
