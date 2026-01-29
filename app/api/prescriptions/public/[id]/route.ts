import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET - Busca receita pública por ID (usado para QR code)
 * Esta rota é pública e permite verificar receitas através do QR code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            name: true,
            crm: true,
            email: true,
          },
        },
        consultation: {
          select: {
            scheduledAt: true,
            status: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Receita não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a receita está válida
    if (prescription.status !== 'ISSUED') {
      return NextResponse.json(
        { error: 'Receita não está mais válida' },
        { status: 403 }
      );
    }

    // Verificar validade
    if (prescription.expiresAt && new Date(prescription.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Receita expirada' },
        { status: 403 }
      );
    }

    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Erro ao buscar receita pública:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar receita' },
      { status: 500 }
    );
  }
}
