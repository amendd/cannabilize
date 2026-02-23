/**
 * Lista todos os caminhos de imagens usados na landing (home):
 * - SystemConfig (landing_*_url)
 * - SiteAsset
 * - LandingTestimonial (photoUrl)
 * - landing_consumption_forms_items (imageUrl em cada item)
 * - Defaults do código quando não há valor no banco
 *
 * Uso: npx tsx scripts/list-landing-image-paths.ts
 * Requer: DATABASE_URL no .env
 *
 * Gera: scripts/landing-image-paths.txt (lista de caminhos) e
 *       scripts/landing-image-paths-missing.txt (os que não existem em public/)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Defaults do lib/landing-config.ts e componentes
const DEFAULT_PATHS = [
  '/images/hero/doctor-consultation.jpg',
  '/images/hero/placeholder.jpg',
  '/images/cannalize-logo.png',
  '/images/process/consultation.jpg',
  '/images/process/prescription.jpg',
  '/images/process/anvisa.jpg',
  '/images/process/delivery.jpg',
  '/images/team/dr-joao-silva.jpg',
  '/images/team/dra-maria-santos.jpg',
  '/images/team/equipe-suporte.jpg',
  '/images/team/default-avatar.jpg',
  '/images/testimonials/natalia-almeida.jpg',
  '/images/testimonials/luciana-pereira.jpg',
  '/images/testimonials/beatriz-dobruski.jpg',
  '/images/testimonials/vera-oliveira.jpg',
  '/images/testimonials/luadi-morais.jpg',
  '/images/testimonials/thiago-jatoba.jpg',
  '/images/events/click-runner.webp',
  '/images/events/arpoador.webp',
  '/images/events/iron-man.webp',
  '/images/placeholder.jpg',
];

function isLocalImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  return t.startsWith('/images/') && !t.startsWith('//');
}

function extractPath(url: string): string {
  return url.trim().split('?')[0];
}

async function main() {
  const paths = new Set<string>(DEFAULT_PATHS);

  try {
    // SystemConfig: landing_*_url
    const configs = await prisma.systemConfig.findMany({
      where: { key: { startsWith: 'landing_' } },
    });
    for (const row of configs) {
      if (isLocalImageUrl(row.value)) paths.add(extractPath(row.value));
      if (row.key === 'landing_consumption_forms_items') {
        try {
          const items = JSON.parse(row.value) as Array<{ imageUrl?: string }>;
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item && isLocalImageUrl(item.imageUrl)) paths.add(extractPath(item.imageUrl!));
            }
          }
        } catch {
          // ignore invalid JSON
        }
      }
    }

    // SiteAsset: value é URL
    const assets = await prisma.siteAsset.findMany();
    for (const a of assets) {
      if (isLocalImageUrl(a.value)) paths.add(extractPath(a.value));
    }

    // LandingTestimonial: photoUrl
    const testimonials = await prisma.landingTestimonial.findMany();
    for (const t of testimonials) {
      if (isLocalImageUrl(t.photoUrl)) paths.add(extractPath(t.photoUrl!));
    }
  } catch (e) {
    console.error('Erro ao ler banco (use DATABASE_URL):', e);
  }

  const sorted = [...paths].sort();
  const projectRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(projectRoot, 'public');
  const existing: string[] = [];
  const missing: string[] = [];

  for (const p of sorted) {
    const filePath = path.join(publicDir, p.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      existing.push(p);
    } else {
      missing.push(p);
    }
  }

  const outDir = path.join(projectRoot, 'scripts');
  const listPath = path.join(outDir, 'landing-image-paths.txt');
  const missingPath = path.join(outDir, 'landing-image-paths-missing.txt');

  fs.writeFileSync(listPath, sorted.join('\n') + '\n', 'utf8');
  fs.writeFileSync(missingPath, missing.join('\n') + '\n', 'utf8');

  console.log('Caminhos de imagens da landing (total):', sorted.length);
  console.log('Existem em public/:', existing.length);
  console.log('Faltando em public/:', missing.length);
  console.log('');
  console.log('Arquivos gerados:');
  console.log('  -', listPath);
  console.log('  -', missingPath);
  console.log('');
  if (missing.length > 0) {
    console.log('Faltando (primeiros 20):');
    missing.slice(0, 20).forEach((p) => console.log('  ', p));
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
