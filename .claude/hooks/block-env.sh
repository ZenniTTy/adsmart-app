#!/usr/bin/env bash
set -uo pipefail
INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
[ -z "$FILE" ] && exit 0
FILE="${FILE//\\//}"
BASE="$(basename "$FILE")"

deny() {
  {
    echo "BLOQUEADO: $FILE"
    echo "Motivo: $1"
    echo "Credenciais da AdSmart nunca passam pelo agente. Use fixtures sinteticas em tests/."
  } >&2
  exit 2
}

case "$BASE" in
  .env.example|.env.sample) exit 0 ;;
esac

case "$BASE" in
  .env|.env.*) deny "arquivo de ambiente" ;;
  *credentials*.json) deny "arquivo de credenciais" ;;
  *service-account*.json) deny "chave de service account" ;;
  *-key.json) deny "chave JSON" ;;
  *-[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].json) deny "chave com nome padrao do Google Cloud" ;;
  *.pem|*.p12|*.pfx|*.key) deny "chave privada" ;;
esac

case "$FILE" in
  *.adsmart/*|*.adsmart) deny "diretorio local de dados da AdSmart" ;;
  */node_modules/*|node_modules/*|*/dist/*|dist/*) deny "artefato de build ou dependencia; edite a fonte" ;;
esac
exit 0
