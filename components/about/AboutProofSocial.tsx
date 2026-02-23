import { Star, Users, MapPin, Heart } from 'lucide-react';

const STATS = [
  {
    icon: Users,
    value: '15.000+',
    label: 'Pacientes acompanhados com suporte médico',
    sub: 'Em todo o Brasil',
  },
  {
    icon: Star,
    value: '4.9',
    label: 'Bem avaliados por quem já nos conhece',
    sub: 'Nota média no Google',
  },
  {
    icon: Heart,
    value: '96%',
    label: 'Pacientes satisfeitos com o tratamento',
    sub: 'Recomendariam a Cannabilize',
  },
  {
    icon: MapPin,
    value: '27',
    label: 'Estados com atendimento',
    sub: 'Presença nacional',
  },
];

export default function AboutProofSocial() {
  return (
    <section className="py-12 md:py-16 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-primary-600 uppercase tracking-wider mb-6 md:mb-8">
          Quem já confia na Cannabilize
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {STATS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="text-center p-4 md:p-6 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-colors duration-300"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary/10 text-primary mb-3 md:mb-4">
                  <Icon size={22} className="md:w-6 md:h-6" aria-hidden />
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
                  {item.value}
                </div>
                <div className="text-xs md:text-sm font-semibold text-gray-700 mt-1 leading-snug">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
