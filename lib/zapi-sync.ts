/**
 * Sincronização de mensagens da Z-API para o banco local.
 * Busca chats e histórico de mensagens na Z-API e persiste em WhatsAppWebhookLog (recebidas)
 * e WhatsAppMessage (enviadas pelo sistema), para exibir no monitor mesmo quando o sistema estava offline.
 */
import { prisma } from '@/lib/prisma';
import { formatPhoneNumber } from '@/lib/whatsapp';

const ZAPI_BASE = 'https://api.z-api.io';

interface ZapiConfig {
  instanceId: string;
  token: string;
  clientToken: string | null;
}

async function getZapiConfig(): Promise<ZapiConfig | null> {
  const config = await prisma.whatsAppConfig.findUnique({
    where: { provider: 'ZAPI' },
  });
  if (!config?.enabled || !config.authToken) return null;
  let instanceId = '';
  if (config.config) {
    try {
      const parsed = JSON.parse(config.config) as { instance_id?: string };
      instanceId = parsed.instance_id?.trim() || '';
    } catch {
      return null;
    }
  }
  if (!instanceId) return null;
  return {
    instanceId,
    token: config.authToken,
    clientToken: config.apiSecret?.trim() || null,
  };
}

/** Formato de mensagem retornado pela API chat-messages da Z-API */
interface ZapiChatMessage {
  messageId?: string;
  phone?: string;
  fromMe?: boolean;
  momment?: number;
  text?: { message?: string };
  image?: { caption?: string };
  document?: { title?: string; fileName?: string };
  [key: string]: unknown;
}

function extractTextFromZapiMessage(msg: ZapiChatMessage): string {
  const parts: string[] = [];
  if (msg.text?.message) parts.push(String(msg.text.message).trim());
  if (msg.image?.caption) parts.push(String(msg.image.caption).trim());
  if (msg.document?.title) parts.push(`[Documento: ${msg.document.title}]`);
  if (msg.document?.fileName && !msg.document?.title) parts.push(`[Arquivo: ${msg.document.fileName}]`);
  return parts.filter(Boolean).join('\n') || '(mídia ou mensagem sem texto)';
}

/**
 * Busca lista de chats na Z-API (paginado).
 * Aceita resposta em array direto ou objeto com chats/data/value/result.
 */
async function fetchZapiChats(
  cfg: ZapiConfig,
  page: number = 1,
  pageSize: number = 50
): Promise<{ phone: string; lastMessageTime?: string }[]> {
  const url = `${ZAPI_BASE}/instances/${cfg.instanceId}/token/${cfg.token}/chats?page=${page}&pageSize=${pageSize}`;
  const headers: Record<string, string> = {};
  if (cfg.clientToken) headers['Client-Token'] = cfg.clientToken;

  const res = await fetch(url, { headers, cache: 'no-store' });
  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`Z-API chats: ${res.status} ${rawText.slice(0, 300)}`);
  }
  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    console.warn('[zapi-sync] Resposta /chats não é JSON:', rawText.slice(0, 200));
    return [];
  }
  const list: unknown[] = Array.isArray(data)
    ? data
    : (data && typeof data === 'object'
        ? (Array.isArray((data as any).chats) ? (data as any).chats
          : Array.isArray((data as any).data) ? (data as any).data
          : Array.isArray((data as any).value) ? (data as any).value
          : Array.isArray((data as any).result) ? (data as any).result
          : Array.isArray((data as any).response) ? (data as any).response
          : [])
        : []);
  if (list.length === 0) {
    if (data !== null && typeof data === 'object') {
      console.warn('[zapi-sync] Z-API /chats retornou 0 itens. Resposta (amostra):', JSON.stringify(data).slice(0, 400));
    }
    return [];
  }
  return list.map((c: { phone?: string; lastMessageTime?: string }) => ({
    phone: String(c?.phone ?? '').replace(/\D/g, ''),
    lastMessageTime: c?.lastMessageTime,
  })).filter((c: { phone: string }) => c.phone.length >= 10);
}

