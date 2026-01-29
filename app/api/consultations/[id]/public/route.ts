import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API pública para página de confirmação
// Retorna apenas dados básicos da consulta se o pagamento foi confirmado
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
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Retornar apenas dados básicos necessários para a página de confirmação
    return NextResponse.json({
      id: consultation.id,
      scheduledDate: consultation.scheduledDate,
      scheduledTime: consultation.scheduledTime,
      name: consultation.patient?.name || consultation.name,
      email: consultation.patient?.email || consultation.email,
      payment: consultation.payment ? {
        status: consultation.payment.status,
        amount: consultation.payment.amount,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consulta' },
      { status: 500 }
    );
  }
}
