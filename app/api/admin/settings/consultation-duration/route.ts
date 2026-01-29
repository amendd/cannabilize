import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import {
  CONSULTATION_DEFAULT_DURATION_MINUTES_KEY,
  getDefaultConsultationDurationMinutes,
} from '@/lib/consultation-config';

const updateSchema = z.object({
  minutes: z.number().int().min(10).max(120),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const minutes = await getDefaultConsultationDurationMinutes();
    return NextResponse.json({ minutes });
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
    const { minutes } = updateSchema.parse(body);

    await prisma.systemConfig.upsert({
      where: { key: CONSULTATION_DEFAULT_DURATION_MINUTES_KEY },
      update: { value: String(minutes) },
      create: { key: CONSULTATION_DEFAULT_DURATION_MINUTES_KEY, value: String(minutes) },
    });

    return NextResponse.json({ minutes });
  } catch (error) {
    return handleApiError(error);
  }
}

