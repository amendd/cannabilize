'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, Quote, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';
import type { LandingConfigPublic } from '@/lib/landing-config';

const SHORT_LENGTH = 80;

export type TestimonialItem = {
  id: string;
  name: string;
  displayDate: string;
  rating: number;
  shortQuote: string;
  fullQuote: string;
  source: string;
  photoUrl: string;
  featured: boolean;
  condition?: string;
  treatmentTime?: string;
  age?: number;
};

/** Fallback com contexto clínico para quando não há depoimentos no CMS */
const FALLBACK_TESTIMONIALS: TestimonialItem[] = [
  { id: '1', name: 'Natalia Almeida', displayDate: '17/05/2025', rating: 5, shortQuote: 'Vi o verdadeiro diferencial no cuidado com o paciente.', fullQuote: 'Faço tratamento com Cannabis Medicinal há mais de um ano, mas só depois que conheci a CannabiLize é que vi o verdadeiro diferencial no cuidado com o paciente 💚', source: 'Google', photoUrl: '/images/testimonials/natalia-almeida.jpg', featured: false, condition: 'Cannabis medicinal', treatmentTime: '12 meses de acompanhamento' },
  { id: '2', name: 'Luciana Pereira', displayDate: '17/05/2025', rating: 5, shortQuote: 'Melhorou a qualidade do meu sono e já não me sinto tão ansiosa.', fullQuote: 'Desde o primeiro momento, muito bem atendida! Com 30 dias em uso do óleo, melhorou a qualidade do meu sono e já não me sinto tão ansiosa quanto antes do tratamento! Grata à CannabiLize! 💚', source: 'Google', photoUrl: '/images/testimonials/luciana-pereira.jpg', featured: false, condition: 'Ansiedade e insônia', treatmentTime: '1 mês de acompanhamento' },
  { id: '3', name: 'Beatriz Dobruski', displayDate: '17/03/2025', rating: 5, shortQuote: 'O tratamento com óleo de CBD transformou minha vida.', fullQuote: 'Apenas gratidão. O tratamento com o óleo de CBD tem transformado minha vida, me ajudando a superar completamente as crises de ansiedade. Além disso, o suporte da equipe foi excepcional.', source: 'Google', photoUrl: '/images/testimonials/beatriz-dobruski.jpg', featured: false, condition: 'Ansiedade', treatmentTime: '3 meses de acompanhamento' },
  { id: '4', name: 'Vera Oliveira', displayDate: '11/05/2025', rating: 5, shortQuote: 'Já estou vendo resultado na ansiedade e para dormir.', fullQuote: 'Boa Noite !! Hoje faz um mês que estou tomando este medicamento, comecei com 2 gotas, por orientação aumentei, hoje estou tomando 5 gotinhas, e já estou vendo resultado, na ansiedade e para dormir.', source: 'Google', photoUrl: '/images/testimonials/vera-oliveira.jpg', featured: false, condition: 'Ansiedade e insônia', treatmentTime: '1 mês de acompanhamento' },
  { id: '5', name: 'Luadi Morais', displayDate: '17/02/2025', rating: 5, shortQuote: 'Pela primeira vez na vida, 5 dias consecutivos sem dores.', fullQuote: 'Estou impactada com a experiência. Pela primeira vez na vida. Fiquei 5 dias consecutivos sem dores. Sei que é só o começo. Agradeço a atenção antes, durante e principalmente no pós.', source: 'Google', photoUrl: '/images/testimonials/luadi-morais.jpg', featured: true, condition: 'Dor crônica', treatmentTime: '2 meses de acompanhamento' },
  { id: '6', name: 'Thiago Jatobá', displayDate: '11/05/2025', rating: 5, shortQuote: 'Consulta acessível e já sinto menos ansiedade.', fullQuote: 'Excelente e rápido atendimento. Consulta com preço muito acessível e o valor da medicação é bem menor que os tarja pretas. Hoje completo minha primeira semana de tratamento e já sinto menos ansiedade.', source: 'Google', photoUrl: '/images/testimonials/thiago-jatoba.jpg', featured: false, condition: 'Ansiedade', treatmentTime: '1 mês de acompanhamento' },
];

interface TestimonialsProps {
  config?: LandingConfigPublic | null;
}

/** Linha de contexto clínico acima do texto do depoimento */
function ClinicalContext({ t }: { t: TestimonialItem }) {
  const parts: string[] = [];
  if (t.condition) parts.push(t.condition);
  if (t.age) parts.push(`${t.age} anos`);
  const line1 = parts.join(' • ');
  if (!line1 && !t.treatmentTime) return null;
  return (
    <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
      {line1 && <p className="font-medium">{line1}</p>}
      {t.treatmentTime && (
        <p className="text-gray-600">{t.treatmentTime}</p>
      )}
    </div>
  );
}

