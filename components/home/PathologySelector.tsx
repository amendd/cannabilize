'use client';

import { useState } from 'react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';
import { Check, Sparkles, Info } from 'lucide-react';

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

const COMMON_CONDITIONS = ['Ansiedade', 'Dores', 'Insônia', 'Depressão', 'Fibromialgia', 'Enxaqueca'];

const MICROCOPY: Record<string, string> = {
  Alcoolismo: 'A cannabis medicinal é utilizada em protocolos de redução de danos e dependência, mediante avaliação médica.',
  Ansiedade: 'A cannabis medicinal é amplamente utilizada para ansiedade, com acompanhamento médico para dosagem e evolução.',
  'Perda de peso': 'Canabinoides podem auxiliar no metabolismo e apetite; a avaliação médica define se o tratamento é indicado.',
  Obesidade: 'A cannabis medicinal pode fazer parte de um protocolo multidisciplinar, com avaliação médica individual.',
  Depressão: 'A cannabis medicinal é utilizada em muitos casos de depressão refratária, sempre com acompanhamento médico.',
  Dores: 'A cannabis medicinal é amplamente utilizada para dores crônicas; o médico avalia seu caso e indica o melhor protocolo.',
  Epilepsia: 'A cannabis medicinal é reconhecida pela ANVISA para epilepsias refratárias, com acompanhamento médico especializado.',
  Insônia: 'A cannabis medicinal é muito utilizada para distúrbios do sono; o médico ajusta a dosagem conforme sua resposta.',
  Tabagismo: 'Canabinoides podem auxiliar em protocolos de cessação do tabaco, com avaliação médica.',
  Autismo: 'A cannabis medicinal é utilizada em diversos protocolos para TEA, com acompanhamento médico especializado.',
  Enxaqueca: 'A cannabis medicinal é amplamente utilizada para enxaqueca crônica, mediante avaliação médica.',
  Fibromialgia: 'A cannabis medicinal é amplamente utilizada para fibromialgia, com alívio de dores e melhora na qualidade do sono.',
  Parkinson: 'A cannabis medicinal pode auxiliar em sintomas do Parkinson; o médico avalia indicação e dosagem.',
  TDAH: 'Em alguns casos a cannabis medicinal é utilizada no TDAH; a avaliação médica define se é indicada para você.',
  Alzheimer: 'A cannabis medicinal é estudada e utilizada em protocolos para sintomas relacionados; avaliação médica necessária.',
  Anorexia: 'A cannabis medicinal pode auxiliar em protocolos nutricionais e de apetite, com acompanhamento médico.',
  Crohn: 'A cannabis medicinal é utilizada em doenças inflamatórias intestinais, com acompanhamento médico.',
  'Intestino irritável': 'A cannabis medicinal é utilizada em casos de intestino irritável, mediante avaliação médica.',
};

export default function PathologySelector() {
  const [selected, setSelected] = useState<string[]>([]);
  const lastSelected = selected.length > 0 ? selected[selected.length - 1] : null;

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
            Qual condição você busca tratar?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            Indique abaixo — tudo passa por avaliação médica. É o primeiro passo para acessar o tratamento com acompanhamento especializado.
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Selecione sua condição para entender como podemos ajudar você.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          {PATHOLOGIES.map((pathology) => {
            const isSelected = selected.includes(pathology);
            const isCommon = COMMON_CONDITIONS.includes(pathology);
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
                  ${isCommon ? 'ring-1 ring-green-200' : ''}
                `}
              >
                {isCommon && (
                  <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide text-green-600 font-medium bg-green-100 px-1.5 py-0.5 rounded">Comum</span>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base pr-6">{pathology}</span>
                  {isSelected && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
                {!isSelected && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/10 transition-all duration-300 pointer-events-none"></div>
                )}
              </button>
            );
          })}
        </div>

        {lastSelected && MICROCOPY[lastSelected] && (
          <div className="mb-10 flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-left">
            <Info size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong className="text-green-800">{lastSelected}:</strong> {MICROCOPY[lastSelected]}
            </p>
          </div>
        )}

        <div className="text-center">
          <AgendarTrigger
            pathologies={selected}
            disabled={selected.length === 0}
            className={`
              inline-flex items-center gap-3 px-10 py-5 rounded-xl text-lg font-bold transition-all duration-300 shadow-lg
              ${selected.length > 0
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transform hover:-translate-y-1 hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {selected.length > 0 ? (
              <>
                <span>Continuar minha avaliação</span>
                <Sparkles size={20} />
              </>
            ) : (
              <span>Selecione pelo menos uma condição</span>
            )}
          </AgendarTrigger>
          
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
