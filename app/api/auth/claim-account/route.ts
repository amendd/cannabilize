import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const claimSchema = z.object({
  consultationId: z.string().min(1),
  email: z.string().email(),
  cpf: z.string().min(11),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

function normalizeCpf(value: string) {
  return value.replace(/\D/g, '');
}

/**
 * Fluxo público (pós-pagamento):
 * - Valida que a consulta existe e o pagamento está PAID
 * - Valida que o email e CPF batem com o usuário da consulta
 * - Define uma senha (se ainda não existir)
 *
 * Depois o frontend pode chamar signIn('credentials') e redirecionar para a área do paciente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultationId, email, cpf, password } = claimSchema.parse(body);

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        payment: true,
        patient: true,
      },
    });

    if (!consultation || !consultation.patient) {
      return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 });
    }

    if (!consultation.payment || consultation.payment.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Pagamento ainda não confirmado para esta consulta.' },
        { status: 400 }
      );
    }

    // Segurança: garantir que está reivindicando o usuário correto
    if (consultation.patient.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email não confere com o cadastro desta consulta.' },
        { status: 400 }
      );
    }

    const userCpf = consultation.patient.cpf ? normalizeCpf(consultation.patient.cpf) : '';
    const providedCpf = normalizeCpf(cpf);
    if (!userCpf || userCpf !== providedCpf) {
      return NextResponse.json(
        { error: 'CPF não confere com o cadastro desta consulta.' },
        { status: 400 }
      );
    }

    // Se já existe senha, orientar a fazer login
    if (consultation.patient.password) {
      return NextResponse.json(
        { error: 'Este usuário já possui senha. Faça login para acessar sua consulta.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: consultation.patientId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Erro ao concluir cadastro (claim-account):', error);
    return NextResponse.json({ error: 'Erro ao concluir cadastro' }, { status: 500 });
  }
}

