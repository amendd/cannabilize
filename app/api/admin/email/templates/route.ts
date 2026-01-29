import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  DEFAULT_EMAIL_TEMPLATES,
  EmailTemplateConfig,
  EmailTemplateType,
} from '@/lib/email';

const EMAIL_TEMPLATES_CONFIG_KEY = 'EMAIL_TEMPLATES_V1';

const emailTemplateSchema = z.object({
  id: z.custom<EmailTemplateType>(),
  name: z.string().min(1),
  description: z.string().min(1),
  subject: z.string().min(1),
  html: z.string().min(1),
});

const templatesPayloadSchema = z.object({
  templates: z.array(emailTemplateSchema),
});

async function ensureAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return session;
}

export async function GET() {
  try {
    const session = await ensureAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: EMAIL_TEMPLATES_CONFIG_KEY },
    });

    if (!config) {
      const defaults: EmailTemplateConfig[] = Object.values(DEFAULT_EMAIL_TEMPLATES);
      return NextResponse.json({ templates: defaults, isDefault: true });
    }

    const templates = JSON.parse(config.value) as EmailTemplateConfig[];
    return NextResponse.json({ templates, isDefault: false });
  } catch (error) {
    console.error('Erro ao buscar templates de email:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar templates de email' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await ensureAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { templates } = templatesPayloadSchema.parse(body);

    // Garante que todos os IDs são válidos e conhecidos
    const validIds = new Set<EmailTemplateType>([
      'ACCOUNT_WELCOME',
      'ACCOUNT_SETUP',
      'CONSULTATION_CONFIRMED',
      'CONSULTATION_REMINDER_24H',
      'CONSULTATION_REMINDER_2H',
      'CONSULTATION_REMINDER_NOW',
      'CONSULTATION_FOLLOWUP',
      'PAYMENT_CONFIRMED',
      'PRESCRIPTION_ISSUED',
    ]);

    for (const t of templates) {
      if (!validIds.has(t.id)) {
        return NextResponse.json(
          { error: `Template ID inválido: ${t.id}` },
          { status: 400 }
        );
      }
    }

    await prisma.systemConfig.upsert({
      where: { key: EMAIL_TEMPLATES_CONFIG_KEY },
      create: {
        key: EMAIL_TEMPLATES_CONFIG_KEY,
        value: JSON.stringify(templates),
      },
      update: {
        value: JSON.stringify(templates),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao salvar templates de email:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar templates de email' },
      { status: 500 }
    );
  }
}

