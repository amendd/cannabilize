'use client';

import Image from 'next/image';
import { useLogoUrl } from '@/lib/public-config-context';

type LogoImageProps = {
  /** Alt text para acessibilidade */
  alt?: string;
  /** Classes Tailwind (ex: h-11 w-auto). Recomendado manter w-auto para proporção. */
  className?: string;
  /** Largura intrínseca (para ratio). Padrão 180. */
  width?: number;
  /** Altura intrínseca (para ratio). Padrão 56. */
  height?: number;
  /** Carregar com prioridade (evita LCP ruim). Padrão true no primeiro logo da página. */
  priority?: boolean;
};

/**
 * Exibe o logo do site preservando transparência (PNG).
 * Usa unoptimized para não converter para AVIF/WebP e evitar fundo branco.
 */
export default function LogoImage({
  alt = 'Cannabilize',
  className = 'h-11 w-auto',
  width = 180,
  height = 56,
  priority = true,
}: LogoImageProps) {
  const logoUrl = useLogoUrl();

  return (
    <Image
      src={logoUrl}
      alt={alt}
      width={width}
      height={height}
      className={`${className} bg-transparent object-contain`}
      priority={priority}
      unoptimized
    />
  );
}
