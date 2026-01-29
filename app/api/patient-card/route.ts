import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateOrUpdatePatientCard, getPatientCard } from '@/lib/patient-card';
import { prisma } from '@/lib/prisma';

/**
 * GET - Busca a carteirinha do paciente logado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas pacientes podem ver sua própria carteirinha
    // Admins podem ver qualquer carteirinha (passando patientId como query param)
    const { searchParams } = new URL(request.url);
    const patientIdParam = searchParams.get('patientId');

    let patientId = session.user.id;

    // Se for admin e passar patientId, permite ver outra carteirinha
    if (session.user.role === 'ADMIN' && patientIdParam) {
      patientId = patientIdParam;
    }

    const card = await getPatientCard(patientId);

    if (!card) {
      return NextResponse.json(
        { error: 'Carteirinha não encontrada. Ela será gerada após a aprovação do administrador.' },
        { status: 404 }
      );
    }

    // Se a carteirinha está pendente ou rejeitada, retornar erro informativo
    if (card.approvalStatus === 'PENDING') {
      return NextResponse.json(
        { error: 'PENDING - Aguardando aprovação do administrador' },
        { status: 403 }
      );
    }

    if (card.approvalStatus === 'REJECTED') {
      return NextResponse.json(
        { error: `REJECTED - ${card.rejectionReason || 'Carteirinha rejeitada'}` },
        { status: 403 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error('Erro ao buscar carteirinha:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar carteirinha' },
      { status: 500 }
    );
  }
}

/**
 * POST - Gera ou atualiza a carteirinha do paciente
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { patientId, prescriptionId } = body;

    // Determinar qual paciente usar
    let targetPatientId = session.user.id;

    // Se for admin ou médico, pode gerar carteirinha para outro paciente
    if ((session.user.role === 'ADMIN' || session.user.role === 'DOCTOR') && patientId) {
      targetPatientId = patientId;
    }

    // Gerar ou atualizar carteirinha
    const card = await generateOrUpdatePatientCard(targetPatientId, prescriptionId);

    return NextResponse.json({
      message: 'Carteirinha gerada com sucesso',
      card,
    });
  } catch (error: any) {
    console.error('Erro ao gerar carteirinha:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar carteirinha' },
      { status: 500 }
    );
  }
}
