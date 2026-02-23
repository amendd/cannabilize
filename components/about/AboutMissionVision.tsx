import { Heart, Eye, Gem } from 'lucide-react';

const PILLARS = [
  {
    icon: Heart,
    title: 'Nossa missão',
    text: 'Democratizar o acesso seguro ao tratamento com cannabis medicinal em todo o Brasil.',
  },
  {
    icon: Eye,
    title: 'Nossa visão',
    text: 'Ser a referência em cannabis medicinal no Brasil pela confiança que a instituição constrói com cada paciente e pela seriedade do cuidado — não pelo tamanho.',
  },
  {
    icon: Gem,
    title: 'Nossos valores',
    text: 'Transparência no processo, respeito à sua história, agilidade sem pressa, ética em tudo que a equipe faz e acolhimento em cada contato.',
  },
];

export default function AboutMissionVision() {
  return (
    <section className="py-14 md:py-20 bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3 md:mb-4">
          O que nos guia
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 font-display tracking-tight">
          Nosso compromisso com você
        </h2>
        <p className="text-gray-600 mb-8 md:mb-12 max-w-2xl text-sm md:text-base">
          A Cannabilize é uma plataforma nacional comprometida com o seu bem-estar e com fazer o certo — com clareza e proximidade.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {PILLARS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-5 md:p-6 lg:p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all"
              >
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary mb-4 md:mb-5">
                  <Icon size={22} className="md:w-6 md:h-6" aria-hidden />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
