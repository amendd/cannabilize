/**
 * Webhook Z-API (z-api.io) - "Ao receber"
 * O painel Z-API envia POST para esta URL quando alguém envia mensagem no WhatsApp.
 * Configure no painel: Webhooks e configurações gerais → "Ao receber" = https://SEU-DOMINIO.com/api/whatsapp/zapi-webhook
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, formatPhoneNumber } from '@/lib/whatsapp';
import { getWhatsAppWelcomeMessage, getWhatsAppNextStepsMessage, getWhatsAppAgentPhones } from '@/lib/capture-funnel';
import { getLastPatientMessages, formatConversationContext } from '@/lib/whatsapp-conversation-context';
import { processIncomingMessage } from '@/lib/whatsapp-capture-flow';

/** Payload Z-API "Ao receber": type ReceivedCallback, phone, text.message, fromMe, etc. (doc: developer.z-api.io webhooks on-message-received) */
interface ZapiReceivedPayload {
  type?: string;
  phone?: string;
  participantPhone?: string | null;
  fromMe?: boolean;
  isGroup?: boolean;
  text?: { message?: string };
  hydratedTemplate?: { message?: string };
  buttonsResponseMessage?: { message?: string; buttonId?: string };
  listResponseMessage?: { message?: string; title?: string; selectedRowId?: string };
  image?: { caption?: string };
  messageId?: string;
  [key: string]: unknown;
}

/** Extrai todo o texto da mensagem (Z-API): texto, template com header/body/footer, botão, lista, legenda, etc. */
function extractTextFromZapiPayload(body: ZapiReceivedPayload): string {
  const candidates: string[] = [
    body?.text?.message,
    body?.buttonsResponseMessage?.message,
    body?.listResponseMessage?.message,
    body?.image?.caption,
    typeof (body as Record<string, unknown>)?.body === 'string' ? (body as Record<string, unknown>).body : null,
    typeof (body as Record<string, unknown>)?.message === 'string' ? (body as Record<string, unknown>).message : null,
    typeof (body as Record<string, unknown>)?.content === 'string' ? (body as Record<string, unknown>).content : null,
    typeof (body as Record<string, unknown>)?.caption === 'string' ? (body as Record<string, unknown>).caption : null,
  ].filter(Boolean) as string[];

  const ht = body?.hydratedTemplate as Record<string, unknown> | undefined;
  if (ht && typeof ht === 'object') {
    if (typeof ht.message === 'string' && ht.message.trim()) candidates.push(ht.message.trim());
    if (typeof ht.header === 'string' && ht.header.trim()) candidates.push(ht.header.trim());
    if (typeof ht.body === 'string' && ht.body.trim()) candidates.push(ht.body.trim());
    if (typeof ht.footer === 'string' && ht.footer.trim()) candidates.push(ht.footer.trim());
    if (typeof ht.text === 'string' && ht.text.trim()) candidates.push(ht.text.trim());
  } else if (typeof body?.hydratedTemplate === 'object' && body.hydratedTemplate && 'message' in body.hydratedTemplate && typeof (body.hydratedTemplate as { message?: string }).message === 'string') {
    candidates.push((body.hydratedTemplate as { message: string }).message.trim());
  }

  const joined = candidates.map((s) => String(s).trim()).filter(Boolean).join('\n').trim();
  return joined || '';
}

/** Últimas chamadas ao webhook (em memória) para GET ?logs=1 */
const MAX_LOG_ENTRIES = 30;
type WebhookLogEntry = {
  at: string;
  type: string;
  phone: string | null;
  fromMe: boolean;
  hasText: boolean;
  result: 'ignored' | 'processed' | 'error';
  detail: string;
  messageText?: string | null;
  payloadPreview: string;
  externalId?: string | null;
};
const webhookLogs: WebhookLogEntry[] = [];

