/**
 * Fluxo de captação via WhatsApp (Cannabilize): boas-vindas → nome → CPF → nascimento → dia → (data) → horário → confirmação slot → confirmação dados → pagamento.
 * Link para concluir cadastro é enviado somente após confirmação do pagamento (webhook).
 *
 * UX: Opções de confirmação usam SIM/NÃO (em vez de CONFIRMAR/ALTERAR). Mensagens fora do fluxo (oi, obrigado, etc.)
 * recebem prefixo acolhedor antes da reorientação, reduzindo sensação de fluxo engessado.
 */

import { prisma } from './prisma';
import { getAvailableSlots, getTodayStringInTimezone, DEFAULT_AVAILABILITY_TIMEZONE } from './availability';
import { createPatientAndConsultationFromLead } from './whatsapp-lead-to-patient';
import { fixWhatsAppLeadBirthDateIfNeeded } from './whatsapp-lead-birthdate-fix';
import { getWhatsAppPixKey, getWhatsAppAgentPhones } from './capture-funnel';
import { getWhatsAppFaqAnswer, looksLikeQuestion, isShortConversationalReply, isDataCollectionStep } from './whatsapp-faq';
import {
  getWhatsAppAiReply,
  getWhatsAppAiFallbackMessage,
  isWhatsAppAiAvailable,
} from './whatsapp-ai';
import { sendWhatsAppMessage, formatPhoneNumber } from './whatsapp';

export const FLOW_STATES = [
  'WELCOME',
  'ASK_NAME',
  'ASK_CPF',
  'ASK_BIRTH',
  'ASK_ANAMNESIS', // anamnese breve antes de agendar
  'ASK_DAY',       // 1=Hoje, 2=Amanhã, 3=Outra data
  'ASK_DATE',      // data específica (se escolheu 3)
  'ASK_SLOT',      // escolher horário no dia já definido
  'CONFIRM_SLOT',  // micro-confirmação do horário
  'CONFIRM',       // resumo final e CONFIRMAR/CORRIGIR
  'QUALIFYING',
  'PAYMENT_SENT',
  'SCHEDULED',
  'HUMAN_PENDING_ACCEPT', // paciente pediu humano; aguardando atendente responder Sim/Não
  'HUMAN_REQUESTED', // atendente aceitou; mensagens encaminhadas para agentPhone
] as const;

export type WhatsAppFlowState = (typeof FLOW_STATES)[number];

/** Retorna data de amanhã no timezone Brasil (YYYY-MM-DD). */
function getTomorrowStringInTimezone(): string {
  const today = getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE);
  const [y, m, d] = today.split('-').map(Number);
  const tomorrow = new Date(y, m - 1, d + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
}

/** Mensagem enviada ao lead para a próxima etapa (sem resposta do usuário ainda). */
export function getPromptForState(state: WhatsAppFlowState, lead?: { name?: string | null }): string {
  switch (state) {
    case 'WELCOME':
      return '';
    case 'ASK_NAME':
      return 'Perfeito 😊\n\nPor favor, me diga seu *nome completo*:';
    case 'ASK_CPF':
      return 'Agora preciso do seu *CPF* (somente números).\nEle é usado apenas para:\n• Identificação do paciente\n• Emissão de documentos médicos\n\n🔒 Seus dados são protegidos.';
    case 'ASK_BIRTH':
      return 'Certo!\n\nQual sua *data de nascimento*?\nFormato: DD/MM/AAAA\nExemplo: 15/03/1990';
    case 'ASK_ANAMNESIS':
      return 'Em poucas palavras, conte seu *motivo da consulta* ou *histórico* (sintomas, medicamentos em uso, expectativas). Pode ser bem breve.';
    case 'ASK_DAY':
      return 'Agora vamos escolher a data da sua consulta 🗓️\n\nComo prefere?\n\n1️⃣ Hoje\n2️⃣ Amanhã\n3️⃣ Escolher outra data\n\nResponda com o número da opção 😊';
    case 'ASK_DATE':
      return 'Perfeito 😊\n\nQual data você deseja?\nFormato: DD/MM/AAAA\nExemplo: 15/02/2026';
    case 'ASK_SLOT':
      return '';
    case 'CONFIRM_SLOT':
      return '';
    case 'CONFIRM':
      return '';
    case 'HUMAN_PENDING_ACCEPT':
    case 'HUMAN_REQUESTED':
      return '';
    default:
      return '';
  }
}

/** Detecta se a mensagem é pedido para falar com um humano/atendente. */
function wantsHumanAgent(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ');
  if (t.length > 120) return false;
  const patterns = [
    /falar\s+com\s+(um\s+)?(humano|atendente|pessoa|operador)/i,
    /quero\s+(um\s+)?(atendente|humano|pessoa)/i,
    /prefiro\s+(um\s+)?(humano|atendente)/i,
    /me\s+(conecte|conecta|passa|liga|passar|ligar)\s+(com|para|com\s+um|para\s+um)\s*(atendente|humano|pessoa)?/i,
    /n[aã]o\s+quero\s+(mais\s+)?(bot|rob[oô]|ia|assistente\s+virtual)/i,
    /^(atendente|humano|pessoa\s+real|operador)$/i,
    /^quero\s+falar\s+com\s+(algu[eé]m|uma\s+pessoa)/i,
  ];
  return patterns.some((p) => p.test(t));
}

/** Detecta se o paciente quer voltar ao atendimento automático (saindo do modo humano). */
function wantsBackToBot(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return /voltar\s+ao\s+atendimento\s+autom[aá]tico/i.test(t) || /voltar\s+ao\s+bot/i.test(t) || /atendimento\s+autom[aá]tico/i.test(t);
}

/** Retorna a mensagem de ASK_DAY: com "Hoje" só se houver médico disponível hoje; senão, fala da alta demanda e oferece Amanhã e Outra data. */
export async function getAskDayMessage(): Promise<string> {
  const todayStr = getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE);
  const todaySlots = await getAvailableSlots(todayStr);
  const todayHasSlots = todaySlots.some((s) => s.available);
  if (todayHasSlots) {
    return 'Agora vamos escolher a data da sua consulta 🗓️\n\nComo prefere?\n\n1️⃣ Hoje\n2️⃣ Amanhã\n3️⃣ Escolher outra data\n\nResponda com o número da opção 😊';
  }
  return 'Agora vamos escolher a data da sua consulta 🗓️\n\n📅 *Hoje* nossa agenda está com *alta demanda* e não temos horários disponíveis.\n\nComo prefere?\n\n1️⃣ Amanhã\n2️⃣ Escolher outra data\n\nResponda com o número da opção 😊';
}

