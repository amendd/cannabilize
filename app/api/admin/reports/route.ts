import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAccessReports } from '@/lib/roles-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canAccessReports(session.user?.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = Math.min(365, Math.max(1, parseInt(searchParams.get('period') || '30', 10)));
    const format = searchParams.get('format') || 'csv';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let since: Date;
    let until: Date = new Date();
    if (startDateParam && endDateParam) {
      since = new Date(startDateParam);
      until = new Date(endDateParam);
      if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
        since = new Date();
        since.setDate(since.getDate() - period);
      }
    } else {
      since = new Date();
      since.setDate(since.getDate() - period);
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { issuedAt: { gte: since, lte: until } },
      include: {
        patient: { select: { name: true, email: true, cpf: true } },
        doctor: { select: { name: true, crm: true, specialization: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    if (format === 'pdf') {
      return NextResponse.json(
        { error: 'Exportação PDF de relatório em desenvolvimento. Use CSV.' },
        { status: 501 }
      );
    }

    const headers = [
      'ID',
      'Data emissão',
      'Validade',
      'Status',
      'Paciente',
      'Email',
      'CPF',
      'Médico',
      'CRM',
      'Especialidade',
    ];
    const rows = prescriptions.map((p) => [
      p.id,
      p.issuedAt.toISOString().slice(0, 10),
      p.expiresAt ? p.expiresAt.toISOString().slice(0, 10) : '',
      p.status,
      p.patient?.name ?? '',
      p.patient?.email ?? '',
      p.patient?.cpf ?? '',
      p.doctor?.name ?? '',
      p.doctor?.crm ?? '',
      p.doctor?.specialization ?? '',
    ]);

    const csv = [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const bom = '\uFEFF';

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-prescricoes-${since.toISOString().slice(0, 10)}-${until.toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
