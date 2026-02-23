/**
 * Rótulos e mensagens padrão de lembrete por etapa do funil WhatsApp.
 * Usado na área admin "Lembretes" para quem iniciou conversa mas ainda não fez consulta.
 */

export const FLOW_STATE_LABELS: Record<string, string> = {
  WELCOME: 'Boas-vindas (início)',
  ASK_NAME: 'Pendente: nome',
  ASK_CPF: 'Pendente: CPF',
  ASK_BIRTH: 'Pendente: data nascimento',
  ASK_ANAMNESIS: 'Pendente: motivo da consulta',
  ASK_DAY: 'Pendente: escolher dia',
  ASK_DATE: 'Pendente: data específica',
  ASK_SLOT: 'Pendente: horário',
  CONFIRM_SLOT: 'Pendente: confirmar horário',
  CONFIRM: 'Pendente: confirmar dados',
  QUALIFYING: 'Em qualificação',
  PAYMENT_SENT: 'Aguardando pagamento',
  SCHEDULED: 'Agendado (sem consulta concluída)',
};

/** Mensagem de lembrete sugerida por etapa (quem parou ali). */
export const FLOW_STATE_REMINDER_MESSAGES: Record<string, string> = {
  WELCOME:
    'Oi! 👋 Vi que você entrou em contato. Estamos aqui para ajudar na sua avaliação para cannabis medicinal. Quer continuar? É só responder esta mensagem.',
  ASK_NAME:
    'Oi! 😊 Ficamos na etapa do seu *nome completo*. Quando puder, nos envie para continuarmos o agendamento da sua consulta.',
  ASK_CPF:
    'Oi! Precisamos do seu *CPF* (somente números) para seguir com o agendamento. Seus dados são protegidos e usados apenas para documentação médica.',
  ASK_BIRTH:
    'Oi! Falta só a sua *data de nascimento* (formato DD/MM/AAAA) para continuarmos. Assim que enviar, seguimos para escolher data e horário da consulta.',
  ASK_ANAMNESIS:
    'Oi! Estamos quase lá. Conte em poucas palavras seu *motivo da consulta* ou histórico (sintomas, medicamentos). Depois escolhemos juntos a melhor data e horário.',
  ASK_DAY:
    'Oi! Agora é só escolher quando prefere a consulta: *1* Hoje, *2* Amanhã ou *3* Outra data. Responda com o número da opção.',
  ASK_DATE:
    'Oi! Qual *data* você prefere para a consulta? Envie no formato DD/MM/AAAA (ex: 15/03/2026).',
  ASK_SLOT:
    'Oi! Escolha um dos *horários* disponíveis que enviamos (responda com o número da opção) para confirmarmos sua consulta.',
  CONFIRM_SLOT:
    'Oi! Confirme o *horário* escolhido respondendo SIM para seguirmos ao pagamento e finalizar seu agendamento.',
  CONFIRM:
    'Oi! Estamos no último passo: confirme seus *dados e horário* respondendo SIM. Em seguida enviamos o link para pagamento e conclusão do cadastro.',
  QUALIFYING:
    'Oi! Sua solicitação está em análise. Em breve retornamos com os próximos passos para agendar sua consulta.',
  PAYMENT_SENT:
    'Oi! Lembrando: após o pagamento ser confirmado, enviamos o link para concluir seu cadastro e a confirmação da consulta. Qualquer dúvida, estamos aqui.',
  SCHEDULED:
    'Oi! Sua consulta já está agendada. Não esqueça da data e horário. Se precisar remarcar ou tiver dúvidas, responda esta mensagem.',
};

/**
 * Retorna o texto de lembrete para uma etapa (e opcionalmente personaliza com o nome).
 * Se customMessages for passado, usa esses textos; senão usa os padrões.
 */
export function getReminderMessageForState(
  flowState: string,
  leadName?: string | null,
  customMessages?: Record<string, string>
): string {
  const source = customMessages ?? FLOW_STATE_REMINDER_MESSAGES;
  const base = source[flowState] ?? source.WELCOME ?? FLOW_STATE_REMINDER_MESSAGES.WELCOME;
  if (leadName && typeof leadName === 'string' && leadName.trim() && base.includes('Oi!')) {
    return base.replace('Oi!', `Oi, ${leadName.trim()}!`);
  }
  return base;
}
