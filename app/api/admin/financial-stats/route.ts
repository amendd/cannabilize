import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // 'day', 'month', 'year'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtro de data
    const where: any = {
      status: 'PAID', // Apenas pagamentos confirmados
    };

    if (startDate && endDate) {
      where.paidAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      // Se não especificado, usar período padrão
      const now = new Date();
      let dateFrom: Date;

      switch (period) {
        case 'day':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'month':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          dateFrom = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      where.paidAt = {
        gte: dateFrom,
        lte: now,
      };
    }

    // Buscar todos os pagamentos pagos no período
    const payments = await prisma.payment.findMany({
      where,
      include: {
        consultation: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { paidAt: 'asc' },
    });

    // Calcular estatísticas gerais
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = payments.length;
    const averageTicket = totalPayments > 0 ? totalRevenue / totalPayments : 0;

    // Agrupar por forma de pagamento
    const paymentMethodsStats: Record<string, { count: number; total: number }> = {};
    payments.forEach((payment) => {
      const method = payment.paymentMethod || 'NÃO INFORMADO';
      if (!paymentMethodsStats[method]) {
        paymentMethodsStats[method] = { count: 0, total: 0 };
      }
      paymentMethodsStats[method].count += 1;
      paymentMethodsStats[method].total += payment.amount;
    });

    // Agrupar por período para gráfico
    const revenueByPeriod: Record<string, number> = {};
    
    payments.forEach((payment) => {
      if (!payment.paidAt) return;
      
      const date = new Date(payment.paidAt);
      let key: string;

      switch (period) {
        case 'day':
          key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          break;
        case 'month':
          key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      }

      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = 0;
      }
      revenueByPeriod[key] += payment.amount;
    });

    // Converter para array ordenado
    const revenueChartData = Object.entries(revenueByPeriod)
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => {
        // Ordenar por data
        try {
          if (period === 'day') {
            // Formato: DD/MM
            const [dayA, monthA] = a.period.split('/');
            const [dayB, monthB] = b.period.split('/');
            const dateA = new Date(new Date().getFullYear(), parseInt(monthA) - 1, parseInt(dayA));
            const dateB = new Date(new Date().getFullYear(), parseInt(monthB) - 1, parseInt(dayB));
            return dateA.getTime() - dateB.getTime();
          } else if (period === 'month') {
            // Formato: "Mês AAAA" (ex: "jan. 2026")
            const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            const partsA = a.period.split(' ');
            const partsB = b.period.split(' ');
            const monthIndexA = months.indexOf(partsA[0].toLowerCase().replace('.', ''));
            const monthIndexB = months.indexOf(partsB[0].toLowerCase().replace('.', ''));
            const yearA = parseInt(partsA[1]);
            const yearB = parseInt(partsB[1]);
            
            if (yearA !== yearB) return yearA - yearB;
            return monthIndexA - monthIndexB;
          } else {
            // Ano: ordenar numericamente
            return parseInt(a.period) - parseInt(b.period);
          }
        } catch {
          // Fallback: ordenação alfabética
          return a.period.localeCompare(b.period);
        }
      });

    // Converter estatísticas de métodos de pagamento para array
    const paymentMethodsData = Object.entries(paymentMethodsStats)
      .map(([method, stats]) => ({
        method,
        count: stats.count,
        total: stats.total,
        percentage: totalRevenue > 0 ? (stats.total / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Estatísticas por status (usando findMany para compatibilidade com SQLite)
    const allPayments = await prisma.payment.findMany({
      where: startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {},
      select: {
        status: true,
        amount: true,
      },
    });

    const statusStatsMap: Record<string, { count: number; total: number }> = {};
    allPayments.forEach((payment) => {
      const status = payment.status || 'UNKNOWN';
      if (!statusStatsMap[status]) {
        statusStatsMap[status] = { count: 0, total: 0 };
      }
      statusStatsMap[status].count += 1;
      statusStatsMap[status].total += payment.amount;
    });

    const statusStats = Object.entries(statusStatsMap).map(([status, stats]) => ({
      status,
      count: stats.count,
      total: stats.total,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalPayments,
        averageTicket,
      },
      revenueChart: revenueChartData,
      paymentMethods: paymentMethodsData,
      statusStats: statusStats.map((s) => ({
        status: s.status,
        count: s.count,
        total: s.total,
      })),
      period,
      dateRange: {
        start: startDate || (period === 'day' 
          ? new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString()
          : period === 'month'
          ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          : new Date(new Date().getFullYear(), 0, 1).toISOString()),
        end: endDate || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching financial stats:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas financeiras' },
      { status: 500 }
    );
  }
}
