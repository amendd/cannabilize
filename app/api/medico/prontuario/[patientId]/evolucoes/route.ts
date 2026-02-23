import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Lista evoluções clínicas do paciente (médico que atende ou admin).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { patientId } = await params;
    if (!patientId) return NextResponse.json({ error: 'patientId obrigatório' }, { status: 400 });

    let doctorId: string | null = null;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      doctorId = doctor?.id || null;
    }

    const where: { patientId: string; doctorId?: string } = { patientId };
    if (doctorId) where.doctorId = doctorId;

    const evolutions = await (prisma as any).clinicalEvolution.findMany({
      where,
      orderBy: { evolutionDate: 'desc' },
      include: {
        doctor: { select: { id: true, name: true } },
        consultation: { select: { id: true, scheduledAt: true } },
      },
    }).catch(() => []);

    return NextResponse.json(evolutions);
  } catch (error) {
    console.error('[evolucoes]', error);
    return NextResponse.json({ error: 'Erro ao listar evoluções' }, { status: 500 });
  }
}

/**
 * POST - Cria evolução clínica (médico ou admin).
 * Body: { content: string, evolutionDate?: string (ISO), consultationId?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { patientId } = await params;
    if (!patientId) return NextResponse.json({ error: 'patientId obrigatório' }, { status: 400 });

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!doctor && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 403 });
    }

    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 });

    const evolutionDate = body.evolutionDate ? new Date(body.evolutionDate) : new Date();
    const consultationId = body.consultationId || null;

    let doctorId = doctor?.id;
    if (session.user.role === 'ADMIN' && body.doctorId) doctorId = body.doctorId;
    if (!doctorId) return NextResponse.json({ error: 'Médico não identificado' }, { status: 400 });

    const evolution = await (prisma as any).clinicalEvolution.create({
      data: {
        patientId,
        doctorId,
        consultationId,
        content,
        evolutionDate,
      },
      include: {
        doctor: { select: { id: true, name: true } },
        consultation: { select: { id: true, scheduledAt: true } },
      },
    });

    return NextResponse.json(evolution);
  } catch (error) {
    console.error('[evolucoes POST]', error);
    return NextResponse.json({ error: 'Erro ao criar evolução' }, { status: 500 });
  }
}