/**
 * Busca mensagens de um chat na Z-API.
 * amount: recomendado 10–30 por requisição.
 */
async function fetchZapiChatMessages(
  cfg: ZapiConfig,
  phoneDigits: string,
  amount: number = 30,
  lastMessageId?: string
): Promise<ZapiChatMessage[]> {
  let url = `${ZAPI_BASE}/instances/${cfg.instanceId}/token/${cfg.token}/chat-messages/${phoneDigits}?amount=${amount}`;
  if (lastMessageId) url += `&lastMessageId=${encodeURIComponent(lastMessageId)}`;
  const headers: Record<string, string> = {};
  if (cfg.clientToken) headers['Client-Token'] = cfg.clientToken;

  const res = await fetch(url, { headers, cache: 'no-store' });
  const rawText = await res.text();
  if (!res.ok) {
    if (res.status === 400 && /multi device|multidevice/i.test(rawText)) {
      console.warn('[zapi-sync] Z-API não suporta histórico de mensagens em contas multi-dispositivo:', phoneDigits);
      return [];
    }
    throw new Error(`Z-API chat-messages: ${res.status} ${rawText.slice(0, 300)}`);
  }
  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    return [];
  }
  const list = Array.isArray(data)
    ? data
    : (data && typeof data === 'object'
        ? ((data as any).chats ?? (data as any).data ?? (data as any).value ?? (data as any).result ?? (data as any).response ?? [])
        : []);
  return Array.isArray(list) ? list : [];
}

export interface SyncMessagesResult {
  success: boolean;
  conversationsProcessed: number;
  logsInserted: number;
  messagesInserted: number;
  error?: string;
  /** Quando a sincronização retorna 0 conversas, indica possível causa para o usuário verificar */
  warning?: string;
}

/**
 * Testa a chamada GET /chats da Z-API e opcionalmente retorna a lista de chats.
 * Usado para diagnóstico e para alimentar a sincronização com a lista que já funciona.
 */
export async function testZapiChatsFetch(): Promise<{
  ok: boolean;
  chatsCount: number;
  chats?: { phone: string; lastMessageTime?: string }[];
  statusCode?: number;
  responsePreview?: string;
  error?: string;
}> {
  const cfg = await getZapiConfig();
  if (!cfg) return { ok: false, chatsCount: 0, error: 'Z-API não configurada ou desabilitada.' };
  try {
    const chats = await fetchZapiChats(cfg, 1, 10);
    return {
      ok: true,
      chatsCount: chats.length,
      chats,
      statusCode: 200,
      responsePreview: JSON.stringify(chats.slice(0, 2)).slice(0, 600),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      chatsCount: 0,
      statusCode: msg.includes('401') ? 401 : msg.includes('403') ? 403 : undefined,
      error: msg,
    };
  }
}

/**
 * Sincroniza mensagens da Z-API para o banco: busca até maxChats conversas,
 * em cada uma busca até amount mensagens, e persiste as que ainda não existem.
 */
