#!/usr/bin/env bash
# Fail if tracked files contain API key patterns (sk-..., etc.)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERN='sk-[a-zA-Z0-9]{20,}'

# Only scan git-tracked files; exclude binary-ish paths
MATCHES=$(git ls-files -z \
  | grep -zvE '\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|pdf|db)$' \
  | xargs -0 grep -lE "$PATTERN" 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "ERROR: Possible API keys found in tracked files:"
  echo "$MATCHES"
  exit 1
fi

echo "OK: No sk-* secrets in tracked files."
