#!/usr/bin/env bash
# Fail if tracked files contain API keys, private keys, or other secret patterns.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ERR=0

# OpenAI / DeepSeek style keys
SK_PATTERN='sk-[a-zA-Z0-9]{20,}'
SK_MATCHES=$(git ls-files -z \
  | grep -zvE '\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|pdf|db)$' \
  | xargs -0 grep -lE "$SK_PATTERN" 2>/dev/null || true)

if [ -n "$SK_MATCHES" ]; then
  echo "ERROR: Possible API keys (sk-*) found in tracked files:"
  echo "$SK_MATCHES"
  ERR=1
fi

# Ethereum private keys in env-style files (64 hex chars, excluding placeholders)
ENV_FILES=$(git ls-files '*.env.example' '*.env*.example' 2>/dev/null || true)
if [ -n "$ENV_FILES" ]; then
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if grep -qE 'PRIVATE_KEY=(0x)?[0-9a-fA-F]{64}' "$file" 2>/dev/null; then
      if ! grep -qE 'PRIVATE_KEY=(your-private-key-here|0x0{64}|<.*>)' "$file" 2>/dev/null; then
        echo "ERROR: Possible private key in $file (use your-private-key-here placeholder)"
        ERR=1
      fi
    fi
  done <<< "$ENV_FILES"
fi

# Any 64-char hex that looks like a standalone private key in tracked source (not in comments)
HEX_MATCHES=$(git ls-files -z \
  | grep -zvE '(\.(png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|pdf|db|lock|svg)|pnpm-lock\.yaml|package-lock\.json)$' \
  | xargs -0 grep -lE '(^|[^0-9a-fA-F])(0x)?[0-9a-fA-F]{64}([^0-9a-fA-F]|$)' 2>/dev/null \
  | grep -vE 'check-no-secrets\.sh$' || true)

if [ -n "$HEX_MATCHES" ]; then
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    # Skip if only placeholders or zero keys
    if grep -qE '(0x)?[1-9a-fA-F][0-9a-fA-F]{63}' "$file" 2>/dev/null; then
      echo "ERROR: Possible 64-char hex secret in $file"
      ERR=1
    fi
  done <<< "$HEX_MATCHES"
fi

if [ "$ERR" -ne 0 ]; then
  exit 1
fi

echo "OK: No sk-* or private-key secrets in tracked files."
