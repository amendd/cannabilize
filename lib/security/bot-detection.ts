/**
 * Detecção de Bots
 * 
 * Análise combinada de múltiplos fatores para detectar bots
 */

interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0.0 a 1.0
  reasons: string[];
  score: number; // Score final (quanto maior, mais suspeito)
}

interface DetectionFactors {
  recaptchaScore?: number; // 0.0 a 1.0 (quanto menor, mais suspeito)
  honeypotFilled?: boolean;
  fillTimeSeconds?: number; // Tempo para preencher formulário
  minFillTime?: number; // Tempo mínimo esperado
  rateLimitExceeded?: boolean;
  userAgent?: string;
  headers?: Record<string, string>;
}

/**
 * Detecta se é bot baseado em múltiplos fatores
 */
export function detectBot(factors: DetectionFactors): BotDetectionResult {
  const reasons: string[] = [];
  let score = 0;
  let confidence = 0;

  // Fator 1: reCAPTCHA score (peso: 40%)
  if (factors.recaptchaScore !== undefined) {
    if (factors.recaptchaScore < 0.3) {
      score += 40;
      confidence += 0.4;
      reasons.push(`Score reCAPTCHA muito baixo: ${factors.recaptchaScore}`);
    } else if (factors.recaptchaScore < 0.5) {
      score += 20;
      confidence += 0.2;
      reasons.push(`Score reCAPTCHA baixo: ${factors.recaptchaScore}`);
    }
  }

  // Fator 2: Honeypot preenchido (peso: 30%)
  if (factors.honeypotFilled) {
    score += 30;
    confidence += 0.3;
    reasons.push('Honeypot field foi preenchido');
  }

  // Fator 3: Tempo de preenchimento (peso: 20%)
  if (factors.fillTimeSeconds !== undefined && factors.minFillTime !== undefined) {
    if (factors.fillTimeSeconds < factors.minFillTime) {
      const timeDiff = factors.minFillTime - factors.fillTimeSeconds;
      score += Math.min(20, timeDiff * 2); // Máximo 20 pontos
      confidence += Math.min(0.2, timeDiff * 0.02);
      reasons.push(
        `Preenchimento muito rápido: ${factors.fillTimeSeconds}s (mínimo esperado: ${factors.minFillTime}s)`
      );
    }
  }

  // Fator 4: Rate limit excedido (peso: 10%)
  if (factors.rateLimitExceeded) {
    score += 10;
    confidence += 0.1;
    reasons.push('Rate limit excedido');
  }

  // Fator 5: User-Agent suspeito
  if (factors.userAgent) {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(factors.userAgent!))) {
      score += 5;
      confidence += 0.05;
      reasons.push(`User-Agent suspeito: ${factors.userAgent}`);
    }
  }

  // Normalizar confidence (0.0 a 1.0)
  confidence = Math.min(1.0, confidence);

  // Considerar bot se score >= 30 ou confidence >= 0.3
  const isBot = score >= 30 || confidence >= 0.3;

  return {
    isBot,
    confidence,
    reasons,
    score,
  };
}

/**
 * Calcula tempo mínimo esperado para preencher formulário
 * baseado no número de campos
 */
export function calculateMinFillTime(fieldCount: number): number {
  // Base: 5 segundos
  // + 2 segundos por campo (tempo médio para ler e preencher)
  return Math.max(5, 5 + fieldCount * 2);
}

/**
 * Valida tempo de preenchimento
 */
export function validateFillTime(
  startTime: number,
  endTime: number,
  minSeconds: number
): {
  valid: boolean;
  fillTime: number;
  reason?: string;
} {
  const fillTime = (endTime - startTime) / 1000; // Converter para segundos

  if (fillTime < minSeconds) {
    return {
      valid: false,
      fillTime,
      reason: `Tempo de preenchimento muito rápido: ${fillTime.toFixed(1)}s (mínimo: ${minSeconds}s)`,
    };
  }

  // Também verificar se não é muito longo (sessão abandonada)
  const maxSeconds = 30 * 60; // 30 minutos
  if (fillTime > maxSeconds) {
    return {
      valid: false,
      fillTime,
      reason: `Tempo de preenchimento muito longo: ${fillTime.toFixed(1)}s (máximo: ${maxSeconds}s)`,
    };
  }

  return {
    valid: true,
    fillTime,
  };
}
