'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Video, FileText, Upload, X, Calendar, Clock, User, ExternalLink, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingPage from '@/components/ui/Loading';
import PrescriptionView from '@/components/admin/PrescriptionView';
import VideoCallWindow from '@/components/medico/VideoCallWindow';

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
    formData.append('fileType', 'EXAM'); // Pode ser EXAM, REPORT, PRESCRIPTION, OTHER
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

  const minutesUntil = canStart ? 0 : Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / (60 * 1000));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-primary hover:underline flex items-center gap-2"
        >
          ← Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Telemedicina e Upload */}
          <div className="lg:col-span-2 space-y-6">
            {/* Janela de Vídeo Integrada */}
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

            {/* Informações da Consulta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Informações da Consulta</h1>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={18} />
                  <span>{new Date(consultationDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={18} />
                  <span>{consultationTime}</span>
                </div>
              </div>

              {consultation.doctor && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={18} className="text-primary" />
                    <h3 className="font-semibold text-gray-900">Médico</h3>
                  </div>
                  <p className="text-gray-700">{consultation.doctor.name}</p>
                </div>
              )}
            </motion.div>

            {/* Receita Médica */}
            {consultation.prescription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-lg shadow-lg p-6"
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

            {/* Upload de Arquivos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Upload size={20} />
                  Enviar Arquivos
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Envie exames, laudos, receitas ou outros documentos para análise do médico.
                Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máximo 10MB por arquivo).
              </p>
              
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
                {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
              </Button>
            </motion.div>

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
                            {file.fileType} • {formatFileSize(file.fileSize || 0)} • {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
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
                    {consultation.status === 'SCHEDULED' ? 'Agendada' :
                     consultation.status === 'IN_PROGRESS' ? 'Em Andamento' :
                     consultation.status === 'COMPLETED' ? 'Concluída' :
                     consultation.status}
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
                      {consultation.payment.status === 'PAID' ? 'Pago' :
                       consultation.payment.status === 'PENDING' ? 'Pendente' :
                       consultation.payment.status}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Informações de Ajuda */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50 rounded-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Dicas</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Envie seus exames e documentos antes da consulta</li>
                <li>• O médico terá acesso a todos os arquivos enviados</li>
                <li>• Você pode enviar múltiplos arquivos</li>
                <li>• Formatos aceitos: PDF, JPG, PNG, DOC, DOCX</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
