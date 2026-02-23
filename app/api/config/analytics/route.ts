import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - Configuração pública do Google Analytics (para o script no front).
 * Usa: 1) SystemConfig (admin), 2) fallback env NEXT_PUBLIC_GA_MEASUREMENT_ID.
 */
export async function GET() {
  try {
    const [enabledConfig, measurementIdConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'analytics_enabled' } }),
      prisma.systemConfig.findUnique({ where: { key: 'analytics_ga4_measurement_id' } }),
    ]);

    const fromDb = (measurementIdConfig?.value || '').trim();
    const fromEnv = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '').trim();
    const measurementId = fromDb || fromEnv || null;

    const enabledFromDb = enabledConfig?.value === 'true';
    const enabled = measurementId ? (enabledFromDb || !!fromEnv) : false;

    return NextResponse.json({
      enabled: !!enabled && !!measurementId,
      measurementId,
    });
  } catch (error) {
    console.error('Erro ao buscar config Analytics (público):', error);
    // Fallback: usar env se o banco falhar, para não quebrar a coleta
    const fromEnv = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '').trim();
    if (fromEnv) {
      return NextResponse.json({ enabled: true, measurementId: fromEnv });
    }
    return NextResponse.json({ enabled: false, measurementId: null });
  }
}
