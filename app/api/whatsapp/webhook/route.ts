import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, formatPhoneNumber } from '@/lib/whatsapp';
import { getWhatsAppWelcomeMessage, getWhatsAppNextStepsMessage, getWhatsAppAgentPhones } from '@/lib/capture-funnel';
import { getLastPatientMessages, formatConversationContext } from '@/lib/whatsapp-conversation-context';
import { processIncomingMessage } from '@/lib/whatsapp-capture-flow';
import {
  getMetaMediaUrl,
  downloadMetaMedia,
  bufferToDataUrl,
  defaultFileName,
  metaMessageTypeToFileType,
} from '@/lib/whatsapp-media';

// Importação dinâmica do twilio para evitar problemas de build (usado só para Twilio)
const twilio = typeof globalThis.window === 'undefined' ? require('twilio') : null;

/**
 * GET - Validação do webhook.
 * - Meta (WhatsApp Cloud API): hub.mode=subscribe, hub.verify_token, hub.challenge → retorna hub.challenge em texto.
 * - Twilio: não usa GET para verificação; retorna JSON informativo.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hubMode = searchParams.get('hub.mode');
  const hubVerifyToken = searchParams.get('hub.verify_token');
  const hubChallenge = searchParams.get('hub.challenge');

  // Meta: verificação do webhook (Configuração no Meta for Developers)
  if (hubMode === 'subscribe' && hubChallenge != null) {
    const config = await prisma.whatsAppConfig.findUnique({
      where: { provider: 'META' },
    });
    const verifyToken = config?.webhookSecret?.trim() || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (verifyToken && hubVerifyToken === verifyToken) {
      return new NextResponse(hubChallenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    console.warn('[WhatsApp Webhook] Meta: verify_token não confere ou não configurado.');
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.json({ message: 'WhatsApp Webhook endpoint' });
}

/**
 * POST - Eventos do webhook.
 * - Meta (WhatsApp Cloud API): body JSON com object "whatsapp_business_account", entry[].changes[].value (messages, statuses).
 * - Twilio: body form-data com Body, From, MessageSid, MessageStatus.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  try {
    // Meta Cloud API envia JSON
    if (contentType.includes('application/json')) {
      return await handleMetaWebhook(request);
    }

    // Twilio envia form-data
    return await handleTwilioWebhook(request);
  } catch (error) {
    console.error('Erro no webhook do WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

/** Payload da Meta: entry[].changes[].value com messages ou statuses */
async function handleMetaWebhook(request: NextRequest) {
  const body = await request.json();

  if (body?.object !== 'whatsapp_business_account') {
    console.log('[WhatsApp Webhook] Meta: object ignorado', body?.object);
    return NextResponse.json({ received: true });
  }

  const hasMessages = body.entry?.some((e: any) => e.changes?.some((c: any) => c.value?.messages?.length));
  if (hasMessages) {
    console.log('[WhatsApp Webhook] Meta: mensagem recebida, processando...');
  }

  const entries = body.entry as Array<{
    id: string;
    changes?: Array<{
      field: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; caption?: string; mime_type?: string };
          document?: { id: string; caption?: string; filename?: string; mime_type?: string };
          audio?: { id: string; mime_type?: string };
          video?: { id: string; caption?: string; mime_type?: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id?: string;
        }>;
      };
    }>;
  }> | undefined;

  if (!entries?.length) {
    return NextResponse.json({ received: true });
  }

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value || value.messaging_product !== 'whatsapp') continue;

      // Mensagens recebidas (incoming) — texto (fluxo de captação) ou mídia (armazenar)
      if (value.messages) {
        const metaConfig = await prisma.whatsAppConfig.findUnique({
          where: { provider: 'META' },
        });
        const metaToken = metaConfig?.enabled ? metaConfig.authToken : null;

        for (const msg of value.messages) {
          const phone = formatPhoneNumber(msg.from);

          // Mídia: imagem, documento, áudio, vídeo — baixar e salvar
          const mediaTypes = ['image', 'document', 'audio', 'video'] as const;
          if (mediaTypes.includes(msg.type as typeof mediaTypes[number])) {
            const mediaPayload =
              msg.type === 'image' ? msg.image
              : msg.type === 'document' ? msg.document
              : msg.type === 'audio' ? msg.audio
              : msg.video;
            const mediaId = mediaPayload?.id;
            if (metaToken && mediaId) {
              try {
                const urlResult = await getMetaMediaUrl(mediaId, metaToken);
                if ('error' in urlResult) {
                  console.error('[WhatsApp Webhook] Meta: mídia URL', urlResult.error);
                } else {
                  const downloadResult = await downloadMetaMedia(urlResult.url, metaToken);
                  if ('error' in downloadResult) {
                    console.error('[WhatsApp Webhook] Meta: download mídia', downloadResult.error);
                  } else {
                    const { fileType, mime } = metaMessageTypeToFileType(msg.type);
                    const mimeType = downloadResult.mimeType || mediaPayload?.mime_type || mime;
                    const fileUrl = bufferToDataUrl(downloadResult.buffer, mimeType);
                    const fileName = (mediaPayload && 'filename' in mediaPayload && mediaPayload.filename)
                      ? mediaPayload.filename
                      : defaultFileName(msg.type, mimeType);
                    const caption = (mediaPayload && 'caption' in mediaPayload && mediaPayload.caption)
                      ? (mediaPayload.caption ?? '').trim() || null
                      : null;
                    const patient = await prisma.user.findFirst({
                      where: { phone, role: 'PATIENT' },
                      select: { id: true },
                    });
                    const consultation = patient
                      ? await prisma.consultation.findFirst({
                          where: { patientId: patient.id, status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] } },
                          orderBy: { scheduledAt: 'asc' },
                          select: { id: true },
                        })
                      : null;
                    await prisma.whatsAppIncomingMedia.create({
                      data: {
                        phone,
                        fileName,
                        fileUrl,
                        fileType,
                        fileSize: downloadResult.buffer.length,
                        mimeType,
                        provider: 'META',
                        providerMediaId: mediaId,
                        caption,
                        patientId: patient?.id ?? null,
                        consultationId: consultation?.id ?? null,
                      },
                    });
                    console.log('[WhatsApp Webhook] Meta: mídia salva', fileType, fileName, 'de', phone);
                  }
                }
              } catch (e) {
                console.error('[WhatsApp Webhook] Meta: erro ao processar mídia', e);
              }
            }
            continue;
          }

          // Apenas texto segue o fluxo de captação
          if (msg.type !== 'text' || !msg.text?.body) continue;
          console.log('[WhatsApp Webhook] Meta: from recebido (raw)', msg.from);
          console.log('[WhatsApp Webhook] Meta: phone formatado', phone);
          const trimmedBody = msg.text.body.trim();

          // Normalizar número para comparação (só dígitos; Brasil: 55+DDD+9+8)
          const normalizePhoneDigits = (p: string | null): string => {
            if (!p) return '';
            let d = (p || '').replace(/\D/g, '').replace(/^0+/, '');
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
            const t = trimmedBody.trim().toLowerCase();
            let pendingLeads: { id: string; phone: string; name: string | null; agentPhone: string | null }[] = [];
            try {
              pendingLeads = await prisma.whatsAppLead.findMany({
                where: { flowState: 'HUMAN_PENDING_ACCEPT' },
                orderBy: { lastMessageAt: 'desc' },
                take: 10,
                select: { id: true, phone: true, name: true, agentPhone: true },
              });
            } catch (_) {}
            const pendingLead = pendingLeads.find((l) => l.agentPhone && normalizePhoneDigits(l.agentPhone) === senderDigits) ?? pendingLeads[0];
            if (pendingLead) {
              const isSim = /^sim$|^s$|^pode$|^aceito$/i.test(t);
              const isNao = /^n[aã]o$|^nao$|^n$|^não$/i.test(t);
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
                continue;
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
                continue;
              }
              await sendWhatsAppMessage({
                to: phone,
                message: 'Responda *SIM* ou *NÃO* para aceitar ou recusar o atendimento.',
              });
              continue;
            }
            let leadsInHuman: { id: string; phone: string; agentPhone: string | null }[] = [];
            try {
              leadsInHuman = await prisma.whatsAppLead.findMany({
                where: { flowState: 'HUMAN_REQUESTED', agentPhone: { not: null } },
                orderBy: { lastMessageAt: 'desc' },
                take: 20,
                select: { id: true, phone: true, agentPhone: true },
              });
            } catch (_) {}
            let lead = leadsInHuman.find((l) => l.agentPhone && normalizePhoneDigits(l.agentPhone) === senderDigits);
            if (!lead) {
              const anyHuman = await prisma.whatsAppLead.findFirst({
                where: { flowState: 'HUMAN_REQUESTED' },
                orderBy: { lastMessageAt: 'desc' },
                select: { id: true, phone: true, agentPhone: true },
              }).catch(() => null);
              if (anyHuman) lead = anyHuman;
            }
            if (lead) {
              if (trimmedBody.trim().toUpperCase() === 'ENCERRAR') {
                await prisma.whatsAppLead.update({
                  where: { id: lead.id },
                  data: { flowState: 'ASK_NAME', agentPhone: null, lastMessageAt: new Date() },
                });
                await sendWhatsAppMessage({
                  to: lead.phone,
                  message: 'O atendimento humano foi encerrado. Para continuar, digite seu *nome completo* ou envie *reiniciar*. 💚',
                });
                await sendWhatsAppMessage({ to: phone, message: 'Atendimento encerrado.' });
                continue;
              }
              const sendResult = await sendWhatsAppMessage({ to: lead.phone, message: trimmedBody });
              if (sendResult.success) console.log('[WhatsApp Webhook] Meta: resposta do atendente reenviada ao paciente', lead.phone);
              else console.error('[WhatsApp Webhook] Meta: falha ao reenviar ao paciente:', sendResult.error);
              continue;
            }
            continue;
          }

          try {
            await prisma.whatsAppWebhookLog.create({
              data: {
                type: 'META_INCOMING',
                phone,
                fromMe: false,
                hasText: true,
                result: 'processed',
                detail: 'Mensagem recebida (Meta)',
                messageText: trimmedBody.slice(0, 4000),
                payloadPreview: null,
              },
            }).catch(() => {});
            const origin = typeof request.url === 'string' ? new URL(request.url).origin : undefined;
            const { messagesToSend } = await processIncomingMessage(phone, trimmedBody, {
              getWelcomeMessage: getWhatsAppWelcomeMessage,
              getNextStepsMessage: getWhatsAppNextStepsMessage,
              origin,
            });
            console.log('[WhatsApp Webhook] Meta: respostas a enviar:', messagesToSend.length, 'para', phone);
            const singleMessage = messagesToSend.filter(Boolean).join('\n\n');
            const result = await sendWhatsAppMessage({ to: phone, message: singleMessage });
            if (result.success) {
              console.log('[WhatsApp Webhook] Meta: resposta única enviada (', messagesToSend.length, 'blocos)');
            } else {
              console.error('[WhatsApp Webhook] Meta: falha ao enviar', result.error);
            }
          } catch (e) {
            console.error('[WhatsApp Webhook] Meta: erro no fluxo', e);
            const fallbackMessage =
              'Desculpe, tivemos um problema técnico no momento. Por favor, envie *reiniciar* para recomeçar o cadastro ou aguarde nosso contato. 💚';
            try {
              await sendWhatsAppMessage({ to: phone, message: fallbackMessage });
            } catch (sendErr) {
              console.error('[WhatsApp Webhook] Meta: falha ao enviar mensagem de erro ao paciente', sendErr);
            }
          }
        }
      }

      // Status de mensagens enviadas (outgoing)
      if (value.statuses) {
        for (const st of value.statuses) {
          const dbMessage = await prisma.whatsAppMessage.findFirst({
            where: { providerMessageId: st.id },
          });
          if (!dbMessage) continue;

          const status = st.status.toUpperCase();
          const updateData: Record<string, unknown> = { status };
          if (status === 'DELIVERED') (updateData as any).deliveredAt = new Date();
          if (status === 'SENT') (updateData as any).sentAt = new Date();
          if (status === 'READ') {
            (updateData as any).readAt = new Date();
            (updateData as any).status = 'READ';
          }

          await prisma.whatsAppMessage.update({
            where: { id: dbMessage.id },
            data: updateData,
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

/** Webhook Twilio: form-data com Body, From, MessageSid, MessageStatus */
async function handleTwilioWebhook(request: NextRequest) {
  const body = await request.formData();
  const messageSid = body.get('MessageSid') as string | null;
  const messageStatus = body.get('MessageStatus') as string | null;
  const bodyText = body.get('Body') as string | null;
  const from = body.get('From') as string | null;

  console.log('[WhatsApp Webhook] Twilio POST', {
    from: from ?? '(vazio)',
    bodyPreview: bodyText ? `${String(bodyText).slice(0, 60)}...` : '(vazio)',
    messageStatus: messageStatus ?? '(não é status)',
  });

  const signature = request.headers.get('x-twilio-signature');
  const baseUrl = process.env.TWILIO_WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL;
  const path = new URL(request.url).pathname;
  const url = baseUrl ? `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}${path}` : request.url;

  const config = await prisma.whatsAppConfig.findUnique({
    where: { provider: 'TWILIO' },
  });

  if (config?.webhookSecret && signature && twilio) {
    try {
      const params = Object.fromEntries(body.entries());
      const isValid = twilio.validateRequest(config.webhookSecret, signature, url, params);
      if (!isValid) {
        console.warn('[WhatsApp Webhook] Twilio: assinatura inválida.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    } catch (validationError) {
      console.error('[WhatsApp Webhook] Twilio: erro ao validar assinatura', validationError);
      return NextResponse.json({ error: 'Validation error' }, { status: 403 });
    }
  }

  if (bodyText != null && bodyText.trim() !== '' && from) {
    const phone = formatPhoneNumber(from.replace(/^whatsapp:/i, ''));
    const trimmedBody = bodyText.trim();

    await prisma.whatsAppWebhookLog.create({
      data: {
        type: 'TWILIO_INCOMING',
        phone,
        fromMe: false,
        hasText: true,
        result: 'processed',
        detail: 'Mensagem recebida (Twilio)',
        messageText: trimmedBody.slice(0, 4000),
        payloadPreview: null,
      },
    }).catch(() => {});

    const normalizePhoneDigits = (p: string | null): string => {
      if (!p) return '';
      let d = (p || '').replace(/\D/g, '').replace(/^0+/, '');
      if (!d.startsWith('55') && d.length >= 10) d = `55${d}`;
      if (d.startsWith('55') && d.length === 12) {
        const m = d.match(/^55(\d{2})(\d{8})$/);
        if (m) d = `55${m[1]}9${m[2]}`;
      }
      return d;
    };
    // Resposta do atendente humano: aceitar/recusar/encerrar ou reenviar ao paciente
    const agentPhones = await getWhatsAppAgentPhones();
    const senderDigits = normalizePhoneDigits(phone);
    const configuredDigitsSet = new Set(agentPhones.map((p) => normalizePhoneDigits(p)));
    const isAgentReply = senderDigits.length >= 10 && configuredDigitsSet.has(senderDigits);
    if (isAgentReply) {
      const t = trimmedBody.trim().toLowerCase();
      let pendingLeads: { id: string; phone: string; name: string | null; agentPhone: string | null }[] = [];
      try {
        pendingLeads = await prisma.whatsAppLead.findMany({
          where: { flowState: 'HUMAN_PENDING_ACCEPT' },
          orderBy: { lastMessageAt: 'desc' },
          take: 10,
          select: { id: true, phone: true, name: true, agentPhone: true },
        });
      } catch (_) {}
      const pendingLead = pendingLeads.find((l) => l.agentPhone && normalizePhoneDigits(l.agentPhone) === senderDigits) ?? pendingLeads[0];
      if (pendingLead) {
        const isSim = /^sim$|^s$|^pode$|^aceito$/i.test(t);
        const isNao = /^n[aã]o$|^nao$|^n$|^não$/i.test(t);
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
          return NextResponse.json({ received: true });
        }
        await sendWhatsAppMessage({
          to: phone,
          message: 'Responda *SIM* ou *NÃO* para aceitar ou recusar o atendimento.',
        });
        return NextResponse.json({ received: true });
      }
      let leadsInHuman: { id: string; phone: string; agentPhone: string | null }[] = [];
      try {
        leadsInHuman = await prisma.whatsAppLead.findMany({
          where: { flowState: 'HUMAN_REQUESTED', agentPhone: { not: null } },
          orderBy: { lastMessageAt: 'desc' },
          take: 20,
          select: { id: true, phone: true, agentPhone: true },
        });
      } catch (_) {}
      let lead = leadsInHuman.find((l) => l.agentPhone && normalizePhoneDigits(l.agentPhone) === senderDigits);
      if (!lead) {
        const anyHuman = await prisma.whatsAppLead.findFirst({
          where: { flowState: 'HUMAN_REQUESTED' },
          orderBy: { lastMessageAt: 'desc' },
          select: { id: true, phone: true, agentPhone: true },
        }).catch(() => null);
        if (anyHuman) lead = anyHuman;
      }
      if (lead) {
        if (trimmedBody.trim().toUpperCase() === 'ENCERRAR') {
          await prisma.whatsAppLead.update({
            where: { id: lead.id },
            data: { flowState: 'ASK_NAME', agentPhone: null, lastMessageAt: new Date() },
          });
          await sendWhatsAppMessage({
            to: lead.phone,
            message: 'O atendimento humano foi encerrado. Para continuar, digite seu *nome completo* ou envie *reiniciar*. 💚',
          });
          await sendWhatsAppMessage({ to: phone, message: 'Atendimento encerrado.' });
          return NextResponse.json({ received: true });
        }
        const sendResult = await sendWhatsAppMessage({ to: lead.phone, message: trimmedBody });
        if (sendResult.success) console.log('[WhatsApp Webhook] Twilio: resposta do atendente reenviada ao paciente', lead.phone);
        else console.error('[WhatsApp Webhook] Twilio: falha ao reenviar ao paciente:', sendResult.error);
      }
      return NextResponse.json({ received: true });
    }

    try {
      const { messagesToSend } = await processIncomingMessage(phone, trimmedBody, {
        getWelcomeMessage: getWhatsAppWelcomeMessage,
        getNextStepsMessage: getWhatsAppNextStepsMessage,
      });
      for (const m of messagesToSend) {
        if (m) await sendWhatsAppMessage({ to: phone, message: m });
      }
    } catch (e) {
      console.error('[WhatsApp Webhook] Twilio: erro no fluxo', e);
    }
    return NextResponse.json({ received: true });
  }

  if (messageStatus && messageSid) {
    const dbMessage = await prisma.whatsAppMessage.findFirst({
      where: { providerMessageId: messageSid },
    });
    if (dbMessage) {
      const updateData: Record<string, unknown> = { status: messageStatus.toUpperCase() };
      if (messageStatus === 'delivered') (updateData as any).deliveredAt = new Date();
      if (messageStatus === 'sent') (updateData as any).sentAt = new Date();
      if (messageStatus === 'read') {
        (updateData as any).readAt = new Date();
        (updateData as any).status = 'READ';
      }
      if (messageStatus === 'failed' || messageStatus === 'undelivered') {
        (updateData as any).status = 'FAILED';
        (updateData as any).error = `Status: ${messageStatus}`;
      }
      await prisma.whatsAppMessage.update({
        where: { id: dbMessage.id },
        data: updateData,
      });
    }
  }

  return NextResponse.json({ received: true });
}
