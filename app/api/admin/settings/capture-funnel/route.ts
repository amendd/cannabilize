import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import {
  getCaptureFunnelConfig,
  saveCaptureFunnelConfig,
  type FunnelType,
} from '@/lib/capture-funnel';

const updateSchema = z.object({
  funnelMobile: z.enum(['SITE', 'WHATSAPP']).optional(),
  funnelDesktop: z.enum(['SITE', 'WHATSAPP']).optional(),
  whatsappNumber: z.string().min(10).max(20).optional(),
  whatsappPrefillTemplate: z.string().max(2000).optional(),
  whatsappWelcomeMessage: z.string().max(5000).optional(),
  whatsappNextStepsMessage: z.string().max(5000).nullable().optional(),
  whatsappPixKey: z.string().max(500).nullable().optional(),
  whatsappAgentPhone: z.string().max(2000).nullable().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const config = await getCaptureFunnelConfig();
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
    const parsed = updateSchema.parse(body);

    await saveCaptureFunnelConfig({
      funnelMobile: parsed.funnelMobile as FunnelType | undefined,
      funnelDesktop: parsed.funnelDesktop as FunnelType | undefined,
      whatsappNumber: parsed.whatsappNumber,
      whatsappPrefillTemplate: parsed.whatsappPrefillTemplate,
      whatsappWelcomeMessage: parsed.whatsappWelcomeMessage,
      whatsappNextStepsMessage: parsed.whatsappNextStepsMessage,
      whatsappPixKey: parsed.whatsappPixKey,
      whatsappAgentPhone: parsed.whatsappAgentPhone,
    });

    const config = await getCaptureFunnelConfig();
    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}
