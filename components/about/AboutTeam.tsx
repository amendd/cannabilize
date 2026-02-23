'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { Stethoscope, Award } from 'lucide-react';
import { usePublicConfig } from '@/lib/public-config-context';

const DEFAULT_TEAM = [
  {
    name: 'Dr. João Silva',
    role: 'Médico Especialista',
    crm: 'CRM 123456',
    specialization: 'Cannabis Medicinal',
    photo: '/images/team/dr-joao-silva.jpg',
    bio: 'Dedica-se a ajudar pacientes a encontrar alívio e qualidade de vida com tratamentos baseados em evidências. Acredita em escuta atenta e plano terapêutico transparente.',
    experience: '10+ anos',
  },
  {
    name: 'Dra. Maria Santos',
    role: 'Médica Especialista',
    crm: 'CRM 789012',
    specialization: 'Neurologia e Cannabis',
    photo: '/images/team/dra-maria-santos.jpg',
    bio: 'Neurologista com foco em canabinoides. Trabalha para que cada paciente entenda seu tratamento e se sinta acolhido em todas as etapas.',
    experience: '8+ anos',
  },
  {
    name: 'Equipe de Suporte',
    role: 'Atendimento e Orientação',
    crm: '',
    specialization: 'Suporte ao paciente',
    photo: '/images/team/equipe-suporte.jpg',
    bio: 'Nossa equipe está disponível para tirar dúvidas sobre documentação, agendamento e próximos passos, para você não caminhar sozinho.',
    experience: 'Disponível 24/7',
  },
];

export default function AboutTeam() {
  const { teamPhotos } = usePublicConfig();
  const team = DEFAULT_TEAM.map((member, index) => ({
    ...member,
    photo: teamPhotos?.[index + 1] || member.photo,
  }));

  return (
    <section className="py-16 md:py-20 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4">
          Quem cuida de você
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-display tracking-tight">
          Equipe médica e suporte que você pode confiar
        </h2>
        <p className="text-gray-600 mb-12 max-w-2xl">
          Especialistas com CRM ativo e anos de experiência, além de uma equipe pronta para apoiar você em cada etapa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <article
              key={index}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300"
            >
              <div className="p-6">
                <div className="relative w-28 h-28 mx-auto mb-5">
                  <OptimizedImage
                    src={member.photo}
                    alt={`Foto de ${member.name}`}
                    width={112}
                    height={112}
                    className="rounded-full object-cover border-4 border-primary-100 shadow-md"
                    fallback="/images/team/default-avatar.jpg"
                  />
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-primary text-white rounded-full px-2.5 py-1 text-xs font-bold shadow">
                    <Award size={12} aria-hidden />
                    {member.experience}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Stethoscope size={18} className="text-primary shrink-0" aria-hidden />
                    <h3 className="text-lg font-bold text-gray-900 font-display">
                      {member.name}
                    </h3>
                  </div>
                  <p className="text-primary-700 font-semibold text-sm mb-1">{member.role}</p>
                  {member.crm && (
                    <p className="text-xs text-gray-500 mb-2">{member.crm}</p>
                  )}
                  <p className="text-sm text-gray-500 mb-3">{member.specialization}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
