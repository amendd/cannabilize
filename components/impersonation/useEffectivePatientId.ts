'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const IMPERSONATION_KEY = 'admin_impersonated_patient_id';

export function useEffectivePatientId() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [effectivePatientId, setEffectivePatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      setLoading(false);
      return;
    }

    // Se for admin, verificar se há patientId impersonado no sessionStorage
    if (session.user.role === 'ADMIN') {
      const impersonatedId = typeof window !== 'undefined' 
        ? sessionStorage.getItem(IMPERSONATION_KEY)
        : null;
      
      if (impersonatedId) {
        setEffectivePatientId(impersonatedId);
      } else {
        // Admin sem impersonação - não pode acessar área do paciente
        setEffectivePatientId(null);
      }
    } else if (session.user.role === 'PATIENT') {
      // Paciente normal usa seu próprio ID
      setEffectivePatientId(session.user.id);
    } else {
      // Outros roles não têm acesso
      setEffectivePatientId(null);
    }

    setLoading(false);
  }, [session, status]);

  const clearImpersonation = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(IMPERSONATION_KEY);
      setEffectivePatientId(null);
      router.push('/admin/pacientes');
    }
  };

  return {
    effectivePatientId,
    loading,
    isImpersonating: session?.user.role === 'ADMIN' && 
                     typeof window !== 'undefined' && 
                     !!sessionStorage.getItem(IMPERSONATION_KEY),
    clearImpersonation,
  };
}

export function setImpersonatedPatientId(patientId: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(IMPERSONATION_KEY, patientId);
  }
}
