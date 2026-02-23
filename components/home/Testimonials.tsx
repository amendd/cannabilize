'use client';

import { useState } from 'react';
import { Star, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { LandingConfigPublic } from '@/lib/landing-config';

const SHORT_LENGTH = 80;

/** Exemplo de estrutura: primeiro nome, condição tratada, tempo de acompanhamento */
const FALLBACK_TESTIMONIALS: Array<{
  id: string; name: string; displayDate: string; rating: number; shortQuote: string; fullQuote: string; source: string; photoUrl: string; featured: boolean;
  condition?: string; age?: number; months?: string;
}> = [
  { id: '1', name: 'Natalia Almeida', displayDate: '17/05/2025', rating: 5, shortQuote: 'Vi o verdadeiro diferencial no cuidado com o paciente.', fullQuote: 'Faço tratamento com Cannabis Medicinal há mais de um ano, mas só depois que conheci a CannabiLize é que vi o verdadeiro diferencial no cuidado com o paciente 💚', source: 'Google', photoUrl: '/images/testimonials/natalia-almeida.jpg', featured: false, condition: 'cannabis medicinal', months: '12 meses de acompanhamento' },
  { id: '2', name: 'Luciana Pereira', displayDate: '17/05/2025', rating: 5, shortQuote: 'Melhorou a qualidade do meu sono e já não me sinto tão ansiosa.', fullQuote: 'Desde o primeiro momento, muito bem atendida! Com 30 dias em uso do óleo, melhorou a qualidade do meu sono e já não me sinto tão ansiosa quanto antes do tratamento! Grata à CannabiLize! 💚', source: 'Google', photoUrl: '/images/testimonials/luciana-pereira.jpg', featured: false, condition: 'ansiedade e insônia', months: '1 mês de acompanhamento' },
  { id: '3', name: 'Beatriz Dobruski', displayDate: '17/03/2025', rating: 5, shortQuote: 'O tratamento com óleo de CBD transformou minha vida.', fullQuote: 'Apenas gratidão. O tratamento com o óleo de CBD tem transformado minha vida, me ajudando a superar completamente as crises de ansiedade. Além disso, o suporte da equipe foi excepcional.', source: 'Google', photoUrl: '/images/testimonials/beatriz-dobruski.jpg', featured: false, condition: 'ansiedade', months: '3 meses de acompanhamento' },
  { id: '4', name: 'Vera Oliveira', displayDate: '11/05/2025', rating: 5, shortQuote: 'Já estou vendo resultado na ansiedade e para dormir.', fullQuote: 'Boa Noite !! Hoje faz um mês que estou tomando este medicamento, comecei com 2 gotas, por orientação aumentei, hoje estou tomando 5 gotinhas, e já estou vendo resultado, na ansiedade e para dormir.', source: 'Google', photoUrl: '/images/testimonials/vera-oliveira.jpg', featured: false, condition: 'ansiedade e insônia', months: '1 mês de acompanhamento' },
  { id: '5', name: 'Luadi Morais', displayDate: '17/02/2025', rating: 5, shortQuote: 'Pela primeira vez na vida, 5 dias consecutivos sem dores.', fullQuote: 'Estou impactada com a experiência. Pela primeira vez na vida. Fiquei 5 dias consecutivos sem dores. Sei que é só o começo. Agradeço a atenção antes, durante e principalmente no pós.', source: 'Google', photoUrl: '/images/testimonials/luadi-morais.jpg', featured: true, condition: 'dor crônica', months: '2 meses de acompanhamento' },
  { id: '6', name: 'Thiago Jatobá', displayDate: '11/05/2025', rating: 5, shortQuote: 'Consulta acessível e já sinto menos ansiedade.', fullQuote: 'Excelente e rápido atendimento. Consulta com preço muito acessível e o valor da medicação é bem menor que os tarja pretas. Hoje completo minha primeira semana de tratamento e já sinto menos ansiedade.', source: 'Google', photoUrl: '/images/testimonials/thiago-jatoba.jpg', featured: false, condition: 'ansiedade', months: '1 mês de acompanhamento' },
];

interface TestimonialsProps {
  config?: LandingConfigPublic | null;
}

export default function Testimonials({ config }: TestimonialsProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  type TestimonialItem = (typeof FALLBACK_TESTIMONIALS)[0];
  const list: TestimonialItem[] = (config?.testimonials && config.testimonials.length > 0)
    ? config.testimonials.map((t) => ({
        id: t.id,
        name: t.name,
        displayDate: t.displayDate,
        rating: t.rating,
        shortQuote: t.shortQuote,
        fullQuote: t.fullQuote,
        source: t.source,
        photoUrl: t.photoUrl ?? undefined,
        featured: t.featured,
        condition: (t as TestimonialItem).condition,
        age: (t as TestimonialItem).age,
        months: (t as TestimonialItem).months,
      }))
    : FALLBACK_TESTIMONIALS;

  const subtitle = (t: TestimonialItem) => {
    const firstName = t.name.split(' ')[0] || t.name;
    let line = firstName;
    if (t.age) line += `, ${t.age} anos`;
    if (t.condition) line += ` — ${t.condition}`;
    if (t.months) line += ` | ${t.months}`;
    return line;
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-5">
            Depoimentos Reais
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Relatos reais de pacientes
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
            Sua satisfação é nossa prioridade. Veja o que nossos pacientes têm a dizer sobre o tratamento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((testimonial, index) => {
            const isLong = testimonial.fullQuote.length > SHORT_LENGTH;
            const isExpanded = expandedId === testimonial.id || expandedId === index;
            const showText = isLong && !isExpanded
              ? (testimonial.shortQuote && testimonial.shortQuote.length <= SHORT_LENGTH ? testimonial.shortQuote : testimonial.fullQuote.slice(0, SHORT_LENGTH).trim() + '...')
              : testimonial.fullQuote;
            return (
              <div
                key={testimonial.id}
                className={`group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 ${testimonial.featured ? 'ring-2 ring-green-300' : ''}`}
              >
                <div className="absolute top-4 right-4 opacity-10">
                  <Quote size={40} className="text-green-600" />
                </div>
                {testimonial.featured && (
                  <span className="absolute top-4 left-4 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">Destaque</span>
                )}

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed relative z-10">
                  &quot;{showText}&quot;
                </p>
                {isLong && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : testimonial.id)}
                    className="text-sm text-green-600 font-medium hover:text-green-700 flex items-center gap-1 mb-4"
                  >
                    {isExpanded ? (
                      <>Ver menos <ChevronUp size={16} /></>
                    ) : (
                      <>Leia mais <ChevronDown size={16} /></>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <Avatar
                    src={testimonial.photoUrl}
                    name={testimonial.name}
                    size="lg"
                    showBorder={true}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{subtitle(testimonial)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{testimonial.displayDate}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex-shrink-0">
                    {testimonial.source}
                  </span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 to-green-50/0 group-hover:from-green-50/50 group-hover:to-transparent rounded-2xl transition-all duration-300 pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* Trust badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md border border-gray-200">
            <Star className="text-yellow-400 fill-yellow-400" size={20} />
            <span className="text-sm font-medium text-gray-700">
              Média de <span className="font-bold text-green-600">4.9/5</span> estrelas em mais de 2.000 avaliações
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
