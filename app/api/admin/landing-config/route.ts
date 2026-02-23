import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { getLandingConfigPublic } from '@/lib/landing-config';

const LANDING_KEYS = [
  'landing_hero_headline',
  'landing_hero_subheadline',
  'landing_hero_image_url',
  'landing_hero_cta_text',
  'landing_logo_url',
  'landing_stat_rating',
  'landing_stat_patients',
  'landing_stat_consultations',
  'landing_stat_testimonials',
  'landing_stat_cities',
  'landing_progress_label',
  'landing_process_1_url',
  'landing_process_2_url',
  'landing_process_3_url',
  'landing_process_4_url',
  'landing_team_1_url',
  'landing_team_2_url',
  'landing_team_3_url',
  'landing_show_events_section',
  'landing_show_blog_preview_section',
  'landing_show_consumption_forms_section',
  'landing_consumption_forms_title',
  'landing_consumption_forms_badge',
  'landing_consumption_forms_badge_sub',
  'landing_consumption_forms_items',
] as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const config = await getLandingConfigPublic();
    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    for (const key of LANDING_KEYS) {
      const value = body[key];
      if (value === undefined) continue;
      const str = typeof value === 'string' ? value : String(value);
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: str },
        create: { key, value: str },
      });
    }

    const config = await getLandingConfigPublic();
    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}
