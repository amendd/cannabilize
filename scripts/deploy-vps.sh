#!/usr/bin/env bash
# Deploy na VPS: pull, install, build e restart do app (PM2).
# Uso na VPS: ./scripts/deploy-vps.sh
# Ou com variáveis: APP_DIR=/var/www/cannabilize PM2_APP=cannabilize ./scripts/deploy-vps.sh
#
# Este script é usado pelo GitHub Actions (via SSH) ou pode ser rodado manualmente na VPS.

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/cannabilize}"
PM2_APP="${PM2_APP:-cannabilize}"

if [[ ! -d "$APP_DIR" ]]; then
  echo "Erro: diretório do app não encontrado: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"
echo "[$(date -Iseconds)] Deploy em $APP_DIR (PM2: $PM2_APP)"

echo "→ git pull..."
git pull origin main

echo "→ npm ci..."
npm ci --omit=dev

echo "→ npm run build..."
npm run build

echo "→ pm2 restart $PM2_APP..."
pm2 restart "$PM2_APP"

echo "[$(date -Iseconds)] Deploy concluído com sucesso."
