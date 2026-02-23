import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/roles-permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canAccessAdmin(session.user?.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const format = searchParams.get('format');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        where.scheduledAt.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.scheduledAt.lte = to;
      }
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
          where: {
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
          select: { id: true, status: true, expiresAt: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      take: format === 'csv' ? 2000 : limit,
    });

    if (format === 'csv') {
      const headers = [
        'ID',
        'Data agendamento',
        'Status',
        'Paciente',
        'Email',
        'Telefone',
        'Médico',
        'CRM',
        'Valor',
      ];
      const rows = consultations.map((c) => [
        c.id,
        c.scheduledAt.toISOString().slice(0, 19),
        c.status,
        c.patient?.name ?? '',
        c.patient?.email ?? '',
        c.patient?.phone ?? '',
        c.doctor?.name ?? '',
        c.doctor?.crm ?? '',
        c.payment?.amount != null ? String(c.payment.amount) : '',
      ]);
      const csv = [
        headers.join(';'),
        ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
      ].join('\r\n');
      const bom = '\uFEFF';
      return new NextResponse(bom + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="consultas.csv"',
        },
      });
    }

    return NextResponse.json(consultations);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consultas' },
      { status: 500 }
    );
  }
}
