'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Calendar, Clock, FileText, Phone, Mail, Paperclip, Download, Stethoscope, CreditCard, Star, MessageSquare, FolderOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import PrescriptionView from './PrescriptionView';
import { canAccessAdmin } from '@/lib/roles-permissions';

interface ConsultationDetailProps {
  consultation: any;
  onStatusUpdated?: (newStatus: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
};

const CONSULTATION_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Realizada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'Não compareceu',
};

const STATUS_ORDER = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];
const STATUS_END = ['CANCELLED', 'NO_SHOW'];

export default function ConsultationDetail({ consultation, onStatusUpdated }: ConsultationDetailProps) {
  const { data: session } = useSession();
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const anamnesisData = consultation?.anamnesis
    ? typeof consultation.anamnesis === 'string'
      ? (() => {
          try {
            return JSON.parse(consultation.anamnesis);
          } catch {
            return null;
          }
        })()
      : consultation.anamnesis
    : null;

  const files = consultation?.files ?? [];
  const showFlow = canAccessAdmin(session?.user?.role);
  const currentStatus = (consultation?.status || 'SCHEDULED').toUpperCase();
  const idx = STATUS_ORDER.indexOf(currentStatus);
  const nextStep = idx >= 0 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
  const prevStep = idx > 0 ? STATUS_ORDER[idx - 1] : null;
  const docInvalid = consultation?.status === 'COMPLETED' && !consultation?.prescription;

  const updateStatus = async (newStatus: string) => {
    if (!consultation?.id) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/consultations/${consultation.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.consultation) {
        onStatusUpdated?.(data.consultation.status);
        window.location.reload();
      } else {
        alert(data.error || 'Não foi possível alterar o status.');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Detalhes da Consulta</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDocModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            <FolderOpen size={18} />
            Documentos do pedido
          </button>
        </div>
      </div>

      {/* Fluxo de etapas (admin/operador) */}
      {showFlow && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Fluxo da consulta</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {STATUS_ORDER.map((s, i) => (
                <span
                  key={s}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    currentStatus === s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i + 1} - {CONSULTATION_STATUS_LABEL[s] ?? s}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-2">
              {prevStep && (
                <button
                  type="button"
                  onClick={() => updateStatus(prevStep)}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                  Voltar etapa
                </button>
              )}
              {nextStep && !STATUS_END.includes(currentStatus) && (
                <button
                  type="button"
                  onClick={() => updateStatus(nextStep)}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                >
                  Avançar etapa
                  <ChevronRight size={18} />
                </button>
              )}
              {STATUS_END.includes(currentStatus) && (
                <button
                  type="button"
                  onClick={() => updateStatus('SCHEDULED')}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-sm font-medium disabled:opacity-50"
                >
                  Reabrir (Agendada)
                </button>
              )}
              {!STATUS_END.includes(currentStatus) && currentStatus !== 'COMPLETED' && (
                <>
                  <button
                    type="button"
                    onClick={() => updateStatus('CANCELLED')}
                    disabled={updatingStatus}
                    className="inline-flex items-center px-3 py-2 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 text-sm font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus('NO_SHOW')}
                    disabled={updatingStatus}
                    className="inline-flex items-center px-3 py-2 rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 text-sm font-medium disabled:opacity-50"
                  >
                    Não compareceu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Documentos do pedido */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="doc-modal-title">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 id="doc-modal-title" className="text-lg font-semibold text-gray-900">Documentos do pedido #{String(consultation?.id).slice(0, 8)}</h3>
              <button type="button" onClick={() => setDocModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
              {docInvalid && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 font-medium">
                  Documentação inválida! Consulta realizada sem receita emitida.
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Paciente</p>
                <p className="text-gray-900">{consultation?.patient?.name} · {consultation?.patient?.email}</p>
                {consultation?.patient?.birthDate && (
                  <p className="text-sm text-gray-500">Nascimento: {new Date(consultation.patient.birthDate).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
              {consultation?.doctor && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Prescritor</p>
                  <p className="text-gray-900">{consultation.doctor.name} {consultation.doctor.crm ? `· CRM ${consultation.doctor.crm}` : ''}</p>
                </div>
              )}
              {consultation?.prescription && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Receita médica</p>
                  <p className="text-gray-900">
                    Emitida em {new Date(consultation.prescription.issuedAt).toLocaleDateString('pt-BR')}
                    {consultation.prescription.expiresAt && ` · Validade: ${new Date(consultation.prescription.expiresAt).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Documentos anexados</p>
                {files.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum documento anexado.</p>
                ) : (
                  <ul className="space-y-2">
                    {files.map((file: { id: string; fileName: string; fileUrl: string; uploadedAt: string }) => (
                      <li key={file.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 truncate">{file.fileName}</span>
                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0">Baixar</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button type="button" onClick={() => setDocModalOpen(false)} className="w-full py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 font-medium">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p><strong>Status:</strong>{' '}
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                consultation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                consultation.status === 'CANCELLED' || consultation.status === 'NO_SHOW' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {CONSULTATION_STATUS_LABEL[consultation.status] ?? consultation.status}
              </span>
            </p>
            {consultation.meetingPlatform && (
              <p><strong>Plataforma:</strong> {consultation.meetingPlatform === 'GOOGLE_MEET' ? 'Google Meet' : consultation.meetingPlatform === 'ZOOM' ? 'Zoom' : consultation.meetingPlatform}</p>
            )}
            {consultation.meetingLink && (
              <p><strong>Link da Reunião:</strong>{' '}
                <a href={consultation.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">
                  Acessar
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Dados do Médico */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" />
            Dados do Médico
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {consultation.doctor ? (
              <div className="space-y-2 text-gray-700">
                <p><strong>Nome:</strong> {consultation.doctor.name}</p>
                {consultation.doctor.crm && <p><strong>CRM:</strong> {consultation.doctor.crm}</p>}
                {consultation.doctor.specialization && <p><strong>Especialidade:</strong> {consultation.doctor.specialization}</p>}
                <p><strong>Email:</strong> {consultation.doctor.email}</p>
                <p><strong>Telefone:</strong> {consultation.doctor.phone || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum médico atribuído a esta consulta.</p>
            )}
          </div>
        </div>

        {/* Pagamento */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Pagamento
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {consultation.payment ? (
              <div className="space-y-2 text-gray-700">
                <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: consultation.payment.currency || 'BRL' }).format(consultation.payment.amount)}</p>
                <p><strong>Status:</strong>{' '}
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    consultation.payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    consultation.payment.status === 'PENDING' || consultation.payment.status === 'PROCESSING' ? 'bg-amber-100 text-amber-800' :
                    consultation.payment.status === 'FAILED' || consultation.payment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {PAYMENT_STATUS_LABEL[consultation.payment.status] ?? consultation.payment.status}
                  </span>
                </p>
                {consultation.payment.paymentMethod && <p><strong>Método:</strong> {consultation.payment.paymentMethod}</p>}
                {consultation.payment.transactionId && <p><strong>ID da transação:</strong> <span className="font-mono text-sm">{consultation.payment.transactionId}</span></p>}
                {consultation.payment.stripePaymentId && <p><strong>Stripe Payment ID:</strong> <span className="font-mono text-sm break-all">{consultation.payment.stripePaymentId}</span></p>}
                {consultation.payment.paidAt && <p><strong>Pago em:</strong> {new Date(consultation.payment.paidAt).toLocaleString('pt-BR')}</p>}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum pagamento vinculado a esta consulta.</p>
            )}
          </div>
        </div>
      </div>

      {/* Anamnese — sempre visível */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          Anamnese
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          {anamnesisData && (anamnesisData.previousTreatments || anamnesisData.currentMedications || anamnesisData.allergies || anamnesisData.additionalInfo) ? (
            <div className="space-y-3">
              {anamnesisData.previousTreatments && (
                <div>
                  <strong>Tratamentos Anteriores:</strong>
                  <p className="text-gray-700 mt-1">{anamnesisData.previousTreatments}</p>
                </div>
              )}
              {anamnesisData.currentMedications && (
                <div>
                  <strong>Medicamentos Atuais:</strong>
                  <p className="text-gray-700 mt-1">{anamnesisData.currentMedications}</p>
                </div>
              )}
              {anamnesisData.allergies && (
                <div>
                  <strong>Alergias:</strong>
                  <p className="text-gray-700 mt-1">{anamnesisData.allergies}</p>
                </div>
              )}
              {anamnesisData.additionalInfo && (
                <div>
                  <strong>Informações Adicionais:</strong>
                  <p className="text-gray-700 mt-1">{anamnesisData.additionalInfo}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">O paciente ainda não preencheu a anamnese.</p>
          )}
        </div>
      </div>

      {/* Documentos enviados pelo paciente — sempre visível (somente leitura) */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Paperclip size={20} className="text-primary" />
          Documentos enviados pelo paciente
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          {files.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {files.map((file: { id: string; fileName: string; fileUrl: string; fileType: string; fileSize?: number | null; uploadedAt: string; description?: string | null }) => (
                <li key={file.id} className="py-4 first:pt-0 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{file.fileName}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {file.fileType} • {formatFileSize(file.fileSize ?? 0)} • {new Date(file.uploadedAt).toLocaleDateString('pt-BR')} às {new Date(file.uploadedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {file.description && (
                      <p className="text-sm text-gray-500 mt-1">{file.description}</p>
                    )}
                  </div>
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    <Download size={16} />
                    Baixar
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum documento enviado pelo paciente nesta consulta.</p>
          )}
        </div>
      </div>

      {/* Avaliação do paciente (feedback pós-consulta) */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star size={20} className="text-primary" />
          Avaliação do paciente
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          {consultation.feedback ? (
            <div className="space-y-2 text-gray-700">
              <p className="flex items-center gap-1">
                <strong>Nota:</strong>{' '}
                <span className="flex gap-0.5" aria-label={`${consultation.feedback.rating} de 5 estrelas`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i <= consultation.feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                    />
                  ))}
                </span>
                <span className="ml-1">({consultation.feedback.rating}/5)</span>
              </p>
              {consultation.feedback.comment && (
                <div>
                  <strong className="flex items-center gap-1.5">
                    <MessageSquare size={16} />
                    Comentário:
                  </strong>
                  <p className="text-gray-700 mt-1 pl-6">{consultation.feedback.comment}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Avaliado em {new Date(consultation.feedback.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">O paciente ainda não avaliou esta consulta.</p>
          )}
        </div>
      </div>

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
