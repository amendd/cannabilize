import Link from 'next/link';

interface GalleryGridProps {
  events: any[];
}

export default function GalleryGrid({ events }: GalleryGridProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nenhum evento cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/galeria/${event.slug}`}
          className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition"
        >
          <div className="h-64 bg-gradient-to-br from-primary to-secondary"></div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
            {event.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
            )}
            {event.eventDate && (
              <p className="text-sm text-gray-500">
                {new Date(event.eventDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