/** Persiste log no banco para a página de monitoramento no admin. Se falhar (ex: coluna ausente), tenta sem messageText. */
async function persistWebhookLog(entry: Omit<WebhookLogEntry, 'at'>) {
  const dataWithText = {
    type: entry.type,
    phone: entry.phone,
    fromMe: entry.fromMe,
    hasText: entry.hasText,
    result: entry.result,
    detail: entry.detail,
    messageText: entry.messageText?.slice(0, 4000) ?? null,
    payloadPreview: entry.payloadPreview?.slice(0, 3500) ?? null,
    externalId: entry.externalId ?? null,
  };
  try {
    await prisma.whatsAppWebhookLog.create({ data: dataWithText });
  } catch (err) {
    console.warn('[WhatsApp Z-API Webhook] Falha ao salvar log (tentando sem messageText):', err);
    try {
      await prisma.whatsAppWebhookLog.create({
        data: {
          type: dataWithText.type,
          phone: dataWithText.phone,
          fromMe: dataWithText.fromMe,
          hasText: dataWithText.hasText,
          result: dataWithText.result,
          detail: dataWithText.detail,
          payloadPreview: dataWithText.payloadPreview,
          externalId: dataWithText.externalId,
        },
      });
    } catch (err2) {
      console.error('[WhatsApp Z-API Webhook] Falha definitiva ao salvar log:', err2);
    }
  }
}

function addLog(entry: Omit<WebhookLogEntry, 'at'>) {
  const withAt = { ...entry, at: new Date().toISOString() };
  webhookLogs.unshift(withAt);
  if (webhookLogs.length > MAX_LOG_ENTRIES) webhookLogs.pop();
  persistWebhookLog(entry);
}

