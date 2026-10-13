#!/bin/sh
# Reference merge-gate step. Copy this file next to scripts/merge-gate.sh.
# Fail when a changed shipping view has no live-screen test in the same diff.
# The test must name the shipping type and carry the harness contract tokens.
# This is a line scan, not a language parser. Keep each view type on one line.
# Untracked files are ignored. Set LIVE_SCREEN_BASE to override the diff base.
set -eu

if ! root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "check-live-screen-test: not a git checkout" >&2
  exit 2
fi
cd "$root"

base=HEAD
if [ -n "${LIVE_SCREEN_BASE:-}" ]; then
  base=$LIVE_SCREEN_BASE
elif git rev-parse --verify --quiet main >/dev/null; then
  if found=$(git merge-base HEAD main 2>/dev/null); then
    base=$found
  fi
fi

changed=$(mktemp)
views=$(mktemp)
tests=$(mktemp)
hits=$(mktemp)
trap 'rm -f "$changed" "$views" "$tests" "$hits"' EXIT
git diff --name-only "$base" | sort -u >"$changed"

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

view_names() {
  case "$1" in
    *.dart)
      awk '
        /^[[:space:]]*\/\// { next }
        /extends[[:space:]]+(StatelessWidget|StatefulWidget|ConsumerWidget|ConsumerStatefulWidget|HookWidget)([^A-Za-z0-9_]|$)/ && match($0, /class[[:space:]]+[A-Za-z_][A-Za-z0-9_]*/) {
          s = substr($0, RSTART, RLENGTH)
          sub(/class[[:space:]]+/, "", s)
          print s
        }
      ' "$1"
      ;;
    *.swift)
      awk '
        /^[[:space:]]*\/\// { next }
        /struct[[:space:]]+[A-Za-z_]/ && (/ :[[:space:]]*View([^A-Za-z0-9_]|$)/ || /:[[:space:]]*View([^A-Za-z0-9_]|$)/ || /,[[:space:]]*View([^A-Za-z0-9_]|$)/ || /some[[:space:]]+View([^A-Za-z0-9_]|$)/) && match($0, /struct[[:space:]]+[A-Za-z_][A-Za-z0-9_]*/) {
          s = substr($0, RSTART, RLENGTH)
          sub(/struct[[:space:]]+/, "", s)
          print s
        }
      ' "$1"
      ;;
    *.kt | *.kts)
      awk '
        /^[[:space:]]*\/\// { next }
        /@Composable/ { comp = 1; next }
        comp && match($0, /fun[[:space:]]+[A-Z][A-Za-z0-9_]*/) {
          s = substr($0, RSTART, RLENGTH)
          sub(/fun[[:space:]]+/, "", s)
          print s
          comp = 0
          next
        }
        comp { comp = 0 }
      ' "$1"
      ;;
    *.tsx | *.jsx)
      awk '
        /^[[:space:]]*\/\// { next }
        match($0, /function[[:space:]]+[A-Z][A-Za-z0-9_]*/) {
          s = substr($0, RSTART, RLENGTH)
          sub(/function[[:space:]]+/, "", s)
          print s
        }
        match($0, /const[[:space:]]+[A-Z][A-Za-z0-9_]*[[:space:]]*=/) {
          s = substr($0, RSTART, RLENGTH)
          sub(/const[[:space:]]+/, "", s)
          sub(/[[:space:]]*=$/, "", s)
          print s
        }
      ' "$1"
      ;;
  esac
}

while IFS= read -r file || [ -n "$file" ]; do
  [ -n "$file" ] || continue
  [ -f "$file" ] || continue
  if is_test_path "$file"; then
    if grep -F -q "brigade-live-screen-test" "$file"; then
      printf '%s\n' "$file" >>"$tests"
    fi
    continue
  fi
  names=$(view_names "$file" | sort -u)
  [ -n "$names" ] || continue
  printf '%s\n' "$names" | while IFS= read -r name || [ -n "$name" ]; do
    [ -n "$name" ] || continue
    printf '%s %s\n' "$file" "$name" >>"$views"
  done
done <"$changed"

if [ ! -s "$views" ]; then
  exit 0
fi

if [ ! -s "$tests" ]; then
  sort -u "$views" | awk '{ print $1 }' | sort -u | while IFS= read -r file || [ -n "$file" ]; do
    printf 'live-screen: missing test for %s\n' "$file"
  done
  exit 1
fi

tokens='brigade-live-screen-test
pumpLiveScreen
fakedAtBoundary
primaryInteraction:
longName
textScale2x
landscape
noOverlap
noOverflow
reachableAction'

while IFS= read -r test || [ -n "$test" ]; do
  [ -n "$test" ] || continue
  printf '%s\n' "$tokens" | while IFS= read -r token || [ -n "$token" ]; do
    [ -n "$token" ] || continue
    if ! grep -F -q "$token" "$test"; then
      printf 'live-screen: %s missing %s\n' "$test" "$token" >>"$hits"
    fi
  done
done <"$tests"

while IFS= read -r row || [ -n "$row" ]; do
  [ -n "$row" ] || continue
  file=${row%% *}
  name=${row#* }
  found=0
  while IFS= read -r test || [ -n "$test" ]; do
    [ -n "$test" ] || continue
    if grep -E -q "(^|[^A-Za-z0-9_])${name}([^A-Za-z0-9_]|$)" "$test"; then
      found=1
      break
    fi
  done <"$tests"
  if [ "$found" -eq 0 ]; then
    printf 'live-screen: %s is not pumped by a live-screen test\n' "$name" >>"$hits"
  fi
done <"$views"

if [ -s "$hits" ]; then
  sort -u "$hits"
  exit 1
fi
exit 0
