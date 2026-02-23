// Integração com WhatsApp: Twilio ou Meta (WhatsApp Cloud API)
import { prisma } from './prisma';

const twilio = typeof window === 'undefined' ? require('twilio') : null;

const META_GRAPH_VERSION = 'v21.0';

export interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  parameters?: string[];
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Formata número de telefone para E.164 (formato internacional).
 * - Se já vier com + (ex: +5511999999999 ou +14155238886), preserva o código do país.
 * - Sem +, assume Brasil e adiciona 55 (ex: 11999999999 → +5511999999999).
 */
export function formatPhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  let cleaned = phone.replace(/\D/g, '');

  // Remove zero à esquerda (formato antigo BR)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Brasil (55): Meta/outros podem enviar 11 ou 12 dígitos (falta o 9 do celular). Correto: 55 + DDD(2) + 9 + 8 = 13 dígitos.
  if (cleaned.startsWith('55')) {
    if (cleaned.length === 11) {
      const match = cleaned.match(/^55(\d{2})(\d{8})$/);
      if (match) cleaned = `55${match[1]}9${match[2]}`;
    } else if (cleaned.length === 12) {
      // Ex: 557991269833 → 55 + 79 + 91269833 (8 dígitos). Inserir 9 após DDD: 5579991269833.
      const match = cleaned.match(/^55(\d{2})(\d{8})$/);
      if (match) cleaned = `55${match[1]}9${match[2]}`;
    }
  }

  // Já veio com + → manter formato internacional
  if (hasPlus && cleaned.length >= 10) {
    return `+${cleaned}`;
  }

  // Já tem código do país 55 e tamanho correto
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    return `+${cleaned}`;
  }

  // Sem código do país: assume Brasil (DDD + número)
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    return `+55${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Valida se o número está no formato correto E.164
 */
export function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Formata o número "From" para a API WhatsApp da Twilio.
 * O Twilio exige o prefixo "whatsapp:" (ex: whatsapp:+14155238886).
 */
function getTwilioWhatsAppFrom(phoneNumber: string | null): string {
  if (!phoneNumber || !phoneNumber.trim()) return '';
  const raw = phoneNumber.trim().replace(/^whatsapp:/i, '');
  const digits = raw.replace(/\D/g, '');
  const withPlus = raw.startsWith('+') ? `+${digits}` : (digits ? `+${digits}` : '');
  return withPlus ? `whatsapp:${withPlus}` : '';
}

const ZAPI_BASE = 'https://api.z-api.io';

const PROVIDERS = ['ZAPI', 'META', 'TWILIO'] as const;
export type WhatsAppProvider = (typeof PROVIDERS)[number];

/** Provedor padrão para envio (configurável no admin; padrão Z-API). */
export async function getDefaultWhatsAppProvider(): Promise<WhatsAppProvider> {
  try {
    const row = await prisma.systemConfig.findUnique({
      where: { key: 'whatsapp_default_provider' },
    });
    const v = (row?.value || 'ZAPI').toUpperCase();
    if (PROVIDERS.includes(v as WhatsAppProvider)) return v as WhatsAppProvider;
  } catch {
    // ignore
  }
  return 'ZAPI';
}

/**
 * Ordem de prioridade: primeiro o provedor padrão (configurável), depois os demais.
 * Padrão do sistema: Z-API.
 */
function getProviderOrder(defaultProvider: WhatsAppProvider): WhatsAppProvider[] {
  const rest = PROVIDERS.filter((p) => p !== defaultProvider);
  return [defaultProvider, ...rest];
}

/**
 * Busca configuração do WhatsApp no banco.
 * Prioridade: provedor padrão (configurável no admin, padrão Z-API) > demais habilitados.
 */
async function getWhatsAppConfig(): Promise<{
  id: string;
  provider: string;
  enabled: boolean | null;
  accountSid: string | null;
  authToken: string | null;
  phoneNumber: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
  config: string | null;
  testPhone: string | null;
  lastTestAt: Date | null;
  lastTestResult: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const defaultProvider = await getDefaultWhatsAppProvider();
  const order = getProviderOrder(defaultProvider);

  for (const provider of order) {
    const config = await prisma.whatsAppConfig.findUnique({
      where: { provider },
    });
    if (config?.enabled) return config;
  }

  return null;
}

function getMetaPhoneNumberId(config: { config: string | null }): string | null {
  if (!config.config) return null;
  try {
    const parsed = JSON.parse(config.config) as { phone_number_id?: string };
    return parsed.phone_number_id?.trim() || null;
  } catch {
    return null;
  }
}

/** Instance ID da Z-API (armazenado em config JSON como instance_id). */
function getZapiInstanceId(config: { config: string | null }): string | null {
  if (!config.config) return null;
  try {
    const parsed = JSON.parse(config.config) as { instance_id?: string };
    return parsed.instance_id?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Envia mensagem via WhatsApp (Meta Cloud API ou Twilio)
 */
export async function sendWhatsAppMessage(
  data: WhatsAppMessage
): Promise<WhatsAppSendResult> {
  try {
    const config = await getWhatsAppConfig();

    if (!config) {
      console.warn('[WhatsApp] Não enviado: integração desabilitada ou não configurada.');
      return { success: false, error: 'WhatsApp desabilitado ou não configurado. Habilite em Admin → WhatsApp.' };
    }

    const formattedPhone = formatPhoneNumber(data.to);
    if (!isValidPhoneNumber(formattedPhone)) {
      throw new Error(`Número de telefone inválido: ${data.to}`);
    }

    const provider = config.provider as string;
    const dbMessage = await prisma.whatsAppMessage.create({
      data: {
        to: formattedPhone,
        message: data.message,
        template: data.template,
        status: 'PENDING',
        provider,
      },
    });

    if (provider === 'META') {
      const phoneNumberId = getMetaPhoneNumberId(config);
      if (!config.authToken || !phoneNumberId) {
        throw new Error('Configuração Meta incompleta: Token de acesso e Phone Number ID são obrigatórios.');
      }
      let toNumber = formattedPhone.replace(/\D/g, '');
      // Brasil: garantir 13 dígitos (55 + DDD 2 + 9 + 8). Meta pode enviar 11 ou 12 (falta o 9 do celular).
      if (toNumber.startsWith('55')) {
        if (toNumber.length === 11) {
          const m = toNumber.match(/^55(\d{2})(\d{8})$/);
          if (m) toNumber = `55${m[1]}9${m[2]}`;
        } else if (toNumber.length === 12) {
          const m = toNumber.match(/^55(\d{2})(\d{8})$/);
          if (m) toNumber = `55${m[1]}9${m[2]}`;
        }
      }
      console.log('[WhatsApp Meta] Enviando para toNumber:', toNumber, '(formatted:', formattedPhone, ')');
      const res = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: toNumber,
            type: 'text',
            text: { body: data.message },
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[WhatsApp Meta] Erro da API:', res.status, JSON.stringify(json));
        const errMsg = json?.error?.message || json?.error?.error_user_msg || res.statusText;
        const code = json?.error?.code;
        const subcode = json?.error?.error_subcode;
        if (code === 131030 || subcode === 131030 || (errMsg && /recipient.*not in allowed list/i.test(errMsg))) {
          throw new Error(
            `Número do destinatário não está na lista de permitidos. Adicione em Meta for Developers → WhatsApp → Configuração da API → "Até" o número exatamente assim: ${toNumber} (só dígitos). Depois clique em "Enviar mensagem" e não atualize a página. Até 5 números no modo desenvolvimento.`
          );
        }
        if (code === 100 || (errMsg && /does not exist|cannot be loaded due to missing permissions/i.test(errMsg))) {
          throw new Error(
            'Phone Number ID inválido ou sem permissão. No Meta for Developers, em WhatsApp → Configuração, use o "Phone number ID" do número de teste/produção (não confunda com o ID da conta business).'
          );
        }
        throw new Error(errMsg || 'Erro ao enviar via Meta API');
      }
      console.log('[WhatsApp Meta] Enviado com sucesso, messageId:', json?.messages?.[0]?.id || '(nenhum)');
      const messageId = json?.messages?.[0]?.id || null;
      await prisma.whatsAppMessage.update({
        where: { id: dbMessage.id },
        data: {
          status: 'SENT',
          providerMessageId: messageId,
          sentAt: new Date(),
        },
      });
      return { success: true, messageId: messageId || undefined };
    }

    // Z-API (z-api.io)
    if (provider === 'ZAPI') {
      const instanceId = getZapiInstanceId(config);
      if (!config.authToken || !instanceId) {
        throw new Error('Configuração Z-API incompleta: Token e Instance ID são obrigatórios.');
      }
      let phoneDigits = formattedPhone.replace(/\D/g, '');
      if (phoneDigits.startsWith('55') && phoneDigits.length === 11) {
        const m = phoneDigits.match(/^55(\d{2})(\d{8})$/);
        if (m) phoneDigits = `55${m[1]}9${m[2]}`;
      } else if (phoneDigits.startsWith('55') && phoneDigits.length === 12) {
        const m = phoneDigits.match(/^55(\d{2})(\d{8})$/);
        if (m) phoneDigits = `55${m[1]}9${m[2]}`;
      }
      const url = `${ZAPI_BASE}/instances/${instanceId}/token/${config.authToken}/send-text`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.apiSecret?.trim()) {
        headers['Client-Token'] = config.apiSecret.trim();
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone: phoneDigits, message: data.message }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[WhatsApp Z-API] Erro:', res.status, JSON.stringify(json));
        const rawMsg = json?.message || json?.error || res.statusText || 'Erro ao enviar via Z-API';
        const errMsg = typeof rawMsg === 'string' && /client-token|client_token/i.test(rawMsg)
          ? 'A Z-API exige o Client-Token. Preencha o campo "Client-Token (opcional)" com o token que aparece em Segurança no painel Z-API, salve e teste novamente.'
          : rawMsg;
        throw new Error(errMsg);
      }
      const messageId = json?.messageId ?? json?.id ?? json?.zaapId ?? null;
      await prisma.whatsAppMessage.update({
        where: { id: dbMessage.id },
        data: {
          status: 'SENT',
          providerMessageId: messageId,
          sentAt: new Date(),
        },
      });
      return { success: true, messageId: messageId || undefined };
    }

    // Twilio
    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      throw new Error('Configuração do WhatsApp incompleta. Verifique Account SID, Auth Token e Número.');
    }
    if (!twilio) {
      throw new Error('Twilio não está disponível no cliente');
    }
    const client = twilio(config.accountSid, config.authToken);
    const twilioMessage = await client.messages.create({
      from: getTwilioWhatsAppFrom(config.phoneNumber),
      to: `whatsapp:${formattedPhone}`,
      body: data.message,
    });
    await prisma.whatsAppMessage.update({
      where: { id: dbMessage.id },
      data: {
        status: 'SENT',
        providerMessageId: twilioMessage.sid,
        sentAt: new Date(),
      },
    });
    return { success: true, messageId: twilioMessage.sid };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    if (data.to) {
      try {
        const dbMessage = await prisma.whatsAppMessage.findFirst({
          where: { to: formatPhoneNumber(data.to) },
          orderBy: { createdAt: 'desc' },
        });
        if (dbMessage?.status === 'PENDING') {
          await prisma.whatsAppMessage.update({
            where: { id: dbMessage.id },
            data: {
              status: 'FAILED',
              error: error instanceof Error ? error.message : 'Erro desconhecido',
            },
          });
        }
      } catch (dbError) {
        console.error('Erro ao salvar erro no banco:', dbError);
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Envia mensagem usando template (Twilio: contentSid; Meta: requer template aprovado no Meta Business Manager)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[]
): Promise<WhatsAppSendResult> {
  try {
    const config = await getWhatsAppConfig();

    if (!config || !config.enabled) {
      return { success: false, error: 'WhatsApp não configurado' };
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!isValidPhoneNumber(formattedPhone)) {
      return { success: false, error: 'Número inválido' };
    }

    if (config.provider === 'META' || config.provider === 'ZAPI') {
      // Meta/Z-API: envio como texto (template name + parâmetros).
      const body = parameters.length ? parameters.join(' ') : templateName;
      return sendWhatsAppMessage({ to: formattedPhone, message: body });
    }

    if (!config.accountSid || !config.authToken || !config.phoneNumber || !twilio) {
      return { success: false, error: 'Configuração Twilio incompleta' };
    }
    const client = twilio(config.accountSid, config.authToken);
    const twilioMessage = await client.messages.create({
      from: getTwilioWhatsAppFrom(config.phoneNumber),
      to: `whatsapp:${formattedPhone}`,
      contentSid: templateName,
      contentVariables: JSON.stringify({
        '1': parameters[0] || '',
        '2': parameters[1] || '',
        '3': parameters[2] || '',
      }),
    });
    return { success: true, messageId: twilioMessage.sid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/** Busca configuração de um provedor específico (para teste). */
async function getWhatsAppConfigByProvider(provider: 'TWILIO' | 'META' | 'ZAPI') {
  const c = await prisma.whatsAppConfig.findUnique({
    where: { provider },
  });
  return c?.enabled ? c : null;
}

/**
 * Testa conexão (Meta, Z-API ou Twilio).
 * Se provider for informado, usa só esse provedor; senão usa o provedor padrão (configurável no admin, padrão Z-API).
 */
export async function testWhatsAppConnection(
  testPhone: string,
  options?: { provider?: 'TWILIO' | 'META' | 'ZAPI' }
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
  status?: string;
}> {
  try {
    const config = options?.provider
      ? await getWhatsAppConfigByProvider(options.provider)
      : await getWhatsAppConfig();

    if (!config || !config.enabled) {
      return { success: false, error: 'WhatsApp não está habilitado para este provedor.' };
    }

    const formattedPhone = formatPhoneNumber(testPhone);
    if (!isValidPhoneNumber(formattedPhone)) {
      return { success: false, error: 'Número de teste inválido' };
    }

    const testMessageBody = '✅ Teste de integração WhatsApp CannabiLizi! Se você recebeu esta mensagem, a configuração está funcionando corretamente. 🚀';

    if (config.provider === 'META') {
      const result = await sendWhatsAppMessage({ to: formattedPhone, message: testMessageBody });
      await prisma.whatsAppConfig.update({
        where: { id: config.id },
        data: {
          lastTestAt: new Date(),
          lastTestResult: result.success ? 'SUCCESS - Mensagem enviada via Meta API' : `ERROR: ${result.error}`,
        },
      });
      if (result.success) {
        return { success: true, message: `Mensagem enviada via Meta API. ID: ${result.messageId || '—'}` };
      }
      return { success: false, error: result.error };
    }

    if (config.provider === 'ZAPI') {
      const result = await sendWhatsAppMessage({ to: formattedPhone, message: testMessageBody });
      await prisma.whatsAppConfig.update({
        where: { id: config.id },
        data: {
          lastTestAt: new Date(),
          lastTestResult: result.success ? 'SUCCESS - Mensagem enviada via Z-API' : `ERROR: ${result.error}`,
        },
      });
      if (result.success) {
        return { success: true, message: `Mensagem enviada via Z-API. ID: ${result.messageId || '—'}` };
      }
      return { success: false, error: result.error };
    }

    // Twilio
    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      return { success: false, error: 'Configuração incompleta' };
    }
    if (!twilio) {
      throw new Error('Twilio não está disponível no cliente');
    }
    const client = twilio(config.accountSid, config.authToken);

    const dbMessage = await prisma.whatsAppMessage.create({
      data: {
        to: formattedPhone,
        message: testMessageBody,
        status: 'PENDING',
        provider: 'TWILIO',
      },
    });

    let testMessage;
    try {
      testMessage = await client.messages.create({
        from: getTwilioWhatsAppFrom(config.phoneNumber),
        to: `whatsapp:${formattedPhone}`,
        body: testMessageBody,
      });
    } catch (createError: any) {
      // Capturar erro específico do Twilio
      const errorCode = createError?.code;
      const errorMessage = createError?.message;
      
      console.error('[WhatsApp Test] Erro ao criar mensagem:', {
        errorCode,
        errorMessage,
        to: formattedPhone,
        from: getTwilioWhatsAppFrom(config.phoneNumber),
      });
      
      // Atualizar mensagem no banco com erro
      await prisma.whatsAppMessage.update({
        where: { id: dbMessage.id },
        data: {
          status: 'FAILED',
          error: errorMessage || 'Erro desconhecido',
        },
      });
      
      // Retornar erro específico
      let userMessage = 'Erro ao enviar mensagem';
      if ((errorCode === 63007 || errorCode === '63007') || errorMessage?.includes('could not find a Channel') || errorMessage?.includes('From address')) {
        userMessage = 'O número "Número WhatsApp" (De) não é um canal válido no Twilio. No Sandbox use exatamente o número do sandbox (ex: +14155238886). Em Produção, use um número aprovado no Console Twilio → WhatsApp. Formato: +[código do país][número] (ex: +5511999999999).';
      } else if (errorCode === '63015' || errorMessage?.includes('joined the Sandbox')) {
        userMessage = `Erro 63015: O número ${formattedPhone} não está na lista de participantes do sandbox. Verifique no Console do Twilio qual número está registrado e use exatamente esse número.`;
      } else if (errorCode === '21608' || errorMessage?.includes('not registered')) {
        userMessage = 'Número não registrado no sandbox. Envie "join [código]" para +1 415 523 8886 no WhatsApp.';
      } else if (errorCode === '21610' || errorMessage?.includes('invalid')) {
        userMessage = 'Número inválido. Verifique o formato: +[código do país][número]';
      } else if (errorCode === '21211') {
        userMessage = 'Número de destino inválido.';
      } else if (errorMessage) {
        userMessage = errorMessage;
      }
      
      return {
        success: false,
        error: userMessage,
        errorCode,
      };
    }

    // Atualizar mensagem no banco com o ID do Twilio
    await prisma.whatsAppMessage.update({
      where: { id: dbMessage.id },
      data: {
        status: testMessage.status.toUpperCase(),
        providerMessageId: testMessage.sid,
        sentAt: new Date(),
      },
    });

    // Buscar status da mensagem após alguns segundos
    let messageStatus = testMessage.status;
    let statusMessage = '';
    let errorCode = '';
    let errorMessage = '';
    
    // Aguardar um pouco e verificar status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const messageDetails = await client.messages(testMessage.sid).fetch();
      messageStatus = messageDetails.status;
      errorCode = (messageDetails as any).errorCode || '';
      errorMessage = (messageDetails as any).errorMessage || '';
      
      // Traduzir status para português
      const statusMap: Record<string, string> = {
        'queued': 'Na fila',
        'sending': 'Enviando',
        'sent': 'Enviado',
        'delivered': 'Entregue',
        'undelivered': 'Não entregue',
        'failed': 'Falhou',
        'read': 'Lido'
      };
      
      statusMessage = statusMap[messageStatus] || messageStatus;
      
      // Log detalhado para debug
      console.log('[WhatsApp Test] Status detalhado:', {
        sid: testMessage.sid,
        status: messageStatus,
        errorCode,
        errorMessage,
        to: formattedPhone,
        from: getTwilioWhatsAppFrom(config.phoneNumber),
      });
    } catch (statusError) {
      console.error('Erro ao buscar status da mensagem:', statusError);
    }

    // Atualizar último teste
    const testResult = messageStatus === 'delivered' || messageStatus === 'sent' 
      ? `SUCCESS - Status: ${statusMessage}` 
      : `WARNING - Status: ${statusMessage}`;
    
    await prisma.whatsAppConfig.update({
      where: { id: config.id },
      data: {
        lastTestAt: new Date(),
        lastTestResult: testResult,
      },
    });

    // Mensagem de retorno baseada no status
    let returnMessage = `Mensagem enviada! ID: ${testMessage.sid}`;
    
    if (messageStatus === 'failed' || messageStatus === 'undelivered') {
      returnMessage += `\n⚠️ Status: ${statusMessage}`;
      
      // Mensagens de erro mais específicas baseadas no código de erro
      if (errorCode === '63015' || errorMessage?.includes('joined the Sandbox') || errorMessage?.includes('not registered')) {
        returnMessage += `\n❌ Erro 63015: Número não está na lista de participantes do sandbox.`;
        returnMessage += `\n📋 Solução:`;
        returnMessage += `\n   1. Acesse: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn`;
        returnMessage += `\n   2. Veja qual número está na lista de "Participantes do Sandbox"`;
        returnMessage += `\n   3. Use EXATAMENTE esse número no campo de teste`;
        returnMessage += `\n   4. Se não estiver na lista, envie "join [código]" para +1 415 523 8886`;
        returnMessage += `\n   5. Número testado: ${formattedPhone}`;
      } else if (errorCode === '21608' || errorMessage?.includes('not registered')) {
        returnMessage += `\n❌ Erro: Número não registrado no sandbox. Envie "join [código]" para +1 415 523 8886 no WhatsApp.`;
      } else if (errorCode === '21610' || errorMessage?.includes('invalid')) {
        returnMessage += `\n❌ Erro: Número inválido. Verifique o formato: +[código do país][número]`;
      } else if (errorCode === '21211') {
        returnMessage += `\n❌ Erro: Número de destino inválido.`;
      } else if (errorMessage) {
        returnMessage += `\n❌ Erro: ${errorMessage}`;
      } else {
        returnMessage += `\n❌ Verifique se o número ${formattedPhone} está registrado no sandbox do Twilio.`;
      }
    } else if (messageStatus === 'sent') {
      returnMessage += `\n✅ Status: ${statusMessage}. A mensagem foi enviada, aguarde a entrega.`;
    } else if (messageStatus === 'delivered') {
      returnMessage += `\n✅ Status: ${statusMessage}. Mensagem entregue com sucesso!`;
    } else {
      returnMessage += `\n📊 Status: ${statusMessage}`;
    }

    return {
      success: true,
      message: returnMessage,
      messageId: testMessage.sid,
      status: messageStatus,
    };
  } catch (error) {
    // Atualizar último teste com erro
    const config = await getWhatsAppConfig();
    if (config) {
      await prisma.whatsAppConfig.update({
        where: { id: config.id },
        data: {
          lastTestAt: new Date(),
          lastTestResult: `ERROR: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        },
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Templates de mensagens (funções auxiliares)
export function getConsultationReminderMessage(
  patientName: string,
  consultationDate: Date,
  meetingLink?: string
): string {
  return `Olá ${patientName}! 

Lembrete: Sua consulta está agendada para ${new Date(consultationDate).toLocaleString('pt-BR')}.

${meetingLink ? `Link da consulta: ${meetingLink}` : ''}

Em caso de dúvidas, estamos à disposição.

CannabiLizi 💚`;
}

export function getPrescriptionNotificationMessage(patientName: string): string {
  return `Olá ${patientName}!

Sua receita médica foi emitida e está disponível na sua área do paciente.

Acesse: https://cannalize.com/paciente/receitas

CannabiLizi 💚`;
}

export function getPaymentReminderMessage(patientName: string, amount: number): string {
  return `Olá ${patientName}!

Você possui um pagamento pendente de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.

Acesse sua área do paciente para realizar o pagamento: https://cannalize.com/paciente

CannabiLizi 💚`;
}
