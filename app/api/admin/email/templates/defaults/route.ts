import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DEFAULT_EMAIL_TEMPLATES } from '@/lib/email';

/**
 * GET - Retorna os templates de email padrão (para uso no painel ao resetar um template).
 * Só é usado no cliente para evitar importar lib/email (que usa nodemailer/Node).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    return NextResponse.json({ defaults: DEFAULT_EMAIL_TEMPLATES });
  } catch (error) {
    console.error('Erro ao buscar templates padrão:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar templates padrão' },
      { status: 500 }
    );
  }
}
