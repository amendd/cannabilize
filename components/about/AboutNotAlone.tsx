import { Stethoscope, MessageCircle, Shield, ArrowRight } from 'lucide-react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';

const ITEMS = [
  { icon: Stethoscope, text: 'Atendimento humano especializado' },
  { icon: MessageCircle, text: 'Resposta rápida pelo WhatsApp' },
  { icon: Shield, text: 'Processo seguro e acompanhado' },
];

export default function AboutNotAlone() {
  return (
    <section className="py-14 md:py-20 bg-white border-t border-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3 md:mb-4">
          Presença humana
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 font-display tracking-tight">
          Você não estará sozinho
        </h2>
        <p className="text-gray-600 mb-8 md:mb-10 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Nossa equipe acompanha você desde o primeiro contato até o início do tratamento.
        </p>

        <ul className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-5 md:gap-8 mb-8 md:mb-10">
          {ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index} className="flex items-center gap-3 text-gray-600">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-50 text-primary shrink-0" aria-hidden>
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="text-sm md:text-base text-left">{item.text}</span>
              </li>
            );
          })}
        </ul>

        <AgendarTrigger
          className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] touch-manipulation"
        >
          <span>Falar com nossa equipe</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden />
        </AgendarTrigger>
      </div>
    </section>
  );
}
