'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FaqItemPublic } from '@/lib/faq';

/** Ordem priorizada: regulatório e objeções primeiro (É legal? Receita? Importação? Tempo?) */
const DEFAULT_FAQS = [
  { id: '1', question: 'É legal no Brasil?', answer: 'Sim. O uso de cannabis medicinal é regulamentado pela ANVISA. Com receita médica e autorização, você importa e usa o medicamento de forma 100% legal no Brasil.', sortOrder: 0 },
  { id: '2', question: 'Preciso de receita médica?', answer: 'Sim. O tratamento com cannabis medicinal no Brasil exige receita médica e autorização da ANVISA. Nossa equipe realiza a consulta, emite a receita quando indicado e te acompanha em todo o processo de autorização e importação.', sortOrder: 1 },
  { id: '3', question: 'Como funciona a importação?', answer: 'Após receber a receita, nossa equipe te auxilia em todas as etapas: solicitação de autorização ANVISA, documentação necessária e processo de importação. O medicamento é importado diretamente dos EUA com isenção de impostos.', sortOrder: 2 },
  { id: '4', question: 'Quanto tempo leva?', answer: 'A receita é emitida em até 10 minutos após a consulta, se aprovado pelo médico. O prazo de entrega do medicamento é de até 15 dias úteis após a aprovação da autorização ANVISA e processamento da importação.', sortOrder: 3 },
  { id: '5', question: 'Posso ter problemas com a polícia?', answer: 'Não. Com receita médica válida e autorização da ANVISA, você está amparado pela lei. O medicamento é para uso pessoal, com documentação em ordem. A CannabiLize cuida de toda a documentação necessária.', sortOrder: 4 },
  { id: '6', question: 'O valor final é só R$50?', answer: 'Os R$ 50 são o valor da consulta médica. O medicamento em si tem custo à parte (importação), e nossa equipe te orienta em todo o processo. Não há custos ocultos: você sabe de tudo antes de seguir.', sortOrder: 5 },
  { id: '7', question: 'Como funciona a consulta online?', answer: 'A consulta é realizada 100% online via Google Meet, com duração média de 15 minutos. Você agenda um horário, preenche uma anamnese pré-consulta e no dia agendado recebe o link da videoconferência.', sortOrder: 6 },
  { id: '8', question: 'Quanto custa a consulta?', answer: 'A consulta médica custa apenas R$ 50,00. Este é um preço acessível para democratizar o acesso ao tratamento com cannabis medicinal.', sortOrder: 7 },
  { id: '9', question: 'A CannabiLize é confiável?', answer: 'Sim! Temos mais de 1.500 depoimentos positivos no Google, mais de 90.000 atendimentos realizados e nota 4.9 estrelas. Somos referência em tratamentos com cannabis medicinal no Brasil.', sortOrder: 8 },
];

interface FAQProps {
  items?: FaqItemPublic[];
}

export default function FAQ({ items }: FAQProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const faqs = items && items.length > 0 ? items : DEFAULT_FAQS;
  const sortedFaqs = [...faqs].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5 tracking-tight">
            Dúvidas frequentes
          </h2>
          <p className="text-lg text-gray-500">
            Algumas das principais dúvidas e curiosidades que já respondemos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedFaqs.map((faq, index) => {
            const isExpanded = expanded === index;

            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : index)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <span className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp size={24} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={24} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-0 border-t border-gray-200">
                    <p className="text-gray-700 mt-4">{faq.answer}</p>
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
