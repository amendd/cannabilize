'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface PublicConfig {
  logoUrl: string;
  teamPhotos: Record<number, string>;
}

const DEFAULT_LOGO = '/images/cannalize-logo.png';
const DEFAULT_TEAM: Record<number, string> = {
  1: '/images/team/dr-joao-silva.jpg',
  2: '/images/team/dra-maria-santos.jpg',
  3: '/images/team/equipe-suporte.jpg',
};

const PublicConfigContext = createContext<PublicConfig>({
  logoUrl: DEFAULT_LOGO,
  teamPhotos: DEFAULT_TEAM,
});

export function PublicConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PublicConfig>({
    logoUrl: DEFAULT_LOGO,
    teamPhotos: DEFAULT_TEAM,
  });

  useEffect(() => {
    fetch('/api/config/landing')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        setConfig((prev) => ({
          logoUrl: data.logoUrl || prev.logoUrl,
          teamPhotos: data.teamPhotos && typeof data.teamPhotos === 'object'
            ? { ...DEFAULT_TEAM, ...data.teamPhotos }
            : prev.teamPhotos,
        }));
      })
      .catch(() => {});
  }, []);

  return (
    <PublicConfigContext.Provider value={config}>
      {children}
    </PublicConfigContext.Provider>
  );
}

export function usePublicConfig(): PublicConfig {
  return useContext(PublicConfigContext);
}

/** Retorna a URL do logo (configurada no admin ou padrão). */
export function useLogoUrl(): string {
  return usePublicConfig().logoUrl;
}
