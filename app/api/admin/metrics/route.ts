import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Extrai UF do endereço do paciente (ex: "Rua X, 123 - São Paulo, SP")
const UF_REGEX = /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MG|MS|MT|PA|PB|PE|PI|PR|RJ|RN|RO|RR|RS|SC|SE|SP|TO)\b/i;

function extractUF(address: string | null): string | null {
  if (!address || typeof address !== 'string') return null;
  const match = address.match(UF_REGEX);
  return match ? match[1].toUpperCase() : null;
}

function getDateRange(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let dateFrom: Date;

  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  switch (period) {
    case 'day':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      dateFrom = new Date(now);
      dateFrom.setDate(now.getDate() - diff);
      dateFrom.setHours(0, 0, 0, 0);
      break;
    case 'month':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      dateFrom = new Date(now.getFullYear(), quarterMonth, 1);
      break;
    case 'year':
      dateFrom = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: dateFrom, end: now };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const { start, end } = getDateRange(period, startDate, endDate);
    const dateFilter = { gte: start, lte: end };

    // Consultas: totais por status e série temporal
    const consultationsInPeriod = await prisma.consultation.findMany({
      where: { scheduledAt: dateFilter },
      select: { id: true, status: true, scheduledAt: true },
    });

    const byStatus = consultationsInPeriod.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    const consultationsByStatus = statuses.map((s) => ({
      status: s,
      count: byStatus[s] || 0,
    }));

    // Série temporal de consultas (por dia/mês conforme período)
    const consultationsChartMap: Record<string, { scheduled: number; completed: number; cancelled: number; inProgress: number; noShow: number }> = {};
    const isDayOrWeek = period === 'day' || period === 'week';
    consultationsInPeriod.forEach((c) => {
      const d = new Date(c.scheduledAt);
      const key = isDayOrWeek
        ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      if (!consultationsChartMap[key]) {
        consultationsChartMap[key] = { scheduled: 0, completed: 0, cancelled: 0, inProgress: 0, noShow: 0 };
      }
      if (c.status === 'SCHEDULED') consultationsChartMap[key].scheduled += 1;
      else if (c.status === 'COMPLETED') consultationsChartMap[key].completed += 1;
      else if (c.status === 'CANCELLED') consultationsChartMap[key].cancelled += 1;
      else if (c.status === 'IN_PROGRESS') consultationsChartMap[key].inProgress += 1;
      else if (c.status === 'NO_SHOW') consultationsChartMap[key].noShow += 1;
    });

    const consultationsChart = Object.entries(consultationsChartMap)
      .map(([periodLabel, v]) => ({
        period: periodLabel,
        agendadas: v.scheduled,
        realizadas: v.completed,
        emAndamento: v.inProgress,
        canceladas: v.cancelled,
        noShow: v.noShow,
      }))
      .sort((a, b) => {
        try {
          if (isDayOrWeek && a.period.includes('/') && b.period.includes('/')) {
            const [da, ma] = a.period.split('/').map(Number);
            const [db, mb] = b.period.split('/').map(Number);
            return new Date(2020, ma - 1, da).getTime() - new Date(2020, mb - 1, db).getTime();
          }
          return a.period.localeCompare(b.period);
        } catch {
          return 0;
        }
      });

    // Totais gerais (não filtrados por período) para KPIs de “hoje”
    const totalConsultations = consultationsInPeriod.length;
    const totalScheduled = byStatus['SCHEDULED'] || 0;
    const totalCompleted = byStatus['COMPLETED'] || 0;
    const totalInProgress = byStatus['IN_PROGRESS'] || 0;
    const totalCancelled = byStatus['CANCELLED'] || 0;
    const totalNoShow = byStatus['NO_SHOW'] || 0;

    // Receitas no período (issuedAt)
    const prescriptionsInPeriod = await prisma.prescription.findMany({
      where: { issuedAt: dateFilter },
      select: { id: true, status: true, issuedAt: true },
    });

    const prescriptionsByStatus = prescriptionsInPeriod.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const prescriptionStatuses = ['ISSUED', 'USED', 'EXPIRED', 'CANCELLED'];
    const prescriptionsByStatusList = prescriptionStatuses.map((s) => ({
      status: s,
      count: prescriptionsByStatus[s] || 0,
    }));

    const prescriptionsChartMap: Record<string, number> = {};
    prescriptionsInPeriod.forEach((p) => {
      const d = new Date(p.issuedAt);
      const key = isDayOrWeek
        ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      prescriptionsChartMap[key] = (prescriptionsChartMap[key] || 0) + 1;
    });
    const prescriptionsChart = Object.entries(prescriptionsChartMap)
      .map(([periodLabel, count]) => ({ period: periodLabel, count }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Usuários: totais e novos no período
    const [totalPatients, totalDoctors, newPatientsInPeriod] = await Promise.all([
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.doctor.count(),
      prisma.user.count({
        where: {
          role: 'PATIENT',
          createdAt: dateFilter,
        },
      }),
    ]);

    // Acessos (logins) – AuditLog action LOGIN
    const loginsInPeriod = await prisma.auditLog.findMany({
      where: { action: 'LOGIN', createdAt: dateFilter },
      select: { id: true, createdAt: true },
    });

    const loginsChartMap: Record<string, number> = {};
    loginsInPeriod.forEach((l) => {
      const d = new Date(l.createdAt);
      const key = isDayOrWeek
        ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      loginsChartMap[key] = (loginsChartMap[key] || 0) + 1;
    });
    const accessChart = Object.entries(loginsChartMap)
      .map(([periodLabel, count]) => ({ period: periodLabel, acessos: count }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Regiões (UF) a partir do endereço dos pacientes
    const patientsWithAddress = await prisma.user.findMany({
      where: { role: 'PATIENT', address: { not: null } },
      select: { address: true },
    });
    const regionCount: Record<string, number> = {};
    let withoutRegion = 0;
    patientsWithAddress.forEach((u) => {
      const uf = extractUF(u.address);
      if (uf) {
        regionCount[uf] = (regionCount[uf] || 0) + 1;
      } else {
        withoutRegion += 1;
      }
    });
    const regions = Object.entries(regionCount)
      .map(([uf, count]) => ({ uf, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    if (withoutRegion > 0) {
      regions.push({ uf: 'Não informado', count: withoutRegion });
    }

    // Financeiro no período (pagamentos pagos)
    const paymentsPaid = await prisma.payment.findMany({
      where: { status: 'PAID', paidAt: dateFilter },
      select: { amount: true },
    });
    const totalRevenue = paymentsPaid.reduce((s, p) => s + Number(p.amount), 0);
    const revenueCount = paymentsPaid.length;
    const averageTicket = revenueCount > 0 ? totalRevenue / revenueCount : 0;

    const revenueChartMap: Record<string, number> = {};
    const paymentsWithDate = await prisma.payment.findMany({
      where: { status: 'PAID', paidAt: dateFilter },
      select: { amount: true, paidAt: true },
    });
    paymentsWithDate.forEach((p) => {
      if (!p.paidAt) return;
      const d = new Date(p.paidAt);
      const key = isDayOrWeek
        ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      revenueChartMap[key] = (revenueChartMap[key] || 0) + Number(p.amount);
    });
    const revenueChart = Object.entries(revenueChartMap)
      .map(([periodLabel, value]) => ({ period: periodLabel, valor: value }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Percentuais
    const totalConsultationsForRate = totalScheduled + totalCompleted + totalInProgress + totalCancelled + totalNoShow;
    const conversionRate = totalConsultationsForRate > 0
      ? Math.round((totalCompleted / totalConsultationsForRate) * 100)
      : 0;
    const cancellationRate = totalConsultationsForRate > 0
      ? Math.round(((totalCancelled + totalNoShow) / totalConsultationsForRate) * 100)
      : 0;

    return NextResponse.json({
      period,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      consultations: {
        total: totalConsultations,
        agendadas: totalScheduled,
        realizadas: totalCompleted,
        emAndamento: totalInProgress,
        canceladas: totalCancelled,
        noShow: totalNoShow,
        byStatus: consultationsByStatus,
        chart: consultationsChart,
      },
      prescriptions: {
        total: prescriptionsInPeriod.length,
        byStatus: prescriptionsByStatusList,
        chart: prescriptionsChart,
      },
      users: {
        totalPatients,
        totalDoctors,
        newPatientsInPeriod,
      },
      access: {
        totalLogins: loginsInPeriod.length,
        chart: accessChart,
      },
      regions,
      financial: {
        totalRevenue,
        paymentCount: revenueCount,
        averageTicket,
        chart: revenueChart,
      },
      percentages: {
        conversionRate,
        cancellationRate,
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar métricas' },
      { status: 500 }
    );
  }
}
