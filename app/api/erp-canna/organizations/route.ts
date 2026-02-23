import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  try {
    const list = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error('erp-canna organizations list:', e);
    return NextResponse.json({ error: 'Erro ao listar associações' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { name, type, document, email, phone, address } = body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        type: type === 'CLINIC' || type === 'HYBRID' ? type : 'ASSOCIATION',
        document: document?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      },
    });
    return NextResponse.json(org);
  } catch (e) {
    console.error('erp-canna organization create:', e);
    return NextResponse.json({ error: 'Erro ao criar associação' }, { status: 500 });
  }
}
