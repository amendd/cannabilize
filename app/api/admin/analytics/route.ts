import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const KEYS = {
  enabled: 'analytics_enabled',
  measurementId: 'analytics_ga4_measurement_id',
} as const;

/**
 * GET - Obter configurações do Google Analytics (admin)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const [enabledConfig, measurementIdConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: KEYS.enabled } }),
      prisma.systemConfig.findUnique({ where: { key: KEYS.measurementId } }),
    ]);

    return NextResponse.json({
      enabled: enabledConfig?.value === 'true',
      measurementId: measurementIdConfig?.value || '',
    });
  } catch (error) {
    console.error('Erro ao buscar configurações Analytics:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

/**
 * POST - Salvar configurações do Google Analytics (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, measurementId } = body;

    if (enabled === undefined) {
      return NextResponse.json(
        { error: 'Campo "enabled" é obrigatório' },
        { status: 400 }
      );
    }

    if (enabled) {
      const id = (measurementId || '').trim();
      if (!id) {
        return NextResponse.json(
          { error: 'ID de medição (GA4) é obrigatório quando Analytics está ativado' },
          { status: 400 }
        );
      }
      // Formato esperado: G-XXXXXXXXXX
      if (!/^G-[A-Z0-9]+$/i.test(id)) {
        return NextResponse.json(
          { error: 'ID de medição deve estar no formato G-XXXXXXXXXX (GA4)' },
          { status: 400 }
        );
      }
    }

    await prisma.systemConfig.upsert({
      where: { key: KEYS.enabled },
      update: { value: String(enabled) },
      create: { key: KEYS.enabled, value: String(enabled) },
    });

    if (measurementId !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key: KEYS.measurementId },
        update: { value: (measurementId || '').trim() },
        create: { key: KEYS.measurementId, value: (measurementId || '').trim() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações do Google Analytics salvas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao salvar configurações Analytics:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
