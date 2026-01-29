import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMedicalReport } from '@/lib/report-generator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consultationId } = body;

    // Buscar consulta com dados relacionados
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        patient: true,
        doctor: true,
        prescription: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão (médico ou paciente da consulta)
    if (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN' && consultation.patientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Gerar laudo
    const pdfBytes = await generateMedicalReport(
      consultation,
      consultation.prescription || undefined
    );

    // Converter para base64
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    return NextResponse.json({
      pdfBase64,
      message: 'Laudo gerado com sucesso',
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar laudo' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId && session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'patientId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar permissão: paciente só pode ver seus próprios laudos, admin pode ver qualquer um
    const effectivePatientId = patientId || session.user.id;
    if (session.user.role === 'PATIENT' && effectivePatientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Buscar consultas do paciente para gerar laudos
    const consultations = await prisma.consultation.findMany({
      where: {
        patientId: effectivePatientId,
        status: 'COMPLETED',
      },
      include: {
        patient: true,
        doctor: true,
        prescription: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar laudos' },
      { status: 500 }
    );
  }
}
