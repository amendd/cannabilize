'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Users, TrendingUp, Clock, Shield, MessageCircle, Award, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SejaMedicoPage() {
  const whatsappNumber = '5511999999999'; // Substitua pelo número real
  const whatsappMessage = encodeURIComponent(
    'Olá! Tenho interesse em me tornar um médico parceiro da Cannabilize e trabalhar com fitocanabinoides.'
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const beneficios = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Expanda sua base de pacientes com suporte especializado',
      description: 'Crescimento sustentável com demanda qualificada por tratamentos com cannabis medicinal'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Receba pacientes previamente orientados pela plataforma',
      description: 'Acesso a pacientes já cadastrados e informados sobre o fluxo de atendimento'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Atenda online com autonomia e organização da sua agenda',
      description: 'Defina seus horários com liberdade e trabalhe de onde quiser'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Equipe dedicada para apoio clínico e operacional',
      description: 'Suporte para dúvidas clínicas, regulatórias e uso da plataforma'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Reconhecimento Profissional',
      description: 'Torne-se referência em tratamentos com fitocanabinoides com capacitação contínua'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Tecnologia de Ponta',
      description: 'Plataforma moderna e intuitiva para gestão de consultas e prontuários'
    }
  ];

  const estatisticas = [
    { numero: '+90.000', label: 'Pacientes Atendidos' },
    { numero: '18+', label: 'Médicos Ativos na Plataforma' },
    { numero: '+50.000', label: 'Consultas Realizadas Mensalmente' },
    { numero: '24/7', label: 'Suporte Disponível' }
  ];

  const processo = [
    {
      step: '01',
      title: 'Entre em Contato',
      description: 'Fale conosco pelo WhatsApp e conheça melhor nossa proposta'
    },
    {
      step: '02',
      title: 'Cadastro e Validação',
      description: 'Preencha o formulário com seus dados e envie a documentação'
    },
    {
      step: '03',
      title: 'Treinamento',
      description: 'Receba capacitação sobre fitocanabinoides e nossa plataforma'
    },
    {
      step: '04',
      title: 'Comece a Atender',
      description: 'Inicie suas consultas e faça parte da revolução da cannabis medicinal'
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block px-6 py-3 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4"
            >
              🌿 Parceria Médica Cannabilize
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              Transforme vidas com{' '}
              <span className="text-green-600">Cannabis Medicinal</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 leading-relaxed"
            >
              A Cannabilize é uma plataforma nacional que conecta pacientes e médicos especializados em cannabis medicinal. Amplie sua prática com suporte clínico especializado, fluxo de pacientes qualificados e capacitação contínua.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            >
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-green-600 text-white px-10 py-5 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <MessageCircle size={24} />
                Conversar com nossa equipe médica
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#beneficios"
                className="border-2 border-green-600 text-green-600 px-10 py-5 rounded-xl text-lg font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Conheça os Benefícios
              </a>
            </motion.div>

            {/* Filtro psicológico — texto institucional */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 pt-8 border-t border-green-200/60 space-y-4 text-center max-w-3xl mx-auto"
            >
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Buscamos médicos comprometidos com medicina baseada em evidências, atendimento humanizado e acompanhamento contínuo do paciente.
              </p>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                A Cannabilize apoia profissionais que desejam atuar com responsabilidade e se desenvolver continuamente na prática da medicina canabinoide.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed pt-2">
                Faça parte da rede médica Cannabilize. Corpo clínico apoiado por diretrizes clínicas e protocolos assistenciais desenvolvidos pela equipe Cannabilize.
              </p>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed pt-1">
                Atuação médica realizada dentro das normas vigentes, com suporte técnico e regulatório especializado.
              </p>
            </motion.div>
          </div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </section>

      {/* Estatísticas */}
      <section className="bg-white py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {estatisticas.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {stat.numero}
                </div>
                <div className="text-sm md:text-base text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rede médica + indicação entre pares */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-center">
          <p className="text-gray-700 text-base md:text-lg font-medium">
            Faça parte da rede médica Cannabilize — médicos parceiros distribuídos nacionalmente, com cannabis medicinal em todo o Brasil.
          </p>
          <p className="text-gray-500 text-sm mt-3">
            Médicos especialistas parceiros Cannabilize. Muitos chegam por indicação de colegas que já atuam na plataforma.
          </p>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que ser um médico parceiro?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Parceria profissional estruturada, com suporte clínico real e desenvolvimento contínuo na medicina canabinoide
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto text-base">
              A equipe Cannabilize oferece apoio clínico, operacional e educacional contínuo durante toda a jornada do médico parceiro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="text-green-600 mb-4">
                  {beneficio.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {beneficio.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {beneficio.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Processo */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como funciona?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
              Um processo simples e rápido para você começar a atender
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto text-base">
              Processo validado e acompanhado pela equipe Cannabilize, garantindo segurança clínica e operacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processo.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 h-full">
                  <div className="text-4xl font-bold text-green-600 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {index < processo.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-green-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que nossos médicos dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                nome: 'Dr. João Silva',
                especialidade: 'Psiquiatria',
                area: 'Médico parceiro Cannabilize',
                depoimento: 'A plataforma me permitiu expandir meu atendimento com suporte clínico real. O fluxo de pacientes qualificados e a capacitação contínua fazem a diferença na prática.'
              },
              {
                nome: 'Dra. Maria Santos',
                especialidade: 'Neurologia',
                area: 'Médica parceira Cannabilize',
                depoimento: 'O suporte da equipe é excepcional tanto no operacional quanto nas dúvidas clínicas. Me sinto parte de um ecossistema médico estruturado.'
              },
              {
                nome: 'Dr. Carlos Oliveira',
                especialidade: 'Clínica Geral',
                area: 'Médico parceiro Cannabilize',
                depoimento: 'Atuar com responsabilidade e acompanhamento contínuo dos pacientes é o que encontrei aqui. Parceria séria, não apenas mais uma oportunidade de atendimento.'
              }
            ].map((depoimento, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Heart key={i} className="w-5 h-5 fill-green-500 text-green-500" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{depoimento.depoimento}"
                </p>
                <div>
                  <div className="font-bold text-gray-900">{depoimento.nome} — {depoimento.especialidade}</div>
                  <div className="text-sm text-gray-600">{depoimento.area}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-green-600 to-green-700 py-20 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para fazer a diferença?
            </h2>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Converse com nosso time de parcerias médicas e conheça como integrar a rede clínica Cannabilize.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white text-green-600 px-10 py-5 rounded-xl text-lg font-semibold hover:bg-green-50 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <MessageCircle size={24} />
                Falar com o time de parcerias médicas
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <p className="text-green-100/90 text-sm max-w-xl mx-auto pt-6">
              Atuação médica realizada dentro das normas vigentes, com suporte técnico e regulatório especializado.
            </p>
            <div className="pt-6 flex items-center justify-center gap-2 text-green-100">
              <CheckCircle2 size={20} />
              <span className="text-sm">Resposta inicial em até 24 horas pela equipe médica Cannabilize.</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
