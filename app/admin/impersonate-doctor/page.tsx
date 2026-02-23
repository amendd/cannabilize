'use client';

import { Suspense, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setImpersonatedDoctorId } from '@/components/impersonation/useEffectiveDoctorId';
import LoadingPage from '@/components/ui/Loading';

function ImpersonateDoctorContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');

  useEffect(() => {
    if (status === 'loading') return;

    // Verificar se é admin
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    // Verificar se tem doctorId
    if (!doctorId) {
      router.push('/admin/medicos');
      return;
    }

    // Salvar doctorId no sessionStorage e redirecionar
    setImpersonatedDoctorId(doctorId);
    router.push('/medico');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role, doctorId]);

  return <LoadingPage />;
}

export default function ImpersonateDoctorPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ImpersonateDoctorContent />
    </Suspense>
  );
}
