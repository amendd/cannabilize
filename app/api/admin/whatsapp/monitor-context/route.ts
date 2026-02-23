import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Contexto do cliente/paciente por telefone para o Monitor Z-API (resumo + próxima consulta + atalhos).
 * Query: phone (dígitos ou E.164)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const phoneParam = request.nextUrl.searchParams.get('phone');
    if (!phoneParam?.trim()) {
      return NextResponse.json({ lead: null, nextConsultation: null, patient: null });
    }

    const digits = phoneParam.replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ lead: null, nextConsultation: null, patient: null });
    }

    const withPlus = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
    const variants = [withPlus, digits, withPlus.replace('+', '')];

    const lead = await prisma.whatsAppLead.findFirst({
      where: { phone: { contains: digits } },
      orderBy: { lastMessageAt: 'desc' },
    });

    const searchDigits = digits;

    const patientByPhone = await prisma.user.findFirst({
      where: {
        role: 'PATIENT',
        phone: { not: null },
        OR: [
          { phone: { contains: searchDigits } },
          { phone: withPlus },
          { phone: digits },
        ],
      },
    });

    const patientId = lead?.userId || patientByPhone?.id;

    const nextConsultation = await prisma.consultation.findFirst({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        OR: [
          ...(patientId ? [{ patientId }] : []),
          { phone: { contains: searchDigits } },
          { phone: withPlus },
          { phone: digits },
        ],
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    const patient = patientByPhone || (nextConsultation?.patient ?? null);

    // Receita mais recente do paciente (prioriza ACTIVE, depois a mais recente por issuedAt) com medicamentos
    let latestPrescription: {
      id: string;
      consultationId: string | null;
      status: string;
      issuedAt: string;
      expiresAt: string | null;
      medications: { name: string; dosage: string | null; quantity: string | null }[];
    } | null = null;

    if (patient?.id) {
      const activePrescription = await prisma.prescription.findFirst({
        where: { patientId: patient.id, status: 'ACTIVE' },
        orderBy: { issuedAt: 'desc' },
        include: {
          medications: {
            include: { medication: { select: { name: true } } },
          },
        },
      });
      const prescription = activePrescription ?? await prisma.prescription.findFirst({
        where: { patientId: patient.id },
        orderBy: { issuedAt: 'desc' },
        include: {
          medications: {
            include: { medication: { select: { name: true } } },
          },
        },
      });
      if (prescription) {
        latestPrescription = {
          id: prescription.id,
          consultationId: prescription.consultationId,
          status: prescription.status,
          issuedAt: prescription.issuedAt.toISOString(),
          expiresAt: prescription.expiresAt?.toISOString() ?? null,
          medications: prescription.medications.map((pm) => ({
            name: pm.medication.name,
            dosage: pm.dosage,
            quantity: pm.quantity,
          })),
        };
      }
    }

    const leadSummary = lead
      ? {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          flowState: lead.flowState,
          consultationId: lead.consultationId,
          robotPaused: lead.robotPaused ?? false,
        }
      : null;

    const consultationSummary = nextConsultation
      ? {
          id: nextConsultation.id,
          scheduledAt: nextConsultation.scheduledAt,
          scheduledDate: nextConsultation.scheduledDate,
          scheduledTime: nextConsultation.scheduledTime,
          status: nextConsultation.status,
          patientName: nextConsultation.patient?.name ?? nextConsultation.name,
          doctorName: nextConsultation.doctor?.name ?? null,
        }
      : null;

    return NextResponse.json({
      lead: leadSummary,
      nextConsultation: consultationSummary,
      patient: patient ? { id: patient.id, name: patient.name, email: patient.email, phone: patient.phone } : null,
      latestPrescription: latestPrescription,
    });
  } catch (error) {
    console.error('Erro ao buscar contexto monitor WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contexto' },
      { status: 500 }
    );
  }
}
