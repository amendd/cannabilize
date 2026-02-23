import { NextResponse } from 'next/server';
import { getLandingConfigPublic } from '@/lib/landing-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getLandingConfigPublic();
    return NextResponse.json(config);
  } catch (e) {
    console.error('GET /api/config/landing', e);
    return NextResponse.json(
      { error: 'Erro ao carregar configuração da landing' },
      { status: 500 }
    );
  }
}
