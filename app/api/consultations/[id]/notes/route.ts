import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Buscar anotações da consulta (apenas médico)
 */
export async function GET(
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

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        notes: true,
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
      // Buscar o médico associado ao usuário
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      
      console.log(`[GET /api/consultations/${params.id}/notes] Doctor found:`, doctor ? { id: doctor.id } : 'null');
      console.log(`[GET] Consultation doctorId:`, consultation.doctorId);
      
      if (!doctor) {
        return NextResponse.json(
          { error: 'Médico não encontrado. Verifique se sua conta está vinculada a um médico.' },
          { status: 403 }
        );
      }
      
      // Permitir acesso se:
      // 1. A consulta não tem médico atribuído (doctorId é null)
      // 2. O médico é o dono da consulta
      if (consultation.doctorId && consultation.doctorId !== doctor.id) {
        console.error(`[GET] Médico não autorizado. DoctorId da consulta: ${consultation.doctorId}, DoctorId do usuário: ${doctor.id}`);
        return NextResponse.json(
          { error: 'Não autorizado a acessar esta consulta' },
          { status: 403 }
        );
      }
    }

    console.log(`[GET] Retornando anotações:`, consultation.notes ? `${consultation.notes.length} caracteres` : 'vazio');

    return NextResponse.json({
      notes: consultation.notes || '',
    });
  } catch (error) {
    console.error('Erro ao buscar anotações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar anotações' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar anotações da consulta (apenas médico)
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
    const { notes } = body;

    console.log(`[PUT /api/consultations/${params.id}/notes] Atualizando anotações`);
    console.log(`[PUT] Session user:`, { id: session.user.id, role: session.user.role });
    console.log(`[PUT] Notes length:`, notes?.length || 0);

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
      // Buscar o médico associado ao usuário
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      
      console.log(`[PUT] Doctor found:`, doctor ? { id: doctor.id } : 'null');
      console.log(`[PUT] Consultation doctorId:`, consultation.doctorId);
      
      if (!doctor) {
        console.error(`[PUT] Médico não encontrado para userId: ${session.user.id}`);
        return NextResponse.json(
          { error: 'Médico não encontrado. Verifique se sua conta está vinculada a um médico.' },
          { status: 403 }
        );
      }
      
      // Permitir edição se:
      // 1. A consulta não tem médico atribuído (doctorId é null) - médico pode assumir
      // 2. O médico é o dono da consulta
      if (consultation.doctorId && consultation.doctorId !== doctor.id) {
        console.error(`[PUT] Médico não autorizado. DoctorId da consulta: ${consultation.doctorId}, DoctorId do usuário: ${doctor.id}`);
        return NextResponse.json(
          { error: 'Não autorizado a editar esta consulta. Esta consulta pertence a outro médico.' },
          { status: 403 }
        );
      }
      
      // Se a consulta não tem médico atribuído, atribuir ao médico logado
      if (!consultation.doctorId) {
        console.log(`[PUT] Consulta sem médico atribuído. Atribuindo ao médico logado: ${doctor.id}`);
        // Atualizar a consulta para atribuir ao médico
        await prisma.consultation.update({
          where: { id: params.id },
          data: { doctorId: doctor.id },
        });
      }
    }

    console.log(`[PUT] Atualizando consulta ${params.id} com anotações...`);
    
    const updated = await prisma.consultation.update({
      where: { id: params.id },
      data: { notes: notes || '' },
      select: {
        id: true,
        notes: true,
      },
    });

    console.log(`[PUT] ✅ Anotações atualizadas com sucesso`);

    return NextResponse.json({
      success: true,
      notes: updated.notes,
    });
  } catch (error) {
    console.error('Erro ao atualizar anotações:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar anotações',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
