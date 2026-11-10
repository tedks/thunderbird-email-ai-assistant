#!/usr/bin/env bash
set -euo pipefail

runfiles="${TEST_SRCDIR:?}/${TEST_WORKSPACE:?}"
stage="$(mktemp -d "${TEST_TMPDIR:?}/extension-contract.XXXXXX")"
trap 'rm -rf -- "$stage"' EXIT
mkdir -p "$stage/tools"
for file in \
  background.html background.js manifest.json options.css options.html options.js \
  tools/extension-contract-test.cjs webpack.config.js; do
  cp "$runfiles/$file" "$stage/$file"
done
node "$stage/tools/extension-contract-test.cjs"
