'use client';

import { useEffect, useState } from 'react';
import { Users, MessageCircle, Calendar, MapPin, Star, TrendingUp } from 'lucide-react';

const stats = [
  { 
    icon: Users, 
    value: 90000, 
    label: 'Atendimentos', 
    suffix: '+',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
  },
  { 
    icon: MessageCircle, 
    value: 400000, 
    label: 'Seguidores', 
    suffix: '+',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
  },
  { 
    icon: Calendar, 
    value: 30000, 
    label: 'Consultas', 
    suffix: '+',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
  },
  { 
    icon: Star, 
    value: 2000, 
    label: 'Depoimentos', 
    suffix: '+',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  { 
    icon: MapPin, 
    value: 2000, 
    label: 'Cidades atendidas', 
    suffix: '+',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
  },
];

export default function Statistics() {
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    setCounted(true);
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
            Números que Comprovam
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Confiança e Resultados
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Milhares de pacientes já confiaram na CannaLize para seu tratamento
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl border border-white/20"
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={28} className="text-white" />
                </div>

                {/* Value */}
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {counted ? (
                    <>
                      {stat.value.toLocaleString('pt-BR')}
                      {stat.suffix}
                    </>
                  ) : (
                    '0'
                  )}
                </div>

                {/* Label */}
                <div className="text-sm md:text-base text-white/90 font-medium">
                  {stat.label}
                </div>

                {/* Decorative corner */}
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-20 rounded-bl-full`}></div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-white/80">
            <TrendingUp size={20} />
            <span className="text-sm font-medium">Crescimento contínuo desde 2020</span>
          </div>
        </div>
      </div>
    </section>
  );
}
