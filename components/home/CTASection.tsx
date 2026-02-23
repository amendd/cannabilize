import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';

export default function CTASection() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8">
          <Sparkles className="text-white" size={40} />
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-7 leading-tight tracking-tight">
          Você pode ter acompanhamento com Cannabis Medicinal por apenas{' '}
          <span className="text-yellow-300">R$50</span>
        </h2>
        
        <p className="text-xl md:text-2xl mb-6 text-white/85 leading-relaxed">
          Conquiste mais qualidade de vida com acompanhamento médico e suporte em todas as etapas.
        </p>

        <p className="text-sm font-medium text-white/90 mb-8">
          Etapa 1 de 3 — Avaliação inicial
        </p>

        <AgendarTrigger
          className="group inline-flex items-center gap-3 bg-white text-green-700 px-10 py-5 rounded-xl text-lg font-bold hover:bg-yellow-300 transition-all duration-300 shadow-2xl hover:shadow-yellow-300/50 transform hover:-translate-y-1"
        >
          <span>Continuar minha avaliação</span>
          <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </AgendarTrigger>

        {/* Micro reassurance */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/85 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-yellow-300" />
            Atendimento em todo o Brasil
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-yellow-300" />
            Processo seguro e legal
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-yellow-300" />
            Acompanhamento especializado
          </span>
        </div>
      </div>
    </section>
  );
}
