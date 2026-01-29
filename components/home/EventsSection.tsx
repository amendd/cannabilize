import Link from 'next/link';
import Image from 'next/image';

const events = [
  {
    title: 'Click Runner',
    date: '2024',
    description: 'Evento de corrida, organizada pela Click no RJ',
    image: '/images/events/click-runner.webp',
    link: '/galeria/click-runner',
  },
  {
    title: 'Praia do Arpoador',
    date: '2024',
    description: 'Campanha de limpeza na praia do Arpoador no Rio de Janeiro.',
    image: '/images/events/arpoador.webp',
    link: '/galeria/arpoador',
  },
  {
    title: 'Iron Man',
    date: '2024',
    description: 'Atleta patrocinado pela CannaLize no Iron Man-RJ 2024',
    image: '/images/events/iron-man.webp',
    link: '/galeria/iron-man',
  },
];

export default function EventsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nossa história está apenas começando
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <Link
              key={index}
              href={event.link}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition group"
            >
              <div className="relative h-48 bg-gradient-to-br from-primary to-secondary">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{event.title}</span>
                </div>
              </div>
              <div className="p-6">
                <span className="text-sm text-gray-500">{event.date}</span>
                <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-2">
                  {event.title}
                </h3>
                <p className="text-gray-600 mb-4">{event.description}</p>
                <span className="text-primary font-semibold group-hover:underline">
                  Ver fotos →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/galeria"
            className="inline-block bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-dark transition"
          >
            Ver galeria completa
          </Link>
        </div>
      </div>
    </section>
  );
}
