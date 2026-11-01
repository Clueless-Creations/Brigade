#!/usr/bin/env bash
# Refresh the Ponytail skills from the latest upstream default branch.
# Run before each agent session and verify run. Nothing is pinned: the copies
# under .agents/skills/ are replaced with upstream HEAD and the resolved commit
# is appended to .agents/skills/.ponytail-resolved.log. If the fetch fails
# (offline), the committed copies stay in place as the fallback and the run
# continues. Set PONYTAIL_REQUIRE_LATEST=1 to make a failed fetch an error.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="${PONYTAIL_URL:-https://github.com/DietrichGebert/ponytail}"
SKILLS="$ROOT/.agents/skills"
LOG="$SKILLS/.ponytail-resolved.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

if ! git clone -q --depth=1 "$URL" "$TMP/ponytail" 2>"$TMP/err" \
   || [[ ! -f "$TMP/ponytail/skills/ponytail/SKILL.md" || ! -f "$TMP/ponytail/skills/ponytail-review/SKILL.md" ]]; then
  printf '%s\t%s\tUNRESOLVED\toffline fallback: committed copies\n' "$STAMP" "$URL" >>"$LOG"
  echo "ponytail: could not fetch latest upstream; using committed copies" >&2
  [[ "${PONYTAIL_REQUIRE_LATEST:-0}" == 1 ]] && exit 1
  exit 0
fi
SHA="$(git -C "$TMP/ponytail" rev-parse HEAD)"
for s in ponytail ponytail-review; do
  rm -rf "$SKILLS/$s.new" && cp -R "$TMP/ponytail/skills/$s" "$SKILLS/$s.new" \
    && rm -rf "$SKILLS/$s" && mv "$SKILLS/$s.new" "$SKILLS/$s"
done
if [[ -d "$ROOT/.agents/licenses" && -f "$TMP/ponytail/LICENSE" ]]; then
  cp "$TMP/ponytail/LICENSE" "$ROOT/.agents/licenses/ponytail.LICENSE"
fi
printf '%s\t%s\t%s\n' "$STAMP" "$URL" "$SHA" >>"$LOG"
echo "ponytail: refreshed to $SHA"
