/**
 * Configuração da IA no WhatsApp armazenada no Admin (SystemConfig).
 * Inclui chave da API (opcional no painel) ou variável de ambiente.
 */

import { prisma } from './prisma';

export const WHATSAPP_AI_ENABLED_KEY = 'WHATSAPP_AI_ENABLED';
export const WHATSAPP_AI_MODEL_KEY = 'WHATSAPP_AI_MODEL';
export const WHATSAPP_AI_API_KEY = 'WHATSAPP_AI_API_KEY';
export const WHATSAPP_AI_PROVIDER_KEY = 'WHATSAPP_AI_PROVIDER';
export const WHATSAPP_AI_INSTRUCTIONS_KEY = 'WHATSAPP_AI_INSTRUCTIONS';

/** Instruções padrão exibidas no Admin quando não há instruções customizadas. Permite editar ou apagar para definir novas. */
export const DEFAULT_WHATSAPP_AI_INSTRUCTIONS = `Sobre a CannabiLize e o atendimento

Quem somos
- A CannabiLize é uma plataforma de cannabis medicinal no Brasil.
- Atendemos pacientes que buscam tratamento regulamentado, com segurança e suporte em todo o processo.

O que oferecemos
- Consulta médica 100% online por videochamada (Google Meet), com duração em torno de 15 minutos.
- Agendamento pelo WhatsApp (este canal) ou pelo site. O paciente informa nome, CPF, data de nascimento e um breve motivo da consulta; em seguida escolhe data e horário disponíveis e confirma. Só então recebe o link de pagamento (PIX ou cartão). O valor da consulta é definido pela clínica (consulte a configuração do sistema para o valor atual). O medicamento (importação) tem custo à parte; a equipe orienta após a receita.
- Após a consulta: se aprovado, a receita é emitida em até 10 minutos e enviada por e-mail. A equipe auxilia na autorização ANVISA, documentação e importação. O medicamento vem com isenção de impostos; entrega em até 15 dias úteis após aprovação.

Legalidade e documentação
- O uso de cannabis medicinal é regulamentado pela ANVISA. Com receita e autorização, o uso e a importação são legais. A CannabiLize cuida da documentação necessária.

Como falar com o paciente
- Quando o paciente fizer uma pergunta informativa (benefícios do CBD, como funciona, indicações, etc.), RESPONDA À DÚVIDA PRIMEIRO com base no que você sabe. Só depois pode mencionar que para uma avaliação personalizada existe a consulta. Não insista em pedir nome ou agendamento antes de responder.
- Tom: acolhedor, profissional e objetivo. Trate por "você". Pode usar 1 ou 2 emojis quando fizer sentido, sem exagero.
- Responda em 1 a 3 frases curtas, adequadas ao WhatsApp. Não faça listas longas nem repita blocos de texto.
- Baseie-se apenas nas informações acima. Não invente preços, prazos, nomes de medicamentos ou dosagens. Se o valor da consulta não estiver nas instruções, diga que o atendente pode informar ou que o valor é enviado no fluxo de agendamento.
- Não dê orientações médicas, indicações de medicamentos ou dosagens. Para isso existe a consulta com o médico.
- Se a dúvida for muito específica ou sensível, ou você não tiver informação, diga que um atendente pode ajudar e que para continuar o agendamento é só responder com a informação que foi pedida na última mensagem.`;

export type WhatsAppAiProvider = 'openai' | 'groq';

export interface WhatsAppAiConfig {
  enabled: boolean;
  model: string | null;
  provider: WhatsAppAiProvider;
  /** True se há chave salva no painel (não expõe o valor). */
  hasStoredApiKey: boolean;
}

/**
 * Lê enabled, model, provider e hasStoredApiKey do banco.
 * Padrão: enabled = true, model = null, provider = openai.
 */
export async function getWhatsAppAiConfig(): Promise<WhatsAppAiConfig> {
  try {
    const entries = await prisma.systemConfig.findMany({
      where: {
        key: { in: [WHATSAPP_AI_ENABLED_KEY, WHATSAPP_AI_MODEL_KEY, WHATSAPP_AI_API_KEY, WHATSAPP_AI_PROVIDER_KEY] },
      },
    });
    const map = new Map(entries.map((e) => [e.key, e.value]));
    const enabled = map.get(WHATSAPP_AI_ENABLED_KEY);
    const model = map.get(WHATSAPP_AI_MODEL_KEY)?.trim() || null;
    const storedKey = map.get(WHATSAPP_AI_API_KEY)?.trim();
    const providerRaw = map.get(WHATSAPP_AI_PROVIDER_KEY)?.toLowerCase();
    const provider: WhatsAppAiProvider = providerRaw === 'groq' ? 'groq' : 'openai';
    return {
      enabled: enabled === 'false' ? false : true,
      model: model && model.length > 0 ? model : null,
      provider,
      hasStoredApiKey: !!storedKey,
    };
  } catch {
    return { enabled: true, model: null, provider: 'openai', hasStoredApiKey: false };
  }
}

/**
 * Retorna a chave da API salva no painel (apenas para uso interno no backend).
 * Usada tanto para OpenAI quanto para Groq, conforme o provider selecionado.
 */
export async function getStoredApiKey(): Promise<string | null> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: WHATSAPP_AI_API_KEY },
    });
    const value = entry?.value?.trim();
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * Retorna as instruções customizadas para a IA (o que a clínica quer que a IA saiba e como falar).
 * Usado para montar o prompt do assistente. Vazio = usa contexto padrão CannabiLize.
 */
export async function getWhatsAppAiInstructions(): Promise<string | null> {
  try {
    const entry = await prisma.systemConfig.findUnique({
      where: { key: WHATSAPP_AI_INSTRUCTIONS_KEY },
    });
    const value = entry?.value?.trim();
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}
