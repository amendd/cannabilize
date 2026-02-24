import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  photoUrl: z.string().url().or(z.string().startsWith('/')).optional().nullable(),
  shortQuote: z.string().min(1).max(300),
  fullQuote: z.string().min(1),
  displayDate: z.string().min(1).max(50),
  source: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  sortOrder: z.number().int().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  condition: z.string().max(200).optional().nullable(),
  treatmentTime: z.string().max(100).optional().nullable(),
  age: z.number().int().min(1).max(120).optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const list = await prisma.landingTestimonial.findMany({
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
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

    if (parsed.featured === true) {
      await prisma.landingTestimonial.updateMany({
        data: { featured: false },
      });
    }

    const testimonial = await prisma.landingTestimonial.create({
      data: {
        name: parsed.name,
        photoUrl: parsed.photoUrl ?? undefined,
        shortQuote: parsed.shortQuote,
        fullQuote: parsed.fullQuote,
        displayDate: parsed.displayDate,
        source: parsed.source ?? 'Google',
        rating: parsed.rating ?? 5,
        sortOrder: parsed.sortOrder ?? 0,
        featured: parsed.featured ?? false,
        active: parsed.active ?? true,
        condition: parsed.condition ?? undefined,
        treatmentTime: parsed.treatmentTime ?? undefined,
        age: parsed.age ?? undefined,
      },
    });
    return NextResponse.json(testimonial);
  } catch (error) {
    return handleApiError(error);
  }
}
