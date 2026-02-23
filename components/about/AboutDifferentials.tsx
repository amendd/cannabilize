import { DollarSign, Headphones, Star, CheckCircle2 } from 'lucide-react';

const DIFFERENTIALS = [
  {
    icon: DollarSign,
    title: 'Valor que cabe no bolso',
    description: 'Você paga um valor fixo e transparente pela consulta. Sobre o medicamento, recebe orientação clara antes de seguir — sem custos escondidos. Menos preocupação, mais tranquilidade.',
  },
  {
    icon: Headphones,
    title: 'Suporte humano em todas as etapas',
    description: 'Pacientes contam com acompanhamento na documentação e no processo de importação. A equipe orienta cada passo, com segurança e acolhimento.',
  },
  {
    icon: Star,
    title: 'Credibilidade que você pode checar',
    description: 'Milhares de avaliações no Google mostram a experiência real de quem já passou pela consulta e pelo tratamento. Você pode conferir e se sentir mais seguro antes de começar.',
  },
  {
    icon: CheckCircle2,
    title: 'Tudo dentro da lei',
    description: 'Você tem a segurança de um processo 100% legalizado: médicos com CRM ativo, prescrições e documentação em conformidade. Tratamento com legitimidade e paz de espírito.',
  },
];

export default function AboutDifferentials() {
  return (
    <section className="py-14 md:py-20 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3 md:mb-4">
          Por que nos escolhem
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 font-display tracking-tight">
          O que você ganha ao fazer seu tratamento conosco
        </h2>
        <p className="text-gray-600 mb-8 md:mb-12 max-w-2xl text-sm md:text-base">
          Transparência, suporte humano e credibilidade em cada etapa do seu caminho.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-8">
          {DIFFERENTIALS.map((diff, index) => {
            const Icon = diff.icon;
            return (
              <div
                key={index}
                className="flex gap-4 md:gap-5 p-5 md:p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-300"
              >
                <div className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary">
                  <Icon size={22} className="md:w-6 md:h-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">{diff.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">{diff.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