export async function POST(request: NextRequest) {
  let body: ZapiReceivedPayload;
  try {
    const raw = await request.json();
    // Z-API pode enviar payload aninhado em "data" ou "payload"
    if (raw && typeof raw === 'object' && (raw.data || raw.payload)) {
      body = (raw.data ?? raw.payload) as ZapiReceivedPayload;
    } else {
      body = (raw ?? {}) as ZapiReceivedPayload;
    }
  } catch (e) {
    console.warn('[WhatsApp Z-API Webhook] Body inválido ou não-JSON:', e);
    addLog({ type: '(erro)', phone: null, fromMe: false, hasText: false, result: 'error', detail: 'Body inválido ou não-JSON', payloadPreview: '' });
    return NextResponse.json({ received: true });
  }

  if (!body || typeof body !== 'object') {
    console.warn('[WhatsApp Z-API Webhook] Body vazio ou não é objeto.');
    return NextResponse.json({ received: true });
  }

  // Preview do payload para o monitor (schema payload_preview até 3500)
  const bodyPreview = JSON.stringify(body).slice(0, 3500);
  console.log('[WhatsApp Z-API Webhook] POST recebido. Body (preview):', bodyPreview + (JSON.stringify(body).length > 500 ? '...' : ''));

  const type = body?.type ?? '(vazio)';
  const rawPhone = body?.isGroup ? body?.participantPhone : body?.phone;
  const text = extractTextFromZapiPayload(body);
  const hasText = !!text?.trim();
  console.log('[WhatsApp Z-API Webhook] Extraído:', { type, phone: rawPhone, fromMe: body?.fromMe, hasText });

  // Aceitar tipo ReceivedCallback ou qualquer payload que tenha phone + texto (algumas versões podem enviar type diferente)
  const isReceivedCallback =
    type === 'ReceivedCallback' ||
    type === 'received-callback' ||
    (!!rawPhone && hasText);

  if (!isReceivedCallback) {
    const detail = `Ignorado: type=${type} phone=${rawPhone ?? 'vazio'} hasText=${hasText}`;
    console.log('[WhatsApp Z-API Webhook]', detail);
    addLog({ type, phone: rawPhone ?? null, fromMe: !!body?.fromMe, hasText, result: 'ignored', detail, payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json({ received: true });
  }

  if (body.fromMe) {
    console.log('[WhatsApp Z-API Webhook] Ignorado: mensagem fromMe (enviada por você).');
    addLog({ type, phone: rawPhone ?? null, fromMe: true, hasText, result: 'ignored', detail: 'Mensagem fromMe (enviada por você)', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json({ received: true });
  }

  if (!rawPhone || typeof rawPhone !== 'string') {
    console.log('[WhatsApp Z-API Webhook] Sem phone/participantPhone, ignorando.');
    addLog({ type, phone: null, fromMe: false, hasText, result: 'ignored', detail: 'Sem phone/participantPhone', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json({ received: true });
  }

  if (!text) {
    console.log('[WhatsApp Z-API Webhook] Sem texto na mensagem (reação/áudio/outro tipo sem texto extraído), ignorando.');
    addLog({ type, phone: rawPhone, fromMe: false, hasText: false, result: 'ignored', detail: 'Sem texto extraído (reação/áudio/outro)', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json({ received: true });
  }

  const digits = rawPhone.replace(/\D/g, '').replace(/^0/, '');
  const phone = formatPhoneNumber(digits.startsWith('55') ? digits : `55${digits}`);
  if (!phone) {
    console.log('[WhatsApp Z-API Webhook] Phone inválido após formatação.');
    addLog({ type, phone: rawPhone, fromMe: false, hasText, result: 'ignored', detail: 'Phone inválido após formatação', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json({ received: true });
  }

  let zapiConfig: { enabled: boolean | null } | null = null;
  try {
    zapiConfig = await prisma.whatsAppConfig.findUnique({
      where: { provider: 'ZAPI' },
    });
  } catch (dbErr) {
    console.error('[WhatsApp Z-API Webhook] Erro ao buscar config Z-API:', dbErr);
    addLog({ type, phone: rawPhone, fromMe: false, hasText, result: 'error', detail: 'Erro ao buscar configuração no banco', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json({ received: true }); // 200 para Z-API não ficar reenviando
  }
  if (!zapiConfig?.enabled) {
    console.log('[WhatsApp Z-API Webhook] Z-API desabilitado, ignorando.');
    addLog({ type, phone: rawPhone ?? null, fromMe: false, hasText, result: 'ignored', detail: 'Z-API desabilitado no Admin', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json({ received: true });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const baseUrl = origin ? origin.replace(/\/$/, '') : undefined;

  // Normalizar número para comparação (só dígitos; Brasil: 55+DDD+9+8 = 13 dígitos)
  const normalizePhoneDigits = (p: string | null): string => {
    if (!p) return '';
    let d = p.replace(/\D/g, '').replace(/^0+/, '');
    if (!d.startsWith('55') && d.length >= 10) d = `55${d}`;
    if (d.startsWith('55') && d.length === 12) {
      const m = d.match(/^55(\d{2})(\d{8})$/);
      if (m) d = `55${m[1]}9${m[2]}`;
    }
    return d;
  };

  // Resposta do atendente humano (lista de números): aceitar/recusar/encerrar ou reenviar ao paciente
  const agentPhones = await getWhatsAppAgentPhones();
  const senderDigits = normalizePhoneDigits(phone);
  const configuredDigitsSet = new Set(agentPhones.map((p) => normalizePhoneDigits(p)));
  const isAgentReply = senderDigits.length >= 10 && configuredDigitsSet.has(senderDigits);

  if (isAgentReply) {
    const trimmedText = (text || '').trim().toLowerCase();

    // 1) Lead aguardando aceite (atendente deve responder SIM ou NÃO)
    let pendingLeads: { id: string; phone: string; name: string | null; agentPhone: string | null }[] = [];
    try {
      pendingLeads = await prisma.whatsAppLead.findMany({
        where: { flowState: 'HUMAN_PENDING_ACCEPT' },
        orderBy: { lastMessageAt: 'desc' },
        take: 10,
        select: { id: true, phone: true, name: true, agentPhone: true },
      });
    } catch (_) {}
    const pendingLead = pendingLeads.find(
      (l) => l.agentPhone && normalizePhoneDigits(l.agentPhone) === senderDigits
    ) ?? pendingLeads[0]; // fallback: mais recente (qualquer atendente pode aceitar)

    if (pendingLead) {
      const isSim = /^sim$|^s$|^pode$|^aceito$/i.test(trimmedText);
      const isNao = /^n[aã]o$|^nao$|^n$|^não$/i.test(trimmedText);

      if (isSim) {
        await prisma.whatsAppLead.update({
          where: { id: pendingLead.id },
          data: { flowState: 'HUMAN_REQUESTED', agentPhone: phone, lastMessageAt: new Date() },
        });
        await sendWhatsAppMessage({
          to: pendingLead.phone,
          message: 'Um atendente está te atendendo agora. Pode enviar suas mensagens. 💚',
        });
        const lastMessages = await getLastPatientMessages(pendingLead.phone, 10);
        const contextText = formatConversationContext(lastMessages);
        if (contextText) {
          await sendWhatsAppMessage({ to: phone, message: contextText });
        }
        const label = pendingLead.name ? `${pendingLead.name} (${pendingLead.phone})` : pendingLead.phone;
        await sendWhatsAppMessage({
          to: phone,
          message: `Agora você está atendendo o paciente ${label}. Responda *neste chat* para que sua resposta seja enviada ao paciente.`,
        });
        console.log('[WhatsApp Z-API Webhook] Atendente aceitou; paciente avisado', pendingLead.phone);
        addLog({ type, phone, fromMe: false, hasText, result: 'processed', detail: 'Atendente aceitou → paciente avisado', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
        return NextResponse.json({ received: true });
      }

      if (isNao) {
        await prisma.whatsAppLead.update({
          where: { id: pendingLead.id },
          data: { flowState: 'ASK_NAME', agentPhone: null, lastMessageAt: new Date() },
        });
        await sendWhatsAppMessage({
          to: pendingLead.phone,
          message: 'Para atendimento humano, por favor aguarde. Em breve alguém irá te atender. 💚',
        });
        console.log('[WhatsApp Z-API Webhook] Atendente recusou; paciente avisado para aguardar', pendingLead.phone);
        addLog({ type, phone, fromMe: false, hasText, result: 'processed', detail: 'Atendente recusou → paciente aguardar', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
        return NextResponse.json({ received: true });
      }

      await sendWhatsAppMessage({
        to: phone,
        message: 'Responda *SIM* ou *NÃO* para aceitar ou recusar o atendimento.',
      });
      return NextResponse.json({ received: true });
    }

    // 2) Lead já em atendimento humano: comando ENCERRAR ou reenviar mensagem ao paciente
    let leadsInHuman = await prisma.whatsAppLead.findMany({
      where: { flowState: 'HUMAN_REQUESTED', agentPhone: { not: null } },
      orderBy: { lastMessageAt: 'desc' },
      take: 20,
    }).catch(() => [] as { id: string; phone: string; agentPhone: string | null; lastMessageAt: Date | null }[]);
    let lead = leadsInHuman.find((l) => l.agentPhone && normalizePhoneDigits(l.agentPhone) === senderDigits);
    if (!lead) {
      const anyHuman = await prisma.whatsAppLead.findFirst({
        where: { flowState: 'HUMAN_REQUESTED' },
        orderBy: { lastMessageAt: 'desc' },
      }).catch(() => null);
      if (anyHuman) lead = anyHuman;
    }
    if (lead) {
      if ((text || '').trim().toUpperCase() === 'ENCERRAR') {
        await prisma.whatsAppLead.update({
          where: { id: lead.id },
          data: { flowState: 'ASK_NAME', agentPhone: null, lastMessageAt: new Date() },
        });
        await sendWhatsAppMessage({
          to: lead.phone,
          message: 'O atendimento humano foi encerrado. Para continuar, digite seu *nome completo* ou envie *reiniciar*. 💚',
        });
        await sendWhatsAppMessage({ to: phone, message: 'Atendimento encerrado.' });
        console.log('[WhatsApp Z-API Webhook] Atendente encerrou atendimento', lead.phone);
        addLog({ type, phone, fromMe: false, hasText, result: 'processed', detail: 'Atendente encerrou', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
        return NextResponse.json({ received: true });
      }
      const sendResult = await sendWhatsAppMessage({ to: lead.phone, message: text });
      if (sendResult.success) {
        console.log('[WhatsApp Z-API Webhook] Resposta do atendente reenviada ao paciente', lead.phone);
        addLog({ type, phone, fromMe: false, hasText, result: 'processed', detail: 'Resposta atendente → paciente', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
      } else {
        console.error('[WhatsApp Z-API Webhook] Falha ao reenviar ao paciente:', sendResult.error);
        addLog({ type, phone, fromMe: false, hasText, result: 'error', detail: `Reenvio falhou: ${sendResult.error}`, payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
      }
      return NextResponse.json({ received: true });
    }

    // Atendente não está em nenhuma conversa ativa → tratar como fluxo normal de paciente (ex.: "boa noite" recebe welcome/next steps)
    console.log('[WhatsApp Z-API Webhook] Atendente sem conversa ativa; tratando como fluxo normal de paciente.');
  }

  // Robô pausado para este número: não enviar respostas automáticas (admin pausou pelo monitor)
  const existingLead = await prisma.whatsAppLead.findFirst({
    where: {
      OR: [
        { phone: { contains: phone.replace(/\D/g, '') } },
        { phone },
      ],
    },
    select: { id: true, robotPaused: true },
  }).catch(() => null);
  if (existingLead?.robotPaused) {
    console.log('[WhatsApp Z-API Webhook] Robô pausado para', phone, '— sem resposta automática.');
    addLog({ type, phone, fromMe: false, hasText, result: 'ignored', detail: 'Robô pausado — sem resposta automática', payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json({ received: true });
  }

  try {
    const { messagesToSend, pendingFollowUp, responseSource } = await processIncomingMessage(phone, text, {
      getWelcomeMessage: getWhatsAppWelcomeMessage,
      getNextStepsMessage: getWhatsAppNextStepsMessage,
      origin: baseUrl,
    });

    let sent = 0;
    for (const m of messagesToSend) {
      if (m) {
        const result = await sendWhatsAppMessage({ to: phone, message: m });
        if (result.success) sent++;
        else console.error('[WhatsApp Z-API Webhook] Falha ao enviar:', result.error);
      }
    }
    // Mensagem de retorno ao fluxo agendada para ~10s depois (cron envia); updateMany evita 500 se o lead não existir (race/edge case)
    if (pendingFollowUp) {
      try {
        await prisma.whatsAppLead.updateMany({
          where: { phone },
          data: {
            pendingFollowUpMessage: pendingFollowUp.message,
            pendingFollowUpSendAt: pendingFollowUp.sendAt,
          },
        });
      } catch (updateErr) {
        console.warn('[WhatsApp Z-API Webhook] Falha ao salvar follow-up (lead pode não existir):', updateErr);
      }
    }
    const sourceLabel = responseSource === 'faq' ? 'FAQ' : responseSource === 'ai' ? 'IA' : responseSource === 'fallback' ? 'fallback (IA indisponível)' : 'fluxo';
    const summary = `Processado: ${sent}/${messagesToSend.length} mensagens enviadas${pendingFollowUp ? ' (follow-up agendado 10s)' : ''}`;
    console.log('[WhatsApp Z-API Webhook]', summary, '| Resposta:', sourceLabel);
    const detail = `${summary} — Resposta: ${sourceLabel}`;
    addLog({ type, phone, fromMe: false, hasText, result: 'processed', detail, messageText: text, payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[WhatsApp Z-API Webhook] Erro ao processar/enviar:', msg);
    if (stack) console.error('[WhatsApp Z-API Webhook] Stack:', stack);
    const detail = (text?.trim() || msg).slice(0, 4000);
    addLog({ type, phone, fromMe: false, hasText, result: 'error', detail, messageText: text, payloadPreview: bodyPreview, externalId: body?.messageId ?? null });
    return NextResponse.json(
      { error: 'Erro ao processar webhook', message: msg },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

/** GET - Testar se a URL está ativa; com ?logs=1 ou ?debug=1 retorna as últimas chamadas ao webhook. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (url.searchParams.get('logs') === '1' || url.searchParams.get('debug') === '1') {
    return NextResponse.json({
      ok: true,
      message: 'Últimas chamadas ao webhook Z-API (em memória). Envie uma mensagem e atualize a página.',
      total: webhookLogs.length,
      logs: webhookLogs,
    });
  }
  return NextResponse.json({
    ok: true,
    message: 'Webhook Z-API (Ao receber) está ativo. Use POST para mensagens. Para ver logs: ?logs=1',
    endpoint: '/api/whatsapp/zapi-webhook',
  });
}
