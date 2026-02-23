import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check público para monitoramento (Nginx, Uptime Robot, etc.).
 * Retorna 200 se o banco responder; 503 em caso de falha.
 * Não expõe dados sensíveis.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('[Health] Database check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
