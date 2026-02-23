import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  category: z.enum(['hero', 'logo', 'banner', 'process', 'statistic']).optional(),
  value: z.string().optional(),
  label: z.string().optional().nullable(),
  altText: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    const asset = await prisma.siteAsset.findUnique({
      where: { key: decodedKey },
    });
    if (!asset) {
      return NextResponse.json({ error: 'Asset não encontrado' }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const asset = await prisma.siteAsset.update({
      where: { key: decodedKey },
      data: {
        ...(parsed.category && { category: parsed.category }),
        ...(parsed.value !== undefined && { value: parsed.value }),
        ...(parsed.label !== undefined && { label: parsed.label }),
        ...(parsed.altText !== undefined && { altText: parsed.altText }),
        ...(parsed.sortOrder !== undefined && { sortOrder: parsed.sortOrder }),
      },
    });
    return NextResponse.json(asset);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    await prisma.siteAsset.delete({
      where: { key: decodedKey },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
