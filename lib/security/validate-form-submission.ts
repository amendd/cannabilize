/**
 * Validação Completa de Submissão de Formulário
 * 
 * Integra todas as camadas de segurança para validar submissões de formulários
 */

import { verifyRecaptcha, getRecaptchaThreshold } from './recaptcha';
import { validateHoneypot } from './honeypot';
import { checkRateLimit, getRateLimitConfig, getClientIP } from './rate-limit';
import { detectBot, validateFillTime, calculateMinFillTime } from './bot-detection';
import { sanitizeObject, validatePayloadSize } from './sanitize';
import { logSecurityEvent, SecurityEventType } from './security-logger';

export interface FormSubmissionData {
  recaptchaToken?: string;
  honeypot?: string;
  formStartTime?: number; // Timestamp quando formulário foi carregado
  [key: string]: any;
}

export interface ValidationOptions {
  formType: 'appointment' | 'login' | 'contact' | 'register';
  requireRecaptcha?: boolean;
  requireHoneypot?: boolean;
  requireFillTime?: boolean;
  fieldCount?: number; // Número de campos no formulário
  allowedFields?: string[]; // Campos permitidos (para sanitização)
  maxPayloadSizeKB?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    recaptchaScore?: number;
    fillTime?: number;
    ip: string;
    userAgent?: string;
  };
}

/**
 * Valida submissão de formulário completa
 */
export async function validateFormSubmission(
  data: FormSubmissionData,
  request: Request | { headers: Headers },
  options: ValidationOptions
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: ValidationResult['metadata'] = {
    ip: getClientIP(request),
    userAgent: request.headers instanceof Headers
      ? request.headers.get('user-agent') || undefined
      : (request as any).headers?.['user-agent'],
  };

  const {
    formType,
    requireRecaptcha = true,
    requireHoneypot = true,
    requireFillTime = true,
    fieldCount = 5,
    allowedFields,
    maxPayloadSizeKB = 100,
  } = options;

  // Verificar se reCAPTCHA está habilitado no sistema
  const { getRecaptchaConfig } = await import('./recaptcha-config');
  const recaptchaConfig = await getRecaptchaConfig();
  const shouldRequireRecaptcha = requireRecaptcha && recaptchaConfig.enabled;

  // 1. Validar tamanho do payload
  const payloadValidation = validatePayloadSize(data, maxPayloadSizeKB);
  if (!payloadValidation.valid) {
    errors.push(payloadValidation.reason || 'Payload muito grande');
    logSecurityEvent(
      SecurityEventType.INVALID_INPUT,
      metadata.ip,
      formType,
      { reason: payloadValidation.reason, size: payloadValidation.size },
      metadata.userAgent
    );
    return {
      valid: false,
      errors,
      warnings,
      metadata,
    };
  }

  // 2. Sanitizar inputs
  const sanitizedData = sanitizeObject(data, {
    sanitizeHtml: true,
    allowedFields,
    maxLength: 10000,
  });

  // 3. Rate limiting
  const rateLimitConfig = getRateLimitConfig(formType);
  const rateLimitResult = checkRateLimit(metadata.ip, rateLimitConfig);
  
  if (!rateLimitResult.allowed) {
    errors.push(rateLimitResult.reason || 'Muitas requisições. Tente novamente mais tarde.');
    logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      metadata.ip,
      formType,
      {
        retryAfter: rateLimitResult.retryAfter,
        remaining: rateLimitResult.remaining,
      },
      metadata.userAgent
    );
    return {
      valid: false,
      errors,
      warnings,
      metadata,
    };
  }

  // 4. Validar reCAPTCHA
  let recaptchaScore: number | undefined;
  if (shouldRequireRecaptcha) {
    if (!data.recaptchaToken) {
      errors.push('Token reCAPTCHA não fornecido');
      logSecurityEvent(
        SecurityEventType.RECAPTCHA_FAILED,
        metadata.ip,
        formType,
        { reason: 'Token não fornecido' },
        metadata.userAgent
      );
    } else {
      const threshold = getRecaptchaThreshold(formType);
      const recaptchaResult = await verifyRecaptcha(
        data.recaptchaToken,
        `submit_${formType}`,
        threshold
      );

      recaptchaScore = recaptchaResult.score;

      if (!recaptchaResult.success) {
        errors.push(recaptchaResult.reason || 'Validação reCAPTCHA falhou');
        logSecurityEvent(
          SecurityEventType.RECAPTCHA_FAILED,
          metadata.ip,
          formType,
          {
            reason: recaptchaResult.reason,
            score: recaptchaResult.score,
            threshold,
          },
          metadata.userAgent
        );
      } else if (recaptchaResult.score < threshold + 0.2) {
        // Score baixo mas ainda aceito
        warnings.push(`Score reCAPTCHA baixo: ${recaptchaResult.score.toFixed(2)}`);
      }
    }
  }

  // 5. Validar Honeypot
  let honeypotFilled = false;
  if (requireHoneypot) {
    const honeypotValue = data.honeypot || sanitizedData.honeypot;
    const honeypotResult = validateHoneypot(honeypotValue);

    if (!honeypotResult.isValid) {
      honeypotFilled = true;
      errors.push('Atividade suspeita detectada');
      logSecurityEvent(
        SecurityEventType.HONEYPOT_TRIGGERED,
        metadata.ip,
        formType,
        { reason: honeypotResult.reason },
        metadata.userAgent
      );
    }
  }

  // 6. Validar tempo de preenchimento
  let fillTime: number | undefined;
  if (requireFillTime && data.formStartTime) {
    const minFillTime = calculateMinFillTime(fieldCount);
    const fillTimeResult = validateFillTime(
      data.formStartTime,
      Date.now(),
      minFillTime
    );

    fillTime = fillTimeResult.fillTime;

    if (!fillTimeResult.valid) {
      warnings.push(fillTimeResult.reason || 'Tempo de preenchimento suspeito');
    }
  }

  // 7. Detecção combinada de bot
  const botDetection = detectBot({
    recaptchaScore,
    honeypotFilled,
    fillTimeSeconds: fillTime,
    minFillTime: requireFillTime ? calculateMinFillTime(fieldCount) : undefined,
    rateLimitExceeded: !rateLimitResult.allowed,
    userAgent: metadata.userAgent,
  });

  if (botDetection.isBot) {
    errors.push('Atividade automatizada detectada');
    logSecurityEvent(
      SecurityEventType.BOT_DETECTED,
      metadata.ip,
      formType,
      {
        confidence: botDetection.confidence,
        score: botDetection.score,
        reasons: botDetection.reasons,
      },
      metadata.userAgent
    );
  }

  // Se há erros críticos, bloquear
  if (errors.length > 0) {
    logSecurityEvent(
      SecurityEventType.BLOCKED_REQUEST,
      metadata.ip,
      formType,
      { errors, warnings },
      metadata.userAgent
    );

    return {
      valid: false,
      errors,
      warnings,
      metadata: {
        ...metadata,
        recaptchaScore,
        fillTime,
      },
    };
  }

  // Sucesso
  return {
    valid: true,
    errors: [],
    warnings,
    metadata: {
      ...metadata,
      recaptchaScore,
      fillTime,
    },
  };
}

/**
 * Helper para extrair dados do formulário da requisição
 */
export async function extractFormData(request: Request): Promise<FormSubmissionData> {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const data: FormSubmissionData = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value.toString();
      }
      return data;
    }
    
    return {};
  } catch (error) {
    console.error('Erro ao extrair dados do formulário:', error);
    return {};
  }
}
