'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Ocultar footer padrão nas rotas que têm layouts próprios
  const hideFooter = pathname?.startsWith('/admin') || 
                     pathname?.startsWith('/medico') || 
                     pathname?.startsWith('/paciente');
  
  if (hideFooter) {
    return null;
  }
  
  return <Footer />;
}
