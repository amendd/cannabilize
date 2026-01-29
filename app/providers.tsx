'use client';

import { SessionProvider } from 'next-auth/react';
import RecaptchaProvider from '@/components/security/RecaptchaProvider';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string>('');

  useEffect(() => {
    // Buscar site key do servidor (endpoint público; não exige login)
    fetch('/api/security/recaptcha')
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.siteKey) {
          setRecaptchaSiteKey(data.siteKey);
        } else {
          // Fallback para variável de ambiente
          setRecaptchaSiteKey(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '');
        }
      })
      .catch(() => {
        // Fallback para variável de ambiente em caso de erro
        setRecaptchaSiteKey(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '');
      });
  }, []);

  return (
    <SessionProvider>
      {recaptchaSiteKey ? (
        <RecaptchaProvider siteKey={recaptchaSiteKey}>
          {children}
        </RecaptchaProvider>
      ) : (
        children
      )}
    </SessionProvider>
  );
}
