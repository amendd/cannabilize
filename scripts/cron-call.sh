#!/bin/bash
# Uso: ./cron-call.sh "GET" "/api/admin/email/reminders?type=NOW"
# Na VPS, defina CRON_SECRET e BASE_URL no .env ou neste script (não commite o secret).
# Exemplo crontab: */15 * * * * /var/www/clickcannabis-replica/scripts/cron-call.sh "GET" "/api/admin/email/reminders?type=NOW"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^CRON_SECRET=|^BASE_URL=' "$ENV_FILE" | xargs)
fi

# Fallback se não estiver no .env (configure na VPS)
# export CRON_SECRET="seu_cron_secret"
# export BASE_URL="http://127.0.0.1:3000"

METHOD="${1:-GET}"
PATH_URL="${2:-/}"
BASE="${BASE_URL:-http://127.0.0.1:3000}"
URL="${BASE}${PATH_URL}"

curl -s -X "$METHOD" -H "Authorization: Bearer $CRON_SECRET" "$URL" > /dev/null 2>&1
