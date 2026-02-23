import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasValidLgpdConsent } from '@/lib/compliance-gates';

/**
 * GET — Verifica se o paciente logado possui consentimento LGPD válido.
 * Usado pelo layout para redirecionar para /paciente/consentimento quando necessário.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ hasConsent: false }, { status: 200 });
  }
  if (session.user.role !== 'PATIENT') {
    return NextResponse.json({ hasConsent: true });
  }
  const hasConsent = await hasValidLgpdConsent(session.user.id);
  return NextResponse.json({ hasConsent });
}
