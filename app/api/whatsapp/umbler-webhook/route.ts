/**
 * Webhook Umbler Talk (uTalk) – DESCONTINUADO.
 *
 * Esta URL não processa mais mensagens. Configure o webhook do WhatsApp para
 * /api/whatsapp/webhook (Twilio) ou /api/whatsapp/zapi-webhook (Z-API).
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Webhook Umbler Talk descontinuado. Use /api/whatsapp/webhook ou /api/whatsapp/zapi-webhook.',
      code: 'UMBLER_TALK_DISCONTINUED',
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook Umbler Talk descontinuado. Use Z-API ou Twilio.',
    code: 'UMBLER_TALK_DISCONTINUED',
  });
}
