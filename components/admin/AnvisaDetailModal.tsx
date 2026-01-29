'use client';

import { X, Shield, FileText, User, Calendar } from 'lucide-react';

interface AnvisaDetailModalProps {
  authorization: any;
  onClose: () => void;
}

export default function AnvisaDetailModal({ authorization, onClose }: AnvisaDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={24} className="text-primary" />
            Detalhes da Autorização ANVISA
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Paciente */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-primary" />
              Dados do Paciente
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>Nome:</strong> {authorization.prescription?.consultation?.patient?.name}</p>
              <p><strong>Email:</strong> {authorization.prescription?.consultation?.patient?.email}</p>
              <p><strong>CPF:</strong> {authorization.prescription?.consultation?.patient?.cpf || 'N/A'}</p>
            </div>
          </div>

          {/* Informações da Autorização */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              Informações da Autorização
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>Número ANVISA:</strong> {authorization.anvisaNumber || 'Pendente'}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  authorization.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  authorization.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  authorization.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {authorization.status}
                </span>
              </p>
              {authorization.submittedAt && (
                <p><strong>Submetida em:</strong> {new Date(authorization.submittedAt).toLocaleString('pt-BR')}</p>
              )}
              {authorization.approvedAt && (
                <p><strong>Aprovada em:</strong> {new Date(authorization.approvedAt).toLocaleString('pt-BR')}</p>
              )}
              {authorization.expiresAt && (
                <p><strong>Expira em:</strong> {new Date(authorization.expiresAt).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
          </div>

          {/* Prescrição */}
          {authorization.prescription && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Prescrição Médica
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Emitida em:</strong> {new Date(authorization.prescription.issuedAt).toLocaleDateString('pt-BR')}</p>
                <p><strong>Médico:</strong> {authorization.prescription.doctor?.name || 'N/A'}</p>
                <p><strong>CRM:</strong> {authorization.prescription.doctor?.crm || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Documentos */}
          {authorization.documents && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(authorization.documents, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Importação */}
          {authorization.import && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Importação</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><strong>Status:</strong> {authorization.import.status}</p>
                {authorization.import.trackingNumber && (
                  <p><strong>Rastreamento:</strong> {authorization.import.trackingNumber}</p>
                )}
                {authorization.import.estimatedDelivery && (
                  <p><strong>Entrega estimada:</strong> {new Date(authorization.import.estimatedDelivery).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
