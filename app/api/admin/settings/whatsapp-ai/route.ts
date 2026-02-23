import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import {
  getWhatsAppAiConfig,
  getWhatsAppAiInstructions,
  DEFAULT_WHATSAPP_AI_INSTRUCTIONS,
  WHATSAPP_AI_ENABLED_KEY,
  WHATSAPP_AI_MODEL_KEY,
  WHATSAPP_AI_API_KEY,
  WHATSAPP_AI_PROVIDER_KEY,
  WHATSAPP_AI_INSTRUCTIONS_KEY,
  type WhatsAppAiProvider,
} from '@/lib/whatsapp-ai-config';

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  model: z.string().max(120).optional().nullable(),
  /** openai | groq */
  provider: z.enum(['openai', 'groq']).optional(),
  /** Chave da API: string para salvar, '' ou null para remover. Omitir para não alterar. */
  apiKey: z.string().max(500).optional().nullable(),
  /** Instruções para a IA (contexto e como falar com o paciente). Máx. 8000 caracteres. */
  instructions: z.string().max(8000).optional().nullable(),
});

function envKeyConfigured(provider: WhatsAppAiProvider): boolean {
  if (provider === 'groq') return !!process.env.GROQ_API_KEY?.trim();
  return !!(
    process.env.OPENAI_WHATSAPP_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim()
  );
}

/** GET - Retorna configuração atual (sem expor a chave). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const [config, instructions] = await Promise.all([
      getWhatsAppAiConfig(),
      getWhatsAppAiInstructions(),
    ]);
    const keyConfigured = envKeyConfigured(config.provider) || config.hasStoredApiKey;

    return NextResponse.json({
      enabled: config.enabled,
      model: config.model ?? '',
      provider: config.provider,
      keyConfigured,
      hasStoredKey: config.hasStoredApiKey,
      instructions: instructions ?? '',
      defaultInstructions: DEFAULT_WHATSAPP_AI_INSTRUCTIONS,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST - Atualiza enabled, model e/ou apiKey no SystemConfig. */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json();
    const parsed = updateSchema.parse(body);

    if (parsed.enabled !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key: WHATSAPP_AI_ENABLED_KEY },
        update: { value: parsed.enabled ? 'true' : 'false' },
        create: { key: WHATSAPP_AI_ENABLED_KEY, value: parsed.enabled ? 'true' : 'false' },
      });
    }

    if (parsed.model !== undefined) {
      const value = parsed.model?.trim() ?? '';
      await prisma.systemConfig.upsert({
        where: { key: WHATSAPP_AI_MODEL_KEY },
        update: { value },
        create: { key: WHATSAPP_AI_MODEL_KEY, value },
      });
    }

    if (parsed.provider !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key: WHATSAPP_AI_PROVIDER_KEY },
        update: { value: parsed.provider },
        create: { key: WHATSAPP_AI_PROVIDER_KEY, value: parsed.provider },
      });
    }

    if (parsed.apiKey !== undefined) {
      const keyValue = typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '';
      if (keyValue.length > 0) {
        await prisma.systemConfig.upsert({
          where: { key: WHATSAPP_AI_API_KEY },
          update: { value: keyValue },
          create: { key: WHATSAPP_AI_API_KEY, value: keyValue },
        });
      } else {
        await prisma.systemConfig.deleteMany({ where: { key: WHATSAPP_AI_API_KEY } });
      }
    }

    if (parsed.instructions !== undefined) {
      const value = typeof parsed.instructions === 'string' ? parsed.instructions.trim() : '';
      if (value.length > 0) {
        await prisma.systemConfig.upsert({
          where: { key: WHATSAPP_AI_INSTRUCTIONS_KEY },
          update: { value },
          create: { key: WHATSAPP_AI_INSTRUCTIONS_KEY, value },
        });
      } else {
        await prisma.systemConfig.deleteMany({ where: { key: WHATSAPP_AI_INSTRUCTIONS_KEY } });
      }
    }

    const [config, instructions] = await Promise.all([
      getWhatsAppAiConfig(),
      getWhatsAppAiInstructions(),
    ]);
    const keyConfigured = envKeyConfigured(config.provider) || config.hasStoredApiKey;

    return NextResponse.json({
      enabled: config.enabled,
      model: config.model ?? '',
      provider: config.provider,
      keyConfigured,
      hasStoredKey: config.hasStoredApiKey,
      instructions: instructions ?? '',
      defaultInstructions: DEFAULT_WHATSAPP_AI_INSTRUCTIONS,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
