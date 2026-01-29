import { NextRequest, NextResponse } from 'next/server';

// Esta é uma referência ao mapa de rate limiting do middleware
// Em produção, isso deveria usar Redis ou outro sistema compartilhado
declare global {
  // eslint-disable-next-line no-var
  var rateLimitMap: Map<string, { count: number; resetTime: number }> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Apenas em desenvolvimento ou com autenticação adequada
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Esta rota não está disponível em produção' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const ip = body.ip;

    // Acessar o mapa global (criado no middleware)
    if (typeof global.rateLimitMap !== 'undefined') {
      if (ip) {
        global.rateLimitMap.delete(ip);
        return NextResponse.json({ message: `Rate limit limpo para IP: ${ip}` });
      } else {
        global.rateLimitMap.clear();
        return NextResponse.json({ message: 'Todos os rate limits foram limpos' });
      }
    }

    return NextResponse.json(
      { error: 'Rate limit map não encontrado' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Erro ao limpar rate limit:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar rate limit' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Apenas em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta rota não está disponível em produção' },
      { status: 403 }
    );
  }

  if (typeof global.rateLimitMap !== 'undefined') {
    const entries = Array.from(global.rateLimitMap.entries()).map(([ip, record]) => ({
      ip,
      count: record.count,
      resetTime: new Date(record.resetTime).toISOString(),
      resetIn: Math.max(0, Math.floor((record.resetTime - Date.now()) / 1000)),
    }));

    return NextResponse.json({
      totalEntries: global.rateLimitMap.size,
      entries,
    });
  }

  return NextResponse.json({ message: 'Rate limit map não encontrado' });
}
