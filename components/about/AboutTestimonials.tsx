import { Star } from 'lucide-react';

export default function AboutTestimonials() {
  const testimonials = [
    {
      name: 'Natalia Almeida',
      date: '17/05/2025',
      rating: 5,
      comment: 'Faço tratamento com Cannabis Medicinal há mais de um ano, mas só depois que conheci a CannaLize é que vi o verdadeiro diferencial no cuidado com o paciente 💚',
    },
    {
      name: 'Luciana Pereira',
      date: '17/05/2025',
      rating: 5,
      comment: 'Desde o primeiro momento, muito bem atendida! Com 30 dias em uso do óleo, melhorou a qualidade do meu sono e já não me sinto tão ansiosa quanto antes do tratamento!',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Veja algumas das vidas que foram transformadas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={20} className="text-secondary fill-secondary" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"{testimonial.comment}"</p>
              <div>
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
