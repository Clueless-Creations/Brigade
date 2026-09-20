# Task-skill host-discovery rehearsal

Status: deterministic package proof passed; Codex native discovery verified for all nine portable task exports; Claude Code native discovery **explicitly open** (host not logged in).

## Tested artifact

- Source revision at branch cut: `624d2251f6f2a81efdda64c86ed1d1fdf50b7571`
- Package stamp for this #386 change: `@cluelesscreations/brigade@0.221.54`
- Artifact mode: `npm pack --dry-run` under **npm 10.9.2** (Node engines `>=24`; CI uses `.node-version` → 24)
- Packed file count on tip before stamp: 2858
- Task-skill contract: `npm run check:task-skills` — pass (20 tests / 0 errors)
- Package parity: `npm run check:package-parity` — 0 errors, 0 warnings when invoked via `npm run` (npm 10)

The packed artifact contains the generated root skill, the nine declared portable task skills,
their required references, notices, and relocation-safe resource closure. This is package proof,
not proof that a host has discovered or loaded a skill.

**npm note:** Ambient npm 9 force-includes ancestor `README.md` files along included nested
paths (`agents/skills/README.md`, `surfaces/studio/README.md`), which trips
`package_parity.pack_dev_leak`. npm 10+ (Node 24 / CI) does not. `check:package-parity` now
prefers `process.env.npm_execpath` so `npm run check:package-parity` follows the npm that
launched the script rather than ambient PATH. A filesystem listing of those READMEs is **not**
host discovery.

## Host observation (2026-09-20 CT)

| Host | Observed version | Discovery method | Matching B2C task skills | Result |
| --- | --- | --- | ---: | --- |
| Codex CLI | `0.151.0` | Native `codex debug prompt-input` after create-only portable export of all nine tasks into an isolated temp Git workspace `.agents/skills/` | 9 | **Verified:** native skill catalog named all nine task skills; isolated root `r19` = temp `.agents/skills` |
| Claude Code | `2.1.251` | `claude -p` probe | unavailable | **Explicitly open:** host returned `Not logged in · Please run /login` before any discovery result. No discovery claim. |

### Codex native names observed (sanitized)

From the isolated install only (not a filesystem `ls` claim):

`b2c-research-opportunity`, `b2c-design-onboarding`, `b2c-review-monetization`,
`b2c-define-product`, `b2c-plan-implementation`, `b2c-review-business-performance`,
`b2c-review-experience`, `b2c-plan-launch`, `b2c-verify-release-readiness`.

Probe properties:

- OS: Linux x86_64 (America/Chicago box clock)
- Install mode: create-only `npm run skills:export` for each task → copy into temp `.agents/skills/<name>/` (no `~/.agents` mutation, no user config change)
- Discovery command: `codex debug prompt-input` (renders model-visible prompt JSON; **no model turn**, no provider call, no paid operation)
- Cleanup: temp workspace removed after capture
- Reference resolution: export contract already asserted by `check:task-skills` relocation tests; this probe asserts **name discovery only**

### Claude missing capability (honesty)

Claude Code on this box is not authenticated. A repeatable native discovery result requires an
authorized login (and must not be substituted with a filesystem listing). Criterion remains
**explicitly open** under the HoE honesty close rule for #386.

## Handoff notes

### #26 — release-readiness (publication owner; no publish from #386)

- Packed library + nine portable exports pass membership/relocation/hash/notice/safety on tip under npm 10.
- Source-only vs package commands: `skills:export` is **source-checkout + tsx/devDeps** only; do not advertise it as a production-registry consumer command. Packed installs already include generated `agents/skills/b2c-*` trees.
- Host install docs may cite Codex discovery evidence at `0.151.0`; Claude discovery must stay caveated as open until authenticated native proof exists.
- **Do not npm publish from this issue.**

### #75 — observed host/tool surfaces (no live model campaign)

| Surface | Observation |
| --- | --- |
| Codex CLI `0.151.0` | Discovers portable task skill names via native skill catalog when installed under repo-local `.agents/skills`. `codex debug prompt-input` is a no-model discovery probe. |
| Claude Code `2.1.251` | Not logged in on rehearsal host; no native discovery result. |
| Cursor Agent | Not in #386 target set; not run. |

No unpaid/paid semantic model campaign was run. Outcome evaluation remains #75.

## Limits

This report does not claim semantic model quality, provider readiness, offline availability of
supplemental links, full live-agent usability, or Claude discovery. Independent review + integrated
verification required by #378 are recorded in the #386 PR / impl report (task-skill + package-parity
gates green; #378 children closed on tip).
