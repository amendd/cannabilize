import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const GLOBAL_KEY = 'doctor_alerts_sound_enabled';

function mutedKey(doctorId: string) {
  return `doctor_alerts_muted_${doctorId}`;
}

/**
 * GET /api/doctors/me/alert-sound
 * Retorna se os alertas sonoros estão habilitados globalmente e se o médico os mutou.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let doctorId: string | null = null;

    if (session.user.role === 'ADMIN') {
      const doctorIdParam = request.nextUrl.searchParams.get('doctorId');
      if (doctorIdParam) doctorId = doctorIdParam;
      else return NextResponse.json({ globalEnabled: false, muted: true });
    } else {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      doctorId = doctor?.id ?? null;
    }

    if (!doctorId) {
      return NextResponse.json({ globalEnabled: false, muted: true });
    }

    const [globalConfig, mutedConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: GLOBAL_KEY } }),
      prisma.systemConfig.findUnique({ where: { key: mutedKey(doctorId) } }),
    ]);

    const globalEnabled = globalConfig?.value === 'true';
    const muted = mutedConfig?.value === 'true';

    return NextResponse.json({ globalEnabled, muted });
  } catch (error) {
    console.error('Erro ao buscar preferência de alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar preferência' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/doctors/me/alert-sound
 * Atualiza se o médico mutou os alertas sonoros.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let doctorId: string | null = null;

    if (session.user.role === 'ADMIN') {
      const doctorIdParam = request.nextUrl.searchParams.get('doctorId');
      if (doctorIdParam) doctorId = doctorIdParam;
      else return NextResponse.json({ error: 'doctorId obrigatório para admin' }, { status: 400 });
    } else {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      doctorId = doctor?.id ?? null;
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const muted = body.muted === true;

    await prisma.systemConfig.upsert({
      where: { key: mutedKey(doctorId) },
      update: { value: muted ? 'true' : 'false' },
      create: { key: mutedKey(doctorId), value: muted ? 'true' : 'false' },
    });

    return NextResponse.json({ muted });
  } catch (error) {
    console.error('Erro ao salvar preferência de alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar preferência' },
      { status: 500 }
    );
  }
}
