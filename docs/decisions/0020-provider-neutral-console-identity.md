# 0020 — Provider-neutral hosted console identity (no email-only merge)

- **Status:** Decision A **accepted**; Decision B **proposed** (awaiting explicit founder/HoE provider pick on #6)
- **Date:** 2026-09-20
- **Steward:** U6 Skills/Astra #6 Phase-0 (provider-neutral console identity); Decision B pick is founder-reserved
- **Affected rules and contracts:** Hosted D1 identity (`hosted/knowledge-mcp/migrations/0001_identity_and_tenancy.sql`); console OAuth boundary (`hosted/builder-console/auth/`); tenant API (`hosted/knowledge-mcp/db/tenant.ts`); ARCH-12 identity-mapping discipline (analogy — do not invent cross-provider joins)
- **Affected units:** #6 (this); follow-on implementation after Decision B settles; recorded follow-up for `clueless-creations-site` `/signin` deep-link (other repo — not edited here)

## Context and evidence

Baseline: main `4963173f6efeff6a4bae627bb2ffb7e426210527` / package `0.221.61`.

Issue [#6](https://github.com/Clueless-Creations/Brigade/issues/6) requires the hosted console to support more than one OAuth/OIDC sign-in provider without coupling user identity to Google, and forbids inventing account-linking policy or picking a provider by taste while coding.

Current schema (`hosted/knowledge-mcp/migrations/0001_identity_and_tenancy.sql:9-31`):

- Deliberately has **no** `identities` table; `users.google_sub` is `NOT NULL UNIQUE`.
- `CREATE UNIQUE INDEX users_by_email ON users (lower(email))` treats email as a uniqueness key.
- Console auth today is Google-only (`hosted/builder-console/auth/google.ts`); tenant lookup is `findUserByGoogleSub` / `createUserAndAccountFromGoogle` (`hosted/knowledge-mcp/db/tenant.ts:187-210`, `:751+`).
- Browser sessions and API keys already point at `user_id` / account membership and must survive migration.

Issue #6 body, comments (none as of 2026-09-20 CT), and related PR search show **no explicit founder/HoE selection** of GitHub, Apple, Microsoft, Auth0, or any other first additional provider.

## Alternatives

### Identity model (Decision A)

**Keep Google-only column; encode other providers into `google_sub`.** Reject — couples every provider to a Google-shaped field, invites fake `google_sub` values, and breaks the “no fake google_sub” acceptance criterion.

**Link / merge accounts when emails match.** Reject — issue #6 and this record forbid email-equality linking; provider-asserted email is profile data unless an explicit authenticated linking flow proves control of both identities. Silent merge is out of scope.

**Provider-neutral `identities(user_id, provider, subject, …)` with unique `(provider, subject)`.** Choose — preserves `users` as account/person owner; backfills Google from `users.google_sub`; allows one additional provider without inventing linking; sessions/API keys keep existing owners.

### First additional provider (Decision B) — comparison (≥2 candidates)

| Criterion | **GitHub** (recommended) | **Sign in with Apple** | **Microsoft (personal/Entra OIDC)** |
| --- | --- | --- | --- |
| Protocol fit | OAuth 2.0 authorization code + User API; stable numeric `id` as subject; common for builder tools | True OIDC (`id_token` + JWKS); parallels Google/`jose` path closely | True OIDC; multi-issuer/tenant complexity |
| Verified identity semantics | Stable `id`; email optional / not always verified the same way — subject must be `id`, never email | Stable `sub`; email often private-relay — good for privacy, weak as profile join key | Stable `oid`/`sub`; work vs personal tenants |
| Audience for builder console | Strong — founders/agents already on GitHub | Weaker for web builder console; stronger for native Apple apps | Mixed; stronger for enterprise, weaker for indie console default |
| Implementation complexity | Medium — authorize/token/user endpoints; fixtures like Google | Medium-high — Apple keys, relay email, form_post nuances | High — issuer/tenant discovery and audience rules |
| Account-linking implications | Use GitHub `id` as `subject`; never merge on email | Use Apple `sub`; relay emails make email-merge especially dangerous | Use Microsoft `oid`/`sub`; tenant id must not be ignored |
| Testing | Deterministic fixtures (fake token/user JSON) without live OAuth app | Fixtures possible; live Apple console is a separate hold | Fixtures possible; tenant matrix heavier |

**Auth0 / generic IdP meta-adapter:** rejected for *this* issue — would add a vendor abstraction and several providers’ worth of surface; #6 allows **one** native adapter under `hosted/builder-console/auth/<provider>.*`.

**Recommendation (not authority):** **GitHub** as the first additional provider — best audience fit for the builder console, clear stable subject (`id`), comparable complexity to the existing Google module, and no pressure to invent email linking. **Apple** is the strongest OIDC-parallel alternative if HoE prefers protocol symmetry with Google/`jose` over audience fit. **Microsoft** is deferred unless HoE prioritizes work accounts.

**Decision B status:** **not settled.** No prior explicit founder/HoE pick was found in #6 body/comments or related PRs. Adapter code for any non-Google provider is **blocked** until HoE confirms a pick on #6 (or on this PR).

## Decision

### Decision A — accepted (canonical identity model)

Adopt a provider-neutral identity table rather than linking by email alone:

- Add `identities(user_id, provider, subject, …)` with **unique `(provider, subject)`**.
- Backfill existing Google rows from `users.google_sub` into `identities` with `provider = 'google'` and `subject = google_sub`.
- Treat `users.google_sub` as **compatibility-only** during an overlap period (nullable or mirrored), then retire writes from new code paths once the tenant API is provider+subject based; do not invent fake `google_sub` for non-Google identities.
- `users` remains the account/person owner; sessions and API keys continue to reference existing user/account owners and must keep working across the migration.
- **Email equality alone MUST NOT link accounts.** Provider-asserted email is profile data. Matching email across providers yields separate accounts (or an explicit non-linking outcome) unless a later, separately scoped authenticated linking flow proves control of both identities.
- Migration must **relax `users_by_email` uniqueness** (drop or replace the unique index) so two accounts may share an email string without forcing a merge; keep non-unique email for display/contact as needed.
- Migration must be idempotent and ordered; preserve existing user IDs, account IDs, sessions, and API keys.

### Decision B — proposed recommendation only

Recommend **GitHub** as the first additional console sign-in provider, with Apple as the leading OIDC alternative. **Do not implement any non-Google provider adapter until HoE explicitly selects a provider on issue #6 or this PR.**

## Compatibility and migration

- Next D1 migration number is allocated from current main under `hosted/knowledge-mcp/migrations/` (do not assume historical counts). As of baseline, latest shipped file is `0008_lazy_stripe_customer.sql`.
- Preserve Google sign-in URLs and behavior unless a separately reviewed change says otherwise.
- Cross-repo: `clueless-creations-site` may deep-link to Google; record a follow-up to route new users through `/signin` — **do not edit that repo from #6**.
- Live OAuth app creation, real secrets, production D1 apply, Worker deploy, and real external-account tests remain **explicit holds** (not authorized by #6 alone).
- This lane does not publish npm.

## Consequences

1. Implementation after HoE confirms Decision B: migration + backfill → provider-neutral tenant API → provider-aware OAuth state → one adapter → `/signin` chooser → analytics `method` + provider-specific failure reasons → security/regression fixtures.
2. Until Decision B is confirmed, **STOP** at this decision unit — no `hosted/builder-console/auth/<provider>.*` for a non-Google provider.
3. After #6 source milestone closes: **STOP**; next U6 item **#3** only on HoE order. Profile #564+ remains Codex’s lane.
4. Founder/HoE ask: reply on #6 (or this PR) with an explicit pick — e.g. `Provider pick: GitHub` (recommended), `Apple`, or `Microsoft` — so implementation may continue without another architecture redesign.