/** Opções de horário exibidas ao lead (para ASK_SLOT). */
export type SlotOption = { date: string; time: string; doctorId: string; label: string };

/** Valida CPF pelos dígitos verificadores e rejeita sequências inválidas (111.111.111-11, etc.). */
function isValidCPF(digits: string): boolean {
  if (digits.length !== 11 || !/^\d+$/.test(digits)) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // todos os dígitos iguais
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[10], 10)) return false;
  return true;
}

/** Detecta mensagens genéricas/fora do fluxo (saudações, agradecimentos, etc.) para responder de forma acolhedora. */
function isGenericOrOffFlowMessage(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ');
  if (t.length > 80) return false; // mensagens longas podem ser motivo da consulta, nome, etc.
  const generic =
    /^(oi|olá|ola|hey|e aí|eai|tudo bem|tudo bom|bom dia|boa tarde|boa noite|obrigad[oa]|valeu|vlw|ok|okay|certeza|certo|entendi|tchau|até mais|ate mais|por favor|pfv|pf|ajuda|help|quero|desejo|sim|não|nao)$/i;
  if (generic.test(t)) return true;
  if (/^[0-9\s\.\-]+$/.test(t) && t.replace(/\D/g, '').length < 4) return false; // pode ser CPF/data parcial
  if (t.length <= 3 && /^[a-záàâãéêíóôõúç\s]+$/i.test(t)) return true; // "oi", "sim", "não"
  return false;
}

/** Prefixo amigável quando o usuário manda mensagem fora do esperado (reduz sensação de fluxo engessado). */
function getFriendlyRedirectPrefix(state: WhatsAppFlowState): string {
  switch (state) {
    case 'ASK_NAME':
      return 'Para seguir com seu agendamento, preciso do seu nome completo 😊 ';
    case 'ASK_CPF':
      return 'Sem problemas! Para continuar, ';
    case 'ASK_BIRTH':
      return 'Para continuar, ';
    case 'ASK_ANAMNESIS':
      return 'Quando quiser, conte um pouco do motivo da consulta 😊 ';
    case 'ASK_DAY':
      return 'Responda com 1, 2 ou 3 para escolher a data 😊 ';
    case 'ASK_DATE':
      return 'Informe a data no formato DD/MM/AAAA. ';
    case 'ASK_SLOT':
      return 'Escolha o número do horário ou digite o horário (ex: 14:00). ';
    case 'CONFIRM_SLOT':
      return 'Responda SIM ou NÃO para esse horário 🙂 ';
    case 'CONFIRM':
      return 'Responda SIM ou NÃO para confirmar ou corrigir 🙂 ';
    default:
      return '';
  }
}

/** Primeiras palavras que não são nome (saudações, respostas curtas) – rejeitar como nome completo. */
const FIRST_WORD_NOT_NAME = new Set([
  'oi', 'olá', 'ola', 'hey', 'e aí', 'eai', 'tudo', 'bom', 'boa', 'noite', 'tarde', 'dia',
  'obrigado', 'obrigada', 'valeu', 'vlw', 'ok', 'okay', 'certeza', 'certo', 'entendi',
  'tchau', 'até', 'ate', 'mais', 'por', 'favor', 'pfv', 'pf', 'ajuda', 'help', 'quero', 'desejo',
  'sim', 'não', 'nao', 'teste', 'reiniciar', 'resetar', 'começar', 'iniciar', 'comecar',
]);

/** Valida nome completo: pelo menos nome e sobrenome, apenas letras/espaços/hífen, sem só números. Rejeita saudações (ex.: "Oi neto"). */
function validateFullName(trimmed: string): { ok: true; name: string } | { ok: false; error: string } {
  const normalized = trimmed.replace(/\s+/g, ' ').trim();
  if (normalized.length < 4) {
    return { ok: false, error: 'Digite seu *nome e sobrenome* (ex.: Maria Silva).' };
  }
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return { ok: false, error: 'Digite *nome e sobrenome* (ex.: João Santos).' };
  }
  const firstWord = parts[0].toLowerCase().replace(/[\-\u0027]/g, '');
  if (FIRST_WORD_NOT_NAME.has(firstWord)) {
    return { ok: false, error: 'Isso parece uma saudação 😊 Por favor, digite seu *nome completo* (ex.: Maria Silva).' };
  }
  const lettersOnly = normalized.replace(/[\s\-\u0027]/g, '');
  const letterCount = (lettersOnly.match(/[\p{L}]/gu) || []).length;
  const digitCount = (lettersOnly.match(/\d/g) || []).length;
  if (digitCount > 0 && digitCount >= letterCount) {
    return { ok: false, error: `O nome deve conter principalmente letras. Digite nome e sobrenome (ex.: Ana Costa).` };
  }
  if (letterCount < 3) {
    return { ok: false, error: `Nome inválido. Digite seu *nome completo* com letras (ex.: Carlos Oliveira).` };
  }
  for (const part of parts) {
    const cleanedPart = part.replace(/[\-\u0027]/g, '');
    const partLetters = cleanedPart.match(/[\p{L}]/gu) ?? [];
    if (partLetters.length < 2) {
      return { ok: false, error: `Cada parte do nome deve ter ao menos 2 letras. Ex.: Maria Silva.` };
    }
  }
  return { ok: true, name: normalized };
}

/** Converte ano de 2 dígitos em 4 (00-29 → 2000-2029, 30-99 → 1930-1999). */
function twoDigitYearToFull(yy: number): number {
  return yy <= 29 ? 2000 + yy : 1900 + yy;
}

/** Parse flexível de data: DD/MM/AAAA, DD-MM-AAAA, DD.MM.AAAA, DD MM AAAA, DD MM YY ou 6/8 dígitos. Retorna null se inválido. */
function parseBirthOrDate(trimmed: string): { day: number; month: number; year: number } | null {
  let day: number; let month: number; let year: number;
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const spaceMatch = trimmed.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{2}|\d{4})$/);
  const match = slashMatch || dashMatch || dotMatch;
  if (match) {
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    year = parseInt(match[3], 10);
  } else if (spaceMatch) {
    day = parseInt(spaceMatch[1], 10);
    month = parseInt(spaceMatch[2], 10);
    const y = spaceMatch[3];
    year = y.length === 4 ? parseInt(y, 10) : twoDigitYearToFull(parseInt(y, 10));
  } else {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 8) {
      day = parseInt(digits.slice(0, 2), 10);
      month = parseInt(digits.slice(2, 4), 10);
      year = parseInt(digits.slice(4, 8), 10);
    } else if (digits.length === 6) {
      day = parseInt(digits.slice(0, 2), 10);
      month = parseInt(digits.slice(2, 4), 10);
      year = twoDigitYearToFull(parseInt(digits.slice(4, 6), 10));
    } else {
      return null;
    }
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1) return null;
  return { day, month, year };
}

