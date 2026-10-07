#!/usr/bin/env bash
# Render every screen x state mock to mocks/<screen>--<state>.png at iPhone
# logical size (393x852). Build agents compare these with simulator
# screenshots of the same screen and state.
# Needs: node, a Chrome or Chromium binary (CHROME env var to override).
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser)}"
node build.mjs >/dev/null || { echo "spec check failed; run node build.mjs"; exit 1; }
mkdir -p mocks
node -e '
const YAML=require("yaml");const s=YAML.parse(require("fs").readFileSync("spec.yaml","utf8"));
for(const sc of s.screens)for(const st of sc.states)console.log(sc.id+":"+st);
' | while read -r pair; do
  out="mocks/${pair/:/--}.png"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --window-size=393,852 --screenshot="$out" "file://$PWD/index.html?mock=$pair" >/dev/null 2>&1
  echo "$out"
done
