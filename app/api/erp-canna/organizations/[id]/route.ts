import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: { orders: { take: 20, orderBy: { createdAt: 'desc' } } },
    });
    if (!org) return NextResponse.json({ error: 'Associação não encontrada' }, { status: 404 });
    return NextResponse.json(org);
  } catch (e) {
    console.error('erp-canna organization get:', e);
    return NextResponse.json({ error: 'Erro ao buscar associação' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, type, document, email, phone, address, active } = body;
    const data: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (type === 'CLINIC' || type === 'HYBRID' || type === 'ASSOCIATION') data.type = type;
    if (document !== undefined) data.document = document?.trim() || null;
    if (email !== undefined) data.email = email?.trim() || null;
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (address !== undefined) data.address = address?.trim() || null;
    if (typeof active === 'boolean') data.active = active;
    const org = await prisma.organization.update({
      where: { id },
      data,
    });
    return NextResponse.json(org);
  } catch (e) {
    console.error('erp-canna organization update:', e);
    return NextResponse.json({ error: 'Erro ao atualizar associação' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.organization.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('erp-canna organization delete:', e);
    return NextResponse.json({ error: 'Erro ao desativar associação' }, { status: 500 });
  }
}
