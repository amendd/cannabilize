import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmailStatus } from '@/lib/email';

// GET - Diagnóstico do envio de email (qual provedor está ativo, se tem credenciais, redirecionamento)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const status = await getEmailStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[email/status] Erro:', error);
    return NextResponse.json(
      {
        hasConfig: false,
        canSend: false,
        redirectTo: null,
        message: error instanceof Error ? error.message : 'Erro ao verificar status',
      },
      { status: 500 }
    );
  }
}
