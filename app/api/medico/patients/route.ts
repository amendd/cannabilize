import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Se for médico, buscar o doctorId através da relação User -> Doctor
    let doctorId: string | null = null;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      doctorId = doctor?.id || null;
    }

    // Se for médico, buscar apenas pacientes dele; se for admin, buscar todos
    const where: any = {};
    if (session.user.role === 'DOCTOR' && doctorId) {
      where.doctorId = doctorId;
    }

    // Buscar consultas para obter pacientes únicos
    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            cpf: true,
            birthDate: true,
          },
        },
        prescription: {
          select: {
            id: true,
            issuedAt: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Agrupar por paciente e obter estatísticas
    const patientsMap = new Map();
    
    consultations.forEach((consultation) => {
      if (!consultation.patient) return;
      
      const patientId = consultation.patient.id;
      
      if (!patientsMap.has(patientId)) {
        patientsMap.set(patientId, {
          id: consultation.patient.id,
          name: consultation.patient.name,
          email: consultation.patient.email,
          phone: consultation.patient.phone,
          cpf: consultation.patient.cpf,
          birthDate: consultation.patient.birthDate,
          totalConsultations: 0,
          lastConsultation: null,
          lastPrescription: null,
        });
      }
      
      const patient = patientsMap.get(patientId);
      patient.totalConsultations += 1;
      
      // Atualizar última consulta
      const consultationDate = new Date(consultation.scheduledAt);
      if (!patient.lastConsultation || consultationDate > new Date(patient.lastConsultation)) {
        patient.lastConsultation = consultation.scheduledAt;
      }
      
      // Atualizar última receita
      if (consultation.prescription) {
        const prescriptionDate = new Date(consultation.prescription.issuedAt);
        if (!patient.lastPrescription || prescriptionDate > new Date(patient.lastPrescription)) {
          patient.lastPrescription = consultation.prescription.issuedAt;
        }
      }
    });

    // Converter map para array e ordenar por última consulta
    const patients = Array.from(patientsMap.values()).sort((a, b) => {
      const dateA = a.lastConsultation ? new Date(a.lastConsultation).getTime() : 0;
      const dateB = b.lastConsultation ? new Date(b.lastConsultation).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pacientes' },
      { status: 500 }
    );
  }
}
