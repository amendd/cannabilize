'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppointmentForm from '@/components/consultation/AppointmentForm';

function AgendamentoContent() {
  const searchParams = useSearchParams();
  const pathologies = searchParams.get('pathologies')?.split(',') || [];

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Agendar Consulta
          </h1>
          <p className="text-xl text-gray-600">
            Preencha os dados abaixo para agendar sua consulta médica online
          </p>
        </div>
        <AppointmentForm initialPathologies={pathologies} />
      </div>
    </div>
  );
}

export default function AgendamentoPage() {
  return (
    <Suspense fallback={<div className="py-16 flex justify-center">Carregando...</div>}>
      <AgendamentoContent />
    </Suspense>
  );
}
