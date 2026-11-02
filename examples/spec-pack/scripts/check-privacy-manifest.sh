#!/bin/sh
# Reference merge-gate step. Copy this file next to scripts/merge-gate.sh.
# Fail when Apple-target code uses a required-reason API and the target's
# PrivacyInfo.xcprivacy has no reason for that category (ITMS-91053).
# A source file belongs to the nearest PrivacyInfo.xcprivacy in its folder or a
# parent folder. Put one manifest in the app folder and one in each extension.
# UserDefaults(suiteName:) needs reason 1C8F.1 (App Group).
# Git-tracked files only: untracked files are ignored. Working-tree edits count.
# This is a line scan, not a language parser. Tests and vendored SDKs are skipped.
set -eu

if ! root=$(git rev-parse --show-toplevel 2>/dev/null); then
  echo "check-privacy-manifest: not a git checkout" >&2
  exit 2
fi
cd "$root"

list=$(mktemp)
uses=$(mktemp)
reasons=$(mktemp)
matches=$(mktemp)
trap 'rm -f "$list" "$uses" "$reasons" "$matches"' EXIT
git ls-files >"$list"

is_test_path() {
  case "$1" in
    test/* | tests/* | Tests/* | UITests/* | */test/* | */tests/* | */Tests/* | */UITests/*)
      return 0
      ;;
    *Test.swift | *Tests.swift | *Test.m | *Tests.m)
      return 0
      ;;
  esac
  return 1
}

is_vendored() {
  case "$1" in
    Pods/* | */Pods/* | Carthage/* | */Carthage/* | .build/* | */.build/* | */SourcePackages/* | vendor/* | */vendor/*)
      return 0
      ;;
  esac
  return 1
}

is_source() {
  case "$1" in
    *.swift | *.m | *.mm | *.c | *.cpp)
      return 0
      ;;
  esac
  return 1
}

# Prints "<category> <required reason or any> <line>", first hit per kind.
scan_file() {
  awk '
    function hit(kind, need) {
      if (!seen[kind " " need]++) print kind " " need " " FNR
    }
    /^[[:space:]]*\/\// { next }
    /^[[:space:]]*\/?\*/ { next }
    {
      line = $0
      sub(/[[:space:]]\/\/.*$/, "", line)
      b = "(^|[^A-Za-z0-9_])"
      e = "([^A-Za-z0-9_]|$)"
      if (line ~ (b "(NS)?UserDefaults" e) || line ~ /@AppStorage/) {
        hit("NSPrivacyAccessedAPICategoryUserDefaults", "any")
      }
      if (line ~ /UserDefaults[[:space:]]*\([[:space:]]*suiteName[[:space:]]*:/ || line ~ /initWithSuiteName:/) {
        hit("NSPrivacyAccessedAPICategoryUserDefaults", "1C8F.1")
      }
      if (line ~ (b "(NSFileCreationDate|NSFileModificationDate|NSURLContentModificationDateKey|NSURLCreationDateKey|contentModificationDateKey|creationDateKey|fileModificationDate|getattrlist|getattrlistbulk|getattrlistat|fgetattrlist)" e) ||
          line ~ /FileAttributeKey\.(creationDate|modificationDate)/ ||
          line ~ /\[[[:space:]]*\.(creationDate|modificationDate)[[:space:]]*\]/ ||
          line ~ /(^|[^A-Za-z0-9_.])(stat|fstat|fstatat|lstat)[[:space:]]*\(/) {
        hit("NSPrivacyAccessedAPICategoryFileTimestamp", "any")
      }
      if (line ~ (b "(systemUptime|mach_absolute_time)" e)) {
        hit("NSPrivacyAccessedAPICategorySystemBootTime", "any")
      }
      if (line ~ (b "(volumeAvailableCapacityKey|volumeAvailableCapacityForImportantUsageKey|volumeAvailableCapacityForOpportunisticUsageKey|volumeTotalCapacityKey|NSURLVolumeAvailableCapacityKey|NSURLVolumeAvailableCapacityForImportantUsageKey|NSURLVolumeAvailableCapacityForOpportunisticUsageKey|NSURLVolumeTotalCapacityKey|systemFreeSize|systemSize|NSFileSystemFreeSize|NSFileSystemSize)" e) ||
          line ~ /(^|[^A-Za-z0-9_.])(statfs|statvfs|fstatfs|fstatvfs)[[:space:]]*\(/) {
        hit("NSPrivacyAccessedAPICategoryDiskSpace", "any")
      }
      if (line ~ (b "activeInputModes" e)) {
        hit("NSPrivacyAccessedAPICategoryActiveKeyboards", "any")
      }
    }
  ' "$1"
}

# Prints "<category> <reason>" for each reason in an XML property list manifest.
manifest_reasons() {
  awk '
    { buf = buf $0 "\n" }
    END {
      n = split(buf, parts, "<dict>")
      for (i = 1; i <= n; i++) {
        p = parts[i]
        if (p !~ /<key>NSPrivacyAccessedAPIType<\/key>[[:space:]]*<string>/) continue
        if (p !~ /<key>NSPrivacyAccessedAPITypeReasons<\/key>[[:space:]]*<array>/) continue
        cat = p
        sub(/.*<key>NSPrivacyAccessedAPIType<\/key>[[:space:]]*<string>[[:space:]]*/, "", cat)
        sub(/[[:space:]]*<\/string>.*/, "", cat)
        r = p
        sub(/.*<key>NSPrivacyAccessedAPITypeReasons<\/key>[[:space:]]*<array>/, "", r)
        sub(/<\/array>.*/, "", r)
        while (match(r, /<string>[^<]*<\/string>/)) {
          s = substr(r, RSTART + 8, RLENGTH - 17)
          gsub(/[[:space:]]/, "", s)
          if (s != "") print cat " " s
          r = substr(r, RSTART + RLENGTH)
        }
      }
    }
  ' "$1"
}

find_manifest() {
  d=$(dirname "$1")
  while :; do
    if [ "$d" = . ]; then
      m=PrivacyInfo.xcprivacy
    else
      m=$d/PrivacyInfo.xcprivacy
    fi
    if [ -f "$m" ] && grep -Fqx "$m" "$list"; then
      echo "$m"
      return 0
    fi
    [ "$d" = . ] && return 1
    d=$(dirname "$d")
  done
}

while IFS= read -r file || [ -n "$file" ]; do
  [ -n "$file" ] || continue
  [ -f "$file" ] || continue
  is_source "$file" || continue
  is_test_path "$file" && continue
  is_vendored "$file" && continue
  scan_file "$file" >"$uses"
  [ -s "$uses" ] || continue
  if ! manifest=$(find_manifest "$file"); then
    while read -r category need line; do
      echo "$file:$line: $category needs PrivacyInfo.xcprivacy in this target" >>"$matches"
    done <"$uses"
    continue
  fi
  manifest_reasons "$manifest" >"$reasons"
  while read -r category need line; do
    if [ "$need" = any ]; then
      grep -q "^$category " "$reasons" && continue
      echo "$file:$line: $category has no reason in $manifest" >>"$matches"
    else
      grep -Fqx "$category $need" "$reasons" && continue
      echo "$file:$line: $category needs reason $need in $manifest" >>"$matches"
    fi
  done <"$uses"
done <"$list"

if [ -s "$matches" ]; then
  sort -u "$matches"
  exit 1
fi
exit 0