/** Valida e normaliza a resposta do usuário para o estado atual. Aceita CPF e datas em vários formatos. */
export function parseAndValidateAnswer(
  state: WhatsAppFlowState,
  text: string,
  context?: { slotOptions?: SlotOption[]; todayHasSlots?: boolean }
): { ok: true; name?: string; cpf?: string; birthDate?: Date; anamnesis?: string; dayChoice?: 1 | 2 | 3; selectedDate?: string; slotIndex?: number; confirmSlot?: 'confirmar' | 'alterar'; confirmData?: 'confirmar' | 'corrigir' } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed.length) return { ok: false, error: 'Por favor, digite sua resposta.' };

  switch (state) {
    case 'ASK_NAME': {
      if (isGenericOrOffFlowMessage(trimmed)) {
        return { ok: false, error: 'Para seguir com seu agendamento, preciso do seu nome completo 😊 Digite nome e sobrenome (ex.: Maria Silva).' };
      }
      const nameResult = validateFullName(trimmed);
      if (!nameResult.ok) return { ok: false, error: nameResult.error };
      return { ok: true, name: nameResult.name };
    }
    case 'ASK_CPF': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length !== 11) {
        return { ok: false, error: 'CPF deve ter 11 dígitos. Pode digitar com pontos e traço que eu entendo 😊' };
      }
      if (!isValidCPF(digits)) {
        return { ok: false, error: 'CPF inválido. Verifique os 11 dígitos e digite novamente (pode usar pontos e traço).' };
      }
      return { ok: true, cpf: digits };
    }
    case 'ASK_BIRTH': {
      const parsed = parseBirthOrDate(trimmed);
      if (!parsed) return { ok: false, error: 'Data inválida. Use DD/MM/AAAA. Exemplo: 15/03/1990' };
      const date = new Date(parsed.year, parsed.month - 1, parsed.day);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        return { ok: false, error: 'A data de nascimento não pode ser no futuro. Use DD/MM/AAAA (ex.: 15/03/1990).' };
      }
      if (parsed.year < 1900) {
        return { ok: false, error: 'Ano inválido. Informe uma data real (ex.: 15/03/1990).' };
      }
      const ageYears = (today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageYears > 120) {
        return { ok: false, error: 'Verifique a data. Use DD/MM/AAAA (ex.: 15/03/1990).' };
      }
      return { ok: true, birthDate: date };
    }
    case 'ASK_ANAMNESIS': {
      if (trimmed.length < 5) {
        return { ok: false, error: 'Conte em poucas palavras seu motivo ou histórico da consulta 😊' };
      }
      const letters = (trimmed.match(/[\p{L}]/gu) || []).length;
      if (letters < 3) {
        return { ok: false, error: 'Descreva em palavras seu motivo ou histórico (ex.: dor crônica, acompanhamento).' };
      }
      return { ok: true, anamnesis: trimmed.slice(0, 5000) };
    }
    case 'ASK_DAY': {
      const noToday = context?.todayHasSlots === false; // "Hoje" não foi ofertado (alta demanda)
      const num = parseInt(trimmed.replace(/\D/g, ''), 10);
      const lower = trimmed.toLowerCase();
      if (noToday) {
        if (num === 1) return { ok: true, dayChoice: 2 }; // 1 = Amanhã
        if (num === 2) return { ok: true, dayChoice: 3 }; // 2 = Outra data
        if (/amanhã|amanha|tomorrow|1/.test(lower)) return { ok: true, dayChoice: 2 };
        if (/outra|outro|escolher|2/.test(lower)) return { ok: true, dayChoice: 3 };
        return { ok: false, error: 'Escolha 1 (Amanhã) ou 2 (Escolher outra data).' };
      }
      if (num === 1 || num === 2 || num === 3) return { ok: true, dayChoice: num as 1 | 2 | 3 };
      if (/hoje|today|1/.test(lower)) return { ok: true, dayChoice: 1 };
      if (/amanhã|amanha|tomorrow|2/.test(lower)) return { ok: true, dayChoice: 2 };
      if (/outra|outro|escolher|3/.test(lower)) return { ok: true, dayChoice: 3 };
      return { ok: false, error: 'Escolha 1 (Hoje), 2 (Amanhã) ou 3 (Escolher outra data).' };
    }
    case 'ASK_DATE': {
      const parsed = parseBirthOrDate(trimmed);
      if (!parsed) return { ok: false, error: 'Data inválida. Use DD/MM/AAAA. Exemplo: 15/02/2026' };
      const todayStr = getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE);
      const dateStr = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
      const today = new Date(todayStr + 'T12:00:00');
      const chosen = new Date(dateStr + 'T12:00:00');
      if (chosen < today) return { ok: false, error: 'Essa data já passou. Por favor, informe outra data.' };
      const maxDays = 30;
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + maxDays);
      if (chosen > maxDate) return { ok: false, error: 'Agendamos até 30 dias à frente. Escolha uma data mais próxima.' };
      return { ok: true, selectedDate: dateStr };
    }
    case 'ASK_SLOT': {
      const options = context?.slotOptions;
      if (!options?.length) return { ok: false, error: 'Horários não carregados. Envie *oi* para recarregar.' };
      const num = parseInt(trimmed.replace(/\D/g, ''), 10);
      if (Number.isNaN(num) || num < 1 || num > options.length) {
        return { ok: false, error: `Escolha o número do horário (1 a ${options.length}) ou digite o horário (ex: 14:00).` };
      }
      return { ok: true, slotIndex: num };
    }
    case 'CONFIRM_SLOT': {
      const lower = trimmed.toLowerCase().replace(/\s/g, '');
      if (/^sim$|confirmar|^s$|^ok$|^1$/.test(lower)) return { ok: true, confirmSlot: 'confirmar' };
      if (/^n[aã]o$|^nao$|alterar|mudar|trocar|^n$|^2$/.test(lower)) return { ok: true, confirmSlot: 'alterar' };
      return { ok: false, error: 'Responda *SIM* para confirmar esse horário ou *NÃO* para escolher outro.' };
    }
    case 'CONFIRM': {
      const lower = trimmed.toLowerCase().replace(/\s/g, '');
      if (/^sim$|^s$|^confirmar|^ok$/.test(lower)) return { ok: true, confirmData: 'confirmar' };
      if (/^n[aã]o$|^nao$|^n$|^corrigir|^alterar|^mudar/.test(lower)) return { ok: true, confirmData: 'corrigir' };
      return { ok: false, error: 'Responda *SIM* se estiver tudo correto ou *NÃO* para corrigir algum dado.' };
    }
    default:
      return { ok: false, error: 'Não entendi. Tente novamente ou digite *oi* para recomeçar.' };
  }
}

