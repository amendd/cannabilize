import { prisma } from '@/lib/prisma';
import GalleryGrid from '@/components/gallery/GalleryGrid';

export const dynamic = 'force-dynamic';

export default async function GaleriaPage() {
  const events = await prisma.event.findMany({
    where: { active: true },
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { eventDate: 'desc' },
  });

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Galeria CannabiLizi
          </h1>
          <p className="text-xl text-gray-600">
            Eventos e momentos especiais
          </p>
        </div>
        <GalleryGrid events={events} />
      </div>
    </div>
  );
}
