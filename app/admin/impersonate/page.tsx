'use client';

import { Suspense, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setImpersonatedPatientId } from '@/components/impersonation/useEffectivePatientId';
import LoadingPage from '@/components/ui/Loading';

function ImpersonateContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  useEffect(() => {
    if (status === 'loading') return;

    // Verificar se é admin
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    // Verificar se tem patientId
    if (!patientId) {
      router.push('/admin/pacientes');
      return;
    }

    // Salvar patientId no sessionStorage e redirecionar
    setImpersonatedPatientId(patientId);
    router.push('/paciente');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role, patientId]);

  return <LoadingPage />;
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ImpersonateContent />
    </Suspense>
  );
}
