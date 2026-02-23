'use client';

import { ArrowRight } from 'lucide-react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';

export default function StickyCTAMobile() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Avaliação inicial por R$50</p>
          <p className="text-xs text-gray-500">Sem compromisso • Atendimento humano</p>
        </div>
        <AgendarTrigger
          className="flex-shrink-0 inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition shadow-lg"
        >
          Continuar minha avaliação
          <ArrowRight size={18} />
        </AgendarTrigger>
      </div>
    </div>
  );
}
