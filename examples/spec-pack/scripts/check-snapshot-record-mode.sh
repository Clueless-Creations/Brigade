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
  # Scan literal settings as tokens, not lines. Comments and strings cannot
  # enable recording; whitespace and argument order cannot hide it. This is
  # not a language evaluator: computed settings still need code review.
  awk -v file="$1" -v sq="'" '
    function report(n) {
      if (!reported[n]++) print file ":" n
    }
    function regex_end(text, start,    at, ch, in_class) {
      for (at = start + 1; at <= length(text); at++) {
        ch = substr(text, at, 1)
        if (ch == "\\") at++
        else if (ch == "[") in_class = 1
        else if (ch == "]") in_class = 0
        else if (ch == "/" && !in_class) return at
      }
      return 0
    }
    function token(value, n,    closing_call, closing_object) {
      if (pending == "label") {
        pending = (value == separator) ? "value" : ""
      } else if (pending == "value") {
        pending = ""
        if (value == "true") report(setting_line)
        else if (scoped_record) {
          if (value == ".") pending = "selector"
          else if (value ~ /^[[:alpha:]_][[:alnum:]_]*$/) pending = "qualifier"
        }
      } else if (pending == "qualifier") {
        pending = (value == ".") ? "selector" : ""
      } else if (pending == "selector") {
        pending = ""
        if (value == "all" || value == "missing" || value == "failed") report(setting_line)
        else if (value ~ /^[[:alpha:]_][[:alnum:]_]*$/) pending = "qualifier"
      }
      if (value == "record" || value == "isRecording") {
        pending = "label"
        separator = (value == "record") ? ":" : "="
        scoped_record = value == "record" && calls[depth] == "withSnapshotTesting"
        setting_line = n
      }
      if (value == "(") calls[++depth] = previous
      else if (value == ")" && depth > 0) {
        closing_call = calls[depth]
        delete calls[depth--]
      }
      if (value == "{") {
        objects[++brace_depth] = previous ~ /^(=|\(|\[|,|:|return|yield)$/
      } else if (value == "}" && brace_depth > 0) {
        closing_object = objects[brace_depth]
        delete objects[brace_depth--]
      }
      # A slash after an operand is division. A slash where an expression
      # starts can introduce a JS/TS or Swift regex literal instead.
      regex_allowed = value !~ /^[[:alnum:]_]+$/ && value != ")" && value != "]" && value != "." &&
        value != "<string>" && value != "<regex>" && value != "++" && value != "--"
      if (value ~ /^(return|throw|yield|await|case|delete|void|typeof|instanceof|in|of|else|do)$/ ||
          closing_call ~ /^(if|while|for|with|switch|catch)$/) regex_allowed = 1
      if (closing_object) regex_allowed = 0
      previous = value
    }
    BEGIN {
      hash_comments = file ~ /\.(py|rb)$/
      slash_regex = file ~ /\.(js|jsx|ts|tsx|swift)$/
      swift = file ~ /\.swift$/
      regex_allowed = 1
      depth = 0
      block = 0
      quote = ""
    }
    {
      line = $0 "\n"
      for (i = 1; i <= length(line);) {
        char = substr(line, i, 1)
        pair = substr(line, i, 2)
        if (block > 0) {
          if (pair == "/*") { block++; i += 2 }
          else if (pair == "*/") { block--; i += 2 }
          else i++
          continue
        }
        if (extended_regex) {
          if (char == "\\") i += 2
          else if (char == "/" && substr(line, i + 1, length(regex_hashes)) == regex_hashes) {
            i += 1 + length(regex_hashes)
            extended_regex = 0
          } else i++
          continue
        }
        if (quote != "") {
          if (substr(line, i, length(quote) + length(hashes)) == quote hashes) {
            i += length(quote) + length(hashes)
            quote = ""
          } else if (char == "\\" && hashes == "") i += 2
          else i++
          continue
        }
        if (pair == "//" || (hash_comments && char == "#")) break
        if (pair == "/*") { block = 1; i += 2; continue }
        if (slash_regex && char == "/" && regex_allowed) {
          end = regex_end(line, i)
          if (end) {
            token("<regex>", FNR)
            i = end + 1
            continue
          }
        }
        hashes = ""
        if (char == "#" && !hash_comments) {
          j = i
          while (substr(line, j, 1) == "#") { hashes = hashes "#"; j++ }
          if (swift && substr(line, j, 1) == "/") {
            extended_regex = 1
            regex_hashes = hashes
            token("<regex>", FNR)
            i = j + 1
            continue
          }
          if (substr(line, j, 1) == "\"") { i = j; char = "\"" }
          else hashes = ""
        }
        if (char == "\"" || char == sq || char == "`") {
          quote = char
          if (char != "`" && substr(line, i, 3) == char char char) quote = char char char
          token("<string>", FNR)
          i += length(quote)
          continue
        }
        if (char ~ /[[:space:]]/) { i++; continue }
        if (pair == "++" || pair == "--") { token(pair, FNR); i += 2; continue }
        if (char ~ /[[:alpha:]_]/) {
          j = i + 1
          while (substr(line, j, 1) ~ /[[:alnum:]_]/) j++
          token(substr(line, i, j - i), FNR)
          i = j
        } else { token(char, FNR); i++ }
      }
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
