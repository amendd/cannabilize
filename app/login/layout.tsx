import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Cannabilize | Central de Acesso',
  description: 'Portal oficial de acesso aos sistemas clínicos e operacionais da Plataforma Cannabilize.',
  robots: 'noindex, nofollow',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