export async function syncZapiMessages(options?: {
  maxChats?: number;
  messagesPerChat?: number;
  /** Lista de chats já obtida (ex.: pelo teste). Usar quando fetch direto dentro da sync retorna vazio. */
  initialChats?: { phone: string; lastMessageTime?: string }[];
}): Promise<SyncMessagesResult> {
  const maxChats = options?.maxChats ?? 30;
  const messagesPerChat = options?.messagesPerChat ?? 30;

  const cfg = await getZapiConfig();
  if (!cfg) {
    return {
      success: false,
      conversationsProcessed: 0,
      logsInserted: 0,
      messagesInserted: 0,
      error: 'Z-API não está configurada ou está desabilitada.',
    };
  }

  let conversationsProcessed = 0;
  let logsInserted = 0;
  let messagesInserted = 0;

  try {
    let chats: { phone: string; lastMessageTime?: string }[];
    if (options?.initialChats?.length) {
      chats = options.initialChats.slice(0, maxChats);
    } else {
      const chatsPageSize = 10;
      const pagesToFetch = Math.max(1, Math.ceil(maxChats / chatsPageSize));
      const allChats: { phone: string; lastMessageTime?: string }[] = [];
      for (let page = 1; page <= pagesToFetch; page++) {
        const pageChats = await fetchZapiChats(cfg, page, chatsPageSize);
        allChats.push(...pageChats);
        if (pageChats.length < chatsPageSize) break;
      }
      if (allChats.length === 0) {
        const retry = await fetchZapiChats(cfg, 1, chatsPageSize);
        if (retry.length > 0) allChats.push(...retry);
      }
      chats = allChats.slice(0, maxChats);
    }
    for (const chat of chats) {
      if (!chat.phone || chat.phone.length < 10) continue;
      const phoneE164 = formatPhoneNumber(chat.phone.startsWith('55') ? chat.phone : `55${chat.phone}`);
      let messages: ZapiChatMessage[];
      try {
        messages = await fetchZapiChatMessages(cfg, chat.phone, messagesPerChat);
      } catch (err) {
        console.warn('[zapi-sync] Erro ao buscar mensagens do chat', chat.phone, err);
        continue;
      }
      conversationsProcessed += 1;

      for (const msg of messages) {
        const messageId = msg.messageId ? String(msg.messageId) : null;
        const fromMe = !!msg.fromMe;
        const text = extractTextFromZapiMessage(msg);
        const momment = typeof msg.momment === 'number' ? msg.momment : Date.now();
        const createdAt = new Date(momment);

        if (fromMe) {
          // Mensagem enviada pelo sistema (CannabiLize) → WhatsAppMessage
          if (!messageId) continue;
          const existing = await prisma.whatsAppMessage.findFirst({
            where: { providerMessageId: messageId },
          });
          if (existing) continue;
          await prisma.whatsAppMessage.create({
            data: {
              to: phoneE164,
              message: text,
              status: 'SENT',
              provider: 'ZAPI',
              providerMessageId: messageId,
              sentAt: createdAt,
              createdAt,
            },
          });
          messagesInserted += 1;
        } else {
          // Mensagem recebida do paciente → WhatsAppWebhookLog (para o monitor)
          if (messageId) {
            const existing = await prisma.whatsAppWebhookLog.findFirst({
              where: { externalId: messageId },
            });
            if (existing) continue;
          }
          await prisma.whatsAppWebhookLog.create({
            data: {
              type: 'ReceivedCallback',
              phone: phoneE164,
              fromMe: false,
              hasText: !!text?.trim(),
              result: 'processed',
              detail: 'Sincronizado da Z-API (mensagem recebida enquanto o sistema estava offline)',
              messageText: text?.slice(0, 4000) ?? null,
              payloadPreview: JSON.stringify({ messageId, fromMe: false, text: text?.slice(0, 500) }).slice(0, 3500),
              externalId: messageId ?? null,
              createdAt,
            },
          });
          logsInserted += 1;
        }
      }
    }

    let warning: string | undefined;
    if (conversationsProcessed > 0 && logsInserted === 0 && messagesInserted === 0) {
      warning =
        'A Z-API não permite buscar histórico de mensagens em contas multi-dispositivo. As conversas no monitor vêm apenas do webhook em tempo real (mensagens que chegam com o sistema ligado).';
    } else if (conversationsProcessed === 0 && logsInserted === 0 && messagesInserted === 0) {
      warning =
        'A Z-API retornou 0 conversas. Verifique em Admin > WhatsApp: Instance ID, Token e Client-Token (Segurança no painel Z-API). Confirme também que a instância está conectada no painel da Z-API.';
    }

    return {
      success: true,
      conversationsProcessed,
      logsInserted,
      messagesInserted,
      warning,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[zapi-sync] Erro:', err);
    return {
      success: false,
      conversationsProcessed,
      logsInserted,
      messagesInserted,
      error: message,
    };
  }
}
