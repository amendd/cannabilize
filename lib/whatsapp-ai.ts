/**
 * IA no fluxo WhatsApp: responde dúvidas que não caíram no FAQ, mantendo tom acolhedor.
 * Usa a mesma OPENAI_API_KEY do projeto (laudo); opcional OPENAI_WHATSAPP_MODEL.
 * Habilitar/desabilitar e modelo podem ser gerenciados no Admin (Integrações → IA no WhatsApp).
 */

import { getConsultationDefaultAmount } from './consultation-price';
import { getWhatsAppAiConfig, getStoredApiKey, getWhatsAppAiInstructions, DEFAULT_WHATSAPP_AI_INSTRUCTIONS, type WhatsAppAiProvider } from './whatsapp-ai-config';

const envOpenAiKey = () =>
  process.env.OPENAI_WHATSAPP_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || null;
const envGroqKey = () => process.env.GROQ_API_KEY?.trim() || null;
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_WHATSAPP_MODEL || 'gpt-4o-mini';
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const OPENAI_BASE = 'https://api.openai.com/v1';
const GROQ_BASE = 'https://api.groq.com/openai/v1';

const FIXED_RULES = `- Responda em português brasileiro, em 1 a 3 frases curtas (cabem no WhatsApp).
- PRIORIDADE: quando o usuário fizer uma pergunta informativa (sobre CBD, benefícios, cannabis, tratamento, como funciona, etc.), RESPONDA À DÚVIDA PRIMEIRO com base no contexto da clínica. Só depois, se fizer sentido, você pode mencionar brevemente que para uma avaliação personalizada pode agendar a consulta. NÃO insista em pedir nome, CPF ou agendamento antes de responder à pergunta.
- O "passo atual" do fluxo é só contexto; não use isso para desviar a pergunta. Se a pessoa perguntou algo, responda. Depois ela pode continuar o agendamento quando quiser.
- Responda com base no contexto/instruções da clínica. Não invente preços, prazos ou informações médicas que não tenham sido fornecidas.
- Se não souber ou a pergunta for muito específica/sensível, diga que um atendente pode ajudar e que para continuar o agendamento é só responder com a informação que foi pedida.
- Tom: amigável, profissional, sem emojis em excesso (pode usar 1 ou 2 se fizer sentido).
- NÃO faça listas longas; NÃO repita o contexto inteiro. Só a resposta objetiva.`;

