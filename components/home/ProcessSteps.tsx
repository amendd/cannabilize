'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Minus,
  Stethoscope,
  FileText,
  Shield,
  Truck,
  MapPin,
  Package,
  Leaf,
  MessageCircle,
} from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { LandingConfigPublic } from '@/lib/landing-config';

const WHATSAPP_URL = 'https://wa.me/5521993686082';

/** Primeira parte do texto (até o primeiro ponto ou ~100 chars). Ex.: "Faça sua consulta... 24h." */
function getTeaser(text: string, maxLength = 120): string {
  const firstSentence = text.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= maxLength) return firstSentence + (text.includes('.') ? '.' : '');
  return text.slice(0, maxLength).trim() + (text.length > maxLength ? '...' : '');
}

interface ProcessStepsProps {
  config?: LandingConfigPublic | null;
}

const steps = [
  {
    number: 1,
    title: 'Consulta Médica',
    icon: Stethoscope,
    description: 'Faça sua consulta médica por apenas R$50, todo o processo é 100% online, com médicos de plantão 24h por dia.',
    details: 'Consulta médica realizada por videoconferência, com especialistas que entendem a fundo a aplicação dos canabinoides. Duração média de 15 minutos via Google Meet.',
    image: '/images/process/consultation.jpg',
    imageAlt: 'Médico realizando consulta online com paciente',
  },
  {
    number: 2,
    title: 'Receita Médica',
    icon: FileText,
    description: 'Se apto para o tratamento, o médico emitirá a receita necessária para que a autorização possa ser solicitada.',
    details: 'Receita emitida em até 10 minutos após a consulta, se aprovado pelo médico. Receita digital válida para solicitação de autorização ANVISA.',
    image: '/images/process/prescription.jpg',
    imageAlt: 'Receita médica digital para cannabis medicinal',
  },
  {
    number: 3,
    title: 'Autorização Anvisa',
    icon: Shield,
    description: 'Acompanhamos você em todas as etapas do processo de documentação necessário para a importação dos medicamentos prescritos.',
    details: 'Suporte completo no preenchimento de formulários, revisão de documentos e acompanhamento do processo até a liberação final pela ANVISA.',
    image: '/images/process/anvisa.jpg',
    imageAlt: 'Processo de autorização ANVISA para importação',
  },
  {
    number: 4,
    title: 'Importação e Entrega',
    icon: Truck,
    description: 'Oferecemos suporte completo na importação direta dos EUA, com isenção de impostos e entrega em até 15 dias úteis.',
    details: 'Importação direta dos Estados Unidos com isenção de impostos. Prazo de entrega de até 15 dias úteis. Acompanhamento pós-tratamento incluído.',
    image: '/images/process/delivery.jpg',
    imageAlt: 'Entrega de medicamentos importados',
  },
];

export default function ProcessSteps({ config }: ProcessStepsProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const processImages = config?.processImages ?? {};

  return (
    <section id="click-process" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho: título à esquerda, tag + subtítulo à direita (estilo ClickCannabis) */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-12 md:mb-14">
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              Tratamento descomplicado
            </h2>
            <p className="mt-2 text-gray-600 text-base">
              O atendimento segue diretrizes clínicas e protocolos assistenciais desenvolvidos pela equipe Cannabilize. Nossa equipe acompanha você em todas as etapas.
            </p>
          </div>
          <div className="lg:text-right">
            <span className="inline-block px-3 py-1 rounded-md bg-green-100 text-green-700 text-sm font-medium mb-2">
              Processos
            </span>
            <p className="text-gray-500 text-sm md:text-base">
              Entenda cada uma das nossas etapas.
            </p>
          </div>
        </div>

        {/* 5 cards em linha: 4 etapas + 1 CTA (horizontal scroll em mobile, grid em desktop) */}
        <div className="flex gap-4 overflow-x-auto pb-2 md:overflow-visible md:grid md:grid-cols-5 md:gap-4 lg:gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            const isExpanded = expanded === step.number;
            const imageUrl = processImages[step.number] || step.image;
            const teaser = getTeaser(step.description);

            return (
              <div
                key={step.number}
                className="flex-shrink-0 w-[280px] md:w-auto md:min-w-0 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md overflow-hidden flex flex-col p-4 h-[320px] md:h-[340px]"
              >
                {/* Cabeçalho fixo: badge e título — sempre visível */}
                <span className="inline-block w-fit px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium mb-3">
                  Etapa {step.number}
                </span>
                <h3 className="text-base md:text-lg font-extrabold text-gray-900 mb-2 tracking-tight">
                  {step.title}
                </h3>

                {/* Área que vira: ícone + teaser OU imagem + segundo texto — overflow escondido para não cobrir o botão */}
                <div className="flex-1 min-h-0 overflow-hidden [perspective:800px] relative z-0">
                  <div
                    className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
                    style={{ transform: isExpanded ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                  >
                    {/* Frente: ícone + primeira parte do texto */}
                    <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden] flex flex-col">
                      <div className="flex justify-center mb-2 flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-green-600">
                          <Icon size={28} strokeWidth={1.5} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed min-h-0 overflow-hidden line-clamp-4">
                        {teaser}
                      </p>
                    </div>

                    {/* Verso: imagem (no lugar do ícone) + segundo texto */}
                    <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col overflow-y-auto overflow-x-hidden [transform:rotateY(180deg)]">
                      {imageUrl && (
                        <div className="relative h-28 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 mb-2">
                          <OptimizedImage
                            src={imageUrl}
                            alt={step.imageAlt || step.title}
                            width={240}
                            height={112}
                            className="object-cover w-full h-full"
                            fallback={`/images/process/step-${step.number}.jpg`}
                          />
                        </div>
                      )}
                      <p className="text-sm text-gray-500 leading-relaxed min-h-0">
                        {step.details}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botão fixo fora do flip — sempre clicável (z-10 acima da área que vira) */}
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : step.number)}
                  className="relative z-10 mt-3 pt-3 border-t border-gray-100 w-full inline-flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm flex-shrink-0 bg-white"
                >
                  {isExpanded ? (
                    <>
                      <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-green-600 text-green-600 flex-shrink-0">
                        <Minus size={14} />
                      </span>
                      Menos informações
                    </>
                  ) : (
                    <>
                      <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-green-600 text-green-600 flex-shrink-0">
                        <Plus size={14} />
                      </span>
                      Mais informações
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {/* Card 5: CTA - Uma jornada de sucesso com quem entende! */}
          <div className="flex-shrink-0 w-[280px] md:w-auto md:min-w-0 rounded-xl bg-green-600 overflow-hidden flex flex-col justify-between p-5 md:p-6 text-white">
            <div>
              {/* Ilustração simbólica: pacote + localização + folha */}
              <div className="flex justify-center mb-4">
                <div className="relative flex items-center justify-center w-24 h-24">
                  <Package className="text-white/90" size={48} />
                  <MapPin className="absolute top-0 right-0 text-green-300" size={24} />
                  <Leaf className="absolute -top-1 left-1/2 -translate-x-1/2 text-green-200" size={20} />
                </div>
              </div>
              <p className="text-center text-lg md:text-xl font-semibold leading-snug mb-6">
                Uma jornada de sucesso com quem entende!
              </p>
            </div>
            <Link
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-white text-green-700 font-bold text-sm md:text-base hover:bg-green-50 transition-colors"
            >
              <MessageCircle size={22} className="text-green-600" />
              Falar com um especialista
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
