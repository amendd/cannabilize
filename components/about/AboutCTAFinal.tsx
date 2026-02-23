import { Stethoscope, ArrowRight, Shield, CheckCircle2, UserRound } from 'lucide-react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';

export default function AboutCTAFinal() {
  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary via-primary-dark to-primary-800 text-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-5 md:mb-6 font-display tracking-tight leading-tight">
          Pronto para dar o primeiro passo?
        </h2>
        <p className="text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8 leading-relaxed">
          Falar com um especialista é seguro e sem compromisso. Você tira suas dúvidas e só segue se fizer sentido para você.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-8 md:mb-10 text-sm md:text-base">
          <span className="inline-flex items-center gap-2 text-white/90">
            <UserRound size={18} aria-hidden />
            Atendimento humano
          </span>
          <span className="inline-flex items-center gap-2 text-white/90">
            <CheckCircle2 size={18} aria-hidden />
            Sem compromisso
          </span>
          <span className="inline-flex items-center gap-2 text-white/90">
            <Shield size={18} aria-hidden />
            Processo seguro e legal
          </span>
        </div>

        <AgendarTrigger
          className="group inline-flex items-center justify-center gap-3 bg-white text-primary-dark px-6 py-4 sm:px-8 rounded-xl text-base sm:text-lg font-bold shadow-xl hover:bg-primary-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 min-h-[52px] touch-manipulation border-2 border-white focus:ring-4 focus:ring-white/30"
        >
          <Stethoscope size={22} aria-hidden />
          <span>Falar com um especialista</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" aria-hidden />
        </AgendarTrigger>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/85">
          <li className="inline-flex items-center gap-1.5">
            <UserRound size={16} aria-hidden />
            Atendimento humano
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={16} aria-hidden />
            Sem compromisso
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Shield size={16} aria-hidden />
            Processo seguro e legal
          </li>
        </ul>

        <p className="mt-6 text-sm text-white/80">
          Ou{' '}
          <a href="/agendar" className="underline hover:text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50 rounded">
            iniciar minha avaliação
          </a>
        </p>
      </div>
    </section>
  );
}
