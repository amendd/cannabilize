import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function resolveDoctorId(session: any) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return doctor?.id || null;
  } catch (error) {
    console.error('Error resolving doctorId for payouts:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const doctorId = await resolveDoctorId(session);
    if (!doctorId) {
      // Se o médico não estiver vinculado ainda, retornar lista vazia em vez de erro
      return NextResponse.json({
        items: [],
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);

    const where: any = { doctorId };
    if (status) where.status = status;
    if (startDate && endDate) {
      where.requestedAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }
    if (q) {
      where.OR = [
        { reference: { contains: q } },
        { notes: { contains: q } },
        { id: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.doctorPayout.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.doctorPayout.count({ where }),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error listing doctor payouts:', error);
    return NextResponse.json(
      { error: 'Erro ao listar pagamentos/repasses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const doctorId = await resolveDoctorId(session);
    if (!doctorId) {
      return NextResponse.json(
        { error: 'Médico não encontrado. Verifique se sua conta está vinculada a um médico.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const amount = Number(body?.amount);
    const notes = typeof body?.notes === 'string' ? body.notes : null;
    const periodStart = body?.periodStart ? new Date(body.periodStart) : null;
    const periodEnd = body?.periodEnd ? new Date(body.periodEnd) : null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const account = await prisma.doctorPayoutAccount.findUnique({
      where: { doctorId },
      select: { id: true },
    });
    if (!account) {
      return NextResponse.json(
        { error: 'Cadastre seus dados de recebimento antes de solicitar pagamento.' },
        { status: 400 }
      );
    }

    // Disponível: apenas pagamentos de consultas COMPLETED com receita emitida - repasses reservados/realizados
    const completedConsultationsWithPrescriptions = await prisma.consultation.findMany({
      where: {
        doctorId: doctorId as string,
        status: 'COMPLETED',
        prescription: {
          isNot: null, // Deve ter receita associada
        },
        payment: {
          isNot: null, // Deve ter pagamento
          status: 'PAID', // Pagamento deve estar pago
        },
      } as Parameters<typeof prisma.consultation.findMany>[0]['where'],
      include: {
        payment: {
          select: {
            amount: true,
          },
        },
      },
    });

    // Somar os valores dos pagamentos das consultas concluídas com receita
    const allTimePaid = completedConsultationsWithPrescriptions.reduce(
      (sum, consultation) => sum + ((consultation as { payment?: { amount: number } }).payment?.amount || 0),
      0
    );

    const allTimeReserved = await prisma.doctorPayout.aggregate({
      where: {
        doctorId,
        status: { in: ['REQUESTED', 'PROCESSING', 'PAID'] },
      },
      _sum: { amount: true },
    });

    const available = (allTimePaid || 0) - (allTimeReserved._sum.amount || 0);
    if (amount > available) {
      return NextResponse.json(
        { error: `Valor solicitado maior que o disponível. Disponível: R$ ${Math.max(0, available).toFixed(2)}` },
        { status: 400 }
      );
    }

    const payout = await prisma.doctorPayout.create({
      data: {
        doctorId,
        amount,
        currency: 'BRL',
        status: 'REQUESTED',
        periodStart,
        periodEnd,
        notes,
      },
    });

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    console.error('Error creating doctor payout request:', error);
    return NextResponse.json(
      { error: 'Erro ao solicitar pagamento' },
      { status: 500 }
    );
  }
}

