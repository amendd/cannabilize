import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [totalPatients, totalPrescriptions, prescriptionsExpiringSoon, consentCount, auditLast30Days] =
      await Promise.all([
        prisma.user.count({ where: { role: 'PATIENT' } }),
        prisma.prescription.count(),
        prisma.prescription.count({
          where: {
            expiresAt: { gte: now, lte: in30Days },
            status: 'ISSUED',
          },
        }),
        prisma.patientConsent.count({ where: { revokedAt: null } }).catch(() => 0),
        prisma.auditLog.count({
          where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        }),
      ]);

    const prescriptionsByStatus = await prisma.prescription.groupBy({
      by: ['status'],
      _count: true,
    });
    const statusMap: Record<string, number> = {};
    prescriptionsByStatus.forEach((s) => {
      statusMap[s.status] = s._count;
    });

    return NextResponse.json({
      totalPatients,
      totalPrescriptions,
      prescriptionsExpiringSoon,
      consentCount,
      auditLast30Days,
      prescriptionsByStatus: statusMap,
    });
  } catch (e) {
    console.error('GPP stats error:', e);
    return NextResponse.json({ error: 'Erro ao carregar estatísticas' }, { status: 500 });
  }
}
