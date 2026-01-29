import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Valida se o usuário tem permissão para acessar a reunião desta consulta
 * GET /api/consultations/[id]/meeting/validate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado', allowed: false },
        { status: 401 }
      );
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada', allowed: false },
        { status: 404 }
      );
    }

    // Verificar se tem reunião criada
    if (!consultation.meetingLink) {
      return NextResponse.json(
        { error: 'Reunião não criada para esta consulta', allowed: false },
        { status: 404 }
      );
    }

    // Verificar permissão de acesso
    let hasAccess = false;
    
    if (session.user.role === 'ADMIN') {
      // Admin tem acesso a todas as reuniões
      hasAccess = true;
    } else if (session.user.role === 'DOCTOR') {
      // Médico tem acesso se for o médico da consulta
      if (consultation.doctor?.userId === session.user.id) {
        hasAccess = true;
      }
    } else if (session.user.role === 'PATIENT') {
      // Paciente tem acesso se for o paciente da consulta
      if (consultation.patientId === session.user.id) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { 
          error: 'Você não tem permissão para acessar esta reunião',
          allowed: false 
        },
        { status: 403 }
      );
    }

    // Retornar informações da reunião (sem expor a senha diretamente)
    return NextResponse.json({
      allowed: true,
      meetingLink: consultation.meetingLink,
      meetingPlatform: consultation.meetingPlatform,
      hasPassword: !!consultation.meetingPassword,
      consultationId: consultation.id,
      patientName: consultation.patient?.name || consultation.name,
      doctorName: consultation.doctor?.name || 'Médico',
    });
  } catch (error) {
    console.error('Erro ao validar acesso à reunião:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao validar acesso',
        allowed: false,
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