/** Próximo estado linear (quando não há ramificação). */
export function getNextState(currentState: WhatsAppFlowState): WhatsAppFlowState {
  const order: WhatsAppFlowState[] = ['WELCOME', 'ASK_NAME', 'ASK_CPF', 'ASK_BIRTH', 'ASK_ANAMNESIS', 'ASK_DAY', 'ASK_DATE', 'ASK_SLOT', 'CONFIRM_SLOT', 'CONFIRM'];
  const i = order.indexOf(currentState);
  if (i < 0 || i >= order.length - 1) return currentState;
  return order[i + 1];
}

/** Mascara CPF para exibição: ***.***.***-84 (só últimos 2 dígitos). */
function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return '—';
  return `***.***.***-${digits.slice(-2)}`;
}

/** Monta mensagem de confirmação final (estado CONFIRM) com CPF mascarado e CONFIRMAR/CORRIGIR.
 * Atenção: Nascimento = sempre lead.birthDate; Motivo/Histórico = sempre lead.anamnesis (não trocar). */
export function buildConfirmMessage(lead: { name?: string | null; cpf?: string | null; birthDate?: Date | null; metadata?: string | null; anamnesis?: string | null }): string {
  let slotLabel: string | null = null;
  if (lead.metadata) {
    try {
      const parsed = JSON.parse(lead.metadata) as { slot?: { date: string; time: string } };
      if (parsed.slot?.date && parsed.slot?.time) {
        const [y, m, d] = parsed.slot.date.split('-').map(Number);
        slotLabel = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} às ${parsed.slot.time}`;
      }
    } catch {
      // ignore
    }
  }
  const nascimentoExibicao = lead.birthDate ? new Date(lead.birthDate).toLocaleDateString('pt-BR') : '—';
  let motivoHistoricoExibicao = lead.anamnesis ? (lead.anamnesis.length > 120 ? lead.anamnesis.slice(0, 120) + '...' : lead.anamnesis) : '';
  // Se por engano foi salva uma data no campo motivo (leads antigos), não exibir como motivo para não confundir
  if (motivoHistoricoExibicao && parseBirthOrDate(motivoHistoricoExibicao.trim())) {
    motivoHistoricoExibicao = ''; // omitir; evita "Motivo/Histórico: 24 11 1994"
  }
  const lines = [
    '📋 *Confira seus dados:*',
    '',
    `• Nome: ${lead.name || '—'}`,
    `• CPF: ${lead.cpf ? maskCpf(lead.cpf) : '—'}`,
    `• Nascimento: ${nascimentoExibicao}`,
    motivoHistoricoExibicao ? `• Motivo/Histórico: ${motivoHistoricoExibicao}` : '',
    slotLabel ? `• Consulta: ${slotLabel}` : '',
    '',
    'Está tudo correto?',
    '',
    '• *SIM* – está tudo certo',
    '• *NÃO* – quero corrigir algum dado',
  ].filter(Boolean);
  return lines.join('\n');
}

/** Monta confirmação única: "Confira seus dados" + horário + uma só pergunta (sem segunda confirmação). */
export function buildConfirmSlotMessage(lead: { name?: string | null; cpf?: string | null; birthDate?: Date | null; metadata?: string | null; anamnesis?: string | null }): string {
  let slotLabel: string | null = null;
  if (lead.metadata) {
    try {
      const parsed = JSON.parse(lead.metadata) as { slot?: { date: string; time: string } };
      if (parsed.slot?.date && parsed.slot?.time) {
        const [y, m, d] = parsed.slot.date.split('-').map(Number);
        slotLabel = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} às ${parsed.slot.time}`;
      }
    } catch {
      // ignore
    }
  }
  const nascimentoExibicao = lead.birthDate ? new Date(lead.birthDate).toLocaleDateString('pt-BR') : '—';
  let motivoHistoricoExibicao = lead.anamnesis ? (lead.anamnesis.length > 120 ? lead.anamnesis.slice(0, 120) + '...' : lead.anamnesis) : '';
  if (motivoHistoricoExibicao && parseBirthOrDate(motivoHistoricoExibicao.trim())) {
    motivoHistoricoExibicao = '';
  }
  const lines = [
    '📋 *Confira seus dados:*',
    '',
    `• Nome: ${lead.name || '—'}`,
    `• CPF: ${lead.cpf ? maskCpf(lead.cpf) : '—'}`,
    `• Nascimento: ${nascimentoExibicao}`,
    motivoHistoricoExibicao ? `• Motivo/Histórico: ${motivoHistoricoExibicao}` : '',
    slotLabel ? `• Consulta: ${slotLabel}` : '',
    '',
    'Posso confirmar esse horário e seus dados?',
    '',
    '• *SIM* – confirmar e seguir para pagamento',
    '• *NÃO* – escolher outro horário ou corrigir algum dado',
  ].filter(Boolean);
  return lines.join('\n');
}

