'use client';

import Link from 'next/link';
import {
  FileCheck,
  UserCheck,
  Leaf,
  Scale,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
  Shield,
  CircleDollarSign,
  Info,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    step: 1,
    title: 'Consulta médica na plataforma',
    description: 'Você realiza a consulta médica por meio da nossa plataforma e, quando indicado pelo médico, recebe a receita.',
    icon: UserCheck,
  },
  {
    step: 2,
    title: 'Receita emitida pelo médico',
    description: 'A receita é de responsabilidade do médico que realizou o atendimento. Ela não garante e não substitui outras exigências legais.',
    icon: FileText,
  },
  {
    step: 3,
    title: 'Solicitação opcional de análise agronômica',
    description: 'Se desejar, você pode solicitar a conexão com um engenheiro agrônomo para avaliação técnica da receita e possível emissão de laudo.',
    icon: Leaf,
  },
  {
    step: 4,
    title: 'Avaliação técnica independente',
    description: 'O engenheiro agrônomo analisa de forma independente e, quando aplicável, emite o laudo agronômico. O resultado depende exclusivamente da análise técnica.',
    icon: FileCheck,
  },
];

const FAQ_ITEMS = [
  {
    q: 'O laudo é garantido?',
    a: 'Não. O laudo depende da análise técnica independente do engenheiro agrônomo. A plataforma não garante a emissão de laudo; apenas facilita a conexão com o profissional.',
  },
  {
    q: 'A plataforma emite o laudo?',
    a: 'Não. O laudo é emitido pelo engenheiro agrônomo, profissional autônomo e independente. A plataforma apenas conecta você a esse serviço técnico opcional.',
  },
  {
    q: 'O engenheiro é independente?',
    a: 'Sim. O engenheiro agrônomo atua de forma técnica e independente. A avaliação e a decisão sobre a emissão do laudo são de sua exclusiva responsabilidade profissional.',
  },
  {
    q: 'O serviço é obrigatório?',
    a: 'Não. A análise agronômica é um serviço adicional e totalmente opcional. Você pode utilizar apenas a receita médica, conforme a legislação aplicável.',
  },
  {
    q: 'O pagamento garante o laudo?',
    a: 'Não. O pagamento refere-se ao serviço profissional de análise. A emissão do laudo depende do resultado da avaliação técnica e não é garantida pelo valor pago.',
  },
  {
    q: 'Isso substitui exigências legais?',
    a: 'Não. O laudo agronômico tem caráter técnico e informativo. Ele não substitui leis, regulamentações ou exigências de órgãos reguladores. O usuário é responsável por cumprir a legislação local.',
  },
  {
    q: 'Posso usar o laudo em qualquer região?',
    a: 'A validade e o uso do laudo dependem da legislação de cada região. É sua responsabilidade verificar as normas locais e utilizar o documento em conformidade com a lei.',
  },
];

