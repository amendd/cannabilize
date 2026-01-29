'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import ConsultationDetail from '@/components/admin/ConsultationDetail';
import PrescriptionForm from '@/components/admin/PrescriptionForm';
import ReportGenerator from '@/components/admin/ReportGenerator';

export default function ConsultationDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN' && session?.user.role !== 'DOCTOR') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (consultationId) {
      fetch(`/api/consultations/${consultationId}`)
        .then(res => res.json())
        .then(data => {
          setConsultation(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [consultationId]);

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!consultation) {
    return <div className="flex items-center justify-center min-h-screen">Consulta não encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-primary hover:underline"
        >
          ← Voltar
        </button>

        <ConsultationDetail consultation={consultation} />
        
        {consultation.status === 'COMPLETED' && !consultation.prescription && (
          <PrescriptionForm consultationId={consultationId} />
        )}

        {consultation.status === 'COMPLETED' && (
          <ReportGenerator consultationId={consultationId} />
        )}
      </div>
    </div>
  );
}
