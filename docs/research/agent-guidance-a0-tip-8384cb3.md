# A0 tip freeze for #388 (deterministic packets only)

**Pinned tip before #388 edits:** `8384cb3` / `0.221.54`  
**Frozen corpus:** `docs/research/agent-guidance-a0.json` (baseline source revision `8ab690f`)  
**Measured:** 2026-09-20 (CT) via `npm run check:agent-entrypoints -- --guidance-baseline docs/research/agent-guidance-a0.json`

This freeze is instruction-file packet accounting only. It is not live Astra/model evidence. Live traces remain #75 authority. Integrated “migration complete” remains #392.

## Reproduce

```sh
npm run check:agent-entrypoints -- \
  --guidance-baseline docs/research/agent-guidance-a0.json \
  --guidance-source-ref 8ab690f8c08ad627c470d074fffdead986f763a6 \
  --guidance-report /tmp/b2c-guidance-a0.json

npm run check:agent-entrypoints -- \
  --guidance-baseline docs/research/agent-guidance-a0.json \
  --guidance-report /tmp/b2c-guidance-candidate.json
```

Reports omit `modelId`, `modelTokens`, `observedAgentTrace`, and `serviceResult`.

## Tip-before (#388 branch cut) vs frozen A0 source sizes

| Source | A0 UTF-8 | Tip `8384cb3` UTF-8 |
| --- | ---: | ---: |
| AGENTS.md | 13,545 | 10,694 |
| SKILL.md | 5,611 | 5,653 |

Candidate after #388 edits is measured in the PR / impl report; do not treat tip-before as the merge candidate.
