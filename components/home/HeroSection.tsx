'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import AgendarTrigger from '@/components/agendar/AgendarTrigger';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { LandingConfigPublic } from '@/lib/landing-config';

const DEFAULT_HERO = {
  headline: 'Tratamento com Cannabis Medicinal de forma legal, acessível e acompanhada por médicos especialistas',
  subheadline: 'Consulta online por apenas R$50 com suporte completo até a chegada do medicamento.',
  imageUrl: '/images/hero/doctor-consultation.jpg',
  ctaText: 'Ver se o tratamento é indicado para mim',
};
const DEFAULT_STATS = { rating: '4,9', patients: '+90 mil' };

/** CTAs que indicam início definitivo — substituir por copy de avaliação (CRO). */
const LEGACY_CTA_TEXTS = [
  'Quero iniciar meu tratamento',
  'Iniciar tratamento',
  'Iniciar tratamento agora',
  'Começar agora',
  'Iniciar jornada',
];
const CTA_AVALIACAO = 'Ver se o tratamento é indicado para mim';

interface HeroSectionProps {
  config?: LandingConfigPublic | null;
}

export default function HeroSection({ config }: HeroSectionProps) {
  const hero = config?.hero ?? DEFAULT_HERO;
  const rawCta = hero.ctaText ?? DEFAULT_HERO.ctaText;
  const ctaText = LEGACY_CTA_TEXTS.some((t) => rawCta.trim().toLowerCase() === t.toLowerCase())
    ? CTA_AVALIACAO
    : rawCta;
  const rating = config?.stats?.rating ?? DEFAULT_STATS.rating;
  const patients = config?.stats?.patients ?? DEFAULT_STATS.patients;

  return (
    <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 py-16 lg:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content — em mobile fica abaixo da imagem (order-2) para nunca sobrepor */}
          <div className="order-2 lg:order-1 text-center lg:text-left space-y-6">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-5">
              🌿 Cannabis Medicinal com Especialistas
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              {hero.headline}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-500 leading-relaxed">
              {hero.subheadline}
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Indicado para pacientes com ansiedade, dor crônica, insônia e outras condições tratáveis com acompanhamento médico.
            </p>

            {/* Micro bloco institucional — autoridade e segurança regulatória */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="text-green-600 font-medium">✔</span> Médicos especialistas em cannabis medicinal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-green-600 font-medium">✔</span> Atendimento em todo o Brasil
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-green-600 font-medium">✔</span> Processo dentro das normas da Anvisa
              </span>
            </div>

            <p className="text-sm text-green-700 font-medium">
              Etapa 1 de 3 — Avaliação inicial
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center sm:items-start pt-1">
              <AgendarTrigger
                className="group w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {ctaText}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </AgendarTrigger>
              <Link
                href="#click-process"
                className="text-green-600 hover:text-green-700 font-medium underline underline-offset-2 transition"
              >
                Como funciona
              </Link>
            </div>
            <div className="text-sm text-gray-500 space-y-1 pt-1">
              <p className="flex items-center gap-2">✓ Conversa inicial sem compromisso</p>
              <p className="flex items-center gap-2">✓ Atendimento humano especializado</p>
              <p className="flex items-center gap-2">✓ Tire dúvidas antes de decidir</p>
            </div>

            {/* Mini prova social no topo */}
            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-6">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 text-lg">⭐</span>
                <span className="text-sm text-gray-600 font-medium"><strong className="text-gray-900">{rating}</strong>/5 no Google</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-green-200 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-green-300 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-green-400 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    +
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium"><strong className="text-gray-900">{patients}</strong> pacientes</span>
              </div>
            </div>
          </div>

          {/* Image Section — em mobile aparece primeiro (order-1); nunca texto sobre a imagem */}
          <div className="relative order-1 lg:order-2">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <OptimizedImage
                src={hero.imageUrl || '/images/hero/doctor-consultation.jpg'}
                alt="Médico especialista em cannabis medicinal realizando consulta online com paciente via videoconferência"
                width={800}
                height={600}
                priority={true}
                fallback="/images/hero/placeholder.jpg"
                className="object-cover w-full h-full"
              />

              {/* Faixa inferior: estatística sem cobrir a imagem */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-12 pb-4 px-4 pointer-events-none">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center">
                  <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">+90.000</span>
                  <span className="text-white/95 text-sm md:text-base font-medium drop-shadow-md">Atendimentos realizados com sucesso</span>
                </div>
              </div>

              {/* Badge compacto no canto: Consulta Online — não cobre o centro da imagem */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 border border-green-100 hidden sm:flex items-center gap-2 pointer-events-none">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Play className="text-green-600" size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900 leading-tight">Consulta Online</div>
                  <div className="text-[10px] text-gray-600 leading-tight">24h por dia</div>
                </div>
              </div>
            </div>

            {/* Badge "Consulta Online" em mobile (abaixo da imagem, para não tapar) */}
            <div className="sm:hidden mt-4 flex items-center justify-center gap-3 bg-white rounded-xl shadow-lg p-3 border border-green-100">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Play className="text-green-600" size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Consulta Online</div>
                <div className="text-xs text-gray-600">24h por dia</div>
              </div>
            </div>
          </div>
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
  );
}
