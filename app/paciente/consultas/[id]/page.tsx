'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Video, FileText, Upload, X, Calendar, Clock, User, ExternalLink, Download, CheckCircle2, ArrowRight, Hash, CreditCard, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingPage from '@/components/ui/Loading';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

const PrescriptionView = dynamic(
  () => import('@/components/admin/PrescriptionView'),
  { ssr: false, loading: () => <div className="rounded-lg border p-6 animate-pulse bg-gray-50 min-h-[200px]" /> }
);

const VideoCallWindow = dynamic(
  () => import('@/components/medico/VideoCallWindow'),
  { ssr: false, loading: () => <div className="rounded-lg border bg-gray-900 aspect-video flex items-center justify-center text-white animate-pulse">Carregando vídeo...</div> }
);
import { getConsultationStatusLabel, getPaymentStatusLabel } from '@/lib/status-labels';

export default function PacienteConsultaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;
  const lastErrorToastAtRef = useRef<number>(0);
  
  const [consultation, setConsultation] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anamnesisForm, setAnamnesisForm] = useState<{ previousTreatments: string; currentMedications: string; allergies: string; additionalInfo: string }>({ previousTreatments: '', currentMedications: '', allergies: '', additionalInfo: '' });
  const [savingAnamnesis, setSavingAnamnesis] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [documentType, setDocumentType] = useState<string>('EXAM'); // EXAM | PRESCRIPTION | REPORT | OTHER

  const documentTypeLabel = (type: string) => {
    switch (type) {
      case 'EXAM': return 'Exame';
      case 'PRESCRIPTION': return 'Receita';
      case 'REPORT': return 'Laudo/Relatório';
      default: return 'Outro';
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (consultationId && status === 'authenticated' && session?.user?.id) {
      loadConsultation();
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId, status, session?.user?.id]);

  useEffect(() => {
    if (consultation?.anamnesis) {
      try {
        const data = typeof consultation.anamnesis === 'string' ? JSON.parse(consultation.anamnesis) : consultation.anamnesis;
        setAnamnesisForm({
          previousTreatments: data.previousTreatments || '',
          currentMedications: data.currentMedications || '',
          allergies: data.allergies || '',
          additionalInfo: data.additionalInfo || '',
        });
      } catch {
        // ignore
      }
    }
  }, [consultation?.anamnesis]);

  useEffect(() => {
    if (consultationId && consultation?.status === 'COMPLETED') {
      fetch(`/api/consultations/${consultationId}/feedback`)
        .then(res => res.json())
        .then(data => { setFeedbackSubmitted(!!data.submitted); if (data.rating) setFeedbackRating(data.rating); })
        .catch(() => setFeedbackSubmitted(false));
    }
  }, [consultationId, consultation?.status]);

  // Atualizar automaticamente quando o médico finalizar a consulta (paciente ainda na tela)
  useEffect(() => {
    if (!consultationId || !consultation || consultation.status === 'COMPLETED') return;
    const interval = setInterval(() => {
      loadConsultation();
    }, 20000); // a cada 20s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId, consultation?.status]);

  const loadConsultation = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`);
      if (response.ok) {
        const data = await response.json();
        setConsultation(data);
      } else {
        const now = Date.now();
        const shouldToast = now - lastErrorToastAtRef.current > 3000;
        if (shouldToast) lastErrorToastAtRef.current = now;

        const errorData = await response.json().catch(() => ({}));
        console.error('Erro ao carregar consulta:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        if (response.status === 401) {
          if (shouldToast) toast.error('Sessão expirada. Faça login novamente.');
          router.push('/login');
          return;
        }

        if (response.status === 403) {
          if (shouldToast) toast.error('Você não tem permissão para acessar esta consulta.');
          router.push('/paciente');
          return;
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const extra = retryAfter ? ` (tente novamente em ~${Math.ceil(Number(retryAfter) / 60)} min)` : '';
          if (shouldToast) toast.error(`Muitas requisições. Aguarde um pouco${extra}.`);
          return;
        }

        const message =
          (errorData && (errorData.error || errorData.details)) ||
          'Erro ao carregar consulta';
        if (shouldToast) toast.error(message);
      }
    } catch (error) {
      console.error('Erro ao carregar consulta:', error);
      const now = Date.now();
      if (now - lastErrorToastAtRef.current > 3000) {
        lastErrorToastAtRef.current = now;
        toast.error('Erro ao carregar consulta');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    // Validar tipo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, JPG, PNG ou DOC/DOCX');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', documentType);
    formData.append('description', '');

    try {
      const response = await fetch(`/api/consultations/${consultationId}/files`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Arquivo enviado com sucesso!');
        loadFiles();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar arquivo');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/consultations/${consultationId}/files?fileId=${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Arquivo excluído com sucesso!');
        loadFiles();
      } else {
        toast.error('Erro ao excluir arquivo');
      }
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSaveAnamnesis = async () => {
    setSavingAnamnesis(true);
    try {
      const res = await fetch(`/api/consultations/${consultationId}/anamnesis`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anamnesisForm),
      });
      if (res.ok) {
        toast.success('Anamnese salva com sucesso.');
        loadConsultation();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro ao salvar anamnese.');
    } finally {
      setSavingAnamnesis(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating < 1 || feedbackRating > 5) {
      toast.error('Selecione uma nota de 1 a 5.');
      return;
    }
    setSavingFeedback(true);
    try {
      const res = await fetch(`/api/consultations/${consultationId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment || undefined }),
      });
      if (res.ok) {
        toast.success('Obrigado pela sua avaliação!');
        setFeedbackSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Erro ao enviar.');
      }
    } catch {
      toast.error('Erro ao enviar avaliação.');
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleStartMeeting = async () => {
    // Para pacientes, apenas recarregar a consulta se já existe link
    // Pacientes não criam reuniões, apenas entram nas criadas pelo médico
    if (consultation?.meetingLink) {
      loadConsultation();
      return;
    }

    // Se não há link, informar que o médico precisa iniciar a reunião
    toast.error('Aguarde o médico iniciar a reunião. Você receberá uma notificação quando estiver disponível.');
  };

  if (status === 'loading' || loading) {
    return <LoadingPage />;
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Consulta não encontrada</div>
      </div>
    );
  }

  const consultationDate = consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
  const consultationTime = consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
  const consultationDateTime = new Date(`${consultationDate}T${consultationTime}`);
  const now = new Date();
  const fiveMinutesBefore = new Date(consultationDateTime.getTime() - 5 * 60 * 1000);
  
  // Paciente pode entrar na reunião se:
  // 1. Já passou 5 minutos antes do horário agendado OU a consulta já passou
  // 2. E o status é SCHEDULED, IN_PROGRESS ou COMPLETED
  // 3. E existe um meetingLink
  const canStart = (now >= fiveMinutesBefore || now > consultationDateTime) && 
                  (consultation.status === 'SCHEDULED' || consultation.status === 'IN_PROGRESS' || consultation.status === 'COMPLETED') &&
                  !!consultation.meetingLink;

  // Countdown até o horário marcado da consulta (ex.: 19:00), não até "5 min antes"
  const minutesUntil = canStart ? 0 : Math.max(0, Math.ceil((consultationDateTime.getTime() - now.getTime()) / (60 * 1000)));

  // Chamada encerrada = não permitir mais upload de arquivos
  const isConsultationFinalized = consultation.status === 'COMPLETED' || !!consultation.videoCallEndedAt;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs baseHref="/paciente" items={[{ label: 'Minhas Consultas', href: '/paciente/consultas' }, { label: 'Detalhe da consulta' }]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Telemedicina ou Pós-Consulta */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consulta finalizada: sem vídeo, bloco pós-consulta */}
            {consultation.status === 'COMPLETED' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-100"
              >
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="text-green-600" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Consulta finalizada</h2>
                  <p className="text-gray-600 mb-6 max-w-md">
                    O médico encerrou a chamada de vídeo. Abaixo você encontra o resumo da consulta, sua receita (quando houver) e os próximos passos.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {consultation.prescription ? (
                      <a href="#receita">
                        <Button variant="primary" size="sm">
                          <FileText size={18} />
                          VER MINHA RECEITA
                          <ArrowRight size={16} />
                        </Button>
                      </a>
                    ) : (
                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                        title="A receita será disponibilizada após o médico emitir"
                      >
                        <FileText size={18} />
                        VER MINHA RECEITA
                      </span>
                    )}
                    <Link
                      href={`/paciente/proximos-passos?from=consultation&id=${consultationId}`}
                      className="inline-flex"
                    >
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-600 transition">
                        PRÓXIMOS PASSOS
                      </span>
                    </Link>
                    <Link href="/paciente/carteirinha" className="inline-flex">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-600 transition">
                        CARTEIRINHA
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Avalie o atendimento - só após consulta finalizada */}
                {feedbackSubmitted === true && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 font-medium">Obrigado pela sua avaliação!</p>
                  </div>
                )}
                {feedbackSubmitted === false && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Avalie o atendimento</h3>
                    <p className="text-sm text-gray-600 mb-4">Sua opinião nos ajuda a melhorar.</p>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setFeedbackRating(n)}
                          className={`w-10 h-10 rounded-full font-semibold transition ${
                            feedbackRating === n ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-primary'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <label className="block text-sm text-gray-700 mb-1">Comentário (opcional)</label>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg mb-4"
                      placeholder="Conte como foi sua experiência..."
                    />
                    <Button onClick={handleSubmitFeedback} disabled={savingFeedback} variant="primary" size="sm">
                      {savingFeedback ? 'Enviando...' : 'Enviar avaliação'}
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Janela de Vídeo Integrada (enquanto agendada ou em andamento) */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <VideoCallWindow
                  meetingLink={consultation.meetingLink}
                  consultationId={consultationId}
                  onStartMeeting={handleStartMeeting}
                  canStart={canStart}
                  minutesUntil={minutesUntil}
                  platform={consultation.meetingPlatform as 'ZOOM' | 'GOOGLE_MEET' | 'OTHER'}
                />
              </motion.div>
            )}

            {/* Informações da Consulta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Informações da Consulta</h1>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Hash size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Identificador</span>
                    <p className="font-mono text-sm text-gray-800">{consultation.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={18} className="text-primary shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Data</span>
                      <p className="text-gray-800">{new Date(consultationDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock size={18} className="text-primary shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Horário</span>
                      <p className="text-gray-800">{consultationTime}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    consultation.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                    consultation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    consultation.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getConsultationStatusLabel(consultation.status)}
                  </span>
                  </div>
                </div>

                {consultation.doctor && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={18} className="text-primary shrink-0" />
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Médico(a)</span>
                    </div>
                    <p className="font-semibold text-gray-900">{consultation.doctor.name}</p>
                    {(consultation.doctor.crm || consultation.doctor.specialization) && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {[consultation.doctor.crm && `CRM ${consultation.doctor.crm}`, consultation.doctor.specialization].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-600">
                  <Video size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Modalidade</span>
                    <p className="text-gray-800">
                      {consultation.meetingLink
                        ? `Telemedicina${consultation.meetingPlatform === 'ZOOM' ? ' (Zoom)' : consultation.meetingPlatform === 'GOOGLE_MEET' ? ' (Google Meet)' : ''}`
                        : 'Telemedicina (link disponibilizado no horário da consulta)'}
                    </p>
                  </div>
                </div>

                {consultation.payment && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <CreditCard size={18} className="text-primary shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Pagamento</span>
                      <p className="text-gray-800">{getPaymentStatusLabel(consultation.payment.status)}</p>
                    </div>
                  </div>
                )}

                {consultation.prescription ? (
                  <div className="flex items-center gap-3 text-gray-600">
                    <FileText size={18} className="text-green-600 shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Receita</span>
                      <p className="text-gray-800">Emitida em {new Date(consultation.prescription.issuedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-500">
                    <FileText size={18} className="shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Receita</span>
                      <p className="text-gray-600">Aguardando Consulta</p>
                    </div>
                  </div>
                )}

                {consultation.nextReturnDate && (
                  <div className="flex items-center gap-3 text-gray-600 border-t pt-4">
                    <RotateCcw size={18} className="text-primary shrink-0" />
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Próximo retorno</span>
                      <p className="text-gray-800">{new Date(consultation.nextReturnDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Receita Médica */}
            {consultation.prescription && (
              <motion.div
                id="receita"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-lg shadow-lg p-6 scroll-mt-4"
              >
                <PrescriptionView
                  prescription={consultation.prescription}
                  consultation={consultation}
                  patient={consultation.patient}
                  doctor={consultation.doctor}
                  showDownloadButton={true}
                />
              </motion.div>
            )}

            {/* Pré-consulta (Anamnese) — após pagamento, antes da consulta */}
            {!isConsultationFinalized && consultation?.payment?.status === 'PAID' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText size={20} />
                  Pré-consulta (Anamnese)
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Preencha com antecedência para o médico conhecer melhor seu caso. Você também pode enviar laudos e receitas abaixo.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tratamentos anteriores</label>
                    <textarea
                      value={anamnesisForm.previousTreatments}
                      onChange={(e) => setAnamnesisForm((p) => ({ ...p, previousTreatments: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Tratamentos anteriores relacionados à sua condição..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos em uso</label>
                    <textarea
                      value={anamnesisForm.currentMedications}
                      onChange={(e) => setAnamnesisForm((p) => ({ ...p, currentMedications: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Medicamentos que você está tomando..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
                    <textarea
                      value={anamnesisForm.allergies}
                      onChange={(e) => setAnamnesisForm((p) => ({ ...p, allergies: e.target.value }))}
                      rows={1}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Alergias conhecidas..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Informações adicionais</label>
                    <textarea
                      value={anamnesisForm.additionalInfo}
                      onChange={(e) => setAnamnesisForm((p) => ({ ...p, additionalInfo: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Outras informações relevantes..."
                    />
                  </div>
                  <Button onClick={handleSaveAnamnesis} disabled={savingAnamnesis} variant="primary" size="sm">
                    {savingAnamnesis ? 'Salvando...' : 'Salvar anamnese'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Upload de Arquivos — só antes da consulta ser finalizada */}
            {!isConsultationFinalized && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Upload size={20} />
                    Exames, receitas e laudos
                  </h2>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Envie exames, receitas e laudos anteriores. Eles ficam <strong>anexados diretamente à sua consulta</strong> e o médico terá acesso na hora do atendimento.
                </p>
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-700 mb-2">Tipo do documento</span>
                  <div className="flex flex-wrap gap-2">
                    {(['EXAM', 'PRESCRIPTION', 'REPORT', 'OTHER'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDocumentType(type)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          documentType === type
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {documentTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                />
                <Button
                  onClick={handleFileSelect}
                  disabled={uploading}
                  variant="outline"
                  className="w-full"
                >
                  <Upload size={18} />
                  {uploading ? 'Enviando...' : 'Selecionar e enviar'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG, DOC, DOCX (máx. 10MB)</p>
              </motion.div>
            )}

            {/* Arquivos Enviados */}
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <FileText size={20} />
                  Meus Arquivos ({files.length})
                </h2>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText size={20} className="text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {documentTypeLabel(file.fileType || 'OTHER')} • {formatFileSize(file.fileSize || 0)} • {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                          </p>
                          {file.description && (
                            <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/consultation-files/${file.id}?download=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Download size={16} />
                          Baixar
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Informações Adicionais */}
          <div className="space-y-6">
            {/* Status da Consulta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    consultation.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                    consultation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getConsultationStatusLabel(consultation.status)}
                  </span>
                </div>
                {consultation.payment && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pagamento:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      consultation.payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      consultation.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getPaymentStatusLabel(consultation.payment.status)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Informações de Ajuda — dicas de upload só antes de finalizar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50 rounded-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Dicas</h3>
              {isConsultationFinalized ? (
                <p className="text-sm text-gray-700">
                  Consulta finalizada. Os documentos que você enviou antes da consulta permanecem disponíveis para o médico.
                </p>
              ) : (
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Envie seus exames e documentos antes da consulta</li>
                  <li>• O médico terá acesso a todos os arquivos enviados</li>
                  <li>• Você pode enviar múltiplos arquivos</li>
                  <li>• Formatos aceitos: PDF, JPG, PNG, DOC, DOCX</li>
                </ul>
              )}
            </motion.div>
          </div>
        </div>
    </div>
  );
}
