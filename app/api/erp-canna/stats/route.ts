import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalPatients,
      totalDoctors,
      totalOrganizations,
      ordersByStatus,
      recentOrders,
      anvisaPending,
      auditCount,
      monthlyRevenue,
      prescriptionsExpiringSoon,
      ordersInProgress,
      ordersDelivered,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.doctor.count({ where: { active: true } }),
      prisma.organization.count({ where: { active: true } }),
      prisma.erpOrder.groupBy({ by: ['status'], _count: true }),
      prisma.erpOrder.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          prescription: { select: { id: true } },
        },
      }),
      prisma.anvisaAuthorization.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.prescription.count({
        where: {
          status: 'ISSUED',
          expiresAt: { lte: in30Days, gte: now },
        },
      }),
      prisma.erpOrder.count({
        where: { status: { in: ['PENDING', 'APPROVED', 'PAID', 'SENT'] } },
      }),
      prisma.erpOrder.count({ where: { status: 'DELIVERED' } }),
    ]);

    const orderStatusMap: Record<string, number> = {};
    ordersByStatus.forEach((s) => {
      orderStatusMap[s.status] = s._count;
    });

    return NextResponse.json({
      totalPatients,
      totalDoctors,
      totalOrganizations,
      ordersByStatus: orderStatusMap,
      recentOrders,
      anvisaPending,
      auditCountLast30Days: auditCount,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
      prescriptionsExpiringSoon,
      ordersInProgress,
      ordersDelivered,
    });
  } catch (e) {
    console.error('erp-canna stats:', e);
    return NextResponse.json({ error: 'Erro ao carregar estatísticas' }, { status: 500 });
  }
}