/** Atualiza o lead com a resposta validada e avança o estado. Retorna próximo estado. */
export async function applyAnswerAndAdvance(
  leadId: string,
  state: WhatsAppFlowState,
  parsed: {
    name?: string;
    cpf?: string;
    birthDate?: Date;
    anamnesis?: string;
    dayChoice?: 1 | 2 | 3;
    selectedDate?: string;
    slotIndex?: number;
    confirmSlot?: 'confirmar' | 'alterar';
    confirmData?: 'confirmar' | 'corrigir';
  }
): Promise<WhatsAppFlowState> {
  const current = await prisma.whatsAppLead.findUnique({ where: { id: leadId }, select: { metadata: true } });
  let meta: Record<string, unknown> = {};
  if (current?.metadata) {
    try {
      meta = JSON.parse(current.metadata) as Record<string, unknown>;
    } catch {
      // ignore
    }
  }

  let next: WhatsAppFlowState;

  if (state === 'ASK_DAY' && parsed.dayChoice != null) {
    if (parsed.dayChoice === 3) {
      next = 'ASK_DATE';
    } else {
      const dateStr = parsed.dayChoice === 1 ? getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE) : getTomorrowStringInTimezone();
      meta.selectedDate = dateStr;
      next = 'ASK_SLOT';
    }
  } else if (state === 'ASK_DATE' && parsed.selectedDate) {
    meta.selectedDate = parsed.selectedDate;
    next = 'ASK_SLOT';
  } else if (state === 'ASK_SLOT' && parsed.slotIndex != null) {
    const options = (meta.slotOptions as SlotOption[]) || [];
    const selected = options[parsed.slotIndex - 1];
    if (selected) {
      meta.slot = { date: selected.date, time: selected.time, doctorId: selected.doctorId };
      delete meta.slotOptions;
    }
    next = 'CONFIRM_SLOT';
  } else if (state === 'CONFIRM_SLOT' && parsed.confirmSlot) {
    // confirmar: fluxo trata direto (cria consulta + pagamento); alterar: volta para ASK_SLOT
    next = parsed.confirmSlot === 'confirmar' ? 'PAYMENT_SENT' : 'ASK_SLOT';
  } else if (state === 'CONFIRM' && parsed.confirmData) {
    next = parsed.confirmData === 'corrigir' ? 'ASK_NAME' : 'CONFIRM'; // CONFIRMAR tratado no handler (cria consulta + envia pagamento)
  } else {
    next = getNextState(state);
  }

  const updateData: Record<string, unknown> = { flowState: next, lastMessageAt: new Date(), metadata: JSON.stringify(meta) };

  if (parsed.name != null) updateData.name = parsed.name;
  if (parsed.cpf != null) updateData.cpf = parsed.cpf;
  if (parsed.birthDate != null) {
    const d = parsed.birthDate;
    updateData.birthDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  if (parsed.anamnesis != null) updateData.anamnesis = parsed.anamnesis;

  await prisma.whatsAppLead.update({
    where: { id: leadId },
    data: updateData as any,
  });
  return next;
}

