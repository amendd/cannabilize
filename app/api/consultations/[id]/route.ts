import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        prescription: {
          include: {
            medications: {
              include: {
                medication: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: 'Consulta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão de acesso à consulta
    let hasAccess = false;
    
    if (session.user.role === 'ADMIN') {
      hasAccess = true;
    } else if (session.user.role === 'DOCTOR') {
      // Médico só pode ver consultas dele
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });
      hasAccess = doctor && consultation.doctorId === doctor.id;
    } else if (session.user.role === 'PATIENT') {
      // Paciente só pode ver suas próprias consultas
      hasAccess = consultation.patientId === session.user.id;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta consulta' },
        { status: 403 }
      );
    }

    // Segurança: Não expor o link da reunião se o usuário não tiver permissão
    // O link só será exibido no frontend após validação adicional

    // Parsear prescriptionData se existir
    if (consultation.prescription && consultation.prescription.prescriptionData) {
      try {
        consultation.prescription.prescriptionData = typeof consultation.prescription.prescriptionData === 'string'
          ? JSON.parse(consultation.prescription.prescriptionData)
          : consultation.prescription.prescriptionData;
      } catch (error) {
        console.error('Error parsing prescriptionData:', error);
      }
    }

    return NextResponse.json(consultation);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consulta' },
      { status: 500 }
    );
  }
}
