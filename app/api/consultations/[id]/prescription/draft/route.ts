import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Buscar rascunho de receita
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        status: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se é médico da consulta ou admin
    if (session.user.role !== 'ADMIN') {
      if (session.user.role === 'DOCTOR') {
        const doctor = await prisma.doctor.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        });
        
        if (!doctor || (consultation.doctorId && consultation.doctorId !== doctor.id)) {
          return NextResponse.json(
            { error: 'Não autorizado' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 403 }
        );
      }
    }

    // Buscar rascunho (prescrição com status DRAFT)
    const draft = await prisma.prescription.findFirst({
      where: {
        consultationId: params.id,
        status: 'DRAFT',
      },
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Erro ao buscar rascunho:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar rascunho' },
      { status: 500 }
    );
  }
}

/**
 * POST - Salvar rascunho de receita
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prescriptionData } = body;

    // Buscar consulta
    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: { patient: true },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se é o médico da consulta
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    if (consultation.doctorId && consultation.doctorId !== doctor.id) {
      return NextResponse.json(
        { error: 'Não autorizado a editar esta consulta' },
        { status: 403 }
      );
    }

    // Verificar se já existe receita emitida
    const existingPrescription = await prisma.prescription.findFirst({
      where: {
        consultationId: params.id,
        status: 'ISSUED',
      },
    });

    if (existingPrescription) {
      return NextResponse.json(
        { error: 'Receita já foi emitida. Não é possível salvar rascunho.' },
        { status: 400 }
      );
    }

    // Verificar se já existe receita emitida (não pode ter rascunho se já foi emitida)
    const existingIssued = await prisma.prescription.findFirst({
      where: {
        consultationId: params.id,
        status: 'ISSUED',
      },
    });

    if (existingIssued) {
      return NextResponse.json(
        { error: 'Receita já foi emitida. Não é possível salvar rascunho.' },
        { status: 400 }
      );
    }

    // Buscar rascunho existente
    const existingDraft = await prisma.prescription.findFirst({
      where: {
        consultationId: params.id,
        status: 'DRAFT',
      },
    });

    let draft;
    if (existingDraft) {
      // Atualizar rascunho existente
      draft = await prisma.prescription.update({
        where: { id: existingDraft.id },
        data: {
          prescriptionData: JSON.stringify(prescriptionData),
          updatedAt: new Date(),
        },
      });
    } else {
      // Criar novo rascunho
      draft = await prisma.prescription.create({
        data: {
          consultationId: params.id,
          patientId: consultation.patientId,
          doctorId: doctor.id,
          prescriptionData: JSON.stringify(prescriptionData),
          issuedAt: new Date(),
          status: 'DRAFT',
        },
      });
    }

    return NextResponse.json({
      success: true,
      draft,
      message: 'Rascunho salvo com sucesso',
    });
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar rascunho' },
      { status: 500 }
    );
  }
}
