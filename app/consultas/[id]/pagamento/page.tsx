'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentForm from '@/components/payment/PaymentForm';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handlePaymentSuccess = () => {
    router.push(`/paciente`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Consulta não encontrada</div>
      </div>
    );
  }

  const amount = consultation.payment?.amount || 50.00;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PaymentForm
          consultationId={consultationId}
          amount={amount}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
}
