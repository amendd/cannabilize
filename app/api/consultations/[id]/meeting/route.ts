import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { telemedicineService } from '@/lib/telemedicine';

/**
 * Cria reunião de telemedicina para uma consulta
 * POST /api/consultations/[id]/meeting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
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
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Validação de segurança: verificar se o médico tem acesso a esta consulta
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!doctor || consultation.doctorId !== doctor.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para criar reunião para esta consulta' },
          { status: 403 }
        );
      }
    }

    // Verificar se já tem reunião criada
    if (consultation.meetingLink) {
      return NextResponse.json(
        { error: 'Reunião já criada para esta consulta' },
        { status: 400 }
      );
    }

    // Verificar se o pagamento foi confirmado
    const payment = await prisma.payment.findUnique({
      where: { consultationId: params.id },
    });

    if (!payment || payment.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Pagamento não confirmado. A reunião só pode ser criada após o pagamento.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    // Se não especificar plataforma, o serviço detectará automaticamente qual está configurada
    const platform = body.platform || undefined;

    // Quando o médico clica em "Iniciar Reunião", SEMPRE usar data/hora atual.
    // Assim a reunião é criada como instantânea (type 1) e todos entram sem "Waiting for the host".
    const meetingStartTime = new Date();

    // Criar reunião (se platform for undefined, será detectada automaticamente)
    const meeting = await telemedicineService.createMeeting({
      consultationId: consultation.id,
      patientName: consultation.patient.name,
      doctorName: consultation.doctor?.name || 'Médico',
      startTime: meetingStartTime,
      duration: 30, // Duração padrão de 30 minutos
      platform: platform as 'ZOOM' | 'GOOGLE_MEET' | undefined,
    });

    return NextResponse.json({
      meeting,
      message: 'Reunião criada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    
    // Determinar status HTTP baseado no tipo de erro
    let status = 500;
    let errorMessage = 'Erro ao criar reunião';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Erros de configuração devem retornar 400
      if (error.message.includes('não configurada') || 
          error.message.includes('incompletas') ||
          error.message.includes('inválido') ||
          error.message.includes('não encontrado')) {
        status = 400;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status }
    );
  }
}

/**
 * Cancela reunião de telemedicina
 * DELETE /api/consultations/[id]/meeting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'DOCTOR')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await telemedicineService.cancelMeeting(params.id);

    return NextResponse.json({ message: 'Reunião cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar reunião' },
      { status: 500 }
    );
  }
}
