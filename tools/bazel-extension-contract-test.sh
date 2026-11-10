#!/usr/bin/env bash
set -euo pipefail

exec node "${TEST_SRCDIR:?}/${TEST_WORKSPACE:?}/tools/extension-contract-test.cjs"
