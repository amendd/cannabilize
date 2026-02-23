'use client';

import { Heart, FileCheck, DollarSign, Headphones, LayoutDashboard, Stethoscope } from 'lucide-react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';

const DIFFERENTIALS = [
  {
    icon: Heart,
    title: 'Você não fica sozinho',
    description: 'Da primeira consulta até o medicamento em casa: nossa equipe te guia em cada etapa. Resultado: menos dúvida, mais segurança.',
  },
  {
    icon: FileCheck,
    title: 'ANVISA e documentação por nossa conta',
    description: 'A burocracia é conosco. Você recebe passo a passo o que fazer e nós acompanhamos até a liberação.',
  },
  {
    icon: DollarSign,
    title: 'R$ 50 na consulta — sem surpresas',
    description: 'O valor da consulta é fixo. Sobre o medicamento, você é orientado com clareza antes de seguir. Nada de custo escondido.',
  },
  {
    icon: Headphones,
    title: 'Suporte antes, durante e depois',
    description: 'Dúvida na dosagem, no formulário ou na entrega? Um canal de suporte que realmente responde e resolve.',
  },
  {
    icon: LayoutDashboard,
    title: 'Tudo em um só lugar',
    description: 'Consultas, receitas e documentos na sua área do paciente. Menos papel, mais controle do seu tratamento.',
  },
  {
    icon: Stethoscope,
    title: 'Médicos especialistas em cannabis medicinal',
    description: 'Você é atendido por profissionais capacitados, que escutam sua história e indicam o tratamento certo — sem pressa, sem julgamento.',
  },
];

export default function WhyCannabiLize() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
            Por que a plataforma Cannabilize
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Por que a plataforma Cannabilize
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Menos burocracia, mais clareza e acompanhamento de verdade — do primeiro contato até o medicamento na sua mão. Pacientes acompanhados pela Cannabilize em todo o Brasil.
          </p>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            O atendimento segue diretrizes clínicas e protocolos assistenciais desenvolvidos pela equipe Cannabilize. Você não enfrenta o processo sozinho.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {DIFFERENTIALS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex p-3 rounded-xl bg-green-100 text-green-600 mb-4">
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <AgendarTrigger
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Inicie sua avaliação médica
          </AgendarTrigger>
        </div>
      </div>
    </section>
  );
}
