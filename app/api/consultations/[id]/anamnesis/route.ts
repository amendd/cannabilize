import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const anamnesisSchema = z.object({
  previousTreatments: z.string().optional(),
  currentMedications: z.string().optional(),
  allergies: z.string().optional(),
  additionalInfo: z.string().optional(),
});

/**
 * PATCH - Paciente atualiza anamnese da própria consulta (após pagamento).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });
    }

    if (consultation.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (!consultation.payment || consultation.payment.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Só é possível preencher a anamnese após a confirmação do pagamento.' },
        { status: 400 }
      );
    }

    if (consultation.status === 'COMPLETED' || consultation.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Não é possível alterar a anamnese após a consulta.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = anamnesisSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const anamnesisString = JSON.stringify(parsed.data);

    await prisma.consultation.update({
      where: { id: params.id },
      data: { anamnesis: anamnesisString },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar anamnese:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar anamnese' },
      { status: 500 }
    );
  }
}
