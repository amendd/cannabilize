'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Image as ImageIcon, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  eventDate: Date | null;
  location: string | null;
  active: boolean;
  images: { id: string; imageUrl: string; order: number }[];
  createdAt: Date;
}

export default function AdminGaleriaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchEvents();
    }
  }, [session]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Evento ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
        fetchEvents();
      } else {
        toast.error('Erro ao atualizar evento');
      }
    } catch (error) {
      toast.error('Erro ao atualizar evento');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Evento excluído com sucesso!');
        fetchEvents();
      } else {
        toast.error('Erro ao excluir evento');
      }
    } catch (error) {
      toast.error('Erro ao excluir evento');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Galeria</h1>
            <p className="text-gray-600 mt-2">Gerencie eventos e imagens da galeria</p>
          </div>
          <Link
            href="/admin/galeria/novo"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Evento
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">Nenhum evento encontrado</p>
              <Link
                href="/admin/galeria/novo"
                className="text-green-600 hover:text-green-700"
              >
                Criar primeiro evento
              </Link>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {/* Imagem de capa */}
                <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 relative">
                  {event.images.length > 0 ? (
                    <img
                      src={event.images[0].imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        event.active
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {event.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {event.eventDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ImageIcon size={16} />
                      {event.images.length} {event.images.length === 1 ? 'imagem' : 'imagens'}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <button
                      onClick={() => toggleActive(event.id, event.active)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                        event.active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {event.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <Link
                      href={`/admin/galeria/${event.id}/editar`}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition text-center"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
