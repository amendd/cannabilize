/**
 * Configuração do funil de captação (Site vs WhatsApp) por canal (mobile/desktop).
 * Usado na página de agendamento e no admin para configurar fluxos.
 */
import { prisma } from './prisma';

export const CAPTURE_FUNNEL_MOBILE_KEY = 'CAPTURE_FUNNEL_MOBILE';
export const CAPTURE_FUNNEL_DESKTOP_KEY = 'CAPTURE_FUNNEL_DESKTOP';
export const CAPTURE_WHATSAPP_NUMBER_KEY = 'CAPTURE_WHATSAPP_NUMBER';
export const CAPTURE_WHATSAPP_PREFILL_TEMPLATE_KEY = 'CAPTURE_WHATSAPP_PREFILL_TEMPLATE';
export const CAPTURE_WHATSAPP_WELCOME_MESSAGE_KEY = 'CAPTURE_WHATSAPP_WELCOME_MESSAGE';
export const CAPTURE_WHATSAPP_NEXT_STEPS_MESSAGE_KEY = 'CAPTURE_WHATSAPP_NEXT_STEPS_MESSAGE';
/** Chave PIX copia e cola (opcional) enviada junto com o link de pagamento no WhatsApp */
export const CAPTURE_WHATSAPP_PIX_KEY = 'CAPTURE_WHATSAPP_PIX_KEY';
/** Número do atendente humano (E.164): mensagens do paciente são encaminhadas para este número; respostas deste número são reenviadas ao paciente */
export const CAPTURE_WHATSAPP_AGENT_PHONE_KEY = 'CAPTURE_WHATSAPP_AGENT_PHONE';

export type FunnelType = 'SITE' | 'WHATSAPP';

export interface CaptureFunnelConfig {
  mobile: { funnelType: FunnelType };
  desktop: { funnelType: FunnelType };
  whatsappNumber: string;
  whatsappPrefillTemplate: string;
  whatsappWelcomeMessage: string;
  whatsappNextStepsMessage: string | null;
  /** Chave PIX copia e cola (opcional) para enviar no WhatsApp após agendamento */
  whatsappPixKey: string | null;
  /** Número do atendente humano (E.164): quando o paciente pede "falar com humano", mensagens são encaminhadas para este número */
  whatsappAgentPhone: string | null;
}

const DEFAULT_PREFILL_TEMPLATE = 'Olá, gostaria de agendar minha consulta.';
// Fluxo Cannabilize: boas-vindas + contexto
const DEFAULT_WELCOME_MESSAGE = `Olá 👋 Tudo bem?

Sou o atendimento da Cannabilize 🌿
Vou te ajudar a agendar sua consulta de forma rápida e segura.

Leva menos de 2 minutos 😊
Vamos começar?`;

async function getSystemConfigValue(key: string, fallback: string): Promise<string> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key },
    });
    if (entry?.value?.trim()) return entry.value.trim();
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Retorna o tipo de funil para um canal (MOBILE ou DESKTOP).
 */
export async function getFunnelTypeForChannel(channel: 'MOBILE' | 'DESKTOP'): Promise<FunnelType> {
  const key = channel === 'MOBILE' ? CAPTURE_FUNNEL_MOBILE_KEY : CAPTURE_FUNNEL_DESKTOP_KEY;
  const value = await getSystemConfigValue(key, 'SITE');
  if (value === 'WHATSAPP') return 'WHATSAPP';
  return 'SITE';
}

/**
 * Formata número para wa.me: se já tem código do país (55, 1, etc.), mantém; senão, se for Brasil (DDD 2-9), adiciona 55.
 * Assim números do Twilio Sandbox (+1 415...) não recebem 55.
 */
function formatNumberForWaMe(digits: string): string {
  if (digits.startsWith('55')) return `+${digits}`; // já Brasil
  if (digits.startsWith('1') && digits.length >= 11) return `+${digits}`; // EUA (ex.: Twilio Sandbox +1 415 523 8886)
  if (digits.length >= 10 && digits.length <= 11 && /^[2-9]/.test(digits)) return `+55${digits}`; // Brasil sem código (ex.: 21999998888)
  if (digits.length >= 10) return `+${digits}`; // outro país ou formato, não adicionar 55
  return `+55${digits}`; // fallback curto, assume Brasil
}

