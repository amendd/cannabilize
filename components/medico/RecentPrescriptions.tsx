'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, User, Download, Eye } from 'lucide-react';

export default function RecentPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/prescriptions?limit=5');
      if (response.ok) {
        const data = await response.json();
        // Limitar a 5 receitas mais recentes
        setPrescriptions(data.slice(0, 5));
      }
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Carregando receitas...</div>;
  }

  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Nenhuma receita emitida recentemente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prescriptions.map((prescription) => {
        const prescriptionData = typeof prescription.prescriptionData === 'string'
          ? JSON.parse(prescription.prescriptionData)
          : prescription.prescriptionData;
        
        const medications = prescriptionData?.medications || [];
        const isExpired = prescription.expiresAt && new Date(prescription.expiresAt) < new Date();

        return (
          <div
            key={prescription.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="text-purple-600" size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} className="text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {prescription.consultation?.patient?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(prescription.issuedAt).toLocaleDateString('pt-BR')}
                  </div>
                  {medications.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {medications.length} {medications.length === 1 ? 'medicamento' : 'medicamentos'}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      isExpired
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {isExpired ? 'Expirada' : 'Válida'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {prescription.pdfUrl && (
                <a
                  href={prescription.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                  title="Download PDF"
                >
                  <Download size={18} />
                </a>
              )}
              <Link
                href={`/admin/consultas/${prescription.consultationId}`}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                title="Ver consulta"
              >
                <Eye size={18} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
