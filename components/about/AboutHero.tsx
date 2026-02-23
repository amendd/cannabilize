import Link from 'next/link';
import { Shield, Stethoscope, ArrowRight } from 'lucide-react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';

export default function AboutHero() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-white via-primary-50/30 to-primary-50/50">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #00A859 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 right-0 w-[min(80vw,600px)] h-[min(80vw,600px)] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[min(60vw,400px)] h-[min(60vw,400px)] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-primary-200 text-primary-800 text-sm font-medium shadow-sm mb-6 md:mb-8">
            <Shield className="text-primary" size={18} aria-hidden />
            <span>Tratamento legalizado e acompanhado por médicos especialistas</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-extrabold text-gray-900 mb-5 md:mb-6 font-display tracking-tight leading-tight">
            Acesso seguro ao tratamento com cannabis medicinal
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-4 leading-relaxed">
            A Cannabilize é uma plataforma nacional que conecta pacientes e médicos especializados em cannabis medicinal.
          </p>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
            Você tem acompanhamento completo do primeiro contato até a documentação e o suporte na importação. A Cannabilize conecta pacientes e profissionais através de uma rede médica especializada. Tudo em conformidade com a legislação brasileira.
          </p>

          {/* Micro prova social — destaque leve, leitura imediata */}
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600 mb-8 md:mb-10 max-w-xl mx-auto">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
              Pacientes acompanhados pela Cannabilize
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
              Atendimento em todo o Brasil
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
              Médicos especializados em cannabis medicinal
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 md:mb-12">
            <AgendarTrigger
              className="group inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white px-6 py-4 sm:px-8 rounded-xl text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 min-h-[48px] touch-manipulation"
            >
              <Stethoscope size={22} aria-hidden />
              <span>Falar com um especialista</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" aria-hidden />
            </AgendarTrigger>
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-dark font-semibold transition-colors py-2 min-h-[48px] items-center justify-center touch-manipulation"
            >
              Ou agendar minha avaliação
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>

          <p className="text-sm font-medium text-gray-700 max-w-xl mx-auto px-4 py-2.5 rounded-lg bg-white/90 border border-primary-100 shadow-sm">
            Médicos com CRM ativo • Prescrição dentro da lei • Suporte em todas as etapas
          </p>
        </div>
      </div>
    </section>
  );
}
