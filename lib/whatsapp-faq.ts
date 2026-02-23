/**
 * FAQ no fluxo WhatsApp: quando o usuário pergunta algo durante o agendamento
 * (valor, como funciona, documentos, etc.), respondemos e em seguida reenviamos
 * o passo atual para não interromper o fluxo.
 */

import { getConsultationDefaultAmount } from './consultation-price';

export type WhatsAppFaqEntry = {
  /** Padrões que identificam a dúvida (primeira correspondência ganha). */
  triggers: RegExp[];
  /** Resposta curta para WhatsApp. Pode ser função async (ex.: para usar preço dinâmico). */
  answer: string | ((opts: { priceFormatted: string }) => Promise<string>);
};

/** Lista de FAQs: ordem importa (primeira correspondência). */
const FAQ_ENTRIES: WhatsAppFaqEntry[] = [
  {
    triggers: [
      /(qual\s+)?(o\s+)?valor|quanto\s+custa|pre[cç]o\s+(da\s+)?consulta|valor\s+da\s+consulta|r\$\s*\d*/i,
      /quanto\s+(é|e)\s+(o\s+)?pagamento/i,
    ],
    answer: async ({ priceFormatted }) =>
      `💰 A consulta médica custa *${priceFormatted}*. O pagamento é por PIX ou cartão, via link que envio após você confirmar os dados. O medicamento (importação) tem custo à parte; a equipe te orienta em tudo.`,
  },
  {
    triggers: [
      /como\s+(fa[cç]o|fazer)\s+o\s+pagamento|forma\s+de\s+pagamento|como\s+pagar/i,
      /aceita\s+pix|pix\s+ou\s+cart[aã]o/i,
    ],
    answer:
      '💳 Após confirmar nome, CPF, data e horário, você recebe um *link para pagamento* (PIX ou cartão). É rápido e seguro.',
  },
  {
    triggers: [
      /como\s+funciona\s+(a\s+)?consulta|consulta\s+online|consultas?\s+funciona/i,
      /é\s+por\s+videochamada|videochamada|google\s+meet/i,
    ],
    answer:
      '📹 A consulta é *100% online* (Google Meet), em torno de 15 minutos. Você agenda, preenche um breve histórico e no dia recebe o link da videoconferência.',
  },
  {
    triggers: [
      /(é\s+)?legal|anvisa|pol[ií]cia|receita\s+m[eé]dica|posso\s+ter\s+problema/i,
      /regulamentad[oa]|autoriza[cç][aã]o/i,
    ],
    answer:
      '✅ Sim. O uso de cannabis medicinal é regulamentado pela ANVISA. Com receita e autorização, o uso e a importação são legais. A CannabiLize cuida de toda a documentação.',
  },
  {
    triggers: [
      /quanto\s+tempo\s+(leva|demora)|prazo\s+(da\s+)?receita|receita\s+em\s+quanto\s+tempo/i,
      /quando\s+recebo\s+a\s+receita/i,
    ],
    answer:
      '⏱️ Se aprovado na consulta, a *receita* é emitida em até 10 minutos após o término. Você recebe por e-mail.',
  },
  {
    triggers: [
      /importa[cç][aã]o|como\s+funciona\s+(o\s+)?processo|entrega|prazo\s+de\s+entrega/i,
      /medicamento\s+chega|demora\s+pra\s+chegar/i,
    ],
    answer:
      '📦 Após a receita, a equipe te auxilia em tudo: autorização ANVISA, documentação e importação. O medicamento vem dos EUA (isenção de impostos). Entrega em até *15 dias úteis* após aprovação.',
  },
  {
    triggers: [
      /(quais\s+)?documentos?|o\s+que\s+preciso\s+levar|preciso\s+de\s+qual\s+documento/i,
      /rg|cpf|laudo|exames?\s+necess[aá]rio/i,
    ],
    answer:
      '📄 Para agendar: nome, CPF, data de nascimento e um breve motivo da consulta. Exames e laudos anteriores você pode enviar pelo link da consulta (opcional).',
  },
  {
    triggers: [
      /hor[aá]rio(s)?\s+(dispon[ií]vel|de\s+atendimento)|quando\s+posso\s+agendar/i,
      /quais\s+hor[aá]rios|que\s+horas\s+atendem/i,
    ],
    answer:
      '🗓️ Depois de informar nome, CPF, nascimento e motivo, te envio as *datas e horários* disponíveis para você escolher. Os horários variam conforme a agenda dos médicos.',
  },
  {
    triggers: [
      /(a\s+)?cannabilize\s+é\s+confi[aá]vel|são\s+confi[aá]veis|é\s+seguro/i,
      /onde\s+ficam|endere[cç]o|sede/i,
    ],
    answer:
      '🌿 A CannabiLize é referência em cannabis medicinal no Brasil: milhares de atendimentos e nota 4.9. Toda a documentação é regular e a equipe te acompanha no processo.',
  },
  {
    triggers: [
      /primeira\s+consulta|j[aá]\s+fui\s+paciente|j[aá]\s+consultei/i,
      /retorno|consulta\s+de\s+retorno/i,
    ],
    answer:
      '🩺 Por aqui fazemos o agendamento da consulta. Se já é paciente, use o link que enviamos ou acesse a plataforma com seu login. Para *novo agendamento*, é só seguir os passos que eu te envio 😊',
  },
  // Genérico "ajuda/dúvida": só quando o usuário pede ajuda de forma vaga (não quando pergunta "X ajuda Y?").
  // Evita que qualquer pergunta com a palavra "ajuda" (ex.: "o oleo de cbd ajuda quem tem ansiedade?") caia no FAQ e impeça a IA de responder.
  {
    triggers: [
      /(pode\s+me\s+ajudar|quero\s+tirar\s+(uma\s+)?(duvida|dúvida))/i,
      /^(me\s+ajuda|preciso\s+de\s+ajuda|quero\s+ajuda|preciso\s+ajudar)\s*\??$/i,
      /^(n[aã]o\s+)?entendi\s*\??$|^explica\s+(pra\s+mim|para\s+mim)\s*\??$/i,
      /^(tem\s+)?(mais\s+)?(alguma\s+)?(outra\s+)?(duvida|dúvida)s?\s*\??$/i,
      /^(posso\s+)?tirar\s+(uma\s+)?(duvidas?|dúvidas?)\s*\??$/i,
      /^dúvida\s*:?\s*$|^duvida\s*:?\s*$/i,
    ],
    answer:
      'Claro! Pode perguntar à vontade 💚 Se for sobre *valor, pagamento, documentos, receita ou como funciona a consulta*, respondo aqui. Qualquer outra coisa, um atendente pode te ajudar.',
  },
];

