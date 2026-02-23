'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AgendarModal from '@/components/agendar/AgendarModal';

/**
 * Página /agendar: acesso direto (link, bookmark).
 * Mostra o mesmo popup de agendamento; ao fechar, volta para a home.
 */
export default function AgendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const p = searchParams.get('pathologies');
  const initialPathologies = p ? p.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const handleClose = () => {
    router.push('/');
  };

  return (
    <AgendarModal
      isOpen={true}
      onClose={handleClose}
      initialPathologies={initialPathologies}
    />
  );
}
