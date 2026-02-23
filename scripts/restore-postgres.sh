#!/usr/bin/env bash
# Restauração de dump PostgreSQL (arquivo .sql ou .sql.gz).
# Uso: RESTORE_DATABASE_URL="postgresql://..." ./scripts/restore-postgres.sh backup-2025-02-10.sql.gz
# Ou:  RESTORE_DATABASE_URL="..." ./scripts/restore-postgres.sh backup-2025-02-10.sql
#
# Requer: psql, gunzip (se for .gz). Use em banco de teste/restore, não em produção direto.

set -euo pipefail

if [[ -z "${RESTORE_DATABASE_URL:-}" ]]; then
  echo "Erro: RESTORE_DATABASE_URL não definida." >&2
  exit 1
fi

DUMP_FILE="${1:-}"
if [[ -z "$DUMP_FILE" || ! -f "$DUMP_FILE" ]]; then
  echo "Uso: RESTORE_DATABASE_URL='...' $0 <arquivo.sql ou arquivo.sql.gz>" >&2
  exit 1
fi

echo "[$(date -Iseconds)] Restaurando de $DUMP_FILE..."

if [[ "$DUMP_FILE" == *.gz ]]; then
  gunzip -c "$DUMP_FILE" | psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1
else
  psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$DUMP_FILE"
fi

echo "[$(date -Iseconds)] Restauração concluída. Valide as tabelas e a aplicação."
