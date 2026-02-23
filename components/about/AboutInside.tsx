'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';

const GALLERY_IMAGES = [
  { src: '/images/about/inside-1.jpg', alt: 'Equipe acompanhando pacientes e documentação' },
  { src: '/images/about/inside-2.jpg', alt: 'Atendimento e suporte ao paciente' },
  { src: '/images/about/inside-3.jpg', alt: 'Reunião e organização do fluxo de tratamento' },
  { src: '/images/about/inside-4.jpg', alt: 'Análise de documentação e processos' },
  { src: '/images/about/inside-5.jpg', alt: 'Ambiente de trabalho e suporte humanizado' },
];

const FALLBACK = '/images/placeholder.jpg';

export default function AboutInside() {
  return (
    <section className="py-14 md:py-20 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3 md:mb-4">
          Operação ativa
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 font-display tracking-tight">
          Por dentro da Cannabilize
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl text-sm md:text-base leading-relaxed">
          Todos os dias, nossa equipe acompanha pacientes, organiza documentações e garante que cada etapa do tratamento aconteça com segurança e transparência.
        </p>
        <p className="text-gray-700 font-medium mb-10 md:mb-12 max-w-2xl text-sm md:text-base leading-relaxed">
          Nossa operação funciona diariamente para garantir que cada paciente tenha acompanhamento seguro em todas as etapas do tratamento.
        </p>

        {/* Galeria */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {GALLERY_IMAGES.map((img, index) => (
              <div
                key={index}
                className="aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-300"
              >
                <OptimizedImage
                  src={img.src}
                  alt={img.alt}
                  width={320}
                  height={240}
                  className="w-full h-full object-cover"
                  fallback={FALLBACK}
                />
              </div>
            ))}
          </div>
          {/* Mobile: opção de scroll horizontal suave (grid já se adapta; em telas muito pequenas 2 colunas) */}
        </div>
      </div>
    </section>
  );
}
