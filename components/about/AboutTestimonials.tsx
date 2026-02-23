import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Natalia',
    ageRange: '30–40 anos',
    condition: 'Tratamento com cannabis medicinal',
    timeInTreatment: 'Mais de 1 ano',
    rating: 5,
    comment: 'Faço tratamento com cannabis medicinal há mais de um ano, mas só depois que conheci a Cannabilize é que vi o verdadeiro diferencial no cuidado com o paciente.',
  },
  {
    name: 'Luciana',
    ageRange: '30–40 anos',
    condition: 'Qualidade do sono e ansiedade',
    timeInTreatment: '30 dias em uso do óleo',
    rating: 5,
    comment: 'Desde o primeiro momento, muito bem atendida! Com 30 dias em uso do óleo, melhorou a qualidade do meu sono e já não me sinto tão ansiosa quanto antes do tratamento!',
  },
  {
    name: 'Carlos',
    ageRange: '40–50 anos',
    condition: 'Dor crônica',
    timeInTreatment: '3 meses',
    rating: 5,
    comment: 'Processo todo explicado, sem pressa. O médico tirou todas as dúvidas e o suporte ajudou na documentação. Hoje me sinto muito melhor.',
  },
];

export default function AboutTestimonials() {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3 md:mb-4">
          Quem já passou por aqui
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 font-display tracking-tight">
          Depoimentos de quem confia no tratamento
        </h2>
        <p className="text-gray-600 mb-8 md:mb-12 max-w-2xl text-sm md:text-base">
          Histórias reais de pacientes que encontraram acompanhamento humanizado e transparente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <article
              key={index}
              className="relative bg-gray-50 rounded-2xl p-5 md:p-6 lg:p-8 border border-gray-100 hover:border-primary-100 transition-colors"
            >
              <Quote className="absolute top-4 right-4 text-primary-200 w-8 h-8 md:w-10 md:h-10" aria-hidden />
              <div className="flex gap-1 mb-3 md:mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="md:w-[18px] md:h-[18px] text-secondary fill-secondary" aria-hidden />
                ))}
              </div>
              <p className="text-gray-700 mb-5 md:mb-6 leading-relaxed italic text-sm md:text-base">"{testimonial.comment}"</p>
              <div className="border-t border-gray-200 pt-4 space-y-1">
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-xs text-gray-500">{testimonial.ageRange}</p>
                <p className="text-sm text-primary-700">{testimonial.condition}</p>
                <p className="text-xs text-gray-500">{testimonial.timeInTreatment}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
