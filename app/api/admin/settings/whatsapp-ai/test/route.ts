import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAuth, handleApiError } from '@/lib/error-handler';
import { getWhatsAppAiReplyWithDiagnostics, isWhatsAppAiAvailable, getWhatsAppAiFallbackMessage } from '@/lib/whatsapp-ai';

/**
 * POST - Testa a IA com uma pergunta de exemplo.
 * Body: { message?: string } (opcional; padrão: "Vocês atendem aos sábados?")
 * Retorna: { success, reply, usedFallback, error } — error traz o motivo exato quando a IA falha (ex.: chave inválida).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = checkAuth(session, 'ADMIN');
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === 'string' && body.message.trim()
      ? body.message.trim().slice(0, 500)
      : 'Vocês atendem aos sábados?';

    const available = await isWhatsAppAiAvailable();
    if (!available) {
      return NextResponse.json({
        success: false,
        reply: null,
        usedFallback: true,
        error: 'Chave da API não configurada. Informe a chave na tela ou configure OPENAI_API_KEY no .env.',
      });
    }

    const { reply, error: diagnosticError } = await getWhatsAppAiReplyWithDiagnostics({
      userMessage: message,
      currentStep: 'ASK_NAME',
      leadName: null,
    });

    if (reply) {
      return NextResponse.json({
        success: true,
        reply,
        usedFallback: false,
        error: null,
      });
    }

    const fallback = getWhatsAppAiFallbackMessage();
    return NextResponse.json({
      success: true,
      reply: fallback,
      usedFallback: true,
      error: diagnosticError || 'A IA não retornou resposta. Exibindo mensagem de fallback.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      reply: null,
      usedFallback: false,
      error: msg,
    });
  }
}