/**
 * Número do WhatsApp para captação (link wa.me). Sem prefixo whatsapp:.
 * Fallback: número da config Twilio (phoneNumber sem "whatsapp:").
 */
export async function getWhatsAppCaptureNumber(): Promise<string> {
  const custom = await getSystemConfigValue(CAPTURE_WHATSAPP_NUMBER_KEY, '');
  if (custom) {
    const digits = custom.replace(/\D/g, '');
    if (digits.length >= 10) return formatNumberForWaMe(digits);
  }
  const config = await prisma.whatsAppConfig.findUnique({
    where: { provider: 'TWILIO' },
  });
  if (config?.phoneNumber) {
    const raw = config.phoneNumber.replace(/^whatsapp:/i, '').replace(/\D/g, '');
    if (raw.length >= 10) return formatNumberForWaMe(raw);
  }
  return '+5521999999999';
}

/**
 * Template da mensagem pré-preenchida no link wa.me.
 * Variáveis: {{name}}, {{pathologies}} (lista numerada).
 */
export async function getWhatsAppPrefillTemplate(): Promise<string> {
  return getSystemConfigValue(CAPTURE_WHATSAPP_PREFILL_TEMPLATE_KEY, DEFAULT_PREFILL_TEMPLATE);
}

/**
 * Mensagem de boas-vindas enviada automaticamente quando o lead manda a primeira mensagem.
 */
export async function getWhatsAppWelcomeMessage(): Promise<string> {
  return getSystemConfigValue(CAPTURE_WHATSAPP_WELCOME_MESSAGE_KEY, DEFAULT_WELCOME_MESSAGE);
}

// Opcional: segunda mensagem após boas-vindas. Se vazio, só envia a mensagem de boas-vindas (já inclui "Vamos começar?").
const DEFAULT_NEXT_STEPS_MESSAGE = '';

/**
 * Mensagem opcional de "próximos passos" enviada logo após as boas-vindas (primeira mensagem do lead).
 * Se vazia no admin, não envia segunda mensagem.
 */
export async function getWhatsAppNextStepsMessage(): Promise<string | null> {
  const value = await getSystemConfigValue(CAPTURE_WHATSAPP_NEXT_STEPS_MESSAGE_KEY, '');
  if (!value.trim()) return null;
  return value.trim();
}

/**
 * Chave PIX copia e cola (opcional). Se configurada, é enviada no WhatsApp junto com o link de pagamento após o agendamento.
 */
export async function getWhatsAppPixKey(): Promise<string | null> {
  const value = await getSystemConfigValue(CAPTURE_WHATSAPP_PIX_KEY, '');
  if (!value.trim()) return null;
  return value.trim();
}

/**
 * Normaliza um número para E.164 (Brasil: +55...).
 */
function normalizeAgentPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length < 10) return null;
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `+${withCountry}`;
}

/**
 * Lista de números dos atendentes humanos (E.164). Valor no admin: um por linha ou separados por vírgula.
 * Usado para enviar "Pode atender?" apenas aos que não estão em um atendimento ativo.
 */
export async function getWhatsAppAgentPhones(): Promise<string[]> {
  const value = await getSystemConfigValue(CAPTURE_WHATSAPP_AGENT_PHONE_KEY, '');
  if (!value.trim()) return [];
  const parts = value.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const phones: string[] = [];
  for (const p of parts) {
    const n = normalizeAgentPhone(p);
    if (n && !phones.includes(n)) phones.push(n);
  }
  return phones;
}

/**
 * Primeiro número de atendente (compatibilidade). Prefira getWhatsAppAgentPhones().
 */
export async function getWhatsAppAgentPhone(): Promise<string | null> {
  const list = await getWhatsAppAgentPhones();
  return list[0] ?? null;
}

