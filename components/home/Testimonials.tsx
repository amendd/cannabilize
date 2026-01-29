'use client';

import { Star, Quote } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

const testimonials = [
  {
    name: 'Natalia Almeida',
    date: '17/05/2025',
    rating: 5,
    comment: 'Faço tratamento com Cannabis Medicinal há mais de um ano, mas só depois que conheci a CannaLize é que vi o verdadeiro diferencial no cuidado com o paciente 💚',
    source: 'Google',
    photo: '/images/testimonials/natalia-almeida.jpg', // Opcional - se não tiver, usa iniciais
  },
  {
    name: 'Luciana Pereira',
    date: '17/05/2025',
    rating: 5,
    comment: 'Desde o primeiro momento, muito bem atendida! Com 30 dias em uso do óleo, melhorou a qualidade do meu sono e já não me sinto tão ansiosa quanto antes do tratamento! Grata à CannaLize! 💚',
    source: 'Google',
    photo: '/images/testimonials/luciana-pereira.jpg',
  },
  {
    name: 'Beatriz Dobruski',
    date: '17/03/2025',
    rating: 5,
    comment: 'Apenas gratidão. O tratamento com o óleo de CBD tem transformado minha vida, me ajudando a superar completamente as crises de ansiedade. Além disso, o suporte da equipe foi excepcional.',
    source: 'Google',
    photo: '/images/testimonials/beatriz-dobruski.jpg',
  },
  {
    name: 'Vera Oliveira',
    date: '11/05/2025',
    rating: 5,
    comment: 'Boa Noite !! Hoje faz um mês que estou tomando este medicamento, comecei com 2 gotas, por orientação aumentei, hoje estou tomando 5 gotinhas, e já estou vendo resultado, na ansiedade e para dormir.',
    source: 'Google',
    photo: '/images/testimonials/vera-oliveira.jpg',
  },
  {
    name: 'Luadi Morais',
    date: '17/02/2025',
    rating: 5,
    comment: 'Estou impactada com a experiência. Pela primeira vez na vida. Fiquei 5 dias consecutivos sem dores. Sei que é só o começo. Agradeço a atenção antes, durante e principalmente no pós.',
    source: 'Google',
    photo: '/images/testimonials/luadi-morais.jpg',
  },
  {
    name: 'Thiago Jatobá',
    date: '11/05/2025',
    rating: 5,
    comment: 'Excelente e rápido atendimento. Consulta com preço muito acessível e o valor da medicação é bem menor que os tarja pretas. Hoje completo minha primeira semana de tratamento e já sinto menos ansiedade.',
    source: 'Google',
    photo: '/images/testimonials/thiago-jatoba.jpg',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
            Depoimentos Reais
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Relatos reais de pacientes
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Sua satisfação é nossa prioridade. Veja o que nossos pacientes têm a dizer sobre o tratamento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4 opacity-10">
                <Quote size={40} className="text-green-600" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={18} 
                    className="text-yellow-400 fill-yellow-400" 
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                "{testimonial.comment}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <Avatar
                  src={testimonial.photo}
                  name={testimonial.name}
                  size="lg"
                  showBorder={true}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.date}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  {testimonial.source}
                </span>
              </div>

              {/* Hover effect gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 to-green-50/0 group-hover:from-green-50/50 group-hover:to-transparent rounded-2xl transition-all duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Trust badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md border border-gray-200">
            <Star className="text-yellow-400 fill-yellow-400" size={20} />
            <span className="text-sm font-medium text-gray-700">
              Média de <span className="font-bold text-green-600">4.9/5</span> estrelas em mais de 2.000 avaliações
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
