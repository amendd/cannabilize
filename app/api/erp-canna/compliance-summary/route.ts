import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [consentCount, auditCountLast30] = await Promise.all([
      prisma.patientConsent.count({ where: { revokedAt: null } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
    ]);
    return NextResponse.json({ consentCount, auditCountLast30 });
  } catch (e) {
    console.error('erp-canna compliance-summary:', e);
    return NextResponse.json({ error: 'Erro ao carregar resumo' }, { status: 500 });
  }
}
