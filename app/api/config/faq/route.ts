import { NextResponse } from 'next/server';
import { getFaqPublic } from '@/lib/faq';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getFaqPublic();
    return NextResponse.json(items);
  } catch (e) {
    console.error('GET /api/config/faq', e);
    return NextResponse.json(
      { error: 'Erro ao carregar dúvidas frequentes' },
      { status: 500 }
    );
  }
}
