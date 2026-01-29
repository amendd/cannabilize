'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Video, FileText, User, Calendar, Clock, FileUp, Save, ExternalLink, Download, Eye, FileCheck, Receipt, Stethoscope, X, RotateCcw, Info, AlertCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingPage from '@/components/ui/Loading';
import PrescriptionBuilder from '@/components/medico/PrescriptionBuilder';
import VideoCallWindow from '@/components/medico/VideoCallWindow';

export default function MedicoConsultaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;
  const lastErrorToastAtRef = useRef<number>(0);
  
  const [consultation, setConsultation] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFileType, setSelectedFileType] = useState<string>('ALL');
  const [prescription, setPrescription] = useState<any>(null);
  const [nextReturnDate, setNextReturnDate] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');
  const [savingReturnDate, setSavingReturnDate] = useState(false);
  const [telemedicineConfigured, setTelemedicineConfigured] = useState<boolean | null>(null);
  const [recreatingMeeting, setRecreatingMeeting] = useState(false);

  const checkTelemedicineStatus = async () => {
    try {
      const response = await fetch('/api/telemedicine/status');
      if (response.ok) {
        const data = await response.json();
        setTelemedicineConfigured(data.configured || false);
      } else {
        setTelemedicineConfigured(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status de telemedicina:', error);
      setTelemedicineConfigured(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'DOCTOR' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  useEffect(() => {
    if (consultationId && status === 'authenticated' && (session?.user.role === 'DOCTOR' || session?.user.role === 'ADMIN')) {
      loadConsultation();
      loadNotes();
      loadFiles();
      loadPrescription();
      loadReturnDate();
      checkTelemedicineStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId, status, session?.user?.role]);

  // Carregar anotações também da consulta quando ela for carregada
  // Mas só atualizar se ainda não tiver anotações carregadas ou se a consulta mudou
  useEffect(() => {
    if (consultation?.notes !== undefined) {
      // Sempre usar as anotações da consulta quando ela for carregada
      // Isso garante que as anotações salvas sejam exibidas
      const consultationNotes = consultation.notes || '';
      // Só atualizar se for diferente do que já está no estado (evita loops)
      if (consultationNotes !== notes) {
        setNotes(consultationNotes);
        console.log('Anotações carregadas da consulta (useEffect):', consultationNotes);
      }
    }
    // Carregar data de retorno da consulta quando ela for carregada
    if (consultation?.nextReturnDate) {
      const returnDate = new Date(consultation.nextReturnDate);
      setNextReturnDate(returnDate.toISOString().split('T')[0]);
      setCustomDate(returnDate.toISOString().split('T')[0]);
    } else {
      // Definir padrão de 12 meses se não houver data de retorno
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 12);
      setCustomDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [consultation]);

  const loadConsultation = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`);
      if (response.ok) {
        const data = await response.json();
        setConsultation(data);
        // Sempre atualizar as anotações quando a consulta for carregada
        // Isso garante que as anotações salvas sejam exibidas
        if (data.notes !== undefined) {
          setNotes(data.notes || '');
          console.log('Anotações carregadas da consulta (loadConsultation):', data.notes);
        }
      } else {
        const now = Date.now();
        const shouldToast = now - lastErrorToastAtRef.current > 3000;
        if (shouldToast) lastErrorToastAtRef.current = now;

        // Tentar extrair detalhes do backend para log/mensagem
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
          router.push('/medico/consultas');
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

  const loadNotes = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}/notes`);
      if (response.ok) {
        const data = await response.json();
        const loadedNotes = data.notes || '';
        console.log('Anotações carregadas da API /notes:', loadedNotes);
        // Sempre atualizar, mesmo se for vazio, para garantir sincronização
        setNotes(loadedNotes);
      } else {
        const errorData = await response.json();
        console.error('Erro ao carregar anotações:', errorData);
        // Se der erro de autorização, não limpar as anotações existentes
        if (response.status !== 403) {
          // Só limpar se não for erro de autorização
        }
      }
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
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

  const loadPrescription = async () => {
    try {
      const response = await fetch(`/api/prescriptions?consultationId=${consultationId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setPrescription(data[0]);
        } else if (data.prescription) {
          setPrescription(data.prescription);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar receita:', error);
    }
  };

  const loadReturnDate = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}/return-date`);
      if (response.ok) {
        const data = await response.json();
        if (data.nextReturnDate) {
          const returnDate = new Date(data.nextReturnDate);
          setNextReturnDate(returnDate.toISOString().split('T')[0]);
          setCustomDate(returnDate.toISOString().split('T')[0]);
        } else {
          // Definir padrão de 12 meses se não houver data de retorno
          const defaultDate = new Date();
          defaultDate.setMonth(defaultDate.getMonth() + 12);
          setCustomDate(defaultDate.toISOString().split('T')[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar data de retorno:', error);
    }
  };

  const handlePrescriptionSaved = () => {
    loadPrescription();
    loadConsultation();
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Atualizar o estado imediatamente com as anotações salvas
        const savedNotes = responseData.notes || '';
        setNotes(savedNotes);
        console.log('✅ Anotações salvas e atualizadas no estado:', savedNotes);
        toast.success('Anotações salvas com sucesso!');
        
        // Recarregar as anotações e a consulta para garantir sincronização
        // Usar setTimeout para dar tempo da atualização do estado
        setTimeout(async () => {
          await Promise.all([loadNotes(), loadConsultation()]);
        }, 100);
      } else {
        const errorMessage = responseData.error || 'Erro ao salvar anotações';
        const errorDetails = responseData.details;
        console.error('Erro ao salvar anotações:', errorMessage, errorDetails);
        toast.error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }
    } catch (error) {
      console.error('Erro ao salvar anotações:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
      toast.error(`Erro ao salvar anotações: ${errorMessage}`);
    } finally {
      setSavingNotes(false);
    }
  };

  const setReturnDate = (months: number | null) => {
    const today = new Date();
    if (months !== null) {
      const newDate = new Date(today);
      newDate.setMonth(newDate.getMonth() + months);
      const dateString = newDate.toISOString().split('T')[0];
      setCustomDate(dateString);
      setNextReturnDate(dateString);
    } else {
      // Usar data customizada
      if (customDate) {
        setNextReturnDate(customDate);
      }
    }
  };

  const saveReturnDate = async () => {
    if (!nextReturnDate) {
      toast.error('Selecione uma data de retorno');
      return;
    }

    setSavingReturnDate(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/return-date`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextReturnDate }),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success('Data de retorno salva com sucesso!');
        loadConsultation();
        loadReturnDate();
      } else {
        const errorMessage = responseData.error || 'Erro ao salvar data de retorno';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao salvar data de retorno:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
      toast.error(`Erro ao salvar data de retorno: ${errorMessage}`);
    } finally {
      setSavingReturnDate(false);
    }
  };

  const handleStartMeeting = async () => {
    if (consultation?.meetingLink) {
      // Se já existe link, apenas recarregar a consulta
      loadConsultation();
      return;
    }

    try {
      toast.loading('Criando reunião...');
      const response = await fetch(`/api/consultations/${consultationId}/meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Não especificar plataforma - o sistema detectará automaticamente qual está configurada
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        toast.dismiss();
        toast.success('Reunião criada com sucesso!');
        // Recarregar consulta para obter o meetingLink
        await loadConsultation();
      } else {
        toast.dismiss();
        const errorData = await response.json();
        // Priorizar a mensagem de erro principal, depois os detalhes
        const errorMessage = errorData.error || errorData.details || 'Erro ao criar reunião';
        console.error('Erro ao criar reunião:', errorData);
        toast.error(errorMessage, {
          duration: 6000, // Mostrar por mais tempo para erros importantes
        });
      }
    } catch (error) {
      toast.dismiss();
      console.error('Erro ao criar reunião:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão ao criar reunião';
      toast.error(errorMessage);
    }
  };

  /** Recriar reunião: cancela a atual e cria uma nova instantânea. Apenas para ADMIN. */
  const handleRecreateMeeting = async () => {
    if (!consultation?.meetingLink) return;
    try {
      setRecreatingMeeting(true);
      toast.loading('Recriando reunião...');
      const delRes = await fetch(`/api/consultations/${consultationId}/meeting`, { method: 'DELETE' });
      if (!delRes.ok) {
        const err = await delRes.json().catch(() => ({}));
        toast.dismiss();
        toast.error(err.error || 'Erro ao cancelar reunião');
        return;
      }
      const postRes = await fetch(`/api/consultations/${consultationId}/meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!postRes.ok) {
        const err = await postRes.json().catch(() => ({}));
        toast.dismiss();
        toast.error(err.error || err.details || 'Erro ao criar nova reunião');
        return;
      }
      toast.dismiss();
      toast.success('Reunião recriada. Novo link disponível.');
      await loadConsultation();
    } catch (error) {
      toast.dismiss();
      console.error('Erro ao recriar reunião:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao recriar reunião');
    } finally {
      setRecreatingMeeting(false);
    }
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
  
  // Permitir iniciar reunião se:
  // 1. Já passou 5 minutos antes do horário agendado OU a consulta já passou (útil para testes e casos onde não foi criada a tempo)
  // 2. E o status é SCHEDULED ou COMPLETED (permitir criar reunião mesmo após a consulta)
  const canStart = (now >= fiveMinutesBefore || now > consultationDateTime) && 
                  (consultation.status === 'SCHEDULED' || consultation.status === 'COMPLETED');

  const minutesUntil = canStart ? 0 : Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / (60 * 1000));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header com navegação */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-primary hover:text-primary-dark flex items-center gap-2 font-medium transition"
            >
              ← Voltar para Consultas
            </button>
            {/* Link opcional para testar a nova versão V2 */}
            <button
              type="button"
              onClick={() => router.push(`/medico/consultas/${consultationId}/v2`)}
              className="text-xs px-3 py-1 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition"
            >
              Testar novo layout (V2)
            </button>
            {/* Recriar reunião: para ADMIN e DOCTOR, quando já existe reunião */}
            {(session?.user.role === 'ADMIN' || session?.user.role === 'DOCTOR') && consultation?.meetingLink && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRecreateMeeting}
                disabled={recreatingMeeting}
                className="text-xs"
              >
                {recreatingMeeting ? 'Recriando...' : 'Recriar reunião'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Status</div>
              <div className={`font-semibold ${
                consultation.status === 'IN_PROGRESS' ? 'text-yellow-600' :
                consultation.status === 'COMPLETED' ? 'text-green-600' :
                consultation.status === 'CANCELLED' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {consultation.status === 'IN_PROGRESS' ? 'Em Andamento' :
                 consultation.status === 'COMPLETED' ? 'Concluída' :
                 consultation.status === 'CANCELLED' ? 'Cancelada' :
                 'Agendada'}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Vídeo e Ferramentas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Janela de Vídeo Integrada */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <VideoCallWindow
                meetingLink={consultation.meetingLink}
                meetingStartUrl={consultation.meetingStartUrl}
                consultationId={consultationId}
                onStartMeeting={handleStartMeeting}
                canStart={canStart}
                minutesUntil={minutesUntil}
                platform={consultation.meetingPlatform as 'ZOOM' | 'GOOGLE_MEET' | 'OTHER'}
              />
            </motion.div>

            {/* Informações Rápidas da Consulta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Info size={20} className="text-primary" />
                <h2 className="text-xl font-bold text-gray-900">Informações da Consulta</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={18} className="text-primary" />
                  <div>
                    <div className="text-xs text-gray-500">Data</div>
                    <div className="font-semibold text-gray-900">{new Date(consultationDate).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <Clock size={18} className="text-primary" />
                  <div>
                    <div className="text-xs text-gray-500">Horário</div>
                    <div className="font-semibold text-gray-900">{consultationTime}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <User size={18} className="text-primary" />
                  <h3 className="font-semibold text-gray-900">Paciente</h3>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-lg font-medium text-gray-900">{consultation.patient?.name || consultation.name}</p>
                  <p className="text-sm text-gray-500">{consultation.patient?.email || consultation.email}</p>
                  {consultation.patient?.phone && (
                    <p className="text-sm text-gray-500">{consultation.patient.phone}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Anotações do Médico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} />
                  Anotações Privadas
                </h2>
                <Button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  variant="primary"
                  size="sm"
                >
                  <Save size={16} />
                  {savingNotes ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Anotações privadas para seu uso durante o atendimento. Apenas você pode ver estas informações.
              </p>
              <textarea
                value={notes || ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Digite suas anotações, sugestões, observações sobre o paciente..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              {notes && (
                <p className="text-xs text-gray-500 mt-2">
                  {notes.length} caractere{notes.length !== 1 ? 's' : ''} digitado{notes.length !== 1 ? 's' : ''}
                </p>
              )}
            </motion.div>

            {/* Data de Retorno */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <RotateCcw size={20} />
                    Data de Retorno
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Agende o próximo retorno do paciente
                  </p>
                </div>
                <Button
                  onClick={saveReturnDate}
                  disabled={savingReturnDate || !nextReturnDate}
                  variant="primary"
                  size="sm"
                >
                  <Save size={16} />
                  {savingReturnDate ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
              
              {/* Botões de opções rápidas */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setReturnDate(1)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    nextReturnDate && (() => {
                      const selected = new Date(nextReturnDate);
                      const oneMonth = new Date();
                      oneMonth.setMonth(oneMonth.getMonth() + 1);
                      return selected.toDateString() === oneMonth.toDateString();
                    })()
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  1 Mês
                </button>
                <button
                  onClick={() => setReturnDate(3)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    nextReturnDate && (() => {
                      const selected = new Date(nextReturnDate);
                      const threeMonths = new Date();
                      threeMonths.setMonth(threeMonths.getMonth() + 3);
                      return selected.toDateString() === threeMonths.toDateString();
                    })()
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  3 Meses
                </button>
                <button
                  onClick={() => setReturnDate(6)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    nextReturnDate && (() => {
                      const selected = new Date(nextReturnDate);
                      const sixMonths = new Date();
                      sixMonths.setMonth(sixMonths.getMonth() + 6);
                      return selected.toDateString() === sixMonths.toDateString();
                    })()
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  6 Meses
                </button>
                <button
                  onClick={() => setReturnDate(12)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    nextReturnDate && (() => {
                      const selected = new Date(nextReturnDate);
                      const twelveMonths = new Date();
                      twelveMonths.setMonth(twelveMonths.getMonth() + 12);
                      return selected.toDateString() === twelveMonths.toDateString();
                    })()
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  12 Meses (Padrão)
                </button>
              </div>

              {/* Campo de data customizada */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ou informe uma data específica:
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setNextReturnDate(e.target.value);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {nextReturnDate && (
                  <p className="text-sm text-gray-600 mt-2">
                    Retorno agendado para: <strong>{new Date(nextReturnDate).toLocaleDateString('pt-BR')}</strong>
                  </p>
                )}
              </div>
            </motion.div>

            {/* Receita Médica */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <PrescriptionBuilder
                consultationId={consultationId}
                consultationStatus={consultation?.status || 'SCHEDULED'}
                existingPrescription={prescription}
                onPrescriptionSaved={handlePrescriptionSaved}
              />
            </motion.div>

            {/* Documentos e Informações do Paciente */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck size={20} />
                  Documentos e Informações do Paciente
                </h2>
              </div>

              {/* Receita Médica */}
              {consultation.prescription && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Receipt size={24} className="text-green-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Receita Médica</h3>
                        <p className="text-sm text-gray-600">
                          Emitida em {new Date(consultation.prescription.issuedAt).toLocaleDateString('pt-BR')}
                        </p>
                        {consultation.prescription.status && (
                          <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                            consultation.prescription.status === 'ISSUED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {consultation.prescription.status === 'ISSUED' ? 'Emitida' : consultation.prescription.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {consultation.prescription.pdfUrl && (
                      <a
                        href={consultation.prescription.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <Download size={18} />
                        Baixar PDF
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Filtros de Arquivos */}
              {files.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
                    <button
                      onClick={() => setSelectedFileType('ALL')}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        selectedFileType === 'ALL'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setSelectedFileType('EXAM')}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        selectedFileType === 'EXAM'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Stethoscope size={14} className="inline mr-1" />
                      Exames
                    </button>
                    <button
                      onClick={() => setSelectedFileType('REPORT')}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        selectedFileType === 'REPORT'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Laudos
                    </button>
                    <button
                      onClick={() => setSelectedFileType('PRESCRIPTION')}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        selectedFileType === 'PRESCRIPTION'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Receitas
                    </button>
                    <button
                      onClick={() => setSelectedFileType('OTHER')}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        selectedFileType === 'OTHER'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Outros
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Arquivos */}
              {files.length > 0 ? (
                <div className="space-y-3">
                  {files
                    .filter(file => selectedFileType === 'ALL' || file.fileType === selectedFileType)
                    .map((file) => {
                      const getFileTypeIcon = (type: string) => {
                        switch (type) {
                          case 'EXAM':
                            return <Stethoscope size={20} className="text-blue-600" />;
                          case 'REPORT':
                            return <FileCheck size={20} className="text-purple-600" />;
                          case 'PRESCRIPTION':
                            return <Receipt size={20} className="text-green-600" />;
                          default:
                            return <FileText size={20} className="text-gray-600" />;
                        }
                      };

                      const getFileTypeLabel = (type: string) => {
                        switch (type) {
                          case 'EXAM':
                            return 'Exame';
                          case 'REPORT':
                            return 'Laudo';
                          case 'PRESCRIPTION':
                            return 'Receita';
                          default:
                            return 'Documento';
                        }
                      };

                      const formatFileSize = (bytes?: number) => {
                        if (!bytes) return '';
                        if (bytes < 1024) return `${bytes} B`;
                        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                      };

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-white rounded-lg">
                              {getFileTypeIcon(file.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900 truncate">{file.fileName}</p>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  file.fileType === 'EXAM' ? 'bg-blue-100 text-blue-800' :
                                  file.fileType === 'REPORT' ? 'bg-purple-100 text-purple-800' :
                                  file.fileType === 'PRESCRIPTION' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {getFileTypeLabel(file.fileType)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{new Date(file.uploadedAt).toLocaleDateString('pt-BR')} às {new Date(file.uploadedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                {file.fileSize && (
                                  <>
                                    <span>•</span>
                                    <span>{formatFileSize(file.fileSize)}</span>
                                  </>
                                )}
                              </div>
                              {file.description && (
                                <p className="text-sm text-gray-600 mt-2">{file.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/consultation-files/${file.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                              title="Visualizar arquivo"
                            >
                              <Eye size={16} />
                              Ver
                            </a>
                            <a
                              href={`/api/consultation-files/${file.id}?download=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                              title="Baixar arquivo"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileUp size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">Nenhum documento enviado pelo paciente ainda.</p>
                  <p className="text-xs mt-1">Os documentos enviados pelo paciente aparecerão aqui.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar - Informações Adicionais */}
          <div className="space-y-6">
            {/* Alerta de Telemedicina */}
            {telemedicineConfigured === false && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Alerta Importante</h3>
                    <p className="text-xs text-red-700 mb-2">
                      Nenhuma plataforma de telemedicina configurada e habilitada. Configure Zoom ou Google Meet no painel de administração.
                    </p>
                    {session?.user.role === 'ADMIN' && (
                      <a
                        href="/admin/telemedicina"
                        className="inline-flex items-center gap-2 text-xs text-red-700 hover:text-red-900 font-medium underline"
                      >
                        <Settings size={14} />
                        Ir para configurações
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Status da Consulta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Status da Consulta</h3>
              <div className={`text-sm font-semibold ${
                consultation.status === 'IN_PROGRESS' ? 'text-yellow-600' :
                consultation.status === 'COMPLETED' ? 'text-green-600' :
                consultation.status === 'CANCELLED' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {consultation.status === 'IN_PROGRESS' ? 'Em Andamento' :
                 consultation.status === 'COMPLETED' ? 'Concluída' :
                 consultation.status === 'CANCELLED' ? 'Cancelada' :
                 'Agendada'}
              </div>
            </motion.div>

            {/* Resumo de Documentos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileCheck size={20} />
                Resumo de Documentos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={18} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Exames</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {files.filter(f => f.fileType === 'EXAM').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileCheck size={18} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Laudos</span>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    {files.filter(f => f.fileType === 'REPORT').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Receitas</span>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    {files.filter(f => f.fileType === 'PRESCRIPTION').length + (consultation.prescription ? 1 : 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Outros</span>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                    {files.filter(f => f.fileType === 'OTHER').length}
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Total</span>
                    <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-semibold">
                      {files.length + (consultation.prescription ? 1 : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Anamnese */}
            {consultation.anamnesis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Anamnese</h3>
                {(() => {
                  try {
                    const anamnesisData = typeof consultation.anamnesis === 'string'
                      ? JSON.parse(consultation.anamnesis)
                      : consultation.anamnesis;
                    
                    return (
                      <div className="space-y-3 text-sm">
                        {anamnesisData.previousTreatments && (
                          <div>
                            <strong className="text-gray-700">Tratamentos Anteriores:</strong>
                            <p className="text-gray-600 mt-1">{anamnesisData.previousTreatments}</p>
                          </div>
                        )}
                        {anamnesisData.currentMedications && (
                          <div>
                            <strong className="text-gray-700">Medicamentos Atuais:</strong>
                            <p className="text-gray-600 mt-1">{anamnesisData.currentMedications}</p>
                          </div>
                        )}
                        {anamnesisData.allergies && (
                          <div>
                            <strong className="text-gray-700">Alergias:</strong>
                            <p className="text-gray-600 mt-1">{anamnesisData.allergies}</p>
                          </div>
                        )}
                        {anamnesisData.additionalInfo && (
                          <div>
                            <strong className="text-gray-700">Informações Adicionais:</strong>
                            <p className="text-gray-600 mt-1">{anamnesisData.additionalInfo}</p>
                          </div>
                        )}
                      </div>
                    );
                  } catch {
                    return <p className="text-gray-600">{consultation.anamnesis}</p>;
                  }
                })()}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
