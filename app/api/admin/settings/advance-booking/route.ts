import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import {
  MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY,
  MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY,
  MIN_ADVANCE_BOOKING_ENABLED_KEY,
  getMinAdvanceBookingMinutesOnline,
  getMinAdvanceBookingMinutesOffline,
  getMinAdvanceBookingEnabled,
} from '@/lib/consultation-config';

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  minutesOnline: z.number().int().min(0).max(1440).optional(), // 0 a 24 horas
  minutesOffline: z.number().int().min(0).max(10080).optional(), // 0 a 7 dias
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const [enabled, minutesOnline, minutesOffline] = await Promise.all([
      getMinAdvanceBookingEnabled(),
      getMinAdvanceBookingMinutesOnline(),
      getMinAdvanceBookingMinutesOffline(),
    ]);
    
    return NextResponse.json({ 
      enabled, 
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
    const parsed = updateSchema.parse(body);

    if (parsed.enabled !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key: MIN_ADVANCE_BOOKING_ENABLED_KEY },
        update: { value: parsed.enabled ? 'true' : 'false' },
        create: { 
          key: MIN_ADVANCE_BOOKING_ENABLED_KEY, 
          value: parsed.enabled ? 'true' : 'false' 
        },
      });
    }

    if (typeof parsed.minutesOnline === 'number') {
      await prisma.systemConfig.upsert({
        where: { key: MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY },
        update: { value: String(parsed.minutesOnline) },
        create: { 
          key: MIN_ADVANCE_BOOKING_MINUTES_ONLINE_KEY, 
          value: String(parsed.minutesOnline) 
        },
      });
    }

    if (typeof parsed.minutesOffline === 'number') {
      await prisma.systemConfig.upsert({
        where: { key: MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY },
        update: { value: String(parsed.minutesOffline) },
        create: { 
          key: MIN_ADVANCE_BOOKING_MINUTES_OFFLINE_KEY, 
          value: String(parsed.minutesOffline) 
        },
      });
    }

    const [enabled, minutesOnline, minutesOffline] = await Promise.all([
      getMinAdvanceBookingEnabled(),
      getMinAdvanceBookingMinutesOnline(),
      getMinAdvanceBookingMinutesOffline(),
    ]);

    return NextResponse.json({ 
      enabled, 
      minutesOnline, 
      minutesOffline 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