export default function LaudoAgronomicoPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="relative bg-gradient-to-br from-green-50 via-white to-stone-50 py-16 lg:py-24 overflow-hidden"
        aria-label="Apresentação"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/40 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-stone-200/40 rounded-full mix-blend-multiply filter blur-xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6">
            <p className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Serviço opcional e independente
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Avaliação agronômica profissional como próximo passo opcional
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Conectamos você a especialistas técnicos quando fizer sentido: após a consulta médica e a receita, você pode, de forma opcional, solicitar análise por um engenheiro agrônomo e emissão de laudo agronômico.
            </p>
            <div className="pt-4">
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 text-green-700 font-medium hover:text-green-800 underline underline-offset-2 transition"
              >
                Entenda como funciona
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section
        id="como-funciona"
        className="py-16 lg:py-20 bg-white border-t border-gray-100"
        aria-labelledby="titulo-como-funciona"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 id="titulo-como-funciona" className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Como funciona
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Fluxo simples e transparente: da consulta médica à análise técnica opcional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="relative"
                >
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 h-full flex flex-col">
                    <span className="inline-block w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold mb-4">
                      {item.step}
                    </span>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-green-600">
                        <Icon size={22} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">
                      {item.description}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <ArrowRight className="w-5 h-5 text-gray-300" aria-hidden />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* O que é a análise agronômica */}
      <section
        className="py-16 lg:py-20 bg-gray-50"
        aria-labelledby="titulo-analise"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="titulo-analise" className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            O que é a análise agronômica
          </h2>

          <div className="space-y-6 text-gray-700">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Papel do engenheiro agrônomo
              </h3>
              <p>
                O engenheiro agrônomo é o profissional habilitado para realizar a avaliação técnica da receita do ponto de vista agronômico e, quando aplicável, emitir o laudo agronômico. Ele atua com independência técnica e responsabilidade profissional.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-green-600" />
                O que é um laudo agronômico
              </h3>
              <p>
                O laudo agronômico é um documento técnico emitido pelo engenheiro agrônomo, resultante da análise da receita e dos aspectos agronômicos envolvidos. Ele tem caráter informativo e técnico.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-green-600" />
                O que o laudo não é
              </h3>
              <p>
                O laudo não é autorização automática, não substitui leis ou regulamentações locais e não garante aprovação por órgãos reguladores. O usuário é responsável por verificar e cumprir a legislação aplicável à sua situação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Serviço opcional e independente - Compliance */}
      <section
        className="py-16 lg:py-20 bg-white border-t border-gray-100"
        aria-labelledby="titulo-opcional"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Scale className="w-6 h-6 text-green-700" />
            </div>
            <h2 id="titulo-opcional" className="text-2xl md:text-3xl font-bold text-gray-900">
              Serviço opcional e independente
            </h2>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-6 md:p-8 space-y-4">
            <p className="text-gray-800 font-medium">
              Esta seção é fundamental para sua informação:
            </p>
            <ul className="space-y-2 text-gray-700 list-none">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>O serviço de análise agronômica é <strong>opcional</strong>. Nenhum usuário é obrigado a contratá-lo.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>O engenheiro agrônomo atua de forma <strong>técnica e independente</strong>. A plataforma não interfere na análise nem na decisão sobre a emissão do laudo.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>A plataforma <strong>apenas facilita a conexão</strong> entre você e o profissional. Não somos responsáveis pelo conteúdo do laudo nem pelo resultado da análise.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>O <strong>pagamento</strong> refere-se ao serviço profissional do engenheiro (tempo, análise e responsabilidade técnica), e não à emissão garantida de um documento.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Transparência sobre pagamento */}
      <section
        className="py-16 lg:py-20 bg-gray-50"
        aria-labelledby="titulo-pagamento"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CircleDollarSign className="w-6 h-6 text-green-700" />
            </div>
            <h2 id="titulo-pagamento" className="text-2xl md:text-3xl font-bold text-gray-900">
              Transparência sobre pagamento
            </h2>
          </div>

          <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4 text-gray-700">
            <p>
              O pagamento ocorre quando você opta por solicitar o serviço de análise agronômica. Pelo valor pago, você está contratando o <strong>serviço profissional</strong> do engenheiro agrônomo, que inclui o tempo dedicado à análise, a avaliação técnica e a responsabilidade profissional.
            </p>
            <p>
              O valor <strong>não garante</strong> a emissão do laudo. A decisão sobre emitir ou não o laudo é exclusiva do engenheiro, com base na análise técnica. Em caso de dúvidas sobre valores e condições, consulte as informações disponíveis no momento da contratação do serviço.
            </p>
          </div>
        </div>
      </section>

      {/* Benefícios para o usuário */}
      <section
        className="py-16 lg:py-20 bg-white border-t border-gray-100"
        aria-labelledby="titulo-beneficios"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="titulo-beneficios" className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
            O que pode representar para você
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Benefícios de contar com orientação técnica especializada, sem promessa de resultado.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Orientação técnica especializada', desc: 'Análise sob a ótica agronômica por profissional habilitado.' },
              { title: 'Análise responsável e profissional', desc: 'Avaliação feita com critério técnico e independência.' },
              { title: 'Clareza sobre viabilidade técnica', desc: 'Compreensão melhor dos aspectos técnicos envolvidos.' },
              { title: 'Mais informação e segurança', desc: 'Documentação técnica que pode complementar sua decisão.' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem faz sentido / Para quem não faz */}
      <section
        className="py-16 lg:py-20 bg-gray-50"
        aria-labelledby="titulo-faz-sentido"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="titulo-faz-sentido" className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 text-center">
            Para quem faz sentido — e para quem não faz
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-green-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Faz sentido para quem</h3>
              </div>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Busca orientação técnica complementar após a receita médica</li>
                <li>• Quer entender melhor os aspectos agronômicos envolvidos</li>
                <li>• Deseja documentação técnica para uso em conformidade com a lei</li>
                <li>• Entende que o laudo não é garantido e depende da análise do profissional</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-6 h-6 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Não faz sentido para quem</h3>
              </div>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Espera garantia automática de laudo ou aprovação</li>
                <li>• Busca substituir exigências legais ou regulatórias</li>
                <li>• Acredita que o pagamento garante a emissão do documento</li>
                <li>• Quer soluções fora da legislação aplicável</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="py-16 lg:py-20 bg-white border-t border-gray-100"
        aria-labelledby="titulo-faq"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-10">
            <HelpCircle className="w-8 h-8 text-green-600" />
            <h2 id="titulo-faq" className="text-2xl md:text-3xl font-bold text-gray-900">
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = faqOpen === index;
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(isOpen ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                    aria-expanded={isOpen}
                    aria-controls={`faq-resposta-${index}`}
                    id={`faq-pergunta-${index}`}
                  >
                    <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                    <span className="text-gray-500 flex-shrink-0" aria-hidden>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <div
                    id={`faq-resposta-${index}`}
                    role="region"
                    aria-labelledby={`faq-pergunta-${index}`}
                    className={isOpen ? 'block' : 'hidden'}
                  >
                    <div className="px-5 pb-4 pt-0 border-t border-gray-100">
                      <p className="text-gray-700 pt-3">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Avisos legais e responsabilidade */}
      <section
        className="py-12 lg:py-16 bg-gray-100 border-t border-gray-200"
        aria-labelledby="titulo-avisos"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 mb-6">
            <Shield className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
            <h2 id="titulo-avisos" className="text-xl font-bold text-gray-900">
              Avisos legais e responsabilidade
            </h2>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 text-sm text-gray-700 space-y-3">
            <p>
              A legalidade do uso e da documentação varia conforme a região e a legislação aplicável. O serviço de análise agronômica tem caráter técnico e informativo.
            </p>
            <p>
              O usuário é responsável por cumprir a legislação local e por utilizar a receita e o laudo (quando emitido) em conformidade com as normas vigentes. A plataforma não substitui órgãos reguladores nem se responsabiliza pelo uso que o usuário faça dos documentos.
            </p>
            <p>
              Em caso de dúvidas sobre requisitos legais ou regulatórios, consulte um advogado ou o órgão competente da sua região.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final discreto */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 mb-6">
            Após realizar sua consulta médica e receber a receita, você pode solicitar a conexão com o engenheiro agrônomo pela área do paciente ou pelo suporte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/agendar"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-green-600 text-green-700 font-medium hover:bg-green-50 transition"
            >
              Agendar consulta
            </Link>
            <a
              href="https://wa.me/5521993686082"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition"
            >
              Tirar dúvidas no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
