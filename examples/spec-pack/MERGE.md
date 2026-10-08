# Merge criteria for build-to-spec pull requests

The founder's human gate is Gate 2: store submission and release. Merging is
not that gate. A reviewer agent can merge a pull request without the founder
only when the review has **high confidence** and the change has a **low blast
radius**. If either is in doubt, stop and ask the founder.

## Confidence: the reviewer checked all of these

- CI is green on the pull request head. No test, snapshot, or suite was
  deleted, skipped, or disabled.
- No snapshot record mode is committed (for example `record: true` or a
  record environment variable). The check is [`scripts/check-snapshot-record-mode.sh`](scripts/check-snapshot-record-mode.sh).
- For UI changes, the reviewer opened **every** compare image and checked it
  against `mocks/<screen>--<state>.png`. No text is clipped or truncated, no
  view overflows its container, nothing overlaps, and sizes match the mock.
  A green merge gate is not enough: a gate can pass with clipping recorded
  into new snapshot references.
- The pull request does its task and nothing else. Each remaining
  difference from the mock is listed in the pull request.

## Low blast radius: merge without the founder when all are true

- No secrets, keys, or tokens are added or printed.
- No signing, provisioning, entitlement, bundle ID, or app group changes.
- No price, product ID, paywall rule, or purchase logic changes.
- No production data migrations and no destructive SQL.
- No public copy (site, store text, paywall) that contradicts the spec.
- No `meta.spec_version` change and no change to an approved spec decision.
- One revert commit can undo the change.

## Always stop and ask the founder

- Payments and prices: products, prices, offers, purchase providers.
- Store metadata, screenshots, review notes, submission, or release.
- Authentication: sign-in, tokens, sessions, account linking.
- Deleting or changing user data, and production database migrations.
- Security text, privacy policy, terms, and data-collection disclosures.
- Any system or account that the founder marked off-limits.
- Any spec decision change or new spec version.
- CI or merge gate changes that weaken a check.

## How to merge

Squash-merge pinned to the reviewed head commit
(`gh pr merge --squash --match-head-commit <sha>`). Record the commit, the
test counts, and the checks in the tracker issue. If you stop, record the
reason and the next owner.
