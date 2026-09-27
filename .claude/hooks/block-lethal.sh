#!/usr/bin/env bash
set -uo pipefail
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0

deny() {
  {
    echo "BLOQUEADO: $1"
    echo "  $CMD"
    echo "Este comando so roda por decisao humana explicita, fora do agente."
  } >&2
  exit 2
}

printf '%s' "$CMD" | grep -qE '(^|[^[:alnum:]_-])rm[[:space:]]+(-[[:alpha:]]*[rR][[:alpha:]]*[fF]|-[[:alpha:]]*[fF][[:alpha:]]*[rR]|(-[rR]|--recursive)[[:space:]]+(-[fF]|--force)|(-[fF]|--force)[[:space:]]+(-[rR]|--recursive))' \
  && deny "rm recursivo forcado"
printf '%s' "$CMD" | grep -qE 'git[[:space:]].*push.*([[:space:]]--force|[[:space:]]-f([[:space:]]|$)|[[:space:]]\+[[:alnum:]])' \
  && deny "git push forcado"
printf '%s' "$CMD" | grep -qE 'git[[:space:]].*reset[[:space:]].*--hard' \
  && deny "git reset --hard"
printf '%s' "$CMD" | grep -qE '[[:alnum:]_.-]*credentials[[:alnum:]_.-]*\.json' \
  && deny "acesso a arquivo de credenciais"
printf '%s' "$CMD" | grep -qE '[[:alnum:]_.-]*service-account[[:alnum:]_.-]*\.json' \
  && deny "acesso a chave de service account"
printf '%s' "$CMD" | grep -qE '[a-z][a-z0-9-]{4,28}[a-z0-9]-[0-9a-f]{12}\.json' \
  && deny "acesso a chave com nome padrao do Google Cloud"
printf '%s' "$CMD" | grep -qE '[[:alnum:]_.]+-key\.json' \
  && deny "acesso a chave JSON"
printf '%s' "$CMD" | grep -qE '\.adsmart(/|[[:space:]"'"'"']|$)' \
  && deny "acesso ao diretorio local de dados do AdSmart"
printf '%s' "$CMD" | grep -E '(^|[[:space:]/"'"'"'=<>])\.env(\.[[:alnum:]_-]+)?([[:space:]"'"'"';|&)]|$)' | grep -qvE '\.env\.(example|sample)([^[:alnum:]]|$)' \
  && deny "acesso a arquivo de ambiente"
exit 0
