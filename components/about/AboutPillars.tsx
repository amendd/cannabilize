import { Zap, Heart, Shield } from 'lucide-react';

export default function AboutPillars() {
  const pillars = [
    {
      icon: Zap,
      title: 'Agilidade',
      description: 'Priorizamos respostas rápidas e soluções eficientes, seja no agendamento da consulta ou na liberação da receita médica.',
    },
    {
      icon: Heart,
      title: 'Empatia',
      description: 'Valorizamos a história de cada pessoa, oferecendo orientações personalizadas e acolhimento genuíno.',
    },
    {
      icon: Shield,
      title: 'Ética',
      description: 'Agimos em total conformidade com as normas legais e éticas do setor de saúde, garantindo segurança total.',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Nossos Pilares
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <Icon size={48} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{pillar.title}</h3>
                <p className="text-gray-600">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
