import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function getDateRangeFromQuery(searchParams: URLSearchParams) {
  const period = (searchParams.get('period') || 'month') as 'day' | 'month' | 'year';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return { period: 'custom' as const, start, end };
  }

  const now = new Date();
  let start: Date;
  switch (period) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { period, start, end: now };
}

function bucketLabel(date: Date, period: 'day' | 'month' | 'year' | 'custom') {
  if (period === 'day') return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  if (period === 'year') return date.getFullYear().toString();
  // month/custom -> agrupar por mês/ano
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { period, start, end } = getDateRangeFromQuery(searchParams);

  // Resolver doctorId de forma mais resiliente
  let doctorId: string | null = null;

  if (session.user.role === 'DOCTOR') {
    // Preferir id já presente na sessão, se existir
    if (session.user.doctorId) {
      doctorId = session.user.doctorId as string;
    } else {
      try {
        const doctor = await prisma.doctor.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        });
        doctorId = doctor?.id || null;
      } catch (e) {
        console.error('Error resolving doctorId from prisma.doctor:', e);
      }
    }
  } else {
    doctorId = searchParams.get('doctorId');
  }

  // Se ainda não conseguimos resolver, retornar resumo zerado em vez de erro 500
  if (!doctorId) {
    return NextResponse.json({
      doctorId: null,
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totals: {
        earned: 0,
        paidOut: 0,
        available: 0,
        requested: 0,
        processing: 0,
        consultationsPaidCount: 0,
      },
      charts: {
        earningsByPeriod: [] as Array<{ period: string; amount: number }>,
      },
    });
  }

  // Consultas pagas no período
  // Considera apenas consultas COMPLETED com receita emitida e pagamento PAID onde:
  // 1. O pagamento foi confirmado (paidAt) no período, OU
  // 2. A consulta foi agendada no período (mesmo que pago antes/depois)
  // Isso garante que apenas consultas concluídas com receita sejam contabilizadas
  let paidPayments: { amount: number; paidAt: Date | null; consultationScheduledAt: Date | null }[] = [];
  try {
    const allPaidPayments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        consultation: { 
          is: { 
            doctorId,
            status: 'COMPLETED', // Apenas consultas concluídas
            prescription: {
              isNot: null, // Deve ter receita emitida
            },
            scheduledAt: { gte: start, lte: end },
          } 
        },
      },
      select: { 
        amount: true, 
        paidAt: true,
        consultation: {
          select: {
            scheduledAt: true,
            status: true,
          },
        },
      },
      orderBy: { paidAt: 'asc' },
    });

    // Filtrar para incluir apenas pagamentos onde:
    // - O paidAt está no período (pagamento confirmado no período), OU
    // - A consulta foi agendada no período (consulta do período, pagamento já confirmado)
    paidPayments = allPaidPayments
      .filter(p => {
        const paidAtInPeriod = p.paidAt && p.paidAt >= start && p.paidAt <= end;
        const consultationInPeriod = p.consultation?.scheduledAt && 
          p.consultation.scheduledAt >= start && 
          p.consultation.scheduledAt <= end;
        return paidAtInPeriod || consultationInPeriod;
      })
      .map(p => ({
        amount: p.amount,
        paidAt: p.paidAt,
        consultationScheduledAt: p.consultation?.scheduledAt || null,
      }));
  } catch (e) {
    console.error('Error fetching paidPayments for doctor summary:', e);
    paidPayments = [];
  }

  const earned = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const consultationsPaidCount = paidPayments.length;

  const earningsByPeriodMap: Record<string, number> = {};
  for (const p of paidPayments) {
    // Usar a data da consulta agendada se disponível (mais relevante para o médico),
    // caso contrário usar a data do pagamento
    const dateToUse = p.consultationScheduledAt || p.paidAt;
    if (!dateToUse) continue;
    const key = bucketLabel(new Date(dateToUse), period);
    earningsByPeriodMap[key] = (earningsByPeriodMap[key] || 0) + p.amount;
  }
  const earningsByPeriod = Object.entries(earningsByPeriodMap).map(([label, value]) => ({
    period: label,
    amount: value,
  }));

  // Repasses do período
  let payouts: { amount: number; status: string }[] = [];
  try {
    payouts = await prisma.doctorPayout.findMany({
      where: {
        doctorId,
        requestedAt: { gte: start, lte: end },
      },
      select: { amount: true, status: true },
      orderBy: { requestedAt: 'asc' },
    });
  } catch (e) {
    console.error('Error fetching doctorPayouts for doctor summary:', e);
    payouts = [];
  }

  const paidOut = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const requested = payouts
    .filter((p) => p.status === 'REQUESTED')
    .reduce((sum, p) => sum + p.amount, 0);

  const processing = payouts
    .filter((p) => p.status === 'PROCESSING')
    .reduce((sum, p) => sum + p.amount, 0);

  // Disponível (all-time): apenas pagamentos de consultas COMPLETED com receita emitida - repasses já reservados/realizados
  let available = 0;
  try {
    // Buscar apenas pagamentos PAID de consultas COMPLETED com receita emitida
    const completedConsultationsWithPrescriptions = await prisma.consultation.findMany({
      where: {
        doctorId,
        status: 'COMPLETED',
        prescription: {
          isNot: null, // Deve ter receita associada
        },
        payment: {
          isNot: null, // Deve ter pagamento
          status: 'PAID', // Pagamento deve estar pago
        },
      },
      include: {
        payment: {
          select: {
            amount: true,
            status: true,
          },
        },
        prescription: {
          select: {
            id: true,
          },
        },
      },
    });

    // Log para debug
    console.log(`[Finance Summary] Consultas COMPLETED com receita e pagamento PAID: ${completedConsultationsWithPrescriptions.length}`);

    // Somar os valores dos pagamentos das consultas concluídas com receita
    const allTimePaid = completedConsultationsWithPrescriptions.reduce(
      (sum, consultation) => {
        const amount = consultation.payment?.amount || 0;
        console.log(`[Finance Summary] Consulta ${consultation.id}: R$ ${amount}`);
        return sum + amount;
      },
      0
    );

    console.log(`[Finance Summary] Total pago (consultas concluídas com receita): R$ ${allTimePaid}`);

    const allTimeReserved = await prisma.doctorPayout.aggregate({
      where: {
        doctorId,
        status: { in: ['REQUESTED', 'PROCESSING', 'PAID'] },
      },
      _sum: { amount: true },
    });

    const reservedAmount = allTimeReserved._sum.amount || 0;
    console.log(`[Finance Summary] Repasses reservados: R$ ${reservedAmount}`);

    available = (allTimePaid || 0) - reservedAmount;
    console.log(`[Finance Summary] Disponível para saque: R$ ${available}`);
  } catch (e) {
    console.error('Error computing available amount for doctor summary:', e);
    available = 0;
  }

  return NextResponse.json({
    doctorId,
    period,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    totals: {
      earned,
      paidOut,
      available: Math.max(0, available),
      requested,
      processing,
      consultationsPaidCount,
    },
    charts: {
      earningsByPeriod,
    },
  });
}