/** Card único de depoimento — reutilizável para grid e carrossel */
function TestimonialCard({
  t,
  isExpanded,
  onToggleExpand,
  isHighlight,
}: {
  t: TestimonialItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isHighlight: boolean;
}) {
  const isLong = t.fullQuote.length > SHORT_LENGTH;
  const showText = isLong && !isExpanded
    ? (t.shortQuote.length <= SHORT_LENGTH ? t.shortQuote : t.fullQuote.slice(0, SHORT_LENGTH).trim() + '...')
    : t.fullQuote;

  return (
    <article
      className={`
        group relative flex flex-col rounded-2xl border bg-white p-6 shadow-md transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
        min-h-[320px] md:min-h-[340px]
        ${isHighlight ? 'ring-2 ring-green-400 border-green-200' : 'border-gray-100'}
      `}
      aria-labelledby={`testimonial-name-${t.id}`}
    >
      {isHighlight && (
        <span className="absolute -top-px left-4 rounded-b-md bg-green-600 px-3 py-1 text-xs font-semibold text-white">
          Caso em destaque
        </span>
      )}
      <div className="absolute top-4 right-4 opacity-10" aria-hidden>
        <Quote size={40} className="text-green-600" />
      </div>

      <div className="flex items-center gap-1 mb-3">
        {[...Array(t.rating)].map((_, i) => (
          <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" aria-hidden />
        ))}
      </div>

      <ClinicalContext t={t} />

      <p className="text-gray-700 leading-relaxed flex-1 relative z-10">
        &quot;{showText}&quot;
      </p>
      {isLong && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-2 text-sm text-green-600 font-medium hover:text-green-700 flex items-center gap-1"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>Ver menos <ChevronUp size={16} /></>
          ) : (
            <>Leia mais <ChevronDown size={16} /></>
          )}
        </button>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 flex-wrap">
        <Avatar src={t.photoUrl} name={t.name} size="lg" showBorder />
        <div className="flex-1 min-w-0">
          <p id={`testimonial-name-${t.id}`} className="font-semibold text-gray-900">{t.name}</p>
          <p className="text-xs text-gray-500">{t.displayDate}</p>
          <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-700 font-medium">
            <CheckCircle2 size={12} className="flex-shrink-0" aria-hidden />
            Paciente verificado
          </span>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex-shrink-0">
          {t.source}
        </span>
      </div>
    </article>
  );
}

export default function Testimonials({ config }: TestimonialsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const list: TestimonialItem[] =
    config?.testimonials && config.testimonials.length > 0
      ? config.testimonials.map((t) => ({
          id: t.id,
          name: t.name,
          displayDate: t.displayDate,
          rating: t.rating,
          shortQuote: t.shortQuote,
          fullQuote: t.fullQuote,
          source: t.source,
          photoUrl: t.photoUrl ?? '',
          featured: t.featured,
          condition: t.condition ?? undefined,
          treatmentTime: t.treatmentTime ?? undefined,
          age: t.age ?? undefined,
        }))
      : FALLBACK_TESTIMONIALS;

  const proofNumber = config?.stats?.testimonials ?? '2.000';
  const proofRating = config?.stats?.rating ?? '4,9';

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (inView && !hasAnimated) setHasAnimated(true);
  }, [inView, hasAnimated]);

  const highlightIndex = list.findIndex((t) => t.featured);
  const effectiveHighlightIndex = highlightIndex >= 0 ? highlightIndex : 0;

  return (
    <section
      ref={sectionRef}
      id="depoimentos"
      className="py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Título emocional */}
        <div className="text-center mb-8">
          <div
            className={`inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-5 transition-all duration-700 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Depoimentos Reais
          </div>
          <h2
            id="testimonials-heading"
            className={`text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight transition-all duration-700 delay-100 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Relatos reais de pacientes
          </h2>
          <p
            className={`text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 transition-all duration-700 delay-150 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Sua satisfação é nossa prioridade. Veja o que nossos pacientes têm a dizer sobre o tratamento.
          </p>

          {/* 2. Prova social numérica — movida para logo abaixo do título */}
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md border border-gray-200 transition-all duration-700 delay-200 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <Star className="text-yellow-400 fill-yellow-400" size={22} aria-hidden />
            <span className="text-base font-medium text-gray-700">
              Avaliação média <span className="font-bold text-green-600">{proofRating}/5</span> baseada em mais de {proofNumber} pacientes atendidos
            </span>
          </div>
        </div>

        {/* 3. Grid (desktop) / Carrossel (mobile) */}
        <div
          className={`mb-14 transition-all duration-700 delay-300 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Desktop: grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((t, index) => (
              <TestimonialCard
                key={t.id}
                t={t}
                isExpanded={expandedId === t.id}
                onToggleExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
                isHighlight={index === effectiveHighlightIndex}
              />
            ))}
          </div>

          {/* Mobile: carrossel horizontal com swipe e snap — 1 card principal + preview do próximo */}
          <div
            className="md:hidden overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            role="region"
            aria-label="Depoimentos em carrossel"
          >
            <div className="flex gap-4" style={{ width: 'max-content' }}>
              {list.map((t, index) => (
                <div
                  key={t.id}
                  className="flex-shrink-0 w-[88vw] max-w-[340px] snap-center"
                >
                  <TestimonialCard
                    t={t}
                    isExpanded={expandedId === t.id}
                    onToggleExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    isHighlight={index === effectiveHighlightIndex}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. CTA de conversão */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 transition-all duration-700 delay-500 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <AgendarTrigger
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-green-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
          >
            Quero iniciar meu tratamento
          </AgendarTrigger>
          <AgendarTrigger
            className="inline-flex items-center justify-center rounded-xl border-2 border-green-600 px-8 py-4 text-lg font-semibold text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
          >
            Agendar avaliação médica
          </AgendarTrigger>
        </div>

        {/* 5. Disclaimer médico */}
        <p
          className={`text-center text-sm text-gray-500 max-w-2xl mx-auto transition-all duration-700 delay-500 ${hasAnimated ? 'opacity-100' : 'opacity-0'}`}
        >
          Os depoimentos representam experiências individuais. Os resultados podem variar conforme cada paciente e condição clínica.
        </p>
      </div>
    </section>
  );
}
