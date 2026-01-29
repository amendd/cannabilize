'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, User, Eye } from 'lucide-react';

interface ConsultationsTableProps {
  filters: {
    status: string;
    dateFrom: string;
    dateTo: string;
  };
}

export default function ConsultationsTable({ filters }: ConsultationsTableProps) {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    fetch(`/api/admin/consultations?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setConsultations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [filters]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consultations.map((consultation) => (
              <tr key={consultation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {consultation.patient?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {consultation.patient?.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">
                      {new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(consultation.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    consultation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    consultation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {consultation.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {consultation.prescription ? (
                    <span className="text-green-600 font-semibold">Emitida</span>
                  ) : (
                    <span className="text-gray-400">Pendente</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/admin/consultas/${consultation.id}`}
                    className="text-primary hover:text-primary-dark flex items-center gap-1"
                  >
                    <Eye size={16} />
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
