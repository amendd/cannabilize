'use client';

import { useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { LandingConfigPublic } from '@/lib/landing-config';

interface ConsumptionFormsProps {
  config: LandingConfigPublic | null;
}

export default function ConsumptionForms({ config }: ConsumptionFormsProps) {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(1);
  const cf = config?.consumptionForms;
  if (!cf || !cf.items?.length) return null;

  const items = [...cf.items].sort((a, b) => a.order - b.order);

  return (
    <section id="formas-de-consumo" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho: título à esquerda, badge + texto ANVISA à direita (referência ClickCannabis) */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              {cf.title}
            </h2>
            <p className="mt-2 text-gray-600 text-base max-w-xl">
              Uso médico com orientação profissional e tratamento personalizado.
            </p>
          </div>
          <div className="flex-shrink-0 md:text-right">
            <div className="inline-block rounded-lg bg-green-100 px-4 py-2.5">
              <span className="block text-sm font-semibold text-green-800">
                {cf.badge}
              </span>
              {cf.badgeSub && (
                <span className="block mt-0.5 text-xs text-gray-500">
                  {cf.badgeSub}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lista em sanfona: item expandido com fundo verde suave e sombra; colapsados com fundo branco */}
        <div className="space-y-4">
          {items.map((item) => {
            const isExpanded = expandedOrder === item.order;
            return (
              <div
                key={item.order}
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded
                    ? 'border border-green-200/80 bg-green-50/90 shadow-sm'
                    : 'border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                {/* Linha clicável: título à esquerda, "Ver mais" / "Ocultar" à direita */}
                <button
                  type="button"
                  onClick={() => setExpandedOrder(isExpanded ? null : item.order)}
                  className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left"
                >
                  <span
                    className={`text-base md:text-lg font-semibold ${
                      isExpanded ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {String(item.order).padStart(2, '0')}. {item.title}
                  </span>
                  <span className="flex-shrink-0 ml-2 text-sm font-medium text-green-600">
                    {isExpanded ? 'Ocultar' : 'Ver mais'}
                  </span>
                </button>

                {/* Conteúdo expandido: descrição à esquerda, imagem à direita (referência) */}
                {isExpanded && (
                  <div className="border-t border-green-200/50 bg-green-50/60 px-5 pb-6 md:px-6 md:pb-6 pt-5">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      {item.imageUrl ? (
                        <div className="flex-shrink-0 w-full lg:w-[min(360px,38%)]">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/80 border border-green-200/40 shadow-sm">
                            <OptimizedImage
                              src={item.imageUrl}
                              alt={item.title}
                              width={360}
                              height={270}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
