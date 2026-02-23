import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { id } = await params;
    const item = await prisma.landingFaq.findUnique({
      where: { id },
    });
    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const item = await prisma.landingFaq.update({
      where: { id },
      data: {
        ...(parsed.question && { question: parsed.question }),
        ...(parsed.answer && { answer: parsed.answer }),
        ...(parsed.sortOrder !== undefined && { sortOrder: parsed.sortOrder }),
        ...(parsed.active !== undefined && { active: parsed.active }),
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { id } = await params;
    await prisma.landingFaq.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
