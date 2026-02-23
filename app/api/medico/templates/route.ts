import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Lista templates (ANAMNESE, EVOLUÇÃO). Apenas médico/admin.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // ANAMNESE | EVOLUÇÃO

    const where: { active: boolean; type?: string } = { active: true };
    if (type) where.type = type;

    const templates = await (prisma as any).template.findMany({ where }).catch(() => []);
    return NextResponse.json(templates);
  } catch (error) {
    console.error('[templates]', error);
    return NextResponse.json({ error: 'Erro ao listar templates' }, { status: 500 });
  }
}