/** Monta o prompt do sistema: usa instruções customizadas do Admin, ou o contexto padrão CannabiLize (com valor atual da consulta). */
async function buildSystemPrompt(): Promise<string> {
  const custom = await getWhatsAppAiInstructions();
  if (custom && custom.length > 0) {
    return `Você é o assistente de atendimento no WhatsApp. Seu papel é ser acolhedor e objetivo.

Contexto e instruções da clínica (siga isto ao responder):
${custom.slice(0, 6000)}

Regras (sempre siga):
${FIXED_RULES}`;
  }
  const amount = await getConsultationDefaultAmount();
  const priceLine = `Valor atual da consulta: R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
  const instructionsWithPrice = `${DEFAULT_WHATSAPP_AI_INSTRUCTIONS}\n\n${priceLine}`;
  return `Você é o assistente de atendimento da CannabiLize no WhatsApp. Seu papel é ser acolhedor e objetivo.

Contexto e instruções da clínica (siga isto ao responder):
${instructionsWithPrice}

Regras (sempre siga):
${FIXED_RULES}`;
}

const FALLBACK_WHEN_AI_UNAVAILABLE =
  'Entendi sua dúvida. Para te ajudar melhor, um atendente pode te responder em breve. Enquanto isso, para continuar seu agendamento, é só responder com a informação que eu pedir na última mensagem 😊';

/** Timeout para não travar o webhook (segundos). */
const REQUEST_TIMEOUT_MS = 8000;

/** Verifica se há chave (env ou salva no painel) para o provider configurado. */
export async function isWhatsAppAiAvailable(): Promise<boolean> {
  const config = await getWhatsAppAiConfig();
  const key = await getApiKeyForProvider(config.provider);
  return !!key;
}

async function getApiKeyForProvider(provider: WhatsAppAiProvider): Promise<string | null> {
  if (provider === 'groq') return envGroqKey() || (await getStoredApiKey());
  return envOpenAiKey() || (await getStoredApiKey());
}

export interface WhatsAppAiReplyOptions {
  /** Mensagem do usuário (pergunta/dúvida). */
  userMessage: string;
  /** Nome do passo atual do fluxo (ex.: ASK_NAME, ASK_CPF) para a IA contextualizar. */
  currentStep?: string;
  /** Nome do lead (se já informado) para personalizar. */
  leadName?: string | null;
}

/**
 * Gera uma resposta curta da IA para dúvida do usuário no WhatsApp.
 * Retorna null se desativada no Admin, chave não configurada, timeout ou erro na API.
 */
export async function getWhatsAppAiReply(options: WhatsAppAiReplyOptions): Promise<string | null> {
  const result = await getWhatsAppAiReplyWithDiagnostics(options);
  return result.reply;
}

export interface WhatsAppAiReplyDiagnostics {
  reply: string | null;
  /** Preenchido quando a IA não responde (erro da API, timeout, etc.) para exibir no teste. */
  error?: string;
}

/**
 * Mesma lógica de getWhatsAppAiReply, mas retorna o erro retornado pela OpenAI (ou timeout)
 * para que o painel de teste possa exibir a causa exata (ex.: chave inválida, 401).
 */
export async function getWhatsAppAiReplyWithDiagnostics(
  options: WhatsAppAiReplyOptions
): Promise<WhatsAppAiReplyDiagnostics> {
  const { userMessage, currentStep, leadName } = options;

  const config = await getWhatsAppAiConfig();
  if (!config.enabled) return { reply: null, error: 'IA desativada no painel. Ative "Usar IA nas dúvidas".' };

  const apiKey = await getApiKeyForProvider(config.provider);
  if (!apiKey) return { reply: null, error: 'Chave da API não configurada. Defina no painel ou use variável de ambiente.' };

  const trimmed = userMessage.trim();
  if (trimmed.length < 2) return { reply: null, error: 'Mensagem muito curta.' };

  const isGroq = config.provider === 'groq';
  const baseUrl = isGroq ? GROQ_BASE : OPENAI_BASE;
  const model = config.model?.trim() || (isGroq ? DEFAULT_GROQ_MODEL : DEFAULT_OPENAI_MODEL);
  const providerLabel = isGroq ? 'Groq' : 'OpenAI';

  const stepContext =
    currentStep === 'ASK_NAME'
      ? 'Estamos pedindo o nome completo do usuário.'
      : currentStep === 'ASK_CPF'
        ? 'Estamos pedindo o CPF.'
        : currentStep === 'ASK_BIRTH'
          ? 'Estamos pedindo a data de nascimento.'
          : currentStep === 'ASK_ANAMNESIS'
            ? 'Estamos pedindo o motivo da consulta ou histórico em poucas palavras.'
            : currentStep === 'ASK_DAY' || currentStep === 'ASK_DATE' || currentStep === 'ASK_SLOT'
              ? 'Estamos no passo de escolher data/horário da consulta.'
              : currentStep === 'CONFIRM_SLOT' || currentStep === 'CONFIRM'
                ? 'Estamos na confirmação do horário ou dos dados.'
                : currentStep === 'QUALIFYING' || currentStep === 'PAYMENT_SENT' || currentStep === 'SCHEDULED'
                  ? 'O agendamento já foi concluído ou o pagamento foi enviado. O usuário pode estar com dúvidas sobre a consulta, receita, próximos passos, valor ou querendo fazer um novo agendamento. Seja acolhedor e responda sobre a CannabiLize, consulta online, documentos e pagamento.'
                  : 'O usuário está em um passo do agendamento.';

  const userContent = [
    leadName ? `[Nome do contato: ${leadName}]` : '',
    `[Contexto do fluxo: ${stepContext}]`,
    '',
    `Pergunta/dúvida do usuário: "${trimmed.slice(0, 500)}"`,
    '',
    'Responda DIRETAMENTE à dúvida em 1 a 3 frases curtas, em português. Não peça nome, CPF ou agendamento antes de responder à pergunta. Se a dúvida for informativa (CBD, benefícios, como funciona), responda com a informação; só no final pode mencionar que para avaliação personalizada existe a consulta.',
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = await buildSystemPrompt();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.4,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      let errMessage: string;
      try {
        const errJson = JSON.parse(errText) as { error?: { message?: string } };
        errMessage = errJson?.error?.message || errText || `HTTP ${response.status}`;
      } catch {
        errMessage = errText || `HTTP ${response.status}`;
      }
      const shortErr = errMessage.slice(0, 300);
      console.warn('[WhatsApp IA]', providerLabel, 'respondeu com erro:', response.status, shortErr);
      return {
        reply: null,
        error: `${providerLabel} (${response.status}): ${shortErr}`,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return { reply: null, error: `${providerLabel} retornou resposta vazia.` };

    const maxLen = 600;
    const reply = content.length > maxLen ? content.slice(0, maxLen - 3) + '…' : content;
    return { reply };
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    const errorMsg = msg.includes('abort')
      ? `Timeout (${providerLabel} demorou mais de 8s para responder). Tente novamente.`
      : `Erro ao chamar ${providerLabel}: ${msg}`;
    console.warn('[WhatsApp IA]', errorMsg);
    return { reply: null, error: errorMsg };
  }
}

/**
 * Mensagem de fallback quando a IA não está disponível ou não conseguiu responder.
 * Pode ser usada pelo fluxo para não deixar o usuário sem resposta.
 */
export function getWhatsAppAiFallbackMessage(): string {
  return FALLBACK_WHEN_AI_UNAVAILABLE;
}
