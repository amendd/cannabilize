import { NextRequest, NextResponse } from 'next/server';

/**
 * Valida autorização para rotas de cron (Bearer CRON_SECRET).
 * Em produção: CRON_SECRET é OBRIGATÓRIO — se não estiver definido, retorna 503.
 * Em desenvolvimento: se CRON_SECRET estiver definido, exige o header; se não, permite (para testes locais).
 */
export function requireCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const valid = !!secret && authHeader === `Bearer ${secret}`;

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.trim() === '') {
      return NextResponse.json(
        {
          error:
            'CRON_SECRET não configurado. Configure a variável de ambiente CRON_SECRET na VPS.',
        },
        { status: 503 }
      );
    }
    if (!valid) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
  } else {
    if (secret && !valid) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
  }

  return null; // autorizado
}
