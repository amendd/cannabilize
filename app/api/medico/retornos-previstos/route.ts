import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Retornos previstos (consultas com nextReturnDate nos próximos dias).
 * Query: days=15 (default 15 dias)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') || '15', 10) || 15));

    let doctorId: string | null = null;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      doctorId = doctor?.id || null;
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + days);

    const where: { nextReturnDate: { gte: Date; lte: Date }; status: string; doctorId?: string } = {
      nextReturnDate: { gte: now, lte: end },
      status: 'COMPLETED',
    };
    if (doctorId) where.doctorId = doctorId;

    const consultations = await prisma.consultation.findMany({
      where,
      orderBy: { nextReturnDate: 'asc' },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      retornos: consultations.map((c) => ({
        id: c.id,
        consultationId: c.id,
        patientId: c.patientId,
        patientName: c.patient?.name,
        patientEmail: c.patient?.email,
        patientPhone: c.patient?.phone,
        nextReturnDate: c.nextReturnDate?.toISOString(),
        scheduledAt: c.scheduledAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[retornos-previstos]', error);
    return NextResponse.json({ error: 'Erro ao buscar retornos' }, { status: 500 });
  }
}
