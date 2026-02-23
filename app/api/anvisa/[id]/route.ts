import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getAnvisaApprovedMessage } from '@/lib/whatsapp-templates';

export async function PATCH(
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

    const body = await request.json();
    const { status, anvisaNumber, rejectionReason } = body;

    const updateData: any = { status };
    if (anvisaNumber) updateData.anvisaNumber = anvisaNumber;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 anos
    }

    const authorization = await prisma.anvisaAuthorization.update({
      where: { id: params.id },
      data: updateData,
    });

    if (status === 'APPROVED') {
      const authWithPatient = await prisma.anvisaAuthorization.findUnique({
        where: { id: params.id },
        include: { patient: true },
      });
      if (authWithPatient?.patient?.phone) {
        const message = getAnvisaApprovedMessage({
          patientName: authWithPatient.patient.name,
          anvisaNumber: authorization.anvisaNumber || 'N/A',
          approvedDate: authorization.approvedAt || new Date(),
          expiresAt: authorization.expiresAt || undefined,
        });
        sendWhatsAppMessage({
          to: authWithPatient.patient.phone,
          message,
        }).catch((err) => console.error('Erro ao enviar WhatsApp ANVISA:', err));
      }
    }

    return NextResponse.json(authorization);
  } catch (error) {
    console.error('Error updating ANVISA authorization:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar autorização ANVISA' },
      { status: 500 }
    );
  }
}
