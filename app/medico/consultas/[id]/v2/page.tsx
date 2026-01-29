'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Info,
  Pill,
  RotateCcw,
  Stethoscope,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingPage from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import PrescriptionBuilder from '@/components/medico/PrescriptionBuilder';
import VideoCallWindow from '@/components/medico/VideoCallWindow';

type ConsultationStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type FileType = 'EXAM' | 'REPORT' | 'PRESCRIPTION' | 'OTHER';

type ChecklistKey = 'anamnesisReviewed' | 'documentsReviewed';

const checklistStorageKey = (consultationId: string) => `consultation:v2:checklist:${consultationId}`;

export default function MedicoConsultaPageV2() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;
  const lastErrorToastAtRef = useRef<number>(0);

  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState<any[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<FileType | 'ALL'>('ALL');

  const [prescription, setPrescription] = useState<any>(null);

  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedNotesRef = useRef<string>('');
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const [customDate, setCustomDate] = useState<string>('');
  const [nextReturnDate, setNextReturnDate] = useState<string>('');
  const [savingReturnDate, setSavingReturnDate] = useState(false);

  const [meetingOpenedOnce, setMeetingOpenedOnce] = useState(false);

  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    anamnesisReviewed: false,
    documentsReviewed: false,
  });

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [recreatingMeeting, setRecreatingMeeting] = useState(false);

  // Auth guard
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

  // Load checklist state
  useEffect(() => {
    if (!consultationId) return;
    try {
      const raw = localStorage.getItem(checklistStorageKey(consultationId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setChecklist((prev) => ({
        ...prev,
        anamnesisReviewed: Boolean(parsed?.anamnesisReviewed),
        documentsReviewed: Boolean(parsed?.documentsReviewed),
      }));
    } catch {
      // ignore
    }
  }, [consultationId]);

  const persistChecklist = (next: Record<ChecklistKey, boolean>) => {
    try {
      localStorage.setItem(checklistStorageKey(consultationId), JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const loadConsultation = async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`);
      if (!response.ok) {
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
        return;
      }
      const data = await response.json();
      setConsultation(data);

      // sync notes
      const incomingNotes = (data?.notes ?? '') as string;
      setNotes(incomingNotes);
      lastSavedNotesRef.current = incomingNotes;
      if (incomingNotes) setLastSavedAt(new Date());

      // sync return date
      if (data?.nextReturnDate) {
        const d = new Date(data.nextReturnDate);
        const iso = d.toISOString().split('T')[0];
        setCustomDate(iso);
        setNextReturnDate(iso);
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() + 12);
        const iso = d.toISOString().split('T')[0];
        setCustomDate(iso);
        setNextReturnDate(iso);
      }
    } catch (e) {
      console.error(e);
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
      if (!response.ok) return;
      const data = await response.json();
      setFiles(data.files || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPrescription = async () => {
    try {
      const response = await fetch(`/api/prescriptions?consultationId=${consultationId}`);
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) setPrescription(data[0]);
      else if (data?.prescription) setPrescription(data.prescription);
      else setPrescription(null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!consultationId) return;
    if (status === 'authenticated' && (session?.user.role === 'DOCTOR' || session?.user.role === 'ADMIN')) {
      loadConsultation();
      loadFiles();
      loadPrescription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId, status, session?.user?.role]);

  // Autosave notes (debounce)
  useEffect(() => {
    if (!consultationId) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    const hasChanges = notes !== lastSavedNotesRef.current;
    if (!hasChanges) return;

    autosaveTimerRef.current = setTimeout(() => {
      void saveNotes({ silent: true });
    }, 1500);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, consultationId]);

  // Ctrl+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveNotes({ silent: false });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const saveNotes = async ({ silent }: { silent: boolean }) => {
    if (savingNotes) return;
    const hasChanges = notes !== lastSavedNotesRef.current;
    if (!hasChanges) return;

    setSavingNotes(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (!silent) toast.error(data?.error || 'Erro ao salvar anotações');
        return;
      }
      const saved = (data?.notes ?? '') as string;
      setNotes(saved);
      lastSavedNotesRef.current = saved;
      setLastSavedAt(new Date());
      if (!silent) toast.success('Anotações salvas');
    } catch (e) {
      console.error(e);
      if (!silent) toast.error('Erro ao salvar anotações');
    } finally {
      setSavingNotes(false);
    }
  };

  const updateStatus = async (next: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) return;
      await loadConsultation();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMeeting = async () => {
    if (consultation?.meetingLink) return;
    try {
      toast.loading('Criando reunião...');
      const response = await fetch(`/api/consultations/${consultationId}/meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      toast.dismiss();
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.error || data?.details || 'Erro ao criar reunião', { duration: 6000 });
        return;
      }
      toast.success('Reunião criada');
      await loadConsultation();
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error('Erro ao criar reunião');
    }
  };

  const handleMeetingOpenedExternally = () => {
    setMeetingOpenedOnce(true);
    if (consultation?.status === 'SCHEDULED') {
      void updateStatus('IN_PROGRESS');
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
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error('Erro ao recriar reunião');
    } finally {
      setRecreatingMeeting(false);
    }
  };

  const setReturnDateQuick = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    const iso = d.toISOString().split('T')[0];
    setCustomDate(iso);
    setNextReturnDate(iso);
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
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data?.error || 'Erro ao salvar data de retorno');
        return;
      }
      toast.success('Data de retorno salva');
      await loadConsultation();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar data de retorno');
    } finally {
      setSavingReturnDate(false);
    }
  };

  const handlePrescriptionSaved = () => {
    void loadPrescription();
    void loadConsultation();
  };

  const consultationDate = useMemo(() => {
    if (!consultation) return '';
    return consultation.scheduledDate || new Date(consultation.scheduledAt).toISOString().split('T')[0];
  }, [consultation]);

  const consultationTime = useMemo(() => {
    if (!consultation) return '';
    return consultation.scheduledTime || new Date(consultation.scheduledAt).toTimeString().slice(0, 5);
  }, [consultation]);

  const canStartMeeting = useMemo(() => {
    if (!consultation) return false;
    const dt = new Date(`${consultationDate}T${consultationTime}`);
    const fiveMinBefore = new Date(dt.getTime() - 5 * 60 * 1000);
    const now = new Date();
    const okTime = now >= fiveMinBefore || now > dt;
    const okStatus = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(consultation.status);
    return okTime && okStatus;
  }, [consultation, consultationDate, consultationTime]);

  const minutesUntil = useMemo(() => {
    if (!consultation) return 0;
    const dt = new Date(`${consultationDate}T${consultationTime}`);
    const fiveMinBefore = new Date(dt.getTime() - 5 * 60 * 1000);
    const now = new Date();
    if (now >= fiveMinBefore) return 0;
    return Math.ceil((fiveMinBefore.getTime() - now.getTime()) / (60 * 1000));
  }, [consultation, consultationDate, consultationTime]);

  const anamnesis = useMemo(() => {
    const raw = consultation?.anamnesis;
    if (!raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return { raw };
    }
  }, [consultation]);

  const checklistItems = useMemo(() => {
    const notesSaved = Boolean(lastSavedAt) && notes.trim().length > 0;
    const hasMeeting = Boolean(consultation?.meetingLink);
    const meetingDone = hasMeeting && (meetingOpenedOnce || consultation?.status === 'IN_PROGRESS' || consultation?.status === 'COMPLETED');

    return [
      {
        id: 'anamnesis',
        label: 'Revisar anamnese',
        required: true,
        completed: checklist.anamnesisReviewed || !anamnesis,
      },
      {
        id: 'documents',
        label: 'Revisar documentos',
        required: false,
        completed: checklist.documentsReviewed || files.length === 0,
      },
      {
        id: 'meeting',
        label: 'Abrir reunião (Zoom/Meet)',
        required: true,
        completed: meetingDone,
      },
      {
        id: 'notes',
        label: 'Registrar anotações (salvas)',
        required: true,
        completed: notesSaved,
      },
      {
        id: 'prescription',
        label: 'Emitir receita (opcional)',
        required: false,
        completed: prescription?.status === 'ISSUED',
      },
      {
        id: 'return',
        label: 'Definir retorno (opcional)',
        required: false,
        completed: Boolean(nextReturnDate),
      },
    ] as const;
  }, [anamnesis, checklist, files.length, consultation, meetingOpenedOnce, lastSavedAt, notes, prescription, nextReturnDate]);

  const requiredOk = useMemo(() => checklistItems.filter((i) => i.required).every((i) => i.completed), [checklistItems]);
  const doneCount = useMemo(() => checklistItems.filter((i) => i.completed).length, [checklistItems]);

  const finalizeConsultation = async () => {
    if (!requiredOk) {
      toast.error('Conclua os itens obrigatórios antes de finalizar');
      return;
    }
    setFinalizing(true);
    try {
      await updateStatus('COMPLETED');
      toast.success('Consulta finalizada');
      setShowFinalizeModal(false);
    } finally {
      setFinalizing(false);
    }
  };

  if (status === 'loading' || loading) return <LoadingPage />;
  if (!consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Consulta não encontrada</div>
      </div>
    );
  }

  const statusLabel: Record<ConsultationStatus, string> = {
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada',
  };

  const statusColor: Record<ConsultationStatus, string> = {
    SCHEDULED: 'text-blue-600',
    IN_PROGRESS: 'text-yellow-600',
    COMPLETED: 'text-green-600',
    CANCELLED: 'text-red-600',
  };

  const filteredFiles = files.filter((f) => selectedFileType === 'ALL' || f.fileType === selectedFileType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <button onClick={() => router.back()} className="text-primary hover:text-primary-dark font-medium transition">
              ← Voltar
            </button>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 truncate">
              Atendimento (V2) — {consultation.patient?.name || 'Paciente'}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                {new Date(consultationDate).toLocaleDateString('pt-BR')}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                {consultationTime}
              </span>
              <span className="flex items-center gap-2">
                <Info size={16} className="text-primary" />
                <span className={statusColor[consultation.status as ConsultationStatus]}>
                  {statusLabel[consultation.status as ConsultationStatus] || consultation.status}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(session?.user.role === 'ADMIN' || session?.user.role === 'DOCTOR') && consultation?.meetingLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecreateMeeting}
                disabled={recreatingMeeting}
              >
                {recreatingMeeting ? 'Recriando...' : 'Recriar reunião'}
              </Button>
            )}
            <div className="text-right">
              <div className="text-xs text-gray-500">Progresso</div>
              <div className="text-sm font-semibold text-gray-900">
                {doneCount}/{checklistItems.length}
              </div>
            </div>
            {consultation.status !== 'COMPLETED' && (
              <Button
                variant={requiredOk ? 'primary' : 'outline'}
                disabled={!requiredOk}
                onClick={() => setShowFinalizeModal(true)}
              >
                <CheckCircle2 size={18} />
                Finalizar
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Checklist</h2>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-gray-600">Etapas</span>
                  <span className="font-semibold text-primary">{doneCount}/{checklistItems.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(doneCount / checklistItems.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                    ) : (
                      <Circle size={18} className="text-gray-400 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${item.completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
                          {item.label}
                        </span>
                        {item.required && <span className="text-xs text-red-500">*</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <Button
                  variant={checklist.anamnesisReviewed || !anamnesis ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const next = { ...checklist, anamnesisReviewed: true };
                    setChecklist(next);
                    persistChecklist(next);
                  }}
                >
                  <FileText size={16} />
                  Marcar anamnese revisada
                </Button>

                <Button
                  variant={checklist.documentsReviewed || files.length === 0 ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const next = { ...checklist, documentsReviewed: true };
                    setChecklist(next);
                    persistChecklist(next);
                  }}
                >
                  <FileCheck size={16} />
                  Marcar documentos revisados
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Resumo</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500">Paciente</div>
                  <div className="font-semibold text-gray-900">{consultation.patient?.name || 'N/A'}</div>
                  <div className="text-gray-600">{consultation.patient?.email || 'N/A'}</div>
                  {consultation.patient?.phone && <div className="text-gray-600">{consultation.patient.phone}</div>}
                </div>

                {anamnesis?.allergies && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-red-600" />
                      <span className="text-xs font-bold text-red-800">ALERGIAS</span>
                    </div>
                    <div className="text-xs text-red-700">{anamnesis.allergies}</div>
                  </div>
                )}

                {anamnesis?.currentMedications && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs font-bold text-yellow-800 mb-1">Medicações atuais</div>
                    <div className="text-xs text-yellow-800">{anamnesis.currentMedications}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video */}
            <VideoCallWindow
              meetingLink={consultation.meetingLink}
              meetingStartUrl={consultation.meetingStartUrl}
              consultationId={consultationId}
              canStart={canStartMeeting}
              minutesUntil={minutesUntil}
              platform={(consultation.meetingPlatform as any) || 'OTHER'}
              onStartMeeting={handleCreateMeeting}
              onOpenExternal={handleMeetingOpenedExternally}
            />

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText size={20} />
                    Anotações (autosave)
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Salva automaticamente. Use Ctrl+S para salvar manualmente.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {savingNotes ? (
                    <span className="text-sm text-gray-500">Salvando…</span>
                  ) : lastSavedAt ? (
                    <span className="text-xs text-gray-400">
                      Salvo às {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Ainda não salvo</span>
                  )}

                  <Button variant="outline" size="sm" onClick={() => void saveNotes({ silent: false })} disabled={savingNotes}>
                    <Download size={16} />
                    Salvar agora
                  </Button>
                </div>
              </div>

              <textarea
                ref={(el) => {
                  notesRef.current = el;
                }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  'Exemplo de estrutura:\n' +
                  '- Queixa principal:\n' +
                  '- HMA:\n' +
                  '- Antecedentes:\n' +
                  '- Medicações/Alergias:\n' +
                  '- Hipótese diagnóstica:\n' +
                  '- Plano:'
                }
                className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none font-mono text-sm"
              />
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                <Info size={14} />
                <span>{notes.trim().length} caracteres</span>
              </div>
            </div>

            {/* Prescription */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Pill size={20} className="text-primary" />
                <h2 className="text-xl font-bold text-gray-900">Receita</h2>
              </div>

              <PrescriptionBuilder
                consultationId={consultationId}
                consultationStatus={consultation.status || 'SCHEDULED'}
                existingPrescription={prescription}
                onPrescriptionSaved={handlePrescriptionSaved}
              />

              {prescription?.pdfUrl && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Prévia do PDF</span>
                    <a
                      href={prescription.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      <Download size={14} />
                      Abrir/baixar
                    </a>
                  </div>
                  <iframe title="Prévia da receita" src={prescription.pdfUrl} className="w-full h-96 rounded border border-gray-200 bg-white" />
                </div>
              )}
            </div>

            {/* Return date */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <RotateCcw size={20} />
                    Retorno
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Defina uma data sugerida de retorno (opcional).</p>
                </div>

                <Button variant="primary" size="sm" onClick={saveReturnDate} disabled={savingReturnDate || !nextReturnDate}>
                  {savingReturnDate ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => setReturnDateQuick(1)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium">
                  1 mês
                </button>
                <button onClick={() => setReturnDateQuick(3)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium">
                  3 meses
                </button>
                <button onClick={() => setReturnDateQuick(6)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium">
                  6 meses
                </button>
                <button onClick={() => setReturnDateQuick(12)} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium">
                  12 meses
                </button>
              </div>

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
                  Retorno em: <strong>{new Date(nextReturnDate).toLocaleDateString('pt-BR')}</strong>
                </p>
              )}
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck size={20} />
                  Documentos
                </h2>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="ALL">Todos</option>
                    <option value="EXAM">Exames</option>
                    <option value="REPORT">Laudos</option>
                    <option value="PRESCRIPTION">Receitas</option>
                    <option value="OTHER">Outros</option>
                  </select>
                </div>
              </div>

              {filteredFiles.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="text-sm">Nenhum documento encontrado.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFiles.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white rounded-lg">
                          {file.fileType === 'EXAM' ? (
                            <Stethoscope size={18} className="text-blue-600" />
                          ) : file.fileType === 'REPORT' ? (
                            <FileCheck size={18} className="text-purple-600" />
                          ) : (
                            <FileText size={18} className="text-gray-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{file.fileName}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(file.uploadedAt).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(file.uploadedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/consultation-files/${file.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm"
                          title="Visualizar"
                        >
                          <Eye size={16} />
                          Ver
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showFinalizeModal} onClose={() => setShowFinalizeModal(false)} title="Finalizar consulta" size="lg">
        <div className="space-y-4">
          <p className="text-gray-600">Para finalizar, conclua os itens obrigatórios:</p>

          <div className="space-y-2">
            {checklistItems
              .filter((i) => i.required)
              .map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {i.completed ? <CheckCircle2 size={18} className="text-green-600" /> : <Circle size={18} className="text-gray-400" />}
                  <span className={`text-sm ${i.completed ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{i.label}</span>
                </div>
              ))}
          </div>

          {!requiredOk && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              Ainda faltam itens obrigatórios.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowFinalizeModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={finalizeConsultation} disabled={!requiredOk || finalizing} loading={finalizing}>
              <CheckCircle2 size={18} />
              Finalizar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

