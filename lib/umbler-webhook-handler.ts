/**
 * Lógica dinâmica do webhook Umbler: FAQ e pedido explícito de humano.
 * Evita respostas redundantes e garante que "transferir para humano" só seja sugerido
 * quando o paciente pedir de forma clara.
 */

/** Frases que indicam pedido explícito de atendente humano. Só essas devem levar à transferência. */
const PEDIDO_HUMANO_PATTERNS = [
  /quero\s+falar\s+com\s+(um\s+)?(humano|atendente|alguém|pessoa)/i,
  /falar\s+com\s+(um\s+)?(humano|atendente|alguém)/i,
  /preciso\s+de\s+um\s+atendente/i,
  /pessoa\s+real/i,
  /não\s+quero\s+bot/i,
  /atendente\s+humano/i,
  /quero\s+reclamar/i,
  /falar\s+com\s+alguém\s+da\s+equipe/i,
];

/** Perguntas frequentes: padrão → resposta única (evita transferência indevida). */
const FAQ: { pattern: RegExp; response: string }[] = [
  {
    pattern: /como\s+(faço|fazer)\s+o\s+pagamento|forma\s+de\s+pagamento|como\s+pagar/i,
    response:
      'Após confirmar o agendamento você receberá um *link para pagamento* (PIX ou cartão). Se já confirmou e não recebeu, verifique o e-mail ou peça para falar com um atendente.',
  },
  {
    pattern: /(qual\s+)?(o\s+)?valor|quanto\s+custa|preço\s+da\s+consulta|r\$\s*\d*/i,
    response: 'A consulta médica online custa *R$ 50*. O pagamento é feito por PIX ou cartão, via link enviado após a confirmação dos dados.',
  },
  {
    pattern: /horário\s+disponível|horários\s+disponíveis|quando\s+posso\s+agendar/i,
    response:
      'Após informar nome, CPF, data de nascimento, patologias e breve anamnese, te envio as opções de data e horário para você escolher.',
  },
  {
    pattern: /(é\s+)?legal|anvisa|polícia|receita\s+médica/i,
    response:
      'Sim. O uso de cannabis medicinal é regulamentado pela ANVISA. Com receita médica e autorização, o uso e a importação são legais. A CannabiLize cuida de toda a documentação.',
  },
];

/**
 * Verifica se a mensagem é um pedido explícito para falar com um humano.
 * Retorna a mensagem de transferência ou null.
 */
export function getTransferToHumanResponse(text: string): string | null {
  const t = text.trim();
  if (t.length < 3) return null;
  for (const pattern of PEDIDO_HUMANO_PATTERNS) {
    if (pattern.test(t)) {
      return 'Vou te conectar com um atendente. Um momento, por favor.';
    }
  }
  return null;
}

/**
 * Verifica se a mensagem é uma pergunta frequente (FAQ).
 * Retorna a resposta única ou null (aí o fluxo normal segue).
 */
export function getFaqResponse(text: string): string | null {
  const t = text.trim();
  if (t.length < 2) return null;
  for (const faq of FAQ) {
    if (faq.pattern.test(t)) {
      return faq.response;
    }
  }
  return null;
}

/**
 * Decide se devemos responder com FAQ, transferência para humano, ou deixar o fluxo normal tratar.
 * Ordem: 1) pedido explícito de humano → uma mensagem de transferência;
 *        2) FAQ → uma mensagem de resposta;
 *        3) null → usar processIncomingMessage (fluxo de captação).
 */
export function getUmblerQuickResponse(text: string): string | null {
  const transfer = getTransferToHumanResponse(text);
  if (transfer) return transfer;
  return getFaqResponse(text);
}
