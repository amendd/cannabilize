import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import {
  RESCHEDULE_INVITES_ENABLED_KEY,
  RESCHEDULE_INVITE_EXPIRY_HOURS_KEY,
  getRescheduleInvitesEnabled,
  getRescheduleInviteExpiryHours,
} from '@/lib/consultation-config';

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  expiryHours: z.number().int().min(1).max(168).optional(), // 1h a 7 dias
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const [enabled, expiryHours] = await Promise.all([
      getRescheduleInvitesEnabled(),
      getRescheduleInviteExpiryHours(),
    ]);

    return NextResponse.json({ enabled, expiryHours });
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
        where: { key: RESCHEDULE_INVITES_ENABLED_KEY },
        update: { value: parsed.enabled ? 'true' : 'false' },
        create: {
          key: RESCHEDULE_INVITES_ENABLED_KEY,
          value: parsed.enabled ? 'true' : 'false',
        },
      });
    }

    if (typeof parsed.expiryHours === 'number') {
      await prisma.systemConfig.upsert({
        where: { key: RESCHEDULE_INVITE_EXPIRY_HOURS_KEY },
        update: { value: String(parsed.expiryHours) },
        create: {
          key: RESCHEDULE_INVITE_EXPIRY_HOURS_KEY,
          value: String(parsed.expiryHours),
        },
      });
    }

    const [enabled, expiryHours] = await Promise.all([
      getRescheduleInvitesEnabled(),
      getRescheduleInviteExpiryHours(),
    ]);

    return NextResponse.json({ enabled, expiryHours });
  } catch (error) {
    return handleApiError(error);
  }
}
