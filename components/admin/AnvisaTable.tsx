'use client';

import { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import AnvisaDetailModal from './AnvisaDetailModal';

interface AnvisaTableProps {
  filters: {
    status: string;
  };
}

export default function AnvisaTable({ filters }: AnvisaTableProps) {
  const [authorizations, setAuthorizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuth, setSelectedAuth] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);

    fetch(`/api/anvisa?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setAuthorizations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [filters]);

  const updateStatus = async (id: string, status: string, anvisaNumber?: string) => {
    try {
      const response = await fetch(`/api/anvisa/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, anvisaNumber }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      // Atualizar lista
      const updated = authorizations.map(auth =>
        auth.id === id ? { ...auth, status, anvisaNumber } : auth
      );
      setAuthorizations(updated);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prescrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Número ANVISA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {authorizations.map((auth) => (
                <tr key={auth.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {auth.prescription?.consultation?.patient?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {auth.prescription?.consultation?.patient?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {auth.prescription?.id.slice(0, 8) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {auth.anvisaNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      auth.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      auth.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      auth.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {auth.status === 'APPROVED' ? 'Aprovada' :
                       auth.status === 'PENDING' ? 'Pendente' :
                       auth.status === 'REJECTED' ? 'Rejeitada' :
                       auth.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {auth.submittedAt
                      ? new Date(auth.submittedAt).toLocaleDateString('pt-BR')
                      : new Date(auth.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAuth(auth)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Ver
                      </button>
                      {auth.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => {
                              const anvisaNumber = prompt('Digite o número da autorização ANVISA:');
                              if (anvisaNumber) {
                                updateStatus(auth.id, 'APPROVED', anvisaNumber);
                              }
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Motivo da rejeição:');
                              if (reason) {
                                updateStatus(auth.id, 'REJECTED', undefined);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAuth && (
        <AnvisaDetailModal
          authorization={selectedAuth}
          onClose={() => setSelectedAuth(null)}
        />
      )}
    </>
  );
}
