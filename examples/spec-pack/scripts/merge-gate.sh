#!/bin/sh
# Reference merge gate for a build-to-spec app.
# Copy this file and the check-*.sh steps beside it into the app's scripts/.
set -eu
dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
sh "$dir/check-snapshot-record-mode.sh"
sh "$dir/check-live-screen-test.sh"
sh "$dir/check-mock-state-branches.sh"
