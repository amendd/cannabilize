import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const prescriptionId = searchParams.get('prescriptionId');

    const where: { patientId?: string; prescriptionId?: string | null } = {};
    if (patientId) where.patientId = patientId;
    if (prescriptionId) where.prescriptionId = prescriptionId;

    const documents = await prisma.prescriptionDocument.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: { select: { id: true, name: true, crm: true } },
        prescription: { select: { id: true, status: true } },
      },
      orderBy: [{ prescriptionId: 'asc' }, { version: 'desc' }, { uploadedAt: 'desc' }],
    });
    return NextResponse.json(documents);
  } catch (e) {
    console.error('GPP documents GET:', e);
    return NextResponse.json({ error: 'Erro ao listar documentos' }, { status: 500 });
  }
}
