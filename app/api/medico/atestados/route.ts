import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST - Emite atestado médico (médico ou admin).
 * Body: { patientId, content, cid10?, daysOff?, consultationId? }
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

    const issuedAt = body.issuedAt ? new Date(body.issuedAt) : new Date();
    const certificate = await (prisma as any).medicalCertificate.create({
      data: {
        patientId,
        doctorId,
        consultationId: body.consultationId || null,
        content,
        cid10: body.cid10 || null,
        daysOff: body.daysOff ?? null,
        issuedAt,
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true, crm: true } },
      },
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error('[atestados POST]', error);
    return NextResponse.json({ error: 'Erro ao emitir atestado' }, { status: 500 });
  }
}
