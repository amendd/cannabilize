import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isTimeSlotAvailable } from '@/lib/reschedule-invites';
import {
  sendRescheduleInviteAcceptedEmail,
  sendRescheduleInviteRejectedEmail,
} from '@/lib/email';

export async function POST(
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

    // Permitir PATIENT ou ADMIN (para modo de impersonação)
    if (session.user.role !== 'PATIENT' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'ACCEPT' ou 'REJECT'

    if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use ACCEPT ou REJECT' },
        { status: 400 }
      );
    }

    // Buscar convite
    const invite = await prisma.consultationRescheduleInvite.findUnique({
      where: { id: params.id },
      include: {
        consultation: {
          include: {
            patient: true,
            doctor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se convite pertence ao paciente
    // Se for admin, verificar se está impersonando o paciente correto
    let authorized = false;
    
    if (session.user.role === 'PATIENT') {
      authorized = invite.patientId === session.user.id;
    } else if (session.user.role === 'ADMIN') {
      // Admin pode responder se:
      // 1. O convite pertence ao paciente que está sendo visualizado (impersonação)
      // 2. Ou sempre permitir (admin tem permissão total)
      const { searchParams } = new URL(request.url);
      const impersonatedPatientId = searchParams.get('patientId');
      
      if (impersonatedPatientId) {
        authorized = invite.patientId === impersonatedPatientId;
      } else {
        // Admin sem impersonação explícita - permitir (admin tem acesso total)
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Você não tem permissão para responder este convite' },
        { status: 403 }
      );
    }

    // Verificar se convite está pendente
    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Este convite já foi respondido ou expirou' },
        { status: 400 }
      );
    }

    // Verificar se não expirou
    if (new Date() > invite.expiresAt) {
      await prisma.consultationRescheduleInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        { error: 'Este convite expirou' },
        { status: 400 }
      );
    }

    if (action === 'ACCEPT') {
      // Verificar se horário ainda está disponível
      const availabilityCheck = await isTimeSlotAvailable(
        invite.newScheduledDate,
        invite.newScheduledTime,
        invite.doctorId,
        invite.consultationId
      );

      if (!availabilityCheck.available) {
        return NextResponse.json(
          { error: availabilityCheck.reason || 'Este horário não está mais disponível' },
          { status: 400 }
        );
      }

      // Atualizar consulta
      const updatedConsultation = await prisma.consultation.update({
        where: { id: invite.consultationId },
        data: {
          scheduledAt: invite.newScheduledAt,
          scheduledDate: invite.newScheduledDate,
          scheduledTime: invite.newScheduledTime,
        },
      });

      // Marcar convite como aceito
      await prisma.consultationRescheduleInvite.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      });

      // Cancelar outros convites pendentes da mesma consulta
      await prisma.consultationRescheduleInvite.updateMany({
        where: {
          consultationId: invite.consultationId,
          id: { not: invite.id },
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Enviar email de confirmação
      sendRescheduleInviteAcceptedEmail({
        to: invite.consultation.patient.email,
        patientName: invite.consultation.patient.name,
        newDateTime: invite.newScheduledAt,
        meetingLink: invite.consultation.meetingLink,
      }).catch(error => {
        console.error('Erro ao enviar email de confirmação:', error);
      });

      return NextResponse.json({
        success: true,
        consultation: {
          id: updatedConsultation.id,
          scheduledAt: updatedConsultation.scheduledAt.toISOString(),
          scheduledDate: updatedConsultation.scheduledDate,
          scheduledTime: updatedConsultation.scheduledTime,
        },
      });
    } else {
      // REJECT
      await prisma.consultationRescheduleInvite.update({
        where: { id: invite.id },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
      });

      // Enviar email ao médico
      if (invite.consultation.doctor?.user?.email) {
        sendRescheduleInviteRejectedEmail({
          to: invite.consultation.doctor.user.email,
          doctorName: invite.consultation.doctor.name,
          patientName: invite.consultation.patient.name,
          currentDateTime: invite.currentScheduledAt,
        }).catch(error => {
          console.error('Erro ao enviar email ao médico:', error);
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Convite recusado',
      });
    }
  } catch (error) {
    console.error('Erro ao responder convite:', error);
    return NextResponse.json(
      { error: 'Erro ao responder convite' },
      { status: 500 }
    );
  }
}
