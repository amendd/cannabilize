'use client';

import { SessionProvider } from 'next-auth/react';
import RecaptchaProvider from '@/components/security/RecaptchaProvider';
import { AgendarModalProvider } from '@/components/agendar/AgendarModalContext';
import { PublicConfigProvider } from '@/lib/public-config-context';
import { useEffect, useState } from 'react';

const ENV_RECAPTCHA_KEY = typeof process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY === 'string'
  ? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  : '';

export function Providers({ children }: { children: React.ReactNode }) {
  // Usar env na hora para não atrasar hidratação; só buscar da API se env estiver vazio
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string>(ENV_RECAPTCHA_KEY);

  useEffect(() => {
    if (ENV_RECAPTCHA_KEY) return;
    fetch('/api/security/recaptcha')
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.siteKey) setRecaptchaSiteKey(data.siteKey);
      })
      .catch(() => {});
  }, []);

  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={0}>
      <PublicConfigProvider>
        <AgendarModalProvider>
          {recaptchaSiteKey ? (
          <RecaptchaProvider siteKey={recaptchaSiteKey}>
            {children}
          </RecaptchaProvider>
        ) : (
          children
        )}
        </AgendarModalProvider>
      </PublicConfigProvider>
    </SessionProvider>
  );
}
