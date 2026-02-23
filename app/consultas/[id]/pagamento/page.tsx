'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import PaymentForm from '@/components/payment/PaymentForm';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultationId = params.id as string;
  const tokenFromUrl = searchParams.get('token');
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (consultationId) {
      const url = tokenFromUrl
        ? `/api/consultations/${consultationId}/public?token=${encodeURIComponent(tokenFromUrl)}`
        : `/api/consultations/${consultationId}/public`;
      fetch(url)
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
  }, [consultationId, tokenFromUrl]);

  const handlePaymentSuccess = () => {
    const qs = tokenFromUrl ? `?token=${encodeURIComponent(tokenFromUrl)}` : '';
    router.push(`/consultas/${consultationId}/confirmacao${qs}`);
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

  const amount = consultation.payment?.amount ?? 50;
  const patientName = consultation.name || 'Paciente';
  const scheduledDate = consultation.scheduledDate;
  const scheduledTime = consultation.scheduledTime;
  const dateTimeLabel = scheduledDate && scheduledTime
    ? `${new Date(scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })} às ${scheduledTime}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Deixar claro de quem é a consulta para evitar confusão com outro paciente */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">Você está pagando a consulta de</p>
          <p className="text-xl font-semibold text-gray-900 capitalize">{patientName}</p>
          {dateTimeLabel && (
            <p className="text-sm text-gray-500 mt-1">{dateTimeLabel}</p>
          )}
        </div>
        <PaymentForm
          consultationId={consultationId}
          amount={amount}
          onSuccess={handlePaymentSuccess}
        />
        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <a href="/login" className="text-primary font-medium hover:underline">
            Fazer login para acessar sua área
          </a>
        </p>
      </div>
    </div>
  );
}
