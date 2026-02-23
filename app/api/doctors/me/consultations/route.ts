import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/doctors/me/consultations
 * Retorna as consultas do médico logado.
 * Query: limit, status, full=true (retorna dados completos para listagem; sem full retorna só campos para polling).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    let doctorId: string | null = null;

    if (session.user.role === 'ADMIN') {
      const doctorIdParam = request.nextUrl.searchParams.get('doctorId');
      if (doctorIdParam) {
        doctorId = doctorIdParam;
      } else {
        return NextResponse.json([]);
      }
    } else {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      doctorId = doctor?.id ?? null;
    }

    if (!doctorId) {
      return NextResponse.json([]);
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);
    const status = searchParams.get('status') || undefined;
    const full = searchParams.get('full') === 'true';

    const where: { doctorId: string; status?: string } = { doctorId };
    if (status) {
      where.status = status;
    }

    if (!full) {
      const consultations = await prisma.consultation.findMany({
        where,
        select: {
          id: true,
          scheduledAt: true,
          scheduledDate: true,
          scheduledTime: true,
          status: true,
          patient: { select: { name: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      });
      return NextResponse.json(consultations);
    }

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        doctor: true,
        prescription: true,
        payment: true,
        rescheduleInvites: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
          select: { id: true, status: true, expiresAt: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error('Erro ao buscar consultas do médico:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consultas' },
      { status: 500 }
    );
  }
}
