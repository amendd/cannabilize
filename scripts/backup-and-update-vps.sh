#!/bin/bash
# Backup de arquivos que conflitam com o repo e atualização na VPS.
# Uso: na VPS, na pasta do projeto: bash scripts/backup-and-update-vps.sh
# Ou: chmod +x scripts/backup-and-update-vps.sh && ./scripts/backup-and-update-vps.sh

set -e
cd /var/www/cannabilize

echo "=== 1. Backup dos arquivos que conflitam com git pull ==="
BACKUP_DIR="/root/cannabilize-backup-$(date +%Y%m%d-%H%M)"
mkdir -p "$BACKUP_DIR"

if [ -f env.vps.producao.txt ]; then
  cp env.vps.producao.txt "$BACKUP_DIR/env.vps.producao.txt.bak"
  echo "  Backup: env.vps.producao.txt -> $BACKUP_DIR/"
fi
if [ -d nginx ]; then
  mkdir -p "$BACKUP_DIR/nginx"
  cp -r nginx/* "$BACKUP_DIR/nginx/" 2>/dev/null || true
  echo "  Backup: nginx/ -> $BACKUP_DIR/nginx/"
fi

echo "=== 2. Remover arquivos que bloqueiam o merge ==="
rm -f env.vps.producao.txt
rm -f nginx/cannabilize.conf
# Manter pasta nginx se existir outros arquivos
rmdir nginx 2>/dev/null || true

echo "=== 3. Git pull ==="
git pull

echo "=== 4. Build ==="
npm run build

echo "=== 5. Reiniciar app ==="
pm2 restart all

echo "=== Concluído. Backup em: $BACKUP_DIR ==="
echo "Se precisar restaurar env ou nginx, copie de volta de $BACKUP_DIR"
