import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Meu histórico (paciente): timeline de consultas e receitas para o próprio usuário.
 * Não expõe notas internas do médico; apenas resumos e links para receitas/documentos.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const patientId = session.user.id;

    const [consultations, prescriptions, pathologies] = await Promise.all([
      prisma.consultation.findMany({
        where: { patientId },
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          nextReturnDate: true,
          doctor: { select: { id: true, name: true, crm: true, specialization: true } },
          prescription: { select: { id: true, issuedAt: true, status: true } },
          files: { select: { id: true, fileName: true, fileType: true } },
        },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        orderBy: { issuedAt: 'desc' },
        select: {
          id: true,
          issuedAt: true,
          expiresAt: true,
          status: true,
          doctor: { select: { name: true, crm: true } },
          consultation: { select: { id: true, scheduledAt: true } },
        },
      }),
      prisma.patientPathology.findMany({
        where: { patientId },
        include: { pathology: { select: { name: true } } },
      }),
    ]);

    const timeline = [
      ...consultations.map((c) => ({
        type: 'consultation' as const,
        id: c.id,
        date: c.scheduledAt.toISOString(),
        title: 'Consulta',
        subtitle: c.doctor?.name ?? 'Médico',
        status: c.status,
        nextReturnDate: c.nextReturnDate?.toISOString() ?? null,
        hasPrescription: !!c.prescription,
        prescriptionId: c.prescription?.id ?? null,
        filesCount: c.files?.length ?? 0,
      })),
      ...prescriptions
        .filter((p) => !consultations.some((c) => c.prescription?.id === p.id))
        .map((p) => ({
          type: 'prescription' as const,
          id: p.id,
          date: p.issuedAt.toISOString(),
          title: 'Receita',
          subtitle: p.doctor?.name ?? '',
          status: p.status,
          expiresAt: p.expiresAt?.toISOString() ?? null,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      consultations: consultations.map((c) => ({
        id: c.id,
        scheduledAt: c.scheduledAt.toISOString(),
        status: c.status,
        nextReturnDate: c.nextReturnDate?.toISOString() ?? null,
        doctor: c.doctor,
        prescription: c.prescription,
        filesCount: c.files?.length ?? 0,
      })),
      prescriptions,
      pathologies: pathologies.map((p) => p.pathology.name),
      timeline,
    });
  } catch (error) {
    console.error('[meu-historico]', error);
    return NextResponse.json({ error: 'Erro ao carregar histórico' }, { status: 500 });
  }
}
