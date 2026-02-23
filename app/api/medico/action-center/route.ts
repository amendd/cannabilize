import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function getDoctorId(session: { user: { id: string; role: string; doctorId?: string } }, request: NextRequest): string | null {
  if (session.user.role === 'ADMIN') {
    return request.nextUrl.searchParams.get('doctorId');
  }
  return session.user.doctorId ?? null;
}

async function resolveDoctorId(session: { user: { id: string; role: string; doctorId?: string } }, request: NextRequest): Promise<string | null> {
  let doctorId = getDoctorId(session, request);
  if (doctorId) return doctorId;
  if (session.user.role !== 'DOCTOR') return null;
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return doctor?.id ?? null;
}

/** Retorna valor médio da consulta paga do médico (para ganhos previstos) */
async function getAverageConsultationAmount(doctorId: string): Promise<number> {
  const agg = await prisma.payment.aggregate({
    where: {
      status: 'PAID',
      consultation: {
        doctorId,
        status: 'COMPLETED',
        prescription: { isNot: null },
      },
    },
    _avg: { amount: true },
    _count: { id: true },
  });
  if ((agg._count?.id ?? 0) === 0) return 200; // fallback
  return agg._avg?.amount ?? 200;
}

/** Conta slots da semana a partir de DoctorAvailability (aproximado por dia) */
async function getWeeklySlotsCount(doctorId: string): Promise<number> {
  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId, active: true },
  });
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  let totalSlots = 0;
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + d);
    const dayOfWeek = dayDate.getDay();
    const dayAvail = availabilities.filter((a) => a.dayOfWeek === dayOfWeek);
    for (const a of dayAvail) {
      const [sh, sm] = a.startTime.split(':').map(Number);
      const [eh, em] = a.endTime.split(':').map(Number);
      const duration = a.duration || 30;
      const startM = sh * 60 + sm;
      const endM = eh * 60 + em;
      const slots = Math.max(0, Math.floor((endM - startM) / duration));
      totalSlots += slots;
    }
  }
  return totalSlots;
}

