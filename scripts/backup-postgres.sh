#!/usr/bin/env bash
# Backup completo do PostgreSQL (produção/staging).
# Uso: BACKUP_DATABASE_URL="postgresql://..." [BACKUP_BUCKET=s3://...] ./scripts/backup-postgres.sh
# Ou: BACKUP_DATABASE_URL="..." ./scripts/backup-postgres.sh
#     (apenas gera o arquivo localmente se BACKUP_BUCKET não estiver definido)
#
# Requer: pg_dump, gzip. Para upload: aws cli (S3) ou gsutil (GCS).

set -euo pipefail

DATE=$(date +%Y%m%d-%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${BACKUP_OUTPUT_DIR:-$SCRIPT_DIR/../backups}"
FILENAME="backup-${DATE}.sql.gz"
FILEPATH="${OUTPUT_DIR}/${FILENAME}"

if [[ -z "${BACKUP_DATABASE_URL:-}" ]]; then
  echo "Erro: BACKUP_DATABASE_URL não definida." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "[$(date -Iseconds)] Iniciando backup PostgreSQL..."
if pg_dump "$BACKUP_DATABASE_URL" --no-owner --no-acl | gzip > "$FILEPATH"; then
  echo "[$(date -Iseconds)] Dump gerado: $FILEPATH ($(du -h "$FILEPATH" | cut -f1))"
else
  echo "[$(date -Iseconds)] Falha no pg_dump." >&2
  exit 1
fi

# Upload opcional para S3
if [[ -n "${BACKUP_BUCKET:-}" ]]; then
  if command -v aws &>/dev/null; then
    echo "[$(date -Iseconds)] Enviando para $BACKUP_BUCKET..."
    if aws s3 cp "$FILEPATH" "$BACKUP_BUCKET/$(basename "$FILEPATH")" --sse AES256; then
      echo "[$(date -Iseconds)] Upload concluído."
    else
      echo "[$(date -Iseconds)] Falha no upload S3." >&2
      exit 1
    fi
  else
    echo "[$(date -Iseconds)] BACKUP_BUCKET definido mas 'aws' não encontrado; backup apenas local." >&2
  fi
fi

# Upload opcional para GCS
if [[ -n "${BACKUP_GCS_BUCKET:-}" ]]; then
  if command -v gsutil &>/dev/null; then
    echo "[$(date -Iseconds)] Enviando para gs://$BACKUP_GCS_BUCKET..."
    if gsutil cp "$FILEPATH" "gs://$BACKUP_GCS_BUCKET/$(basename "$FILEPATH")"; then
      echo "[$(date -Iseconds)] Upload GCS concluído."
    else
      echo "[$(date -Iseconds)] Falha no upload GCS." >&2
      exit 1
    fi
  else
    echo "[$(date -Iseconds)] BACKUP_GCS_BUCKET definido mas 'gsutil' não encontrado." >&2
  fi
fi

echo "[$(date -Iseconds)] Backup concluído com sucesso."
