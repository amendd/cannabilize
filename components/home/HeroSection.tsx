'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 py-16 lg:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
              🌿 Cannabis Medicinal com Especialistas
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Médicos prescritores de{' '}
              <span className="text-green-600">Cannabis Medicinal</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Consultas online com especialistas por apenas{' '}
              <span className="font-bold text-green-600 text-3xl">R$50</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                href="/agendamento"
                className="group bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Iniciar jornada
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#click-process"
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Entenda como funciona
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-6">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-green-200 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-green-300 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-green-400 border-2 border-white"></div>
                  <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    +
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium">+90.000 pacientes atendidos</span>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              {/* Imagem real - se não existir, mostra gradiente como fallback */}
              <OptimizedImage
                src="/images/hero/doctor-consultation.jpg"
                alt="Médico especialista em cannabis medicinal realizando consulta online com paciente via videoconferência"
                width={800}
                height={600}
                priority={true}
                fallback="/images/hero/placeholder.jpg"
                className="object-cover w-full h-full"
              />
              
              {/* Overlay sutil para melhorar legibilidade se necessário */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Content overlay com estatísticas */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                      +90.000
                    </div>
                    <div className="text-2xl md:text-3xl font-semibold mb-2 text-white">Atendimentos</div>
                    <div className="text-lg opacity-90 text-white">Realizados com sucesso</div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm pointer-events-none"></div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border-2 border-green-200 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="text-green-600" size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Consulta Online</div>
                  <div className="text-xs text-gray-600">24h por dia</div>
                </div>
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
