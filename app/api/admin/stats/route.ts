import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/roles-permissions';

export const dynamic = 'force-dynamic';

const ACTIVE_PRESCRIPTION_STATUSES = ['ACTIVE', 'EXPIRING', 'ISSUED'];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canAccessAdmin(session.user?.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalPatients,
      totalConsultations,
      totalPrescriptions,
      payments,
      prescriptionsActive,
      prescriptionsExpiring7,
      prescriptionsExpiring15,
      prescriptionsExpiring30,
      prescriptionsExpired,
      patientsWithoutConsent,
      inactiveDoctorsCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PATIENT', deletedAt: null } }),
      prisma.consultation.count(),
      prisma.prescription.count(),
      prisma.payment.findMany({ where: { status: 'PAID' }, select: { amount: true } }),
      prisma.prescription.count({
        where: {
          status: { in: ACTIVE_PRESCRIPTION_STATUSES },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      prisma.prescription.count({
        where: {
          status: { in: ACTIVE_PRESCRIPTION_STATUSES },
          expiresAt: { gte: now, lte: in7 },
        },
      }),
      prisma.prescription.count({
        where: {
          status: { in: ACTIVE_PRESCRIPTION_STATUSES },
          expiresAt: { gte: now, lte: in15 },
        },
      }),
      prisma.prescription.count({
        where: {
          status: { in: ACTIVE_PRESCRIPTION_STATUSES },
          expiresAt: { gte: now, lte: in30 },
        },
      }),
      prisma.prescription.count({
        where: {
          expiresAt: { lt: now },
          status: { notIn: ['REPLACED', 'CANCELLED'] },
        },
      }),
      prisma.user.count({
        where: {
          role: 'PATIENT',
          deletedAt: null,
          patientConsents: {
            none: {
              type: 'DATA_PROCESSING',
              revokedAt: null,
            },
          },
        },
      }),
      prisma.doctor.count({ where: { active: false } }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json(
      {
        totalPatients,
        totalConsultations,
        totalPrescriptions,
        totalRevenue,
        prescriptionsActive,
        prescriptionsExpiring7,
        prescriptionsExpiring15,
        prescriptionsExpiring30,
        prescriptionsExpired,
        alertsNoConsent: patientsWithoutConsent,
        alertsDoctorInactive: inactiveDoctorsCount,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
