'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

const PATHOLOGIES = [
  'Alcoolismo',
  'Ansiedade',
  'Perda de peso',
  'Obesidade',
  'Depressão',
  'Dores',
  'Epilepsia',
  'Insônia',
  'Tabagismo',
  'Autismo',
  'Enxaqueca',
  'Fibromialgia',
  'Parkinson',
  'TDAH',
  'Alzheimer',
  'Anorexia',
  'Crohn',
  'Intestino irritável',
];

export default function PathologySelector() {
  const [selected, setSelected] = useState<string[]>([]);

  const togglePathology = (pathology: string) => {
    setSelected(prev =>
      prev.includes(pathology)
        ? prev.filter(p => p !== pathology)
        : [...prev, pathology]
    );
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white via-green-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
            <Sparkles size={16} />
            <span>Tratamento Personalizado</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Para qual condição você busca um tratamento?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Selecione as suas patologias abaixo e inicie seu tratamento com cannabis medicinal ainda hoje!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
          {PATHOLOGIES.map((pathology) => {
            const isSelected = selected.includes(pathology);
            return (
              <button
                key={pathology}
                onClick={() => togglePathology(pathology)}
                className={`
                  group relative p-4 rounded-xl border-2 transition-all duration-300 text-left
                  transform hover:scale-105 hover:shadow-lg
                  ${isSelected
                    ? 'border-green-600 bg-gradient-to-br from-green-50 to-green-100 text-green-700 font-semibold shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50 text-gray-700'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base">{pathology}</span>
                  {isSelected && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Hover effect */}
                {!isSelected && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/10 transition-all duration-300 pointer-events-none"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href={{
              pathname: '/agendamento',
              query: { pathologies: selected.join(',') }
            }}
            className={`
              inline-flex items-center gap-3 px-10 py-5 rounded-xl text-lg font-bold transition-all duration-300 shadow-lg
              ${selected.length > 0
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transform hover:-translate-y-1 hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            style={{ pointerEvents: selected.length > 0 ? 'auto' : 'none' }}
          >
            {selected.length > 0 ? (
              <>
                <span>Iniciar jornada com {selected.length} {selected.length === 1 ? 'condição' : 'condições'}</span>
                <Sparkles size={20} />
              </>
            ) : (
              <span>Selecione pelo menos uma condição</span>
            )}
          </Link>
          
          {selected.length > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              ✓ Você selecionou {selected.length} {selected.length === 1 ? 'condição' : 'condições'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
