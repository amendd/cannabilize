'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { Stethoscope, Award, Heart } from 'lucide-react';

const team = [
  {
    name: 'Dr. João Silva',
    role: 'Médico Especialista',
    crm: 'CRM123456',
    specialization: 'Cannabis Medicinal',
    photo: '/images/team/dr-joao-silva.jpg',
    bio: 'Especialista em cannabis medicinal com 10 anos de experiência. Formado pela USP.',
    experience: '10+ anos',
  },
  {
    name: 'Dra. Maria Santos',
    role: 'Médica Especialista',
    crm: 'CRM789012',
    specialization: 'Neurologia e Cannabis',
    photo: '/images/team/dra-maria-santos.jpg',
    bio: 'Neurologista especializada em tratamentos com canabinoides. Membro da IACM.',
    experience: '8+ anos',
  },
  {
    name: 'Equipe de Suporte',
    role: 'Atendimento ao Cliente',
    crm: '',
    specialization: 'Suporte e Orientação',
    photo: '/images/team/equipe-suporte.jpg',
    bio: 'Equipe dedicada a oferecer o melhor atendimento e suporte em todas as etapas do tratamento.',
    experience: '24/7',
  },
];

export default function AboutTeam() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
            Nossa Equipe
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 font-display">
            Profissionais Especializados
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça os especialistas que estão prontos para ajudar você em sua jornada de tratamento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              {/* Foto */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <OptimizedImage
                  src={member.photo}
                  alt={`Foto de ${member.name}`}
                  width={128}
                  height={128}
                  className="rounded-full object-cover border-4 border-green-200 shadow-md group-hover:border-green-400 transition-colors"
                  fallback="/images/team/default-avatar.jpg"
                />
                {/* Badge de experiência */}
                <div className="absolute -bottom-2 -right-2 bg-green-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1">
                  <Award size={12} />
                  {member.experience}
                </div>
              </div>

              {/* Informações */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Stethoscope size={20} className="text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900 font-display">
                    {member.name}
                  </h3>
                </div>
                <p className="text-green-600 font-semibold mb-1">{member.role}</p>
                {member.crm && (
                  <p className="text-sm text-gray-500 mb-2">{member.crm}</p>
                )}
                <p className="text-sm text-gray-600 mb-3">{member.specialization}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 to-green-50/0 group-hover:from-green-50/50 group-hover:to-transparent rounded-2xl transition-all duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 rounded-full border border-green-200">
            <Heart className="text-green-600" size={20} />
            <span className="text-sm font-medium text-gray-700">
              Equipe disponível 24 horas por dia para você
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
