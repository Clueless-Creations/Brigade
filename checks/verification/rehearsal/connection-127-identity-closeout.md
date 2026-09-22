# Connection #127 identity + capability receipts closeout (U6 R1)

Owner: **#127**. Status: tip AC→evidence map for connection-identity / capability-receipt residual closeout.
Main pin at land: `136b012` / `@cluelesscreations/brigade@0.221.56` → stamp **0.221.57**.
Contract: `contracts/public-api/connection-receipt.ts`.
Fixture surface: `checks/verification/public-api/connection-and-packet.test.ts` + `checks/verification/fixtures/cli.fixtures.ts`.

This slice is **capability-identity / setup-contract residual closeout** only.
It does **not** add hosted/remote job execution, new write scopes, provider credentials,
silent client-config mutation, npm publish, Product Profile #564+ work, or auto-advance to #403.

## Consumed tip surfaces (do not rebuild)

| Area                      | Path                                         | Note                                                       |
| ------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Receipt contract          | `contracts/public-api/connection-receipt.ts` | mode, identity, declares, providerObservation, observed    |
| Local MCP handshake       | `entrypoints/mcp/server.ts`                  | server name `b2c-local`; instructions + receipt            |
| Hosted MCP handshake      | `hosted/knowledge-mcp/worker.ts`             | server name `b2c-hosted`; knowledge-only receipt           |
| Setup registration        | `kernel/session/setup.ts`                    | prints distinct names + receipt; never edits client config |
| Doctor/inspect            | `kernel/session/doctor.ts`                   | same compact receipt on existing diagnostic surface        |
| Leftover migration        | `leftoverNameMigrationGuidance()`            | additive; no silent rewrite                                |
| Surface selection         | `selectConfiguredSurface`                    | evidence > name heuristics; wrong_surface guidance         |
| Hosted read-only boundary | hosted knowledge Worker                      | preserved; no execution authority                          |

## Acceptance → evidence

| #127 acceptance                                                             | Tip evidence                                                                                                                           | Fixture / test                                | Status   |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------- |
| Fresh local and hosted setup no longer share one ambiguous default identity | setup prints `b2c-local`; hosted console/snippets use `b2c-hosted`; portable form `npx -y @cluelesscreations/brigade` under local name | cli setup + leftover-name matrix              | **done** |
| Compact machine-readable capability receipt without architecture docs       | `Connection receipt: {…}` on setup, local/hosted handshake, doctor/inspect                                                             | connection-and-packet + cli doctor/inspect    | **done** |
| Hosted knowledge never implies local/remote execution                       | hosted receipt declares planning/execution/writes `none`; wrong_surface guidance                                                       | hosted worker tests + wrong_surface matrix    | **done** |
| Local builder availability never implies provider readiness                 | `providerObservation: "not_tested"` always                                                                                             | receipt schema + providerObservation fixtures | **done** |
| Both modes coexist without naming collision                                 | `selectConfiguredSurface` + bothConfigured routing; duplicate names → collision                                                        | both-configured tests                         | **done** |
| Documented compatible migration; no silent config rewrite                   | leftover guidance; setup never edits Claude/Cursor/Codex files                                                                         | leftover migration fixtures + setup prose     | **done** |
| Wrong-surface fails with actionable next step + truthful scope              | hostedWrongSurfaceRefusal / connectionCapabilityGuidance                                                                               | wrong_surface + cli_only matrices             | **done** |
| No hosted execution or new write authority                                  | no new write tools; hosted Worker stays knowledge-only                                                                                 | package parity + hosted worker boundary       | **done** |

## Issue test matrix → evidence

| Configuration                    | Expected                                                                   | Evidence                                     |
| -------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| Local builder only               | Local planning/execution; providers not verified                           | local receipt + setup/doctor                 |
| Hosted knowledge only            | Knowledge-only; local actions wrong_surface + next step                    | hosted receipt + wrong_surface               |
| Both configured                  | Distinct names; router selects by need                                     | bothConfigured selection tests               |
| Ambiguous leftover → local       | Capability from handshake, not name                                        | interpretConfiguredConnection leftover local |
| Ambiguous leftover → hosted      | Knowledge-only; no local execution claim                                   | leftover hosted reading                      |
| Local MCP ok, worker CLI missing | Planning/knowledge ok; execution observed unavailable; still local surface | observed.workspaceExecution unavailable      |
| Hosted unhealthy/auth failure    | Distinct from no-execution-by-design                                       | hosted worker unauthorized ≠ wrong_surface   |
| Provider not observed            | Receipt stays `providerObservation: "not_tested"`                          | schema literal + fixtures                    |

## Hard bans observed

- No hosted/remote job execution
- No new write scopes / provider credentials
- No silent client-config mutation
- No npm publish (#26)
- No Product Profile #564+ steal
- Evidence layers not collapsed to one green "connected"
- No auto-advance to #403

## STOP

After merge/close: **STOP** → next **#403** only on HoE order.
