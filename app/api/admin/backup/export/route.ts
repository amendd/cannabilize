import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { exportToJson } from '@/lib/backup';

/**
 * GET /api/admin/backup/export
 * Gera e retorna um arquivo JSON de backup (somente ADMIN).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const payload = await exportToJson();
    const filename = `backup-${payload.meta.exportedAt.slice(0, 19).replace(/:/g, '-')}.json`;

    return new NextResponse(JSON.stringify(payload, null, 0), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
