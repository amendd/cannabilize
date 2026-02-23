import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { importFromPayload, type BackupPayload } from '@/lib/backup';

const bodySchema = z.object({
  confirmRestore: z.literal(true),
  payload: z.object({
    meta: z.object({
      exportedAt: z.string(),
      version: z.number(),
      dbType: z.enum(['sqlite', 'postgresql']),
    }),
    data: z.record(z.array(z.record(z.unknown()))),
  }),
});

/**
 * POST /api/admin/backup/import
 * Corpo: { confirmRestore: true, payload: BackupPayload }
 * Substitui os dados do banco pelos do backup. Apenas ADMIN e com confirmação explícita.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json();
    const parsed = bodySchema.parse(body);
    if (!parsed.confirmRestore) {
      return NextResponse.json({ error: 'É necessário confirmar a restauração (confirmRestore: true).' }, { status: 400 });
    }

    const result = await importFromPayload(parsed.payload as BackupPayload);
    return NextResponse.json({ success: true, imported: result.imported });
  } catch (error) {
    return handleApiError(error);
  }
}
