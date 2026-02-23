import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendTemplateTest } from '@/lib/email';
import type { EmailTemplateType } from '@/lib/email';
import { z } from 'zod';

const TEMPLATE_IDS: EmailTemplateType[] = [
  'ACCOUNT_WELCOME',
  'ACCOUNT_SETUP',
  'CONSULTATION_CONFIRMED',
  'CONSULTATION_REMINDER_24H',
  'CONSULTATION_REMINDER_2H',
  'CONSULTATION_REMINDER_1H',
  'CONSULTATION_REMINDER_10MIN',
  'CONSULTATION_REMINDER_NOW',
  'CONSULTATION_FOLLOWUP',
  'PAYMENT_CONFIRMED',
  'PRESCRIPTION_ISSUED',
  'RESCHEDULE_INVITE',
  'RESCHEDULE_INVITE_ACCEPTED',
  'RESCHEDULE_INVITE_REJECTED',
  'RESCHEDULE_INVITE_EXPIRED',
];

const schema = z.object({
  templateId: z.string().refine((id): id is EmailTemplateType => TEMPLATE_IDS.includes(id as EmailTemplateType), {
    message: 'Modelo de email inválido',
  }),
  testEmail: z.string().email(),
});

// POST - Enviar email de teste com um modelo transacional (variáveis de exemplo)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, testEmail } = schema.parse(body);

    const { sentTo, redirected } = await sendTemplateTest(testEmail, templateId);

    return NextResponse.json({
      success: true,
      message: redirected
        ? `Email de teste enviado (redirecionado para ${sentTo}). Verifique a caixa de entrada desse endereço.`
        : `Email de teste do modelo "${templateId}" enviado para ${sentTo}`,
      sentTo,
      redirected,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[send-template-test] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao enviar email de teste',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
