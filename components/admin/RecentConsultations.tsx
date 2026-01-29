'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, User, Clock } from 'lucide-react';

export default function RecentConsultations() {
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/consultations?limit=10')
      .then(res => res.json())
      .then(data => setConsultations(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Consultas Recentes</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Paciente</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((consultation) => (
              <tr key={consultation.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span>{consultation.patient?.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    consultation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    consultation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {consultation.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/consultas/${consultation.id}`}
                    className="text-primary hover:underline text-sm"
                  >
                    Ver detalhes
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
