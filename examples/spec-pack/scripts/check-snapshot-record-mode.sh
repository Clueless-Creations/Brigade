#!/bin/sh
# Reference merge-gate step. Copy this file into scripts/merge-gate.sh.
# Fail when a tracked snapshot test is left in record mode.
# Git-tracked files only: untracked files are ignored.
set -eu

if ! root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "check-snapshot-record-mode: not a git checkout" >&2
  exit 2
fi
cd "$root"

list=$(mktemp)
matches=$(mktemp)
trap 'rm -f "$list" "$matches"' EXIT
git ls-files >"$list"

# Test sources: Swift and the other source types an app repo may use.
is_test_source() {
  case "$1" in
    *.swift | *.m | *.mm | *.kt | *.kts | *.java | *.ts | *.tsx | *.js | *.jsx | *.py | *.rb | *.cpp | *.cc | *.cxx | *.c | *.h | *.hpp | *.cs | *.go | *.scala)
      return 0
      ;;
  esac
  return 1
}

# Schemes, test plans, GitHub workflows, and CI env files.
is_record_env_file() {
  case "$1" in
    *.xcscheme | *.xctestplan | .github/workflows/*)
      return 0
      ;;
  esac
  base=${1##*/}
  case "$base" in
    .env | .env.* | *.env)
      return 0
      ;;
  esac
  return 1
}

scan_sources() {
  # A trailing newline makes end-of-line match a non-identifier character.
  awk -v file="$1" '
    function report(n) { print file ":" n }
    {
      line = $0 "\n"
      if (line ~ /record[[:space:]]*:[[:space:]]*true[^[:alnum:]_]/) report(FNR)
      if (line ~ /isRecording[[:space:]]*=[[:space:]]*true[^[:alnum:]_]/) report(FNR)
      if (line ~ /withSnapshotTesting[[:space:]]*\([[:space:]]*record[[:space:]]*:[[:space:]]*\.all[^[:alnum:]_]/) report(FNR)
      if (line ~ /withSnapshotTesting[[:space:]]*\([[:space:]]*record[[:space:]]*:[[:space:]]*\.missing[^[:alnum:]_]/) report(FNR)
    }
  ' "$1"
}

# SNAPSHOT_TESTING_RECORD set to any value other than never.
# Regexes passed into functions are strings. A /regex/ value is not a pattern in mawk.
scan_env() {
  awk -v file="$1" -v sq="'" '
    function trim(s) {
      gsub(/^[[:space:]]+/, "", s)
      gsub(/[[:space:]]+$/, "", s)
      return s
    }
    function clean(s,    q, end) {
      s = trim(s)
      q = substr(s, 1, 1)
      if (q == "\"" || q == sq) {
        end = index(substr(s, 2), q)
        if (end > 0) return trim(substr(s, 2, end - 1))
      }
      sub(/[[:space:]]+#.*$/, "", s)
      s = trim(s)
      sub(/[[:space:]].*$/, "", s)
      sub(/[,;]$/, "", s)
      return s
    }
    function has_key(s) {
      return match(s, /(^|[^[:alnum:]_])SNAPSHOT_TESTING_RECORD([^[:alnum:]_]|$)/)
    }
    function after(s, re,    rest) {
      if (!match(s, re)) return "\n"
      rest = substr(s, RSTART + RLENGTH)
      return clean(rest)
    }
    function xml_value(s) { return after(s, "value[[:space:]]*=[[:space:]]*") }
    function json_value(s) { return after(s, "\"value\"[[:space:]]*:[[:space:]]*") }
    function xml_string(s,    v) {
      if (!match(s, /<string>[^<]*<\/string>/)) return "\n"
      v = substr(s, RSTART + 8, RLENGTH - 17)
      return trim(v)
    }
    function assignment(s,    re) {
      re = "(^|[^[:alnum:]_])SNAPSHOT_TESTING_RECORD[" sq "\"]?[[:space:]]*[:=][[:space:]]*"
      return after(s, re)
    }
    function emit(n, value) {
      if (value != "never") print file ":" n
    }
    function clear_pending() {
      if (pending_at > 0) print file ":" pending_at
      pending = 0
      pending_at = 0
    }
    BEGIN { pending = 0; pending_at = 0 }
    {
      if ($0 ~ /^[[:space:]]*#/) next
      if ($0 ~ /^[[:space:]]*\/\//) next
      if ($0 ~ /^[[:space:]]*<!--/ && $0 ~ /-->[[:space:]]*$/) next
      if (pending > 0) {
        value = xml_value($0)
        if (value == "\n") value = json_value($0)
        if (value == "\n") value = xml_string($0)
        if (value != "\n") {
          emit(pending_at, value)
          pending = 0
          pending_at = 0
          next
        }
        if ($0 ~ /<\/EnvironmentVariable>/ || has_key($0)) {
          clear_pending()
          if (!has_key($0)) next
        } else {
          pending--
          if (pending == 0) clear_pending()
          next
        }
      }
      if (!has_key($0)) next
      value = xml_value($0)
      if (value == "\n") value = assignment($0)
      if (value != "\n") {
        emit(FNR, value)
        next
      }
      pending = 8
      pending_at = FNR
    }
    END { if (pending_at > 0) print file ":" pending_at }
  ' "$1"
}

while IFS= read -r file || [ -n "$file" ]; do
  [ -n "$file" ] || continue
  [ -f "$file" ] || continue
  if is_test_source "$file"; then
    scan_sources "$file" >>"$matches"
  fi
  if is_record_env_file "$file"; then
    scan_env "$file" >>"$matches"
  fi
done <"$list"

if [ -s "$matches" ]; then
  cat "$matches"
  exit 1
fi
exit 0
