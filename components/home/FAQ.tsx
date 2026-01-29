'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'Como funciona a consulta online?',
    answer: 'A consulta é realizada 100% online via Google Meet, com duração média de 15 minutos. Você agenda um horário, preenche uma anamnese pré-consulta e no dia agendado recebe o link da videoconferência.',
  },
  {
    question: 'Quanto custa a consulta?',
    answer: 'A consulta médica custa apenas R$ 50,00. Este é um preço acessível para democratizar o acesso ao tratamento com cannabis medicinal.',
  },
  {
    question: 'Quanto tempo leva para receber a receita?',
    answer: 'Se aprovado pelo médico, a receita é emitida em até 10 minutos após o término da consulta. Você recebe a receita digital por email.',
  },
  {
    question: 'Como funciona o processo de importação?',
    answer: 'Após receber a receita, nossa equipe te auxilia em todas as etapas: solicitação de autorização ANVISA, documentação necessária e processo de importação. O medicamento é importado diretamente dos EUA com isenção de impostos.',
  },
  {
    question: 'Qual o prazo de entrega?',
    answer: 'O prazo de entrega é de até 15 dias úteis após a aprovação da autorização ANVISA e processamento da importação.',
  },
  {
    question: 'A CannaLize é confiável?',
    answer: 'Sim! Temos mais de 1.500 depoimentos positivos no Google, mais de 90.000 atendimentos realizados e nota 4.9 estrelas. Somos referência em tratamentos com cannabis medicinal no Brasil.',
  },
];

export default function FAQ() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Dúvidas frequentes
          </h2>
          <p className="text-lg text-gray-600">
            Algumas das principais dúvidas e curiosidades que já respondemos.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
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
