/**
 * Validação reCAPTCHA v3
 * 
 * Este módulo valida tokens reCAPTCHA v3 do Google
 * para proteger formulários contra bots.
 */

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

/**
 * Valida token reCAPTCHA v3
 * 
 * @param token Token reCAPTCHA recebido do cliente
 * @param action Ação que está sendo validada (ex: 'submit_form')
 * @param threshold Score mínimo aceitável (0.0 a 1.0, padrão: 0.5)
 * @returns Objeto com sucesso e score
 */
export async function verifyRecaptcha(
  token: string,
  action: string = 'submit_form',
  threshold?: number
): Promise<{ success: boolean; score: number; reason?: string }> {
  // Buscar configuração do banco ou usar padrão
  const { getRecaptchaConfig } = await import('./recaptcha-config');
  const config = await getRecaptchaConfig();
  
  // Se não fornecido, usar da configuração
  const finalThreshold = threshold ?? config.threshold;
  const secretKey = config.secretKey || process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('RECAPTCHA_SECRET_KEY não configurada. Validação desabilitada.');
    // Em desenvolvimento, permite passar sem validação
    if (process.env.NODE_ENV === 'development') {
      return { success: true, score: 1.0 };
    }
    return { success: false, score: 0, reason: 'reCAPTCHA não configurado' };
  }

  if (!token) {
    return { success: false, score: 0, reason: 'Token reCAPTCHA não fornecido' };
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      const errors = data['error-codes'] || [];
      return {
        success: false,
        score: 0,
        reason: `Erro na validação: ${errors.join(', ')}`,
      };
    }

    // Verificar se a ação corresponde
    if (data.action !== action) {
      return {
        success: false,
        score: data.score,
        reason: `Ação não corresponde: esperado ${action}, recebido ${data.action}`,
      };
    }

    // Verificar score (quanto maior, mais confiável)
    if (data.score < threshold) {
      return {
        success: false,
        score: data.score,
        reason: `Score muito baixo: ${data.score} (mínimo: ${threshold})`,
      };
    }

    return {
      success: true,
      score: data.score,
    };
  } catch (error) {
    console.error('Erro ao validar reCAPTCHA:', error);
    return {
      success: false,
      score: 0,
      reason: 'Erro ao conectar com serviço reCAPTCHA',
    };
  }
}

/**
 * Obtém threshold recomendado para tipo de formulário
 */
export function getRecaptchaThreshold(formType: 'appointment' | 'login' | 'contact' | 'register'): number {
  const thresholds: Record<string, number> = {
    appointment: 0.5,
    login: 0.3,
    contact: 0.4,
    register: 0.5,
  };

  return thresholds[formType] || 0.5;
}
