import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  photoUrl: z.string().url().or(z.string().startsWith('/')).optional().nullable(),
  shortQuote: z.string().min(1).max(300).optional(),
  fullQuote: z.string().min(1).optional(),
  displayDate: z.string().min(1).max(50).optional(),
  source: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  sortOrder: z.number().int().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  condition: z.string().max(200).optional().nullable(),
  treatmentTime: z.string().max(100).optional().nullable(),
  age: z.number().int().min(1).max(120).optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { id } = await params;
    const testimonial = await prisma.landingTestimonial.findUnique({
      where: { id },
    });
    if (!testimonial) {
      return NextResponse.json({ error: 'Depoimento não encontrado' }, { status: 404 });
    }
    return NextResponse.json(testimonial);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    if (parsed.featured === true) {
      await prisma.landingTestimonial.updateMany({
        where: { id: { not: id } },
        data: { featured: false },
      });
    }

    const testimonial = await prisma.landingTestimonial.update({
      where: { id },
      data: {
        ...(parsed.name && { name: parsed.name }),
        ...(parsed.photoUrl !== undefined && { photoUrl: parsed.photoUrl }),
        ...(parsed.shortQuote && { shortQuote: parsed.shortQuote }),
        ...(parsed.fullQuote && { fullQuote: parsed.fullQuote }),
        ...(parsed.displayDate && { displayDate: parsed.displayDate }),
        ...(parsed.source !== undefined && { source: parsed.source }),
        ...(parsed.rating !== undefined && { rating: parsed.rating }),
        ...(parsed.sortOrder !== undefined && { sortOrder: parsed.sortOrder }),
        ...(parsed.featured !== undefined && { featured: parsed.featured }),
        ...(parsed.active !== undefined && { active: parsed.active }),
        ...(parsed.condition !== undefined && { condition: parsed.condition }),
        ...(parsed.treatmentTime !== undefined && { treatmentTime: parsed.treatmentTime }),
        ...(parsed.age !== undefined && { age: parsed.age }),
      },
    });
    return NextResponse.json(testimonial);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const { id } = await params;
    await prisma.landingTestimonial.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
