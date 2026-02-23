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
        medications: {
          include: {
            medication: true,
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

    // Status válidos para exibição pública (QR code): ACTIVE e EXPIRING são os atuais; ISSUED é legado
    const validStatuses = ['ACTIVE', 'EXPIRING', 'ISSUED'];
    if (!validStatuses.includes(prescription.status)) {
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

    // Acesso via QR code: quem escaneia teve o documento apresentado pelo paciente, que assim
    // autoriza a exibição dos dados necessários para validação (nome, CPF, email de contato).
    return NextResponse.json({
      id: prescription.id,
      status: prescription.status,
      issuedAt: prescription.issuedAt,
      expiresAt: prescription.expiresAt,
      doctor: {
        name: prescription.doctor.name,
        crm: prescription.doctor.crm,
      },
      patient: prescription.patient
        ? {
            name: prescription.patient.name,
            cpf: prescription.patient.cpf,
            email: prescription.patient.email,
          }
        : null,
      consultation: prescription.consultation
        ? {
            scheduledAt: prescription.consultation.scheduledAt,
            status: prescription.consultation.status,
          }
        : null,
      prescriptionData: prescription.prescriptionData,
      medications: prescription.medications,
      pdfUrl: prescription.pdfUrl,
    });
  } catch (error) {
    console.error('Erro ao buscar receita pública:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar receita' },
      { status: 500 }
    );
  }
}