/** Formata preço para exibição (R$ 50,00). */
async function getPriceFormatted(): Promise<string> {
  const amount = await getConsultationDefaultAmount();
  return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Verifica se a mensagem parece uma pergunta/dúvida (FAQ).
 * Retorna a resposta pronta para enviar ou null.
 * Quando retorna resposta, o fluxo deve reenviar o passo atual (não avança estado).
 */
export async function getWhatsAppFaqAnswer(text: string): Promise<string | null> {
  const t = text.trim();
  if (t.length < 3) return null;

  const priceFormatted = await getPriceFormatted();

  for (const entry of FAQ_ENTRIES) {
    const matched = entry.triggers.some((r) => r.test(t));
    if (!matched) continue;

    if (typeof entry.answer === 'function') {
      return entry.answer({ priceFormatted });
    }
    return entry.answer;
  }

  return null;
}

/**
 * Indica se a mensagem parece uma pergunta (interrogação ou frases típicas).
 * Usado para tentar FAQ/IA antes de tratar como resposta do fluxo.
 * Não exige "?" — frases como "Você gosta de viajar" também são tratadas como pergunta.
 */
export function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  if (t.length < 4) return false;
  if (t.includes('?')) return true;
  const lower = t.toLowerCase();
  const questionStarters = [
    'quanto', 'qual', 'quais', 'como', 'quando', 'onde', 'por que', 'porque',
    'é legal', 'é seguro', 'tem ', 'preciso', 'preciso de', 'qual o', 'qual a',
    'aceita', 'custa', 'valor', 'preço', 'funciona', 'documentos', 'horário',
    'prazo', 'entrega', 'receita', 'importação', 'ajuda', 'dúvida',
  ];
  if (questionStarters.some((q) => lower.startsWith(q) || lower.includes(` ${q}`))) return true;
  // Frases que são claramente pergunta mesmo sem "?" (prioridade para IA/FAQ)
  const questionPhrases = [
    'você gosta', 'gosta de', 'você acha', 'acha que', 'você sabe', 'sabe se', 'sabe qual',
    'é verdade', 'será que', 'tem como', 'dá pra', 'da pra', 'consegue', 'pode me dizer',
    'queria saber', 'quero saber', 'me diz', 'me fala', 'explique', 'explica ',
    'o que acha', 'o que você', 'isso ajuda', 'ajuda em', 'ajuda quem', 'ajuda para',
  ];
  return questionPhrases.some((q) => lower.includes(q));
}

/** Passos em que o fluxo espera dado estruturado (nome, CPF, data, etc.). Em CONFIRM_SLOT/CONFIRM, "Sim" é resposta válida. */
const DATA_COLLECTION_STATES = ['ASK_NAME', 'ASK_CPF', 'ASK_BIRTH', 'ASK_ANAMNESIS'] as const;

/**
 * Indica se a mensagem é uma resposta curta de conversa (ex.: "Sim", "Não", "Ok") que pode ser
 * resposta à IA e não ao fluxo. Usado para não roubar "Sim" para o passo ASK_CPF quando o paciente
 * estava respondendo à pergunta da IA.
 */
export function isShortConversationalReply(text: string): boolean {
  const t = text.trim();
  if (t.length > 25) return false;
  const lower = t.toLowerCase();
  const replies = [
    'sim', 's', 'não', 'nao', 'n', 'ok', 'claro', 'quero', 'não quero', 'nao quero',
    'talvez', 'acho que sim', 'acho que não', 'pode ser', 'com certeza', 'certamente',
    'quero saber', 'queria saber', 'pode ser', 'com certeza',
  ];
  return replies.some((r) => lower === r || lower.replace(/\s+/g, ' ').trim() === r);
}

export function isDataCollectionStep(state: string): boolean {
  return (DATA_COLLECTION_STATES as readonly string[]).includes(state);
}
