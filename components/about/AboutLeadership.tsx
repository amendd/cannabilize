import OptimizedImage from '@/components/ui/OptimizedImage';
import { Stethoscope, Headphones } from 'lucide-react';

const FOUNDER = {
  name: 'Edson Neto',
  titles: ['Fundador da Cannabilize', 'Empreendedor em Saúde Digital'],
  photo: '/images/founders/edson-neto.png',
  story: {
    problem: 'Muita gente quer acesso ao tratamento com cannabis medicinal, mas não sabe por onde começar ou tem medo de processos confusos e pouco transparentes.',
    motivation: 'A Cannabilize nasceu para que cada pessoa mereça um caminho claro, seguro e acompanhado por quem entende.',
    mission: 'A Cannabilize existe para que você tenha, da consulta à documentação, um processo humanizado — e que ver alguém recuperar qualidade de vida siga guiando o trabalho da equipe.',
    closing: 'Hoje a instituição segue trabalhando para que cada paciente tenha acesso seguro, orientação clara e acompanhamento verdadeiro durante todo o tratamento.',
  },
};

const TEAM_CARDS = [
  {
    icon: Stethoscope,
    title: 'Equipe Médica Especializada',
    description: 'Médicos com experiência em cannabis medicinal responsáveis pela avaliação e acompanhamento dos pacientes.',
  },
  {
    icon: Headphones,
    title: 'Equipe de Suporte ao Paciente',
    description: 'Profissionais dedicados a orientar e acompanhar cada etapa do processo, garantindo clareza e segurança ao paciente.',
  },
];

export default function AboutLeadership() {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3 md:mb-4">
          Quem está por trás
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-8 md:mb-12 font-display tracking-tight">
          Nossa liderança
        </h2>

        <div className="space-y-12 md:space-y-16">
          {/* Card 1: Fundador em destaque */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 lg:gap-12">
            <div className="shrink-0 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-64 lg:h-64 rounded-2xl overflow-hidden border-4 border-primary-100 shadow-xl bg-gray-100 ring-2 ring-white">
              <OptimizedImage
                src={FOUNDER.photo}
                alt={`Foto de ${FOUNDER.name}`}
                width={256}
                height={256}
                className="w-full h-full object-cover"
                fallback="/images/team/default-avatar.jpg"
              />
            </div>
            <div className="flex-1 min-w-0 text-center md:text-left">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{FOUNDER.name}</h3>
              <div className="space-y-1 mb-5">
                {FOUNDER.titles.map((title, i) => (
                  <p key={i} className="text-primary-600 font-semibold text-sm md:text-base">
                    {title}
                  </p>
                ))}
              </div>
              <div className="space-y-5 text-gray-600 leading-relaxed text-sm md:text-base">
                <p>
                  <strong className="text-gray-800">O que observamos:</strong> {FOUNDER.story.problem}
                </p>
                <p>
                  <strong className="text-gray-800">Nossa motivação:</strong> {FOUNDER.story.motivation}
                </p>
                <p>
                  <strong className="text-gray-800">Por que a Cannabilize existe:</strong> {FOUNDER.story.mission}
                </p>
                <p className="pt-1 text-gray-700">
                  {FOUNDER.story.closing}
                </p>
              </div>
            </div>
          </div>

          {/* Cards 2 e 3: Equipe Médica e Suporte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {TEAM_CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 md:p-6 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary mb-5">
                    <Icon size={28} aria-hidden />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">{card.title}</h4>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