/** Busca slots para uma data (ou próximos 7 dias se selectedDate não estiver em metadata). Atualiza lead.metadata.slotOptions. */
export async function buildSlotOptionsAndMessage(leadId: string): Promise<{ message: string; slotOptions: SlotOption[] } | { error: string }> {
  const lead = await prisma.whatsAppLead.findUnique({ where: { id: leadId }, select: { metadata: true } });
  let meta: Record<string, unknown> = {};
  if (lead?.metadata) {
    try {
      meta = JSON.parse(lead.metadata) as Record<string, unknown>;
    } catch {
      // ignore
    }
  }
  const selectedDate = meta.selectedDate as string | undefined;
  const maxSlots = 10;
  const slots: SlotOption[] = [];

  if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    const available = await getAvailableSlots(selectedDate);
    for (const s of available) {
      if (!s.available) continue;
      const [y, m, dayNum] = selectedDate.split('-').map(Number);
      const dateLabel = `${String(dayNum).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      slots.push({
        date: selectedDate,
        time: s.time,
        doctorId: s.doctorId,
        label: s.time,
      });
      if (slots.length >= maxSlots) break;
    }
  } else {
    const todayStr = getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE);
    const [y, m, dayNum] = todayStr.split('-').map(Number);
    for (let d = 0; d < 7 && slots.length < maxSlots; d++) {
      const day = new Date(y, Number(m) - 1, dayNum + d);
      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const available = await getAvailableSlots(dateStr);
      for (const s of available) {
        if (!s.available) continue;
        slots.push({
          date: dateStr,
          time: s.time,
          doctorId: s.doctorId,
          label: `${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)} às ${s.time}`,
        });
        if (slots.length >= maxSlots) break;
      }
    }
  }

  if (slots.length === 0) {
    const todayStr = getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE);
    const isToday = selectedDate === todayStr;
    const dateLabel = selectedDate
      ? (() => {
          const [y, m, d] = selectedDate.split('-').map(Number);
          return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        })()
      : 'esta data';
    const msg = isToday
      ? `📅 *Hoje* tivemos muita demanda e todos os horários já foram preenchidos.\n\nNossos médicos estão com a agenda *cheia* para hoje. Que tal escolher *amanhã* ou outra data? 😊\n\nEnvie a data no formato DD/MM/AAAA (ex.: 11/02/2026).`
      : `📅 Para o dia *${dateLabel}* a demanda foi grande e todos os médicos estão com a agenda *cheia*.\n\nEscolha outra data e garantimos seu atendimento! 😊\n\nEnvie no formato DD/MM/AAAA (ex.: 15/02/2026).`;
    return { error: msg };
  }
  meta.slotOptions = slots;
  await prisma.whatsAppLead.update({
    where: { id: leadId },
    data: { metadata: JSON.stringify(meta), lastMessageAt: new Date() },
  });
  const dateLabel = selectedDate
    ? (() => {
        const [y, m, d] = selectedDate.split('-').map(Number);
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      })()
    : '';
  const lines = [
    dateLabel ? `Perfeito! 🗓️\n\n📅 *Data selecionada:* ${dateLabel}\n\nAgora escolha o horário disponível:\n` : '📅 *Escolha o horário da sua consulta:*\n',
    ...slots.map((s, i) => `${i + 1}️⃣ ${s.time}`),
    '',
    'Responda com o *número* da opção ou informe o *horário* desejado (ex: 14:00) ⏰',
  ];
  return { message: lines.join('\n'), slotOptions: slots };
}

/** Normaliza entrada de horário (ex: "14:00", "9:30", "0930") para "HH:MM" ou null se inválido. */
function normalizeTimeInput(input: string): string | null {
  const t = input.trim();
  const withColon = t.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
  if (withColon) {
    const h = Math.min(23, Math.max(0, parseInt(withColon[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(withColon[2], 10)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const noColon = t.match(/^(\d{3,4})$/);
  if (noColon) {
    const n = noColon[1].padStart(4, '0');
    const h = parseInt(n.slice(0, 2), 10);
    const m = parseInt(n.slice(2, 4), 10);
    if (h <= 23 && m <= 59) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return null;
}

/** Estados do fluxo de captação (perguntas e confirmações). */
const CAPTURE_STATES: WhatsAppFlowState[] = ['ASK_NAME', 'ASK_CPF', 'ASK_BIRTH', 'ASK_ANAMNESIS', 'ASK_DAY', 'ASK_DATE', 'ASK_SLOT', 'CONFIRM_SLOT', 'CONFIRM'];

/** Origem da resposta enviada ao paciente: fluxo (etapas), FAQ, IA ou fallback (IA indisponível). */
export type WhatsAppResponseSource = 'flow' | 'faq' | 'ai' | 'fallback';

/**
 * Processa uma mensagem recebida: cria/atualiza lead, aplica resposta ao fluxo e retorna as mensagens a enviar.
 * Link para concluir cadastro é enviado somente após confirmação do pagamento (webhook).
 */
export async function processIncomingMessage(
  phone: string,
  text: string,
  options: {
    getWelcomeMessage: () => Promise<string>;
    getNextStepsMessage: () => Promise<string | null>;
    origin?: string;
  }
): Promise<{ messagesToSend: string[]; pendingFollowUp?: { message: string; sendAt: Date }; responseSource?: WhatsAppResponseSource }> {
  const trimmed = text.trim();
  let lead = null;
  try {
    lead = await prisma.whatsAppLead.findUnique({ where: { phone } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/birth_date|Could not convert.*DateTime/i.test(msg)) {
      await fixWhatsAppLeadBirthDateIfNeeded(phone);
      lead = await prisma.whatsAppLead.findUnique({ where: { phone } });
    } else {
      throw err;
    }
  }

  const isFirstMessage = !lead;
  if (!lead) {
    lead = await prisma.whatsAppLead.create({
      data: {
        phone,
        rawFirstMessage: trimmed.slice(0, 2000),
        flowState: 'WELCOME',
        lastMessageAt: new Date(),
      },
    });
  } else {
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { lastMessageAt: new Date() },
    });
  }

  let state = lead.flowState as WhatsAppFlowState;
  // Migrar leads antigos que estavam em patologias/anamnese para o novo fluxo (escolha de dia)
  const stateStr = String(lead.flowState || '');
  if (stateStr === 'ASK_PATHOLOGIES' || stateStr === 'ANAMNESE') {
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { flowState: 'ASK_DAY', lastMessageAt: new Date() },
    });
    state = 'ASK_DAY';
  }

  // Sair do modo humano (ou da fila de atendimento) e voltar ao fluxo
  if ((state === 'HUMAN_REQUESTED' || state === 'HUMAN_PENDING_ACCEPT') && wantsBackToBot(trimmed)) {
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { flowState: 'ASK_NAME', agentPhone: null, lastMessageAt: new Date() },
    });
    const backMsg =
      state === 'HUMAN_PENDING_ACCEPT'
        ? 'Pedido de atendimento humano cancelado. Para continuar, digite seu *nome completo*:'
        : 'Voltamos ao atendimento automático. Para continuar, digite seu *nome completo*:';
    return {
      messagesToSend: [
        backMsg,
        getPromptForState('ASK_NAME'),
      ],
    };
  }

  // Aguardando atendente aceitar: paciente só recebe mensagem de espera
  if (state === 'HUMAN_PENDING_ACCEPT') {
    return {
      messagesToSend: ['Aguardando confirmação do atendente. Um momento, por favor. 💚'],
    };
  }

  // Já em atendimento humano: encaminhar mensagem ao atendente e confirmar ao paciente
  if (state === 'HUMAN_REQUESTED') {
    const agentPhone = lead.agentPhone ?? (await getWhatsAppAgentPhones())[0] ?? null;
    if (agentPhone) {
      const label = lead.name ? `${lead.name} (${phone})` : phone;
      const forwardText = `Paciente ${label}:\n\n${trimmed}`;
      try {
        await sendWhatsAppMessage({ to: agentPhone, message: forwardText });
      } catch (e) {
        console.error('[WhatsApp] Falha ao encaminhar para atendente:', e);
      }
    }
    return {
      messagesToSend: ['Mensagem recebida. Um atendente já está te atendendo. 💚'],
    };
  }

  const isRestartKeyword = /^(reiniciar|resetar|começar|iniciar|oi|olá|teste)$/i.test(trimmed);
  if (!isFirstMessage && isRestartKeyword) {
    const welcome = await options.getWelcomeMessage();
    const nextSteps = await options.getNextStepsMessage();
    const messagesToSend: string[] = [];
    if (welcome?.trim()) messagesToSend.push(welcome.trim());
    if (nextSteps?.trim()) messagesToSend.push(nextSteps.trim());
    messagesToSend.push(getPromptForState('ASK_NAME'));
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { flowState: 'ASK_NAME', lastMessageAt: new Date() },
    });
    return { messagesToSend };
  }

  if (isFirstMessage) {
    const welcome = await options.getWelcomeMessage();
    const nextSteps = await options.getNextStepsMessage();
    const messagesToSend: string[] = [];
    if (welcome?.trim()) messagesToSend.push(welcome.trim());
    if (nextSteps?.trim()) messagesToSend.push(nextSteps.trim());
    messagesToSend.push(getPromptForState('ASK_NAME'));
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { flowState: 'ASK_NAME', lastMessageAt: new Date() },
    });
    return { messagesToSend };
  }

  // CONFIRM_SLOT + SIM: confirmação única (já mostrou "Confira seus dados") — criar consulta e enviar pagamento direto (sem estado CONFIRM).
  if (state === 'CONFIRM_SLOT' && /^sim$|confirmar|^ok$/i.test(trimmed)) {
    const result = await createPatientAndConsultationFromLead(lead.id, options.origin);
    if (!result.ok) {
      return { messagesToSend: [`⚠️ ${result.error}`] };
    }
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { flowState: 'PAYMENT_SENT', lastMessageAt: new Date() },
    });
    const pixKey = await getWhatsAppPixKey();
    const paymentLines = [
      'Perfeito! ✅',
      '',
      'Sua consulta foi pré-agendada com sucesso.',
      'Para confirmar, é só realizar o pagamento 👇',
      '',
      '💳 *Pagamento (PIX ou cartão):*',
      result.paymentUrl,
    ];
    if (pixKey) {
      paymentLines.push('', '📋 *PIX (copia e cola):*', pixKey);
    }
    paymentLines.push('', 'Após o pagamento, você receberá a confirmação automática.');
    return { messagesToSend: [paymentLines.join('\n')] };
  }

  // CONFIRM + NÃO/CORRIGIR: voltar para nome
  if (state === 'CONFIRM' && /n[aã]o|nao|corrigir/i.test(trimmed)) {
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { flowState: 'ASK_NAME', lastMessageAt: new Date() },
    });
    return { messagesToSend: ['Para corrigir, digite seu *nome completo* novamente:', getPromptForState('ASK_NAME')] };
  }

  // CONFIRM + SIM: criar paciente/consulta e enviar link de pagamento (mantido para leads que já estavam no estado CONFIRM).
  if (state === 'CONFIRM' && /^sim$|confirmar|^ok$/i.test(trimmed)) {
    const result = await createPatientAndConsultationFromLead(lead.id, options.origin);
    if (!result.ok) {
      return { messagesToSend: [`⚠️ ${result.error}`] };
    }
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { flowState: 'PAYMENT_SENT', lastMessageAt: new Date() },
    });
    const pixKey = await getWhatsAppPixKey();
    const paymentLines = [
      'Perfeito! ✅',
      '',
      'Sua consulta foi pré-agendada com sucesso.',
      'Para confirmar, é só realizar o pagamento 👇',
      '',
      '💳 *Pagamento (PIX ou cartão):*',
      result.paymentUrl,
    ];
    if (pixKey) {
      paymentLines.push('', '📋 *PIX (copia e cola):*', pixKey);
    }
    paymentLines.push('', 'Após o pagamento, você receberá a confirmação automática.');
    return { messagesToSend: [paymentLines.join('\n')] };
  }

  // ASK_SLOT: permitir horário digitado (ex: 14:00) além do número da lista
  if (state === 'ASK_SLOT') {
    const customTime = normalizeTimeInput(trimmed);
    if (customTime) {
      let selectedDate: string | undefined;
      if (lead.metadata) {
        try {
          const meta = JSON.parse(lead.metadata) as { selectedDate?: string };
          selectedDate = meta.selectedDate;
        } catch {
          // ignore
        }
      }
      if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        const allSlots = await getAvailableSlots(selectedDate);
        const match = allSlots.find((s) => s.available && s.time === customTime);
        if (match) {
          let meta: Record<string, unknown> = {};
          if (lead.metadata) {
            try {
              meta = JSON.parse(lead.metadata) as Record<string, unknown>;
            } catch {
              // ignore
            }
          }
          meta.slot = { date: selectedDate, time: match.time, doctorId: match.doctorId };
          await prisma.whatsAppLead.update({
            where: { id: lead.id },
            data: { flowState: 'CONFIRM_SLOT', metadata: JSON.stringify(meta), lastMessageAt: new Date() },
          });
          const updatedLead = await prisma.whatsAppLead.findUnique({ where: { id: lead.id } });
          return { messagesToSend: [buildConfirmSlotMessage(updatedLead || lead)] };
        }
        const slotResult = await buildSlotOptionsAndMessage(lead.id);
        const listMsg = slotResult.error ? await getAskDayMessage() : slotResult.message;
        return {
          messagesToSend: [
            'Esse horário não está disponível 😕',
            'Escolha um *número* da lista ou informe *outro horário*.',
            '',
            listMsg,
          ],
        };
      }
    }
  }

  if (CAPTURE_STATES.includes(state)) {
    // Limpar follow-up pendente ao processar nova mensagem (evita enviar mensagem antiga se o paciente avançou ou fez nova pergunta)
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { pendingFollowUpMessage: null, pendingFollowUpSendAt: null },
    });

    // Pedido para falar com um humano: perguntar apenas aos atendentes livres (não em atendimento)
    if (wantsHumanAgent(trimmed)) {
      let agentPhones: string[] = [];
      try {
        agentPhones = await getWhatsAppAgentPhones();
      } catch (e) {
        console.warn('[WhatsApp] Erro ao obter números dos atendentes:', e);
      }
      const busyAgentPhones = new Set<string>();
      if (agentPhones.length > 0) {
        const inCall = await prisma.whatsAppLead.findMany({
          where: { flowState: 'HUMAN_REQUESTED', agentPhone: { not: null } },
          select: { agentPhone: true },
        });
        for (const row of inCall) {
          if (row.agentPhone) busyAgentPhones.add(formatPhoneNumber(row.agentPhone));
        }
      }
      const freeAgents = agentPhones.filter((p) => !busyAgentPhones.has(formatPhoneNumber(p)));
      try {
        await prisma.whatsAppLead.update({
          where: { id: lead.id },
          data: { flowState: 'HUMAN_PENDING_ACCEPT', agentPhone: null, lastMessageAt: new Date() },
        });
      } catch (updateErr) {
        console.warn('[WhatsApp] Erro ao atualizar lead para HUMAN_PENDING_ACCEPT:', updateErr);
      }
      if (freeAgents.length === 0) {
        const waitMsg = 'Para atendimento humano, por favor aguarde. Em breve alguém irá te atender. 💚';
        return { messagesToSend: [waitMsg] };
      }
      const label = lead.name ? `${lead.name} (${phone})` : phone;
      const toAgent = `Novo pedido de atendimento humano – Paciente ${label}\n\nEle disse: "${trimmed}"\n\nVocê pode atender agora? Responda *SIM* ou *NÃO*.`;
      for (const agentPhone of freeAgents) {
        try {
          await sendWhatsAppMessage({ to: agentPhone, message: toAgent });
        } catch (e) {
          console.error('[WhatsApp] Falha ao notificar atendente', agentPhone, e);
        }
      }
      return { messagesToSend: ['Solicitação de atendimento humano registrada. Um momento, por favor. 💚'] };
    }

    // Dúvidas e perguntas: responde com FAQ/IA e agenda mensagem de retorno ao fluxo para 10s depois (não interrompe se o paciente tiver mais dúvidas).
    // Inclui respostas curtas de conversa (Sim, Não, Ok) quando o passo atual espera dado estruturado (nome, CPF, etc.), para não roubar "Sim" como se fosse resposta ao fluxo.
    if (trimmed.includes('?') || looksLikeQuestion(trimmed) || (isShortConversationalReply(trimmed) && isDataCollectionStep(state))) {
      const faqAnswer = await getWhatsAppFaqAnswer(trimmed);
      const aiAnswer =
        !faqAnswer && (await isWhatsAppAiAvailable())
          ? await getWhatsAppAiReply({
              userMessage: trimmed,
              currentStep: state,
              leadName: lead.name,
            })
          : null;
      const answer = faqAnswer ?? aiAnswer ?? getWhatsAppAiFallbackMessage();
      const responseSource: WhatsAppResponseSource = faqAnswer ? 'faq' : aiAnswer ? 'ai' : 'fallback';

      let currentStepPrompt: string;
      if (state === 'ASK_SLOT') {
        const slotResult = await buildSlotOptionsAndMessage(lead.id);
        currentStepPrompt = slotResult.error ? await getAskDayMessage() : slotResult.message;
      } else if (state === 'CONFIRM_SLOT') {
        currentStepPrompt = buildConfirmSlotMessage(lead);
      } else if (state === 'CONFIRM') {
        currentStepPrompt = buildConfirmMessage(lead);
      } else {
        currentStepPrompt = getPromptForState(state, lead);
      }
      const sendAt = new Date(Date.now() + 10_000); // 10 segundos depois
      return {
        messagesToSend: [answer],
        pendingFollowUp: { message: currentStepPrompt, sendAt },
        responseSource,
      };
    }

    const slotOptions = (state === 'ASK_SLOT' || state === 'CONFIRM_SLOT') && lead.metadata
      ? (() => {
          try {
            const meta = JSON.parse(lead.metadata) as { slotOptions?: SlotOption[] };
            return meta.slotOptions;
          } catch {
            return undefined;
          }
        })()
      : undefined;
    let todayHasSlots: boolean | undefined;
    if (state === 'ASK_DAY') {
      const todayStr = getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE);
      const todaySlots = await getAvailableSlots(todayStr);
      todayHasSlots = todaySlots.some((s) => s.available);
    }
    const parsed = parseAndValidateAnswer(state, trimmed, { slotOptions, todayHasSlots });
    if (!parsed.ok) {
      const friendlyPrefix = isGenericOrOffFlowMessage(trimmed) ? getFriendlyRedirectPrefix(state) : '';
      const errMsg = friendlyPrefix
        ? friendlyPrefix + parsed.error.replace(/^❌\s*/, '')
        : `❌ ${parsed.error}`;
      if (state === 'ASK_ANAMNESIS') return { messagesToSend: [errMsg, getPromptForState('ASK_ANAMNESIS')] };
      if (state === 'ASK_DAY') return { messagesToSend: [errMsg, await getAskDayMessage()] };
      if (state === 'ASK_DATE') return { messagesToSend: [errMsg, getPromptForState('ASK_DATE')] };
      if (state === 'ASK_SLOT') {
        const slotResult = await buildSlotOptionsAndMessage(lead.id);
        if (slotResult.error) {
          await prisma.whatsAppLead.update({
            where: { id: lead.id },
            data: { flowState: 'ASK_DATE', lastMessageAt: new Date() },
          });
          // Mensagem de agenda cheia já pede a data no formato DD/MM/AAAA — não enviar prompt genérico em seguida
          return { messagesToSend: [slotResult.error] };
        }
        return { messagesToSend: [errMsg, slotResult.message] };
      }
      if (state === 'CONFIRM_SLOT') return { messagesToSend: [errMsg, buildConfirmSlotMessage(lead)] };
      if (state === 'CONFIRM') return { messagesToSend: [errMsg, buildConfirmMessage(lead)] };
      return { messagesToSend: [errMsg, getPromptForState(state, lead)] };
    }
    let next = await applyAnswerAndAdvance(lead.id, state, parsed);
    const updatedLead = await prisma.whatsAppLead.findUnique({ where: { id: lead.id } });
    if (!updatedLead) return { messagesToSend: [] };

    let nextPrompt: string;
    if (next === 'ASK_SLOT') {
      const slotResult = await buildSlotOptionsAndMessage(lead.id);
      if (slotResult.error) {
        await prisma.whatsAppLead.update({
          where: { id: lead.id },
          data: { flowState: 'ASK_DATE', lastMessageAt: new Date() },
        });
        // Mensagem de agenda cheia já pede a data no formato DD/MM/AAAA — não enviar prompt genérico em seguida
        return { messagesToSend: [slotResult.error] };
      }
      nextPrompt = slotResult.message;
    } else if (next === 'CONFIRM_SLOT') {
      nextPrompt = buildConfirmSlotMessage(updatedLead);
    } else if (next === 'CONFIRM') {
      nextPrompt = buildConfirmMessage(updatedLead);
    } else if (next === 'ASK_DAY') {
      nextPrompt = await getAskDayMessage();
    } else {
      nextPrompt = getPromptForState(next, updatedLead);
    }
    return { messagesToSend: [nextPrompt] };
  }

  if (state === 'WELCOME') {
    await prisma.whatsAppLead.update({
      where: { id: lead.id },
      data: { flowState: 'ASK_NAME', lastMessageAt: new Date() },
    });
    return { messagesToSend: [getPromptForState('ASK_NAME')] };
  }

  // Pós-fluxo (QUALIFYING, PAYMENT_SENT, SCHEDULED): permitir conversa com IA/FAQ para dúvidas sobre consulta, pagamento, receita etc.
  if (['QUALIFYING', 'PAYMENT_SENT', 'SCHEDULED'].includes(state)) {
    if (trimmed.length >= 2) {
      const faqAnswer = await getWhatsAppFaqAnswer(trimmed);
      const aiAnswer =
        !faqAnswer && (await isWhatsAppAiAvailable())
          ? await getWhatsAppAiReply({
              userMessage: trimmed,
              currentStep: state,
              leadName: lead.name,
            })
          : null;
      const answer = faqAnswer ?? aiAnswer ?? getWhatsAppAiFallbackMessage();
      const responseSource: WhatsAppResponseSource = faqAnswer ? 'faq' : aiAnswer ? 'ai' : 'fallback';
      if (faqAnswer ?? aiAnswer) {
        return {
          messagesToSend: [
            answer,
            '',
            'Para *novo agendamento*, digite: *oi* ou *reiniciar*.',
          ],
          responseSource,
        };
      }
      // IA indisponível e FAQ não encontrou: usar fallback + lembrete
      return {
        messagesToSend: [
          answer,
          '',
          'Para *novo agendamento*, digite: *oi* ou *reiniciar*.',
        ],
        responseSource,
      };
    }
    // Mensagem muito curta: manter resposta fixa acolhedora
    return {
      messagesToSend: [
        'Qualquer dúvida, estou por aqui 💚',
        'Obrigado pela confiança!',
        '',
        'Para *novo agendamento*, digite: *oi* ou *reiniciar*.',
      ],
    };
  }

  return { messagesToSend: [] };
}
