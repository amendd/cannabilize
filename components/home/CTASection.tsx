import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

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
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
          <Sparkles className="text-white" size={40} />
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
          Inicie o tratamento com Cannabis Medicinal por apenas{' '}
          <span className="text-yellow-300">R$50</span>
        </h2>
        
        <p className="text-xl md:text-2xl mb-8 opacity-95 leading-relaxed">
          Conquiste mais qualidade de vida e fique livre dos tratamentos invasivos.
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            'Consulta 100% Online',
            'Médicos Especialistas',
            'Suporte Completo'
          ].map((benefit, index) => (
            <div key={index} className="flex items-center justify-center gap-2 text-white/90">
              <CheckCircle2 size={20} className="text-yellow-300" />
              <span className="font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        <Link
          href="/agendamento"
          className="group inline-flex items-center gap-3 bg-white text-green-700 px-10 py-5 rounded-xl text-lg font-bold hover:bg-yellow-300 transition-all duration-300 shadow-2xl hover:shadow-yellow-300/50 transform hover:-translate-y-1"
        >
          <span>Iniciar tratamento agora</span>
          <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </Link>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/80 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>Sem compromisso</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>Resultados comprovados</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>+90.000 pacientes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
