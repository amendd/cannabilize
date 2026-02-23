/**
 * POST /api/umbler-talk/confirm-booking
 *
 * Integração Umbler Talk (uTalk) descontinuada.
 * Esta rota não processa mais agendamentos. Use o fluxo principal do site (agendamento + Z-API/Twilio).
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Integração Umbler Talk descontinuada. Use o agendamento pelo site ou WhatsApp (Z-API/Twilio).',
      code: 'UMBLER_TALK_DISCONTINUED',
    },
    { status: 410 }
  );
}
