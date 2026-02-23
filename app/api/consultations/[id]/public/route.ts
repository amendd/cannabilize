import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API para página de confirmação (LGPD).
 * - Com ?token=XXX válido: retorna dados completos (nome, email) para claim account e exibição.
 * - Sem token ou token inválido: retorna apenas dados mínimos (sem PII) para exibir "Consulta confirmada para DD/MM".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
          },
        },
        payment: true,
        confirmationToken: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    const tokenParam = request.nextUrl.searchParams.get('token');
    let hasValidToken = false;

    if (tokenParam && consultation.confirmationToken) {
      if (
        consultation.confirmationToken.token === tokenParam &&
        new Date() < consultation.confirmationToken.expiresAt
      ) {
        hasValidToken = true;
      }
    }

    // Sem token válido: retornar apenas dados mínimos (sem PII)
    if (!hasValidToken) {
      return NextResponse.json({
        id: consultation.id,
        scheduledDate: consultation.scheduledDate,
        scheduledTime: consultation.scheduledTime,
        payment: consultation.payment
          ? {
              status: consultation.payment.status,
              amount: consultation.payment.amount,
            }
          : null,
        // Não incluir name, email
      });
    }

    // Com token válido: retornar dados completos para página de confirmação e claim account
    return NextResponse.json({
      id: consultation.id,
      scheduledDate: consultation.scheduledDate,
      scheduledTime: consultation.scheduledTime,
      name: consultation.patient?.name || consultation.name,
      email: consultation.patient?.email || consultation.email,
      payment: consultation.payment
        ? {
            status: consultation.payment.status,
            amount: consultation.payment.amount,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consulta' },
      { status: 500 }
    );
  }
}
