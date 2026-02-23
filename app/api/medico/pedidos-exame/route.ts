import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST - Cria pedido de exame (médico ou admin).
 * Body: { patientId, content, consultationId? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!doctor && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 403 });
    }

    const body = await request.json();
    const patientId = body.patientId;
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!patientId || !content) {
      return NextResponse.json({ error: 'patientId e content obrigatórios' }, { status: 400 });
    }

    const doctorId = session.user.role === 'ADMIN' && body.doctorId ? body.doctorId : doctor?.id;
    if (!doctorId) return NextResponse.json({ error: 'Médico não identificado' }, { status: 400 });

    const requestedAt = new Date();
    const examRequest = await (prisma as any).examRequest.create({
      data: {
        patientId,
        doctorId,
        consultationId: body.consultationId || null,
        content,
        requestedAt,
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true, crm: true } },
      },
    });

    return NextResponse.json(examRequest);
  } catch (error) {
    console.error('[pedidos-exame POST]', error);
    return NextResponse.json({ error: 'Erro ao criar pedido de exame' }, { status: 500 });
  }
}
