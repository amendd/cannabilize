import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/roles-permissions';

const ACTIVE_PRESCRIPTION_STATUSES = ['ACTIVE', 'EXPIRING', 'ISSUED'];
const CONSULTATIONS_LIMIT = 15;

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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);

    const [
      statsResult,
      pendingResult,
      healthResult,
      consultations,
    ] = await Promise.all([
      // Stats (igual a /api/admin/stats)
      (async () => {
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
        return {
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
        };
      })(),
      // Pending (igual a /api/admin/pending)
      Promise.all([
        prisma.consultation.count({ where: { status: 'SCHEDULED' } }),
        prisma.consultation.count({
          where: {
            status: 'COMPLETED',
            prescription: null,
          },
        }),
        prisma.anvisaAuthorization.count({ where: { status: 'PENDING' } }),
        prisma.patientCard.count({ where: { approvalStatus: 'PENDING' } }),
      ]).then(([consultations, prescriptions, anvisa, patientCards]) => ({
        consultations,
        prescriptions,
        anvisa,
        patientCards,
      })),
      // Health (igual a /api/admin/health)
      Promise.all([
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
              { expiresAt: { lte: in30 } },
              { status: { not: 'EXPIRED' } },
            ],
          },
        }),
      ]).then(([consultationsToday, prescriptionsPending, anvisaPending, patientCardsPending, activeDoctors, anvisaExpiringSoon]) => ({
        consultationsToday,
        prescriptionsPending,
        regulatoryPending: anvisaPending + patientCardsPending,
        activeDoctors,
        anvisaExpiringSoon,
      })),
      // Consultas recentes (limit 15)
      prisma.consultation.findMany({
        where: {},
        include: {
          patient: {
            select: { id: true, name: true, email: true, phone: true },
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
        take: CONSULTATIONS_LIMIT,
      }),
    ]);

    return NextResponse.json(
      {
        stats: statsResult,
        pending: pendingResult,
        health: healthResult,
        consultations,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
