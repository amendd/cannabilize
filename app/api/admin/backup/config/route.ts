import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { BACKUP_CONFIG_KEY_RETENTION_DAYS, BACKUP_CONFIG_KEY_AUTO_EXPORT_ENABLED } from '@/lib/backup';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const dbUrl = process.env.DATABASE_URL ?? '';
    const dbType = dbUrl.startsWith('file:') ? 'sqlite' : 'postgresql';

    let retentionDays = 14;
    let autoExportEnabled = false;

    const [retentionRow, autoRow] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: BACKUP_CONFIG_KEY_RETENTION_DAYS } }),
      prisma.systemConfig.findUnique({ where: { key: BACKUP_CONFIG_KEY_AUTO_EXPORT_ENABLED } }),
    ]);
    if (retentionRow?.value) retentionDays = parseInt(retentionRow.value, 10) || 14;
    if (autoRow?.value) autoExportEnabled = autoRow.value === 'true';

    return NextResponse.json({
      dbType,
      retentionDays,
      autoExportEnabled,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  retentionDays: z.number().int().min(1).max(365).optional(),
  autoExportEnabled: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json();
    const parsed = updateSchema.parse(body);

    if (typeof parsed.retentionDays === 'number') {
      await prisma.systemConfig.upsert({
        where: { key: BACKUP_CONFIG_KEY_RETENTION_DAYS },
        update: { value: String(parsed.retentionDays) },
        create: { key: BACKUP_CONFIG_KEY_RETENTION_DAYS, value: String(parsed.retentionDays) },
      });
    }
    if (typeof parsed.autoExportEnabled === 'boolean') {
      await prisma.systemConfig.upsert({
        where: { key: BACKUP_CONFIG_KEY_AUTO_EXPORT_ENABLED },
        update: { value: String(parsed.autoExportEnabled) },
        create: { key: BACKUP_CONFIG_KEY_AUTO_EXPORT_ENABLED, value: String(parsed.autoExportEnabled) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
