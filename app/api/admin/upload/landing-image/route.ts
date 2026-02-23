import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['hero', 'logo', 'process_1', 'process_2', 'process_3', 'process_4', 'team_1', 'team_2', 'team_3', 'consumption_1', 'consumption_2', 'consumption_3', 'consumption_4'] as const;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB (outras imagens)
const MAX_SIZE_LOGO_BYTES = 8 * 1024 * 1024; // 8MB (logo)
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function getExtension(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function getSubdir(type: string): string {
  if (type === 'hero') return 'hero';
  if (type === 'logo') return '';
  if (type.startsWith('process_')) return 'process';
  if (type.startsWith('team_')) return 'team';
  if (type.startsWith('consumption_')) return 'consumption';
  return 'hero';
}

// Logo vai para public/images/ (raiz de images)
function getDir(type: string): string {
  const subdir = getSubdir(type);
  return path.join(process.cwd(), 'public', 'images', subdir);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }
    if (!type || !ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use: hero, logo, process_1-4, team_1-3, consumption_1-4' },
        { status: 400 }
      );
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato não permitido. Use JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }
    const maxSize = type === 'logo' ? MAX_SIZE_LOGO_BYTES : MAX_SIZE_BYTES;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: type === 'logo' ? 'Arquivo muito grande. Tamanho máximo: 8MB.' : 'Arquivo muito grande. Tamanho máximo: 2MB.' },
        { status: 400 }
      );
    }

    const subdir = getSubdir(type);
    const ext = getExtension(file.type);
    const filename = `${type}-${Date.now()}.${ext}`;
    const dir = getDir(type);
    const filepath = path.join(dir, filename);

    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = subdir ? `/images/${subdir}/${filename}` : `/images/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