/**
 * GET /api/medico/action-center
 * Dados para a Central de Ação do Médico + Atenção Clínica + carga da agenda + ganhos previstos.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const doctorId = await resolveDoctorId(session, request);
    if (!doctorId) {
      return NextResponse.json({
        consultationsStartingNow: 0,
        consultationsNext30_60: 0,
        pendingPrescriptions: 0,
        patientsAwaitingReturn: 0,
        earningsPredictedToday: 0,
        earningsPredictedWeek: 0,
        earningsPredictedMonth: 0,
        weeklyAgendaLoad: { totalSlots: 0, occupiedSlots: 0, percent: 0 },
        atencaoClinica: { noReturn30Days: [], prescriptionsExpiringSoon: [] },
        doctorProfile: { isOnline: false, acceptsOnlineBooking: false, hasActiveAgenda: false },
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const windowStartNow = Math.max(0, nowMinutes - 5);
    const windowEndNow = nowMinutes + 15;
    const window30 = nowMinutes + 30;
    const window60 = nowMinutes + 60;

    const todayConsultations = await prisma.consultation.findMany({
      where: {
        doctorId,
        scheduledDate: todayStr,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        prescription: { select: { id: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    const toMinutes = (t: string | null, fallback: Date): number => {
      if (!t) {
        const d = fallback;
        return d.getHours() * 60 + d.getMinutes();
      }
      const [h, m] = t.trim().split(':').map(Number);
      return (h ?? 0) * 60 + (m ?? 0);
    };

    let consultationsStartingNow = 0;
    let consultationsNext30_60 = 0;
    const startingNowList: { id: string; patientName: string; scheduledTime: string }[] = [];
    const next30_60List: { id: string; patientName: string; scheduledTime: string }[] = [];

    for (const c of todayConsultations) {
      const scheduledTime = c.scheduledTime || new Date(c.scheduledAt).toTimeString().slice(0, 5);
      const mins = toMinutes(c.scheduledTime, c.scheduledAt);
      if (c.status === 'IN_PROGRESS') {
        consultationsStartingNow += 1;
        startingNowList.push({
          id: c.id,
          patientName: c.patient?.name ?? 'Paciente',
          scheduledTime,
        });
      } else if (mins >= windowStartNow && mins < windowEndNow) {
        consultationsStartingNow += 1;
        startingNowList.push({
          id: c.id,
          patientName: c.patient?.name ?? 'Paciente',
          scheduledTime,
        });
      } else if (mins >= window30 && mins < window60) {
        consultationsNext30_60 += 1;
        next30_60List.push({
          id: c.id,
          patientName: c.patient?.name ?? 'Paciente',
          scheduledTime,
        });
      }
    }

    const pendingPrescriptions = await prisma.consultation.count({
      where: {
        doctorId,
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        prescription: null,
      },
    });

    const retornosCount = await prisma.consultation.count({
      where: {
        doctorId,
        status: 'COMPLETED',
        nextReturnDate: { gte: now },
      },
    });

    const avgAmount = await getAverageConsultationAmount(doctorId);

    const todayScheduled = todayConsultations.length;
    const earningsPredictedToday = todayScheduled * avgAmount;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekConsultations = await prisma.consultation.count({
      where: {
        doctorId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: { gte: weekStart, lt: weekEnd },
      },
    });
    const earningsPredictedWeek = weekConsultations * avgAmount;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const monthConsultations = await prisma.consultation.count({
      where: {
        doctorId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledAt: { gte: monthStart, lte: monthEnd },
      },
    });
    const earningsPredictedMonth = monthConsultations * avgAmount;

    const totalSlots = await getWeeklySlotsCount(doctorId);
    const occupiedSlots = weekConsultations;
    const weeklyAgendaLoad = {
      totalSlots: Math.max(totalSlots, occupiedSlots),
      occupiedSlots,
      percent: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
    };

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const lastConsultationByPatient = await prisma.consultation.groupBy({
      by: ['patientId'],
      where: {
        doctorId,
        status: 'COMPLETED',
      },
      _max: { scheduledAt: true },
    });
    const patientIdsNoReturn = lastConsultationByPatient
      .filter((g) => g._max.scheduledAt && g._max.scheduledAt < thirtyDaysAgo)
      .map((g) => g.patientId);
    const noReturn30Days: { patientId: string; patientName: string; lastConsultation: string }[] = [];
    if (patientIdsNoReturn.length > 0) {
      const patients = await prisma.user.findMany({
        where: { id: { in: patientIdsNoReturn } },
        select: { id: true, name: true },
      });
      const lastByPatient = new Map(lastConsultationByPatient.map((g) => [g.patientId, g._max.scheduledAt?.toISOString()]));
      for (const p of patients) {
        noReturn30Days.push({
          patientId: p.id,
          patientName: p.name,
          lastConsultation: lastByPatient.get(p.id) ?? '',
        });
      }
    }

    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const prescriptionsExpiring = await prisma.prescription.findMany({
      where: {
        doctorId,
        expiresAt: { gte: now, lte: thirtyDaysFromNow },
        status: { in: ['ACTIVE', 'EXPIRING'] },
      },
      include: {
        patient: { select: { id: true, name: true } },
      },
      take: 20,
    });
    const prescriptionsExpiringSoon = prescriptionsExpiring.map((p) => ({
      id: p.id,
      patientId: p.patientId,
      patientName: p.patient?.name ?? 'Paciente',
      expiresAt: p.expiresAt?.toISOString() ?? '',
    }));

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { lastActiveAt: true, acceptsOnlineBooking: true },
    });
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isOnline = !!(doctor?.lastActiveAt && new Date(doctor.lastActiveAt) >= fiveMinAgo);
    const acceptsOnlineBooking = doctor?.acceptsOnlineBooking ?? false;
    const hasActiveAgenda = totalSlots > 0;

    return NextResponse.json({
      consultationsStartingNow,
      consultationsNext30_60,
      pendingPrescriptions,
      patientsAwaitingReturn: retornosCount,
      earningsPredictedToday,
      earningsPredictedWeek,
      earningsPredictedMonth,
      weeklyAgendaLoad: {
        ...weeklyAgendaLoad,
        percent: Math.min(100, weeklyAgendaLoad.percent),
      },
      startingNowList,
      next30_60List,
      atencaoClinica: {
        noReturn30Days: noReturn30Days.slice(0, 15),
        prescriptionsExpiringSoon,
      },
      doctorProfile: {
        isOnline,
        acceptsOnlineBooking,
        hasActiveAgenda,
      },
    });
  } catch (error) {
    console.error('[action-center]', error);
    return NextResponse.json(
      { error: 'Erro ao carregar central de ação' },
      { status: 500 }
    );
  }
}
