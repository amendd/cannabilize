import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type PayoutAccountPayload = {
  type?: 'PIX' | 'BANK';
  pixKey?: string | null;
  pixKeyType?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  agency?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  holderName?: string | null;
  document?: string | null;
  notes?: string | null;
};

async function resolveDoctorId(session: any) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return doctor?.id || null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const doctorId = await resolveDoctorId(session);
    if (!doctorId) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    const account = await prisma.doctorPayoutAccount.findUnique({
      where: { doctorId },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching doctor payout account:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de recebimento' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const doctorId = await resolveDoctorId(session);
    if (!doctorId) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    const body = (await request.json()) as PayoutAccountPayload;

    // Validação do CPF (obrigatório)
    if (!body.document) {
      return NextResponse.json(
        { error: 'CPF do titular é obrigatório. Os dados de recebimento devem ser do próprio médico.' },
        { status: 400 }
      );
    }

    const cleanCPF = String(body.document).replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve conter 11 dígitos' },
        { status: 400 }
      );
    }

    // Validação básica de CPF (não pode ser todos os dígitos iguais)
    if (/^(\d)\1+$/.test(cleanCPF)) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      );
    }

    const data = {
      type: body.type || 'PIX',
      pixKey: body.pixKey ?? null,
      pixKeyType: body.pixKeyType ?? null,
      bankName: body.bankName ?? null,
      bankCode: body.bankCode ?? null,
      agency: body.agency ?? null,
      accountNumber: body.accountNumber ?? null,
      accountType: body.accountType ?? null,
      holderName: body.holderName ?? null,
      document: cleanCPF, // Salvar apenas números
      notes: body.notes ?? null,
    };

    // Regras simples de consistência
    if (data.type === 'PIX') {
      if (!data.pixKey) {
        return NextResponse.json(
          { error: 'Informe a chave PIX para recebimento' },
          { status: 400 }
        );
      }
      if (!data.pixKeyType) {
        return NextResponse.json(
          { error: 'Tipo de chave PIX é obrigatório. Selecione CPF, CNPJ, E-mail, Telefone ou Chave aleatória.' },
          { status: 400 }
        );
      }
      // Validar valores permitidos para pixKeyType
      const validPixKeyTypes = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'];
      if (!validPixKeyTypes.includes(data.pixKeyType)) {
        return NextResponse.json(
          { error: 'Tipo de chave PIX inválido. Use: CPF, CNPJ, EMAIL, PHONE ou RANDOM.' },
          { status: 400 }
        );
      }
    }
    if (data.type === 'BANK' && (!data.bankName || !data.agency || !data.accountNumber)) {
      return NextResponse.json(
        { error: 'Informe banco, agência e conta para recebimento' },
        { status: 400 }
      );
    }

    const account = await prisma.doctorPayoutAccount.upsert({
      where: { doctorId },
      create: { doctorId, ...data },
      update: data,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating doctor payout account:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar dados de recebimento' },
      { status: 500 }
    );
  }
}

