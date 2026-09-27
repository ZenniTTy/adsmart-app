#!/usr/bin/env bash
set -uo pipefail
INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
case "$(basename "${FILE:-}")" in .env.example|.env.sample) exit 0 ;; esac

CONTENT=$(printf '%s' "$INPUT" | jq -r '
  (.tool_input.content // empty),
  (.tool_input.new_string // empty),
  ([.tool_input.edits[]?.new_string] | join("\n"))
' 2>/dev/null)
[ -z "$CONTENT" ] && exit 0

fail() {
  echo "SEGREDO DETECTADO ($1) em ${FILE:-arquivo}. Segredos nunca entram em codigo, fixture, log ou doc." >&2
  exit 2
}

printf '%s' "$CONTENT" | grep -qE -- '-----BEGIN [A-Z ]*PRIVATE KEY-----' && fail "chave privada PEM"
printf '%s' "$CONTENT" | grep -qE '"private_key"[[:space:]]*:[[:space:]]*"[^"]{20,}' && fail "private_key de service account"
printf '%s' "$CONTENT" | grep -qE '"private_key_id"[[:space:]]*:[[:space:]]*"[0-9a-f]{40}"' && fail "private_key_id de service account"
printf '%s' "$CONTENT" | grep -qE 'ya29\.[A-Za-z0-9_-]{20,}' && fail "access token OAuth do Google"
printf '%s' "$CONTENT" | grep -qE '1//[0-9A-Za-z_-]{30,}' && fail "refresh token OAuth do Google"
printf '%s' "$CONTENT" | grep -qE 'AIza[0-9A-Za-z_-]{35}' && fail "API key do Google"
printf '%s' "$CONTENT" | grep -qE 'GOCSPX-[A-Za-z0-9_-]{20,}' && fail "client secret OAuth do Google"
printf '%s' "$CONTENT" | grep -qiE 'developer[_-]?token["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9_-]{20,}' && fail "developer token do Google Ads"
printf '%s' "$CONTENT" | grep -qE 'gh[pousr]_[A-Za-z0-9]{36,}' && fail "token do GitHub"
printf '%s' "$CONTENT" | grep -qE 'AKIA[0-9A-Z]{16}' && fail "AWS access key"
exit 0
