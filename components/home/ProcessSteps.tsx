'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Stethoscope, FileText, Shield, Truck, CheckCircle2 } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

const steps = [
  {
    number: 1,
    title: 'Consulta Médica',
    icon: Stethoscope,
    description: 'Faça sua consulta médica por apenas R$50, todo o processo é 100% online, com médicos de plantão 24h por dia.',
    details: 'Consulta médica realizada por videoconferência, com especialistas que entendem a fundo a aplicação dos canabinoides. Duração média de 15 minutos via Google Meet.',
    image: '/images/process/consultation.jpg',
    imageAlt: 'Médico realizando consulta online com paciente',
    color: 'from-blue-500 to-blue-600',
  },
  {
    number: 2,
    title: 'Receita Médica',
    icon: FileText,
    description: 'Se apto para o tratamento, o médico emitirá a receita necessária para que a autorização possa ser solicitada.',
    details: 'Receita emitida em até 10 minutos após a consulta, se aprovado pelo médico. Receita digital válida para solicitação de autorização ANVISA.',
    image: '/images/process/prescription.jpg',
    imageAlt: 'Receita médica digital para cannabis medicinal',
    color: 'from-green-500 to-green-600',
  },
  {
    number: 3,
    title: 'Autorização da Anvisa',
    icon: Shield,
    description: 'Acompanhamos você em todas as etapas do processo de documentação necessário para a importação dos medicamentos prescritos.',
    details: 'Suporte completo no preenchimento de formulários, revisão de documentos e acompanhamento do processo até a liberação final pela ANVISA.',
    image: '/images/process/anvisa.jpg',
    imageAlt: 'Processo de autorização ANVISA para importação',
    color: 'from-purple-500 to-purple-600',
  },
  {
    number: 4,
    title: 'Importação e Entrega',
    icon: Truck,
    description: 'Oferecemos suporte completo na importação direta dos EUA, com isenção de impostos e entrega em até 15 dias úteis.',
    details: 'Importação direta dos Estados Unidos com isenção de impostos. Prazo de entrega de até 15 dias úteis. Acompanhamento pós-tratamento incluído.',
    image: '/images/process/delivery.jpg',
    imageAlt: 'Entrega de medicamentos importados',
    color: 'from-orange-500 to-orange-600',
  },
];

export default function ProcessSteps() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section id="click-process" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
            Processo Simplificado
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            O processo da <span className="text-green-600">CannaLize</span> acontece em quatro etapas rápidas
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Se apto ao tratamento, nós iremos te auxiliar em cada uma das etapas, até a chegada dos seus medicamentos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isExpanded = expanded === step.number;

            return (
              <div
                key={step.number}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
                  isExpanded ? 'border-green-500' : 'border-transparent'
                }`}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : step.number)}
                  className="w-full p-6 flex items-start gap-4 hover:bg-gray-50 transition"
                >
                  {/* Icon/Number Circle */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-xl shadow-lg`}>
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon size={24} className="text-green-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    
                    {/* Expand indicator */}
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      {isExpanded ? (
                        <>
                          <span>Ver menos</span>
                          <ChevronUp size={18} />
                        </>
                      ) : (
                        <>
                          <span>Saiba mais</span>
                          <ChevronDown size={18} />
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-0 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                    {/* Imagem ilustrativa */}
                    {step.image && (
                      <div className="mt-4 mb-4 relative h-48 rounded-xl overflow-hidden">
                        <OptimizedImage
                          src={step.image}
                          alt={step.imageAlt || step.title}
                          width={400}
                          height={200}
                          className="object-cover w-full h-full"
                          fallback={`/images/process/step-${step.number}.jpg`}
                        />
                      </div>
                    )}
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-green-600 flex-shrink-0 mt-1" size={20} />
                        <p className="text-gray-700 leading-relaxed">{step.details}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Visual Timeline */}
        <div className="hidden lg:block relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 transform -translate-y-1/2"></div>
          <div className="relative flex justify-between">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white`}>
                  {step.number}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
