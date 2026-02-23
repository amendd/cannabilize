import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  key: z.string().min(1).max(100),
  category: z.enum(['hero', 'logo', 'banner', 'process', 'statistic']),
  value: z.string().min(1),
  label: z.string().optional(),
  altText: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const list = await prisma.siteAsset.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
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

    const asset = await prisma.siteAsset.upsert({
      where: { key: parsed.key },
      update: {
        category: parsed.category,
        value: parsed.value,
        label: parsed.label ?? undefined,
        altText: parsed.altText ?? undefined,
        sortOrder: parsed.sortOrder ?? 0,
      },
      create: {
        key: parsed.key,
        category: parsed.category,
        value: parsed.value,
        label: parsed.label,
        altText: parsed.altText,
        sortOrder: parsed.sortOrder ?? 0,
      },
    });
    return NextResponse.json(asset);
  } catch (error) {
    return handleApiError(error);
  }
}
