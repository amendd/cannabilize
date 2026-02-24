import { NextResponse } from 'next/server';
import { getContactPhone, getContactEmail } from '@/lib/contact-config';

/**
 * GET - Retorna telefone e email de contato da clínica (público).
 */
export async function GET() {
  try {
    const [phone, email] = await Promise.all([
      getContactPhone(),
      getContactEmail(),
    ]);
    return NextResponse.json({ phone, email });
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    return NextResponse.json(
      { phone: '(11) 99999-9999', email: 'contato@cannabilize.com.br' },
      { status: 200 }
    );
  }
}
