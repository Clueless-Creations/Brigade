# 0018 - Publish Brigade through the Clueless Creations npm scope

- **Status:** accepted.
- **Date:** 2026-09-19.
- **Steward:** founder-requested release decision.
- **Supersedes:** the npm package-name portions of ADR-0015 and ADR-0017.

## Context and evidence

The human-facing product name is Brigade, while the repository and installed
skill still use the stable `b2c-app-builder` technical identity. The first
manual publish created `b2c-app-builder@0.221.39` under the founder account.
The unscoped npm name `brigade` is already occupied, while the founder is an
owner of the `cluelesscreations` npm organization and
`@cluelesscreations/brigade` is available.

## Decision

The canonical public package is **`@cluelesscreations/brigade`**. The package
continues to ship one repository-root runtime and the existing `b2c` CLI. It
adds `brigade` and `brigade-mcp` MCP bin aliases so the scoped package works
with `npx -y @cluelesscreations/brigade`, while retaining the existing
`b2c-app-builder` and `b2c-app-builder-mcp` aliases for compatibility.

The already published `b2c-app-builder@0.221.39` remains available as a
legacy compatibility package and is not a second release surface. New
versions and trusted publishing target only `@cluelesscreations/brigade`.

## Compatibility

The `b2c` CLI, MCP tool names, routing skill, repository URL, schema IDs,
stored records, and local workspace paths remain unchanged. Consumers moving
to the canonical package install `@cluelesscreations/brigade`; consumers of
the legacy package are not broken by this rename.

## Verification

- `npm whoami` returns the founder account.
- `npm org ls cluelesscreations --json` reports the founder as `owner`.
- `npm view brigade version` returns an existing unrelated package.
- `npm view @cluelesscreations/brigade version` returns 404 before this publish.
- `check:package-parity` and `npm pack --dry-run` remain the package boundary
  checks.
