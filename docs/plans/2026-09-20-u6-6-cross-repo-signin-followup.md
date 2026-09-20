# Follow-up — route marketing deep-links through `/signin` (#6)

**Status:** recorded follow-up only — **do not** edit `clueless-creations-site` from Brigade #6.  
**Date:** 2026-09-20  
**Owner:** separate assignment after console `/signin` chooser ships.

## Why

`clueless-creations-site` may deep-link new users straight to Google start (`/auth/google/start`). After ADR-0020 / #6, `/signin` is the chooser (Google + GitHub). Deep-links that skip the chooser still work for Google (compatible URLs) but hide GitHub and skip the Terms/Privacy framing the chooser provides.

## Exact change (other repo)

1. Find marketing CTAs / header links that target `https://app.clueless-creations.com/auth/google/start` (or equivalent).
2. Point them at `https://app.clueless-creations.com/signin` (optionally preserving `?entry_point=…`).
3. Keep Google `/auth/google/start` and callback URLs intact for in-flight bookmarks and OAuth app redirect registration.

## Holds

No DNS, OAuth app, or production deploy is authorized by this note.
