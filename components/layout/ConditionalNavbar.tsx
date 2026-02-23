'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Ocultar navbar padrão nas rotas que têm layouts próprios
  const hideNavbar = pathname?.startsWith('/admin') || 
                     pathname?.startsWith('/medico') || 
                     pathname?.startsWith('/paciente') ||
                     pathname?.startsWith('/erp-canna') ||
                     pathname?.startsWith('/ifp-canna') ||
                     pathname?.startsWith('/gpp-canna');
  
  if (hideNavbar) {
    return null;
  }
  
  return <Navbar />;
}
