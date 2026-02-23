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
    const order = await prisma.erpOrder.findUnique({
      where: { id },
      include: {
        patient: true,
        prescription: true,
        consultation: true,
        organization: true,
      },
    });
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    console.error('erp-canna order get:', e);
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 });
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
  const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'PAID', 'SENT', 'DELIVERED', 'CANCELLED'];
  try {
    const body = await request.json();
    const { status, notes, trackingCode, shippedAt, deliveredAt } = body;
    const data: Record<string, unknown> = {};
    if (validStatuses.includes(status)) data.status = status;
    if (notes !== undefined) data.notes = notes?.trim() || null;
    if (trackingCode !== undefined) data.trackingCode = trackingCode?.trim() || null;
    if (shippedAt !== undefined) data.shippedAt = shippedAt ? new Date(shippedAt) : null;
    if (deliveredAt !== undefined) data.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
    const order = await prisma.erpOrder.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(order);
  } catch (e) {
    console.error('erp-canna order update:', e);
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 });
  }
}
