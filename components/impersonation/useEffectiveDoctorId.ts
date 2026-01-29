'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const IMPERSONATION_KEY = 'admin_impersonated_doctor_id';

export function useEffectiveDoctorId() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [effectiveDoctorId, setEffectiveDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      setLoading(false);
      return;
    }

    // Se for admin, verificar se há doctorId impersonado no sessionStorage
    if (session.user.role === 'ADMIN') {
      const impersonatedId = typeof window !== 'undefined' 
        ? sessionStorage.getItem(IMPERSONATION_KEY)
        : null;
      
      if (impersonatedId) {
        setEffectiveDoctorId(impersonatedId);
      } else {
        // Admin sem impersonação - não pode acessar área do médico
        setEffectiveDoctorId(null);
      }
    } else if (session.user.role === 'DOCTOR') {
      // Médico normal usa seu próprio ID
      setEffectiveDoctorId(session.user.id);
    } else {
      // Outros roles não têm acesso
      setEffectiveDoctorId(null);
    }

    setLoading(false);
  }, [session, status]);

  const clearImpersonation = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(IMPERSONATION_KEY);
      setEffectiveDoctorId(null);
      router.push('/admin/medicos');
    }
  };

  return {
    effectiveDoctorId,
    loading,
    isImpersonating: session?.user.role === 'ADMIN' && 
                     typeof window !== 'undefined' && 
                     !!sessionStorage.getItem(IMPERSONATION_KEY),
    clearImpersonation,
  };
}

export function setImpersonatedDoctorId(doctorId: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(IMPERSONATION_KEY, doctorId);
  }
}
