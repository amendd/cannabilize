'use client';

import { User, Calendar, Clock, FileText, Phone, Mail } from 'lucide-react';
import PrescriptionView from './PrescriptionView';

interface ConsultationDetailProps {
  consultation: any;
}

export default function ConsultationDetail({ consultation }: ConsultationDetailProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalhes da Consulta</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações do Paciente */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} className="text-primary" />
            Dados do Paciente
          </h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Nome:</strong> {consultation.patient?.name}</p>
            <p><strong>Email:</strong> {consultation.patient?.email}</p>
            <p><strong>Telefone:</strong> {consultation.patient?.phone || 'N/A'}</p>
            <p><strong>CPF:</strong> {consultation.patient?.cpf || 'N/A'}</p>
          </div>
        </div>

        {/* Informações da Consulta */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Informações da Consulta
          </h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Data:</strong> {new Date(consultation.scheduledAt).toLocaleDateString('pt-BR')}</p>
            <p><strong>Horário:</strong> {new Date(consultation.scheduledAt).toLocaleTimeString('pt-BR')}</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                consultation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {consultation.status}
              </span>
            </p>
            {consultation.meetingLink && (
              <p><strong>Link da Reunião:</strong> 
                <a href={consultation.meetingLink} target="_blank" className="text-primary hover:underline ml-2">
                  Acessar
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Anamnese */}
      {consultation.anamnesis && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Anamnese
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {consultation.anamnesis.previousTreatments && (
              <div>
                <strong>Tratamentos Anteriores:</strong>
                <p className="text-gray-700 mt-1">{consultation.anamnesis.previousTreatments}</p>
              </div>
            )}
            {consultation.anamnesis.currentMedications && (
              <div>
                <strong>Medicamentos Atuais:</strong>
                <p className="text-gray-700 mt-1">{consultation.anamnesis.currentMedications}</p>
              </div>
            )}
            {consultation.anamnesis.allergies && (
              <div>
                <strong>Alergias:</strong>
                <p className="text-gray-700 mt-1">{consultation.anamnesis.allergies}</p>
              </div>
            )}
            {consultation.anamnesis.additionalInfo && (
              <div>
                <strong>Informações Adicionais:</strong>
                <p className="text-gray-700 mt-1">{consultation.anamnesis.additionalInfo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notas Médicas */}
      {consultation.notes && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas Médicas</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">{consultation.notes}</p>
          </div>
        </div>
      )}

      {/* Receita Médica */}
      {consultation.prescription && (
        <div className="mt-6">
          <PrescriptionView
            prescription={consultation.prescription}
            consultation={consultation}
            patient={consultation.patient}
            doctor={consultation.doctor}
            showDownloadButton={true}
          />
        </div>
      )}
    </div>
  );
}
