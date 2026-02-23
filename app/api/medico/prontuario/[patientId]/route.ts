import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Prontuário do paciente (médico/admin).
 * Retorna: dados do paciente, patologias, consultas (com anamnese, notas, receita, anexos), receitas, evoluções, atestados, pedidos de exame.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { patientId } = await params;
    if (!patientId) {
      return NextResponse.json({ error: 'patientId obrigatório' }, { status: 400 });
    }

    let doctorId: string | null = null;
    if (session.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      doctorId = doctor?.id || null;
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: 'PATIENT' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        birthDate: true,
        address: true,
        image: true,
      },
    });
    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
    }

    const consultationsWhere: { patientId: string; doctorId?: string } = { patientId };
    if (session.user.role === 'DOCTOR' && doctorId) {
      consultationsWhere.doctorId = doctorId;
    }

    const [pathologies, consultations, prescriptions, filesByConsultation, evolutions, certificates, examRequests] = await Promise.all([
      prisma.patientPathology.findMany({
        where: { patientId },
        include: { pathology: { select: { id: true, name: true } } },
      }),
      prisma.consultation.findMany({
        where: consultationsWhere,
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          anamnesis: true,
          notes: true,
          nextReturnDate: true,
          laudoDraft: true,
          doctor: { select: { id: true, name: true, crm: true } },
          prescription: {
            select: {
              id: true,
              issuedAt: true,
              status: true,
              expiresAt: true,
            },
          },
        },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        orderBy: { issuedAt: 'desc' },
        include: {
          doctor: { select: { id: true, name: true, crm: true } },
          consultation: { select: { id: true, scheduledAt: true } },
        },
      }),
      prisma.consultationFile.findMany({
        where: { consultation: consultationsWhere },
        orderBy: { createdAt: 'desc' },
      }),
      'clinicalEvolutions' in prisma
        ? (prisma as any).clinicalEvolution.findMany({
            where: { patientId, ...(doctorId ? { doctorId } : {}) },
            orderBy: { evolutionDate: 'desc' },
            include: {
              doctor: { select: { id: true, name: true } },
              consultation: { select: { id: true, scheduledAt: true } },
            },
          })
        : Promise.resolve([]),
      'medicalCertificates' in prisma
        ? (prisma as any).medicalCertificate.findMany({
            where: { patientId, ...(doctorId ? { doctorId } : {}) },
            orderBy: { issuedAt: 'desc' },
            include: { doctor: { select: { id: true, name: true } } },
          })
        : Promise.resolve([]),
      'examRequests' in prisma
        ? (prisma as any).examRequest.findMany({
            where: { patientId, ...(doctorId ? { doctorId } : {}) },
            orderBy: { requestedAt: 'desc' },
            include: { doctor: { select: { id: true, name: true } } },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      patient: {
        ...patient,
        birthDate: patient.birthDate?.toISOString() ?? null,
      },
      pathologies: pathologies.map((p) => ({ id: p.pathology.id, name: p.pathology.name })),
      consultations: consultations.map((c) => ({
        id: c.id,
        scheduledAt: c.scheduledAt.toISOString(),
        status: c.status,
        anamnesis: c.anamnesis,
        notes: c.notes,
        nextReturnDate: c.nextReturnDate?.toISOString() ?? null,
        doctor: c.doctor,
        prescription: c.prescription,
        hasLaudo: !!c.laudoDraft,
      })),
      prescriptions,
      files: filesByConsultation,
      clinicalEvolutions: evolutions,
      medicalCertificates: certificates,
      examRequests,
    });
  } catch (error) {
    console.error('[prontuario]', error);
    return NextResponse.json({ error: 'Erro ao carregar prontuário' }, { status: 500 });
  }
}
