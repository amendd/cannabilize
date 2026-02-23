import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const list = await prisma.landingFaq.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(list);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json();
    const parsed = createSchema.parse(body);

    const maxOrder = await prisma.landingFaq.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = parsed.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

    const item = await prisma.landingFaq.create({
      data: {
        question: parsed.question,
        answer: parsed.answer,
        sortOrder,
        active: parsed.active ?? true,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}
