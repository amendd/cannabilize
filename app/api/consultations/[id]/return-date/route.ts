import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Buscar data de retorno da consulta
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
        nextReturnDate: true,
        doctorId: true,
        patientId: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão: médico da consulta, paciente ou admin
    let hasAccess = false;
    
    if (session.user.role === 'ADMIN') {
      hasAccess = true;
    } else if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      hasAccess = doctor && (consultation.doctorId === doctor.id || !consultation.doctorId);
    } else if (session.user.role === 'PATIENT') {
      hasAccess = consultation.patientId === session.user.id;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Não autorizado a acessar esta consulta' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      nextReturnDate: consultation.nextReturnDate,
    });
  } catch (error) {
    console.error('Erro ao buscar data de retorno:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar data de retorno' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar data de retorno da consulta (apenas médico)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nextReturnDate } = body;

    console.log(`[PUT /api/consultations/${params.id}/return-date] Atualizando data de retorno`);

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        doctorId: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se é o médico da consulta ou admin
    if (session.user.role !== 'ADMIN') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      
      if (!doctor) {
        return NextResponse.json(
          { error: 'Médico não encontrado. Verifique se sua conta está vinculada a um médico.' },
          { status: 403 }
        );
      }
      
      // Permitir edição se:
      // 1. A consulta não tem médico atribuído (doctorId é null) - médico pode assumir
      // 2. O médico é o dono da consulta
      if (consultation.doctorId && consultation.doctorId !== doctor.id) {
        return NextResponse.json(
          { error: 'Não autorizado a editar esta consulta. Esta consulta pertence a outro médico.' },
          { status: 403 }
        );
      }
      
      // Se a consulta não tem médico atribuído, atribuir ao médico logado
      if (!consultation.doctorId) {
        await prisma.consultation.update({
          where: { id: params.id },
          data: { doctorId: doctor.id },
        });
      }
    }

    // Converter a data se fornecida como string
    let returnDateValue: Date | null = null;
    if (nextReturnDate) {
      returnDateValue = new Date(nextReturnDate);
    }

    const updated = await prisma.consultation.update({
      where: { id: params.id },
      data: { nextReturnDate: returnDateValue },
      select: {
        id: true,
        nextReturnDate: true,
      },
    });

    console.log(`[PUT] ✅ Data de retorno atualizada com sucesso`);

    return NextResponse.json({
      success: true,
      nextReturnDate: updated.nextReturnDate,
    });
  } catch (error) {
    console.error('Erro ao atualizar data de retorno:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar data de retorno',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
