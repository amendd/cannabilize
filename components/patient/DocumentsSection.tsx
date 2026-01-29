'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Shield, Truck } from 'lucide-react';

interface DocumentsSectionProps {
  patientId: string;
}

export default function DocumentsSection({ patientId }: DocumentsSectionProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [anvisaAuths, setAnvisaAuths] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/prescriptions?patientId=${patientId}`).then(res => res.json()),
      fetch(`/api/anvisa?patientId=${patientId}`).then(res => res.json()),
      fetch(`/api/imports?patientId=${patientId}`).then(res => res.json()),
    ])
      .then(([pres, anvisa, imp]) => {
        setPrescriptions(pres);
        setAnvisaAuths(anvisa);
        setImports(imp);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [patientId]);

  const downloadPDF = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando documentos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Receitas Médicas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText size={24} className="text-primary" />
          Receitas Médicas
        </h2>
        
        {prescriptions.length === 0 ? (
          <p className="text-gray-500">Nenhuma receita emitida ainda.</p>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    Receita #{prescription.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Emitida em {new Date(prescription.issuedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {prescription.status}
                  </p>
                </div>
                {prescription.pdfUrl && (
                  <button
                    onClick={() => downloadPDF(prescription.pdfUrl, `receita-${prescription.id}.pdf`)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
                  >
                    <Download size={18} />
                    Baixar PDF
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Autorizações ANVISA */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Shield size={24} className="text-primary" />
          Autorizações ANVISA
        </h2>
        
        {anvisaAuths.length === 0 ? (
          <p className="text-gray-500">Nenhuma autorização ANVISA ainda.</p>
        ) : (
          <div className="space-y-4">
            {anvisaAuths.map((auth) => (
              <div
                key={auth.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">
                    {auth.anvisaNumber || `Autorização #${auth.id.slice(0, 8)}`}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                </div>
                {auth.submittedAt && (
                  <p className="text-sm text-gray-500">
                    Submetida em {new Date(auth.submittedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {auth.approvedAt && (
                  <p className="text-sm text-green-600">
                    Aprovada em {new Date(auth.approvedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Importações */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Truck size={24} className="text-primary" />
          Importações
        </h2>
        
        {imports.length === 0 ? (
          <p className="text-gray-500">Nenhuma importação registrada ainda.</p>
        ) : (
          <div className="space-y-4">
            {imports.map((importItem) => (
              <div
                key={importItem.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">
                    Importação #{importItem.id.slice(0, 8)}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    importItem.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    importItem.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                    importItem.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {importItem.status === 'DELIVERED' ? 'Entregue' :
                     importItem.status === 'IN_TRANSIT' ? 'Em Trânsito' :
                     importItem.status === 'PENDING' ? 'Pendente' :
                     importItem.status}
                  </span>
                </div>
                {importItem.trackingNumber && (
                  <p className="text-sm text-gray-600 mb-1">
                    Rastreamento: {importItem.trackingNumber}
                  </p>
                )}
                {importItem.estimatedDelivery && (
                  <p className="text-sm text-gray-500">
                    Entrega estimada: {new Date(importItem.estimatedDelivery).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {importItem.deliveredAt && (
                  <p className="text-sm text-green-600">
                    Entregue em {new Date(importItem.deliveredAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
