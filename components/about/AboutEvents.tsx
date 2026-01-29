import Link from 'next/link';

export default function AboutEvents() {
  const events = [
    { title: 'Click Runner', date: '2024', link: '/galeria/click-runner' },
    { title: 'Praia do Arpoador', date: '2024', link: '/galeria/arpoador' },
    { title: 'Iron Man', date: '2024', link: '/galeria/iron-man' },
    { title: 'Carnaval no Rio', date: '2024', link: '/galeria/carnaval' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Nossa história está apenas começando
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event, index) => (
            <Link
              key={index}
              href={event.link}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition p-6"
            >
              <div className="h-32 bg-gradient-to-br from-primary to-secondary mb-4 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-sm text-gray-500">{event.date}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
