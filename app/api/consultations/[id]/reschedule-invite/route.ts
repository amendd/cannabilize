import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createRescheduleInvite,
  isTimeSlotAvailable,
  getEarlierAvailableSlots,
} from '@/lib/reschedule-invites';
import { getRescheduleInvitesEnabled } from '@/lib/consultation-config';
import { sendRescheduleInviteEmail } from '@/lib/email';

export async function POST(
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

    const rescheduleEnabled = await getRescheduleInvitesEnabled();
    if (!rescheduleEnabled) {
      return NextResponse.json(
        { error: 'A ferramenta de adiantamento de consultas está desativada pelo administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newScheduledDate, newScheduledTime, message, validateOnly } = body;

    // Validar dados
    if (!newScheduledDate || !newScheduledTime) {
      return NextResponse.json(
        { error: 'Data e horário são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar consulta
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

    // Verificar se consulta está agendada
    if (consultation.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Apenas consultas agendadas podem ser remarcadas' },
        { status: 400 }
      );
    }

    // Verificar permissão: médico só pode convidar suas próprias consultas
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });

      if (!doctor || consultation.doctorId !== doctor.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para enviar convite para esta consulta' },
          { status: 403 }
        );
      }
    }

    const doctorId = consultation.doctorId!;

    // Verificar se novo horário é antes do atual
    const newScheduledAt = new Date(`${newScheduledDate}T${newScheduledTime}`);
    const currentScheduledAt = new Date(consultation.scheduledAt);

    if (newScheduledAt >= currentScheduledAt) {
      return NextResponse.json(
        { error: 'O novo horário deve ser anterior ao horário atual da consulta' },
        { status: 400 }
      );
    }

    // Verificar se novo horário não é no passado
    const now = new Date();
    if (newScheduledAt < now) {
      return NextResponse.json(
        { error: 'Não é possível agendar consultas no passado' },
        { status: 400 }
      );
    }

    // Verificar se horário está disponível (médico sugere o horário: não exige antecedência mínima)
    const availabilityCheck = await isTimeSlotAvailable(
      newScheduledDate,
      newScheduledTime,
      doctorId,
      consultation.id,
      { skipAdvanceBookingCheck: true }
    );

    if (!availabilityCheck.available) {
      return NextResponse.json(
        { error: availabilityCheck.reason || 'Este horário não está mais disponível' },
        { status: 400 }
      );
    }

    // Se for apenas validação, retornar sucesso
    if (validateOnly) {
      return NextResponse.json({
        valid: true,
        message: 'Horário disponível',
      });
    }

    // Verificar se já existe convite pendente para esta consulta
    // Se existir, cancelar automaticamente para permitir o novo convite
    const existingInvites = await prisma.consultationRescheduleInvite.findMany({
      where: {
        consultationId: consultation.id,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Cancelar convites pendentes anteriores
    if (existingInvites.length > 0) {
      await prisma.consultationRescheduleInvite.updateMany({
        where: {
          consultationId: consultation.id,
          status: 'PENDING',
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });
      console.log(`Cancelados ${existingInvites.length} convite(s) pendente(s) anterior(es) para criar novo convite`);
    }

    // Criar convite
    const invite = await createRescheduleInvite({
      consultationId: consultation.id,
      patientId: consultation.patientId,
      doctorId,
      currentScheduledAt,
      newScheduledAt,
      newScheduledDate,
      newScheduledTime,
      message: message || null,
    });

    // Enviar email ao paciente (não bloqueia a resposta)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      'http://localhost:3000';
    const acceptUrl = `${baseUrl}/paciente/consultas?invite=${invite.id}&action=accept`;
    const rejectUrl = `${baseUrl}/paciente/consultas?invite=${invite.id}&action=reject`;

    sendRescheduleInviteEmail({
      to: consultation.patient.email,
      patientName: consultation.patient.name,
      doctorName: consultation.doctor?.name || 'Médico',
      currentDateTime: currentScheduledAt,
      newDateTime: newScheduledAt,
      message: message || null,
      acceptUrl,
      rejectUrl,
      expiresAt: invite.expiresAt,
    }).catch(error => {
      console.error('Erro ao enviar email de convite:', error);
    });

    // Enviar WhatsApp ao paciente (não bloqueia a resposta)
    if (consultation.patient.phone) {
      const { sendWhatsAppMessage } = await import('@/lib/whatsapp');
      const { getRescheduleInviteMessage } = await import('@/lib/whatsapp-templates');
      
      const whatsappMessage = await getRescheduleInviteMessage({
        patientName: consultation.patient.name,
        doctorName: consultation.doctor?.name || 'Médico',
        currentDate: new Date(currentScheduledAt).toLocaleDateString('pt-BR'),
        currentTime: consultation.scheduledTime || '',
        newDate: newScheduledDate,
        newTime: newScheduledTime,
        acceptLink: acceptUrl,
        rejectLink: rejectUrl,
      });

      sendWhatsAppMessage({
        to: consultation.patient.phone,
        message: whatsappMessage,
      }).catch(error => {
        console.error('Erro ao enviar WhatsApp de convite:', error);
      });
    }

    return NextResponse.json({
      id: invite.id,
      consultationId: invite.consultationId,
      newScheduledAt: invite.newScheduledAt.toISOString(),
      expiresAt: invite.expiresAt.toISOString(),
      message: invite.message,
    });
  } catch (error) {
    console.error('Erro ao criar convite de remarcação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar convite de remarcação' },
      { status: 500 }
    );
  }
}

// GET: Buscar horários disponíveis antes do horário atual
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

    const rescheduleEnabled = await getRescheduleInvitesEnabled();
    if (!rescheduleEnabled) {
      return NextResponse.json(
        { error: 'A ferramenta de adiantamento de consultas está desativada.' },
        { status: 403 }
      );
    }

    // Buscar consulta
    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        doctor: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });

      if (!doctor || consultation.doctorId !== doctor.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para acessar esta consulta' },
          { status: 403 }
        );
      }
    }

    if (!consultation.doctorId) {
      return NextResponse.json(
        { error: 'Consulta não tem médico atribuído' },
        { status: 400 }
      );
    }

    // Buscar slots disponíveis antes do horário atual
    const earlierSlots = await getEarlierAvailableSlots(
      consultation.id,
      consultation.doctorId,
      new Date(consultation.scheduledAt)
    );

    return NextResponse.json({
      slots: earlierSlots.map(slot => ({
        date: slot.date,
        time: slot.time,
        scheduledAt: slot.scheduledAt.toISOString(),
        formatted: slot.scheduledAt.toLocaleString('pt-BR'),
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar slots anteriores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar horários disponíveis' },
      { status: 500 }
    );
  }
}
