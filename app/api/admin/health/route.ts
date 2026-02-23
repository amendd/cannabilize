import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/roles-permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canAccessAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);

    const [
      consultationsToday,
      prescriptionsPending,
      anvisaPending,
      patientCardsPending,
      activeDoctors,
      anvisaExpiringSoon,
    ] = await Promise.all([
      prisma.consultation.count({
        where: {
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          scheduledAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.consultation.count({
        where: {
          status: 'COMPLETED',
          prescription: null,
        },
      }),
      prisma.anvisaAuthorization.count({ where: { status: 'PENDING' } }),
      prisma.patientCard.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.doctor.count({
        where: {
          active: true,
          lastActiveAt: { gte: last7Days },
        },
      }),
      prisma.anvisaAuthorization.count({
        where: {
          AND: [
            { expiresAt: { not: null } },
            { expiresAt: { lte: in30Days } },
            { status: { not: 'EXPIRED' } },
          ],
        },
      }),
    ]);

    return NextResponse.json(
      {
        consultationsToday,
        prescriptionsPending,
        regulatoryPending: anvisaPending + patientCardsPending,
        activeDoctors,
        anvisaExpiringSoon,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching health KPIs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar indicadores de saúde' },
      { status: 500 }
    );
  }
}
