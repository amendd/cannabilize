'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Eye, Download } from 'lucide-react';

interface ConsultationsHistoryProps {
  patientId: string;
}

export default function ConsultationsHistory({ patientId }: ConsultationsHistoryProps) {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/consultations?patientId=${patientId}`)
      .then(res => res.json())
      .then(data => {
        setConsultations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [patientId]);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Consultas</h2>
      
      {consultations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Você ainda não possui consultas agendadas.</p>
          <Link
            href="/agendamento"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Agendar sua primeira consulta
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <div
              key={consultation.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar size={20} className="text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {new Date(consultation.scheduledAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-600">
                      {new Date(consultation.scheduledAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      consultation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                      consultation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {consultation.status === 'COMPLETED' ? 'Concluída' :
                       consultation.status === 'SCHEDULED' ? 'Agendada' :
                       consultation.status === 'CANCELLED' ? 'Cancelada' :
                       consultation.status}
                    </span>
                    
                    {consultation.prescription && (
                      <span className="text-sm text-green-600 font-semibold">
                        ✓ Receita emitida
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {consultation.status === 'COMPLETED' && (
                    <Link
                      href={`/paciente/consultas/${consultation.id}`}
                      className="text-primary hover:text-primary-dark flex items-center gap-1 text-sm"
                    >
                      <Eye size={16} />
                      Ver detalhes
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
