#!/usr/bin/env bash
# Diagnóstico: por que CSS/JS estáticos retornam HTML (erro MIME) na VPS
# Execute NA VPS, na pasta do projeto: bash scripts/diagnostico-static-vps.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/cannabilize}"
PM2_APP="${PM2_APP:-cannabilize}"

echo "=== Diagnóstico de arquivos estáticos (Next.js) ==="
echo "Pasta do app: $APP_DIR"
echo ""

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERRO: Pasta não encontrada: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

echo "1. Pasta .next existe?"
if [[ -d ".next" ]]; then
  echo "   Sim"
else
  echo "   NÃO — rode: npm run build"
  exit 1
fi

echo ""
echo "2. Conteúdo de .next/static:"
if [[ -d ".next/static" ]]; then
  ls -la .next/static/ 2>/dev/null || echo "   (vazio ou sem permissão)"
  echo ""
  echo "   CSS:"
  ls .next/static/css/*.css 2>/dev/null | head -5 || echo "   Nenhum arquivo CSS"
  echo "   Chunks (primeiros 5):"
  ls .next/static/chunks/*.js 2>/dev/null | head -5 || echo "   Nenhum chunk"
else
  echo "   .next/static NÃO existe — rode: npm run build"
  exit 1
fi

echo ""
echo "3. PM2 — app está rodando e de qual pasta?"
pm2 describe "$PM2_APP" 2>/dev/null | grep -E "script path|cwd|exec cwd" || pm2 list

echo ""
echo "4. Recomendações:"
echo "   - Se .next/static estiver vazio ou com poucos arquivos: npm run build"
echo "   - Se o 'cwd' do PM2 for diferente de $APP_DIR: ajuste o start do PM2 para esta pasta"
echo "   - Depois: pm2 restart $PM2_APP"
echo ""
echo "   Comandos completos:"
echo "   cd $APP_DIR && npm run build && pm2 restart $PM2_APP"
