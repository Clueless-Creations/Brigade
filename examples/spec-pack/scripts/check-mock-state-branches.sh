#!/bin/sh
# Reference merge-gate step. Copy this file next to scripts/merge-gate.sh.
# Fail when a production view branches on a fixture property.
# Git-tracked files only: untracked files are ignored. Working-tree edits count.
# This is a line scan, not a language parser. Keep the view type on one line.
set -eu

if ! root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "check-mock-state-branches: not a git checkout" >&2
  exit 2
fi
cd "$root"

list=$(mktemp)
matches=$(mktemp)
trap 'rm -f "$list" "$matches"' EXIT
git ls-files >"$list"

is_test_path() {
  case "$1" in
    test/* | tests/* | Tests/* | UITests/* | integration_test/* | */test/* | */tests/* | */Tests/* | */UITests/* | */integration_test/*)
      return 0
      ;;
    *_test.dart | *_test.kt | *_test.kts | *Test.swift | *Tests.swift | *.test.ts | *.test.tsx | *.test.js | *.test.jsx | *.spec.ts | *.spec.tsx | *.spec.js | *.spec.jsx)
      return 0
      ;;
  esac
  return 1
}

is_source() {
  case "$1" in
    *.dart | *.swift | *.kt | *.kts | *.tsx | *.jsx | *.ts | *.js)
      return 0
      ;;
  esac
  return 1
}

# A view file is one whose type declaration is on one line.
is_view_file() {
  case "$1" in
    *.dart)
      awk '/^[[:space:]]*\/\// { next } /extends[[:space:]]+(StatelessWidget|StatefulWidget|ConsumerWidget|ConsumerStatefulWidget|HookWidget)([^A-Za-z0-9_]|$)/ { found = 1 } END { exit found ? 0 : 1 }' "$1"
      ;;
    *.swift)
      awk '/^[[:space:]]*\/\// { next } /struct[[:space:]]+[A-Za-z_]/ && /:[[:space:]]*View([^A-Za-z0-9_]|$)|,[[:space:]]*View([^A-Za-z0-9_]|$)|some[[:space:]]+View([^A-Za-z0-9_]|$)/ { found = 1 } END { exit found ? 0 : 1 }' "$1"
      ;;
    *.kt | *.kts)
      awk '/^[[:space:]]*\/\// { next } /@Composable/ { found = 1 } END { exit found ? 0 : 1 }' "$1"
      ;;
    *.tsx | *.jsx)
      awk '/^[[:space:]]*\/\// { next } /function[[:space:]]+[A-Z][A-Za-z0-9_]*|const[[:space:]]+[A-Z][A-Za-z0-9_]*[[:space:]]*=/ { found = 1 } END { exit found ? 0 : 1 }' "$1"
      ;;
    *)
      return 1
      ;;
  esac
}

scan_file() {
  view=0
  if is_view_file "$1"; then
    view=1
  fi
  awk -v file="$1" -v view="$view" '
    function flag(kind) { print file ":" FNR ":" kind }
    /^[[:space:]]*\/\// { next }
    /^[[:space:]]*\/\*/ { next }
    /^[[:space:]]*\*/ { next }
    {
      if ($0 ~ /(^|[^A-Za-z0-9_])(gateOnly|forGate|gateFlag|mockState|fixtureMode|screenshotOnly|forScreenshot|isGateFixture)([^A-Za-z0-9_]|$)/) {
        flag("fixture-flag")
      }
      if (view && $0 ~ /(^|[^A-Za-z0-9_])(name|title|label|displayName)[[:space:]]*(\.length|\.count|\.characters\.count)[[:space:]]*[<>]=?[[:space:]]*[1-9][0-9]/) {
        flag("length-threshold")
      }
    }
  ' "$1"
}

while IFS= read -r file || [ -n "$file" ]; do
  [ -n "$file" ] || continue
  [ -f "$file" ] || continue
  is_source "$file" || continue
  is_test_path "$file" && continue
  scan_file "$file" >>"$matches"
done <"$list"

if [ -s "$matches" ]; then
  sort "$matches"
  exit 1
fi
exit 0
