/**
 * Cria a pasta scripts/sync-landing-images/ com cópias apenas dos arquivos
 * listados em scripts/landing-image-paths.txt que existem em public/.
 * Assim você pode zipar essa pasta e enviar para a VPS, ou usar rsync.
 *
 * Uso:
 *   1. npx tsx scripts/list-landing-image-paths.ts   (gera landing-image-paths.txt)
 *   2. npx tsx scripts/sync-landing-images-pack.ts   (cria sync-landing-images/)
 *   3. Enviar sync-landing-images/ para a VPS em /var/www/cannabilize/public/images/
 *
 * Exemplo na VPS após enviar:
 *   cd /var/www/cannabilize/public && cp -r /caminho/do/sync-landing-images/* images/
 */

import * as fs from 'fs';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '..');
const listPath = path.join(projectRoot, 'scripts', 'landing-image-paths.txt');
const publicDir = path.join(projectRoot, 'public');
const outDir = path.join(projectRoot, 'scripts', 'sync-landing-images');

function main() {
  if (!fs.existsSync(listPath)) {
    console.error('Rode primeiro: npx tsx scripts/list-landing-image-paths.ts');
    process.exit(1);
  }

  const lines = fs.readFileSync(listPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  let copied = 0;
  let skipped = 0;

  for (const urlPath of lines) {
    const relative = urlPath.replace(/^\//, ''); // images/hero/foo.jpg
    const src = path.join(publicDir, relative);
    const relativeToImages = relative.replace(/^images\/?/, '') || relative; // hero/foo.jpg para copiar para public/images/
    const dest = path.join(outDir, relativeToImages);

    if (!fs.existsSync(src)) {
      skipped++;
      continue;
    }

    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
    copied++;
  }

  console.log('Copiados:', copied);
  console.log('Ignorados (não existem em public/):', skipped);
  console.log('Pasta criada:', outDir);
  console.log('');
  console.log('Próximo passo: envie a pasta para a VPS.');
  console.log('Exemplo (no seu PC, PowerShell):');
  console.log('  scp -r scripts/sync-landing-images/* root@5.189.168.66:/var/www/cannabilize/public/images/');
}

main();
