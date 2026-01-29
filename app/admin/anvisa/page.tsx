'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, CheckCircle, XCircle, Clock, Package } from 'lucide-react';

export default function AdminAnvisaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authorizations, setAuthorizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN' && session?.user.role !== 'DOCTOR') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (session) {
      const url = filter ? `/api/anvisa?status=${filter}` : '/api/anvisa';
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setAuthorizations(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [session, filter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/anvisa/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');

      // Atualizar lista
      setAuthorizations((prev) =>
        prev.map((auth) =>
          auth.id === id ? { ...auth, status: newStatus } : auth
        )
      );
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar status');
    }
  };

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'REJECTED':
        return <XCircle size={20} className="text-red-600" />;
      case 'UNDER_REVIEW':
        return <Clock size={20} className="text-yellow-600" />;
      default:
        return <Shield size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin" className="text-primary hover:underline mb-4 inline-block">
            ← Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Gestão ANVISA</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Status
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="SUBMITTED">Enviado</option>
            <option value="UNDER_REVIEW">Em Análise</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Rejeitado</option>
          </select>
        </div>

        <div className="space-y-4">
          {authorizations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Shield size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma autorização encontrada.</p>
            </div>
          ) : (
            authorizations.map((auth) => (
              <div key={auth.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(auth.status)}
                      <h3 className="text-xl font-semibold text-gray-900">
                        Autorização #{auth.id.slice(0, 8)}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        Paciente:{' '}
                        {auth.prescription?.consultation?.patient?.name || 'N/A'}
                      </p>
                      {auth.anvisaNumber && (
                        <p>Número ANVISA: {auth.anvisaNumber}</p>
                      )}
                      <p>
                        Criada em:{' '}
                        {new Date(auth.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      auth.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : auth.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : auth.status === 'UNDER_REVIEW'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {auth.status}
                  </span>
                </div>

                {auth.status === 'PENDING' && (
                  <div className="border-t pt-4 mt-4 flex gap-2">
                    <button
                      onClick={() => updateStatus(auth.id, 'SUBMITTED')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
                    >
                      Marcar como Enviado
                    </button>
                    <button
                      onClick={() => updateStatus(auth.id, 'UNDER_REVIEW')}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-sm"
                    >
                      Em Análise
                    </button>
                  </div>
                )}

                {auth.status === 'UNDER_REVIEW' && (
                  <div className="border-t pt-4 mt-4 flex gap-2">
                    <button
                      onClick={() => updateStatus(auth.id, 'APPROVED')}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => updateStatus(auth.id, 'REJECTED')}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}

                {auth.import && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Package size={20} className="text-primary" />
                      <span className="text-gray-700">Importação associada</span>
                      <span className="text-sm text-gray-500">
                        Status: {auth.import.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
