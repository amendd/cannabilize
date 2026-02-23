'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CURSO_FAQS = [
  {
    id: 'legalidade',
    question: 'O curso é legal? Posso fazer onde moro?',
    answer:
      'O curso em si é 100% legal: é conteúdo educacional. O que varia é a legislação sobre cultivo, colheita e uso de cannabis no seu país ou estado. É sua responsabilidade verificar as leis locais antes de aplicar qualquer prática. O curso não incentiva atos ilegais e enfatiza o cumprimento da lei em cada região.',
  },
  {
    id: 'seguranca',
    question: 'O conteúdo é seguro e responsável?',
    answer:
      'Sim. O material prioriza segurança (equipamentos, ambiente, boas práticas), abordagem técnica e respeito à legislação. Não incentivamos práticas de risco nem uso fora do que a lei permite na sua região.',
  },
  {
    id: 'para-quem',
    question: 'Para quem é o curso? Preciso de formação prévia?',
    answer:
      'O curso atende desde iniciantes com interesse técnico até profissionais que queiram aprofundar conhecimentos. Não é obrigatório ter formação prévia em agronomia ou química; o conteúdo explica os conceitos de forma acessível, mantendo o rigor técnico.',
  },
  {
    id: 'acesso-duracao',
    question: 'Como funciona o acesso e por quanto tempo?',
    answer:
      'O acesso é online: você recebe login na plataforma e pode assistir às aulas e baixar materiais quando quiser. O acesso é vitalício, ou seja, você pode estudar e revisar sem prazo para expiração.',
  },
  {
    id: 'certificado',
    question: 'Há certificado?',
    answer:
      'Sim. Ao concluir todos os módulos e atividades obrigatórias, você recebe um certificado de conclusão do curso, que atesta a participação na formação.',
  },
  {
    id: 'suporte',
    question: 'Como é o suporte a dúvidas?',
    answer:
      'Há um canal dedicado (ex.: área do aluno ou e-mail) para enviar dúvidas sobre o conteúdo. O tempo de resposta pode variar conforme a demanda; geralmente respondemos em até 48 horas úteis.',
  },
  {
    id: 'garantia',
    question: 'Existe garantia?',
    answer:
      'Oferecemos garantia de 7 dias: se você não estiver satisfeito com o curso, pode solicitar reembolso integral dentro desse prazo, sem precisar justificar. Basta entrar em contato pelo canal indicado na área de compra.',
  },
];

export default function CursoFaq() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {CURSO_FAQS.map((faq, index) => {
        const isExpanded = expanded === index;
        return (
          <div
            key={faq.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : index)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded-lg"
              aria-expanded={isExpanded}
              aria-controls={`faq-answer-${faq.id}`}
              id={`faq-question-${faq.id}`}
            >
              <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
              <span className="flex-shrink-0 text-gray-500">
                {isExpanded ? (
                  <ChevronUp size={24} aria-hidden />
                ) : (
                  <ChevronDown size={24} aria-hidden />
                )}
              </span>
            </button>
            <div
              id={`faq-answer-${faq.id}`}
              role="region"
              aria-labelledby={`faq-question-${faq.id}`}
              className={isExpanded ? 'block' : 'hidden'}
            >
              <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                <p className="text-gray-600 pt-4 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
