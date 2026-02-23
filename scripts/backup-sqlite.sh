#!/usr/bin/env bash
# Backup do SQLite (desenvolvimento local).
# Uso: DATABASE_URL="file:./dev.db" ./scripts/backup-sqlite.sh
# Ou com caminho explícito: SQLITE_DB_PATH="./prisma/dev.db" ./scripts/backup-sqlite.sh
#
# Requer: sqlite3 (ou copia direta do arquivo se SQLITE_DB_PATH apontar para o .db).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${BACKUP_OUTPUT_DIR:-$SCRIPT_DIR/../backups}"
DATE=$(date +%Y%m%d-%H%M%S)

# Extrair caminho do arquivo a partir de DATABASE_URL (file:./dev.db ou file:./prisma/dev.db)
if [[ -n "${SQLITE_DB_PATH:-}" ]]; then
  DB_PATH="$SQLITE_DB_PATH"
else
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "Erro: DATABASE_URL ou SQLITE_DB_PATH não definidos." >&2
    exit 1
  fi
  # file:./dev.db ou file:./prisma/dev.db
  DB_PATH="${DATABASE_URL#file:}"
  DB_PATH="$(cd "$SCRIPT_DIR/.." && echo "$DB_PATH")"
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "Erro: Arquivo do banco não encontrado: $DB_PATH" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
FILENAME="sqlite-backup-${DATE}.db"
FILEPATH="${OUTPUT_DIR}/${FILENAME}"

# Cópia atômica (recomendado para SQLite em uso)
if command -v sqlite3 &>/dev/null; then
  echo "[$(date -Iseconds)] Backup SQLite (sqlite3 .backup)..."
  sqlite3 "$DB_PATH" ".backup '$FILEPATH'"
else
  echo "[$(date -Iseconds)] Backup SQLite (cópia do arquivo)..."
  cp "$DB_PATH" "$FILEPATH"
fi

echo "[$(date -Iseconds)] Backup gerado: $FILEPATH ($(du -h "$FILEPATH" | cut -f1))"

# Opcional: dump em SQL (portável)
SQL_NAME="sqlite-backup-${DATE}.sql"
if command -v sqlite3 &>/dev/null; then
  sqlite3 "$DB_PATH" .dump | gzip > "${OUTPUT_DIR}/${SQL_NAME}.gz"
  echo "[$(date -Iseconds)] Dump SQL: ${OUTPUT_DIR}/${SQL_NAME}.gz"
fi

echo "[$(date -Iseconds)] Backup SQLite concluído."
