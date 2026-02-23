/**
 * Integração com a API do Umbler Talk (uTalk) para enviar mensagens no WhatsApp.
 * Use quando o canal de WhatsApp for o Umbler e o fluxo estiver no nosso site (webhook → nosso backend → esta API para enviar).
 *
 * A API oficial (Umbler.U.Talk.Api v1) usa autenticação Bearer JWT:
 * - Documentação: https://app-utalk.umbler.com/api/docs/index.html
 * - Em "Autorizar" → "Autorizações disponíveis" → Valor: cole seu JWT (Bearer).
 *
 * Variáveis de ambiente:
 * - UMBLER_TALK_TOKEN: JWT / chave de acesso (painel uTalk ou "Autorizar" na documentação).
 * - UMBLER_TALK_API_BASE_URL (opcional): base da API. Padrão https://app-utalk.umbler.com/api (API oficial).
 * - UMBLER_TALK_SEND_PATH (opcional): path para enviar mensagem. Padrão /send/token/ (legado). Na API v1 pode ser outro (ex.: /v1/messages).
 */

const DEFAULT_BASE_URL = 'https://app-utalk.umbler.com/api';

/**
 * Normaliza o número para o formato esperado pela API uTalk (ex.: 5511999999999@c.us).
 * Aceita +5511999999999, 5511999999999, 11999999999.
 */
function normalizeToForUmbler(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.length === 11 && digits.startsWith('1') ? '55' + digits : digits.startsWith('55') ? digits : '55' + digits;
  if (withCountry.endsWith('@c.us')) return withCountry;
  return `${withCountry}@c.us`;
}

export interface UmblerSendResult {
  success: boolean;
  error?: string;
}

/**
 * Envia uma mensagem de texto via API do Umbler Talk.
 * Retorna { success: true } ou { success: false, error: "..." }.
 */
export async function sendUmblerMessage(toPhone: string, message: string): Promise<UmblerSendResult> {
  const token = process.env.UMBLER_TALK_TOKEN?.trim();
  if (!token) {
    console.error('[Umbler Talk] UMBLER_TALK_TOKEN não configurado');
    return { success: false, error: 'UMBLER_TALK_TOKEN não configurado' };
  }

  const baseUrl = (process.env.UMBLER_TALK_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const sendPath = process.env.UMBLER_TALK_SEND_PATH || '/send/token/';
  const to = normalizeToForUmbler(toPhone);

  const body = new URLSearchParams({
    token,
    cmd: 'chat',
    to,
    msg: message,
  });

  const url = sendPath.startsWith('http') ? sendPath : `${baseUrl}${sendPath.startsWith('/') ? '' : '/'}${sendPath}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Umbler Talk] Erro ao enviar:', res.status, text);
      return { success: false, error: text || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Umbler Talk] Falha na requisição:', message);
    return { success: false, error: message };
  }
}
