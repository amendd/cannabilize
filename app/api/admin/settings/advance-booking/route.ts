import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import {
  MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY,
  MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY,
  getMinAdvanceBookingMinutesOnline,
  getMinAdvanceBookingMinutesOffline,
} from '@/lib/consultation-config';

const updateSchema = z.object({
  minutesOnline: z.number().int().min(0).max(1440), // 0 a 24 horas
  minutesOffline: z.number().int().min(0).max(10080), // 0 a 7 dias
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const minutesOnline = await getMinAdvanceBookingMinutesOnline();
    const minutesOffline = await getMinAdvanceBookingMinutesOffline();
    
    return NextResponse.json({ 
      minutesOnline, 
      minutesOffline 
    });
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
    const { minutesOnline, minutesOffline } = updateSchema.parse(body);

    // Salvar configuração online
    await prisma.systemConfig.upsert({
      where: { key: MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY },
      update: { value: String(minutesOnline) },
      create: { 
        key: MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY, 
        value: String(minutesOnline) 
      },
    });

    // Salvar configuração offline
    await prisma.systemConfig.upsert({
      where: { key: MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY },
      update: { value: String(minutesOffline) },
      create: { 
        key: MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY, 
        value: String(minutesOffline) 
      },
    });

    return NextResponse.json({ 
      minutesOnline, 
      minutesOffline 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
