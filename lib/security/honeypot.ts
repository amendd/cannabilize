/**
 * Validação de Honeypot Fields
 * 
 * Honeypot é um campo invisível que humanos não veem,
 * mas bots tendem a preencher. Se preenchido = bot detectado.
 */

/**
 * Valida se honeypot field está vazio (como deveria ser)
 * 
 * @param honeypotValue Valor do campo honeypot
 * @returns true se seguro (campo vazio), false se bot detectado
 */
export function validateHoneypot(honeypotValue: string | undefined | null): {
  isValid: boolean;
  reason?: string;
} {
  // Se não foi enviado, considerar válido (campo pode não existir em todos os forms)
  if (honeypotValue === undefined || honeypotValue === null) {
    return { isValid: true };
  }

  // Se foi preenchido (mesmo que seja só espaços), é bot
  const trimmed = typeof honeypotValue === 'string' ? honeypotValue.trim() : String(honeypotValue).trim();
  
  if (trimmed.length > 0) {
    return {
      isValid: false,
      reason: 'Honeypot field foi preenchido - possível bot detectado',
    };
  }

  return { isValid: true };
}

/**
 * Gera nome aleatório para campo honeypot
 * Nomes comuns que bots tendem a preencher
 */
export function generateHoneypotFieldName(): string {
  const commonNames = [
    'website',
    'url',
    'homepage',
    'email_confirm',
    'phone_confirm',
    'company',
    'address',
    'comment',
  ];

  // Em produção, pode usar um nome fixo ou rotacionar
  // Por segurança, usar nome fixo mas não óbvio
  return 'website_url';
}
