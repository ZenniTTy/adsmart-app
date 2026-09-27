#!/usr/bin/env bash
set -uo pipefail
INPUT=$(cat)
ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] && exit 0
case "$FILE" in "$ROOT"/*) ;; *) exit 0 ;; esac
case "$FILE" in *.ts|*.tsx|*.js|*.mjs|*.cjs|*.json|*.jsonc) ;; *) exit 0 ;; esac
case "$FILE" in */node_modules/*|*/dist/*) exit 0 ;; esac
[ -f "$FILE" ] || exit 0

BIOME="$ROOT/node_modules/.bin/biome"
[ -x "$BIOME" ] || { echo "biome ausente em node_modules; rode bun install" >&2; exit 0; }
"$BIOME" check --write --no-errors-on-unmatched "$FILE" >/dev/null 2>&1 \
  || echo "biome deixou pendencias em $FILE; rode bun run lint" >&2
exit 0
