/**
 * Sanitização de Inputs
 * 
 * Remove scripts, tags perigosas e caracteres maliciosos
 * para prevenir XSS e injection attacks.
 */

/**
 * Remove tags HTML perigosas e scripts
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  // Remover tags script e style
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remover atributos perigosos (onclick, onerror, etc)
  sanitized = sanitized.replace(
    /\s*on\w+\s*=\s*["'][^"']*["']/gi,
    ''
  );

  // Remover javascript: e data: URLs perigosas
  sanitized = sanitized.replace(
    /(javascript|data|vbscript):/gi,
    ''
  );

  return sanitized;
}

/**
 * Sanitiza string removendo caracteres especiais perigosos
 */
export function sanitizeString(input: string, allowSpecialChars: boolean = false): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  let sanitized = input.trim();

  // Remover caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  if (!allowSpecialChars) {
    // Remover caracteres especiais perigosos
    sanitized = sanitized.replace(/[<>'"&]/g, '');
  }

  return sanitized;
}

/**
 * Sanitiza email removendo caracteres inválidos
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, '');
}

/**
 * Sanitiza telefone removendo caracteres não numéricos
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  return phone.replace(/\D/g, '');
}

/**
 * Sanitiza CPF removendo caracteres não numéricos
 */
export function sanitizeCPF(cpf: string): string {
  if (typeof cpf !== 'string') {
    return '';
  }

  return cpf.replace(/\D/g, '');
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    sanitizeHtml?: boolean;
    allowedFields?: string[];
    maxLength?: number;
  } = {}
): Partial<T> {
  const { sanitizeHtml: shouldSanitizeHtml = true, allowedFields, maxLength = 10000 } = options;
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Se há lista de campos permitidos, pular campos não permitidos
    if (allowedFields && !allowedFields.includes(key)) {
      continue;
    }

    if (typeof value === 'string') {
      let sanitizedValue = shouldSanitizeHtml ? sanitizeHtml(value) : sanitizeString(value);
      
      // Limitar tamanho
      if (sanitizedValue.length > maxLength) {
        sanitizedValue = sanitizedValue.substring(0, maxLength);
      }

      sanitized[key] = sanitizedValue;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? (shouldSanitizeHtml ? sanitizeHtml(item) : sanitizeString(item))
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as Partial<T>;
}

/**
 * Valida tamanho máximo de payload
 */
export function validatePayloadSize(payload: any, maxSizeKB: number = 100): {
  valid: boolean;
  size: number;
  reason?: string;
} {
  const jsonString = JSON.stringify(payload);
  const sizeBytes = new Blob([jsonString]).size;
  const sizeKB = sizeBytes / 1024;

  if (sizeKB > maxSizeKB) {
    return {
      valid: false,
      size: sizeKB,
      reason: `Payload muito grande: ${sizeKB.toFixed(2)}KB (máximo: ${maxSizeKB}KB)`,
    };
  }

  return {
    valid: true,
    size: sizeKB,
  };
}
