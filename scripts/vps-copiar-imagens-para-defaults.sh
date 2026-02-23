#!/bin/bash
# Execute NA VPS após enviar public/images do PC.
# Copia as imagens enviadas (ex.: hero-xxx.png) para os nomes padrão que o código usa
# quando o banco não tem URL customizada (ex.: doctor-consultation.jpg).
# Uso: bash vps-copiar-imagens-para-defaults.sh
# (rode de dentro de /var/www/cannabilize)

set -e
CD="/var/www/cannabilize/public/images"
cd "$CD" || exit 1

# Hero: primeiro arquivo em hero/ -> doctor-consultation.jpg
if [ -d "hero" ] && [ -n "$(ls -A hero 2>/dev/null)" ]; then
  first=$(ls hero/ | head -1)
  cp "hero/$first" "hero/doctor-consultation.jpg" 2>/dev/null || true
fi

# Process: process_1-* -> consultation.jpg, etc.
[ -d "process" ] && for i in 1 2 3 4; do
  case $i in
    1) name="consultation.jpg";;
    2) name="prescription.jpg";;
    3) name="anvisa.jpg";;
    4) name="delivery.jpg";;
  esac
  f=$(ls process/process_$i-* 2>/dev/null | head -1)
  [ -n "$f" ] && cp "$f" "process/$name"
done

# Logo já pode estar como cannalize-logo.png; se tiver logo-*.png, use como fallback
if [ -f "logo-"* ] && [ ! -f "cannalize-logo.png" ]; then
  cp logo-* cannalize-logo.png 2>/dev/null || true
fi

echo "Concluído. Imagens padrão criadas a partir dos uploads."
