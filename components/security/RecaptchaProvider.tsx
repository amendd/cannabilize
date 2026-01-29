'use client';

/**
 * Provider reCAPTCHA v3
 * 
 * Carrega o script do Google reCAPTCHA e fornece função para executar
 */

import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface RecaptchaProviderProps {
  children: React.ReactNode;
  siteKey: string;
}

export default function RecaptchaProvider({ children, siteKey }: RecaptchaProviderProps) {
  useEffect(() => {
    // Carregar script do reCAPTCHA
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Limpar script ao desmontar
      const existingScript = document.querySelector(
        `script[src*="recaptcha/api.js"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [siteKey]);

  return <>{children}</>;
}

/**
 * Hook para executar reCAPTCHA
 */
export function useRecaptcha(siteKey: string) {
  const executeRecaptcha = useCallback(
    async (action: string = 'submit_form'): Promise<string | null> => {
      if (!siteKey) {
        console.warn('reCAPTCHA site key não configurada');
        return null;
      }

      if (typeof window === 'undefined' || !window.grecaptcha) {
        console.warn('reCAPTCHA não carregado');
        return null;
      }

      try {
        return await new Promise<string>((resolve, reject) => {
          window.grecaptcha.ready(() => {
            window.grecaptcha
              .execute(siteKey, { action })
              .then(resolve)
              .catch(reject);
          });
        });
      } catch (error) {
        console.error('Erro ao executar reCAPTCHA:', error);
        return null;
      }
    },
    [siteKey]
  );

  return { executeRecaptcha };
}