/** Retorna o texto padrão de próximos passos (para exibir no admin). */
export function getDefaultNextStepsMessage(): string {
  return DEFAULT_NEXT_STEPS_MESSAGE;
}

/**
 * Config completa do funil (para API pública e admin).
 */
export async function getCaptureFunnelConfig(): Promise<CaptureFunnelConfig> {
  const [mobile, desktop, whatsappNumber, prefillTemplate, welcomeMessage, nextStepsMessage, pixKey, agentPhonesRaw] = await Promise.all([
    getFunnelTypeForChannel('MOBILE'),
    getFunnelTypeForChannel('DESKTOP'),
    getWhatsAppCaptureNumber(),
    getWhatsAppPrefillTemplate(),
    getWhatsAppWelcomeMessage(),
    getWhatsAppNextStepsMessage(),
    getWhatsAppPixKey(),
    getSystemConfigValue(CAPTURE_WHATSAPP_AGENT_PHONE_KEY, ''),
  ]);
  return {
    mobile: { funnelType: mobile },
    desktop: { funnelType: desktop },
    whatsappNumber,
    whatsappPrefillTemplate: prefillTemplate,
    whatsappWelcomeMessage: welcomeMessage,
    whatsappNextStepsMessage: nextStepsMessage,
    whatsappPixKey: pixKey,
    whatsappAgentPhone: agentPhonesRaw?.trim() || null,
  };
}

/**
 * Salva configuração do funil (admin).
 */
export async function saveCaptureFunnelConfig(data: {
  funnelMobile?: FunnelType;
  funnelDesktop?: FunnelType;
  whatsappNumber?: string;
  whatsappPrefillTemplate?: string;
  whatsappWelcomeMessage?: string;
  whatsappNextStepsMessage?: string | null;
  whatsappPixKey?: string | null;
  whatsappAgentPhone?: string | null;
}): Promise<void> {
  const upsert = async (key: string, value: string) => {
    await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  };
  if (data.funnelMobile !== undefined) {
    await upsert(CAPTURE_FUNNEL_MOBILE_KEY, data.funnelMobile);
  }
  if (data.funnelDesktop !== undefined) {
    await upsert(CAPTURE_FUNNEL_DESKTOP_KEY, data.funnelDesktop);
  }
  if (data.whatsappNumber !== undefined) {
    await upsert(CAPTURE_WHATSAPP_NUMBER_KEY, data.whatsappNumber.trim());
  }
  if (data.whatsappPrefillTemplate !== undefined) {
    await upsert(CAPTURE_WHATSAPP_PREFILL_TEMPLATE_KEY, data.whatsappPrefillTemplate);
  }
  if (data.whatsappWelcomeMessage !== undefined) {
    await upsert(CAPTURE_WHATSAPP_WELCOME_MESSAGE_KEY, data.whatsappWelcomeMessage);
  }
  if (data.whatsappNextStepsMessage !== undefined) {
    await upsert(CAPTURE_WHATSAPP_NEXT_STEPS_MESSAGE_KEY, data.whatsappNextStepsMessage?.trim() ?? '');
  }
  if (data.whatsappPixKey !== undefined) {
    await upsert(CAPTURE_WHATSAPP_PIX_KEY, data.whatsappPixKey?.trim() ?? '');
  }
  if (data.whatsappAgentPhone !== undefined) {
    await upsert(CAPTURE_WHATSAPP_AGENT_PHONE_KEY, data.whatsappAgentPhone?.trim() ?? '');
  }
}

/**
 * Monta o texto da mensagem pré-preenchida substituindo {{name}} e {{pathologies}}.
 */
export function buildPrefillMessage(template: string, name: string, pathologies: string[]): string {
  const pathologiesList = pathologies.length
    ? pathologies.map((p, i) => `${i + 1}. ${p}`).join('\n')
    : '';
  return template
    .replace(/\{\{name\}\}/g, name.trim())
    .replace(/\{\{pathologies\}\}/g, pathologiesList);
}
