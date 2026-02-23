'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Calendar,
  FileText,
  Mail,
  Phone,
  ArrowLeft,
  Stethoscope,
  FilePlus,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import LoadingPage from '@/components/ui/Loading';
import Button from '@/components/ui/Button';

type ProntuarioData = {
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    cpf: string | null;
    birthDate: string | null;
    address: string | null;
  };
  pathologies: { id: string; name: string }[];
  consultations: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    anamnesis: string | null;
    notes: string | null;
    nextReturnDate: string | null;
    doctor: { id: string; name: string; crm: string } | null;
    prescription: { id: string; issuedAt: string; status: string; expiresAt: string | null } | null;
    hasLaudo: boolean;
  }>;
  prescriptions: any[];
  files: any[];
  clinicalEvolutions: any[];
  medicalCertificates: any[];
  examRequests: any[];
};

export default function ProntuarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [data, setData] = useState<ProntuarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [evolutionText, setEvolutionText] = useState('');
  const [savingEvolution, setSavingEvolution] = useState(false);
  const [showEvolutionForm, setShowEvolutionForm] = useState(false);
  const [showAtestadoForm, setShowAtestadoForm] = useState(false);
  const [showExameForm, setShowExameForm] = useState(false);
  const [atestadoContent, setAtestadoContent] = useState('');
  const [atestadoDaysOff, setAtestadoDaysOff] = useState('');
  const [exameContent, setExameContent] = useState('');
  const [savingAtestado, setSavingAtestado] = useState(false);
  const [savingExame, setSavingExame] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'DOCTOR' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session?.user?.role, router]);

  useEffect(() => {
    if (!patientId || status !== 'authenticated') return;
    fetch(`/api/medico/prontuario/${patientId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar prontuário');
        return res.json();
      })
      .then(setData)
      .catch(() => toast.error('Erro ao carregar prontuário'))
      .finally(() => setLoading(false));
  }, [patientId, status]);

  const loadProntuario = () => {
    fetch(`/api/medico/prontuario/${patientId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setData(d));
  };

  const handleAddEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evolutionText.trim()) return;
    setSavingEvolution(true);
    try {
      const res = await fetch(`/api/medico/prontuario/${patientId}/evolucoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: evolutionText.trim(), evolutionDate: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      toast.success('Evolução registrada');
      setEvolutionText('');
      setShowEvolutionForm(false);
      loadProntuario();
    } catch {
      toast.error('Erro ao salvar evolução');
    } finally {
      setSavingEvolution(false);
    }
  };

  const handleEmitAtestado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atestadoContent.trim()) return;
    setSavingAtestado(true);
    try {
      const res = await fetch('/api/medico/atestados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          content: atestadoContent.trim(),
          daysOff: atestadoDaysOff ? parseInt(atestadoDaysOff, 10) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      toast.success('Atestado emitido');
      setAtestadoContent('');
      setAtestadoDaysOff('');
      setShowAtestadoForm(false);
      loadProntuario();
    } catch {
      toast.error('Erro ao emitir atestado');
    } finally {
      setSavingAtestado(false);
    }
  };

  const handlePedidoExame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exameContent.trim()) return;
    setSavingExame(true);
    try {
      const res = await fetch('/api/medico/pedidos-exame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, content: exameContent.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      toast.success('Pedido de exame registrado');
      setExameContent('');
      setShowExameForm(false);
      loadProntuario();
    } catch {
      toast.error('Erro ao registrar pedido');
    } finally {
      setSavingExame(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const parseAnamnesis = (a: string | null) => {
    if (!a) return null;
    try {
      return typeof a === 'string' ? JSON.parse(a) : a;
    } catch {
      return null;
    }
  };

  if (status === 'loading' || loading || !data) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/medico/pacientes"
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-800"
        >
          <ArrowLeft size={20} />
          Voltar aos pacientes
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-5 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User size={28} />
            Prontuário – {data.patient.name}
          </h1>
          <p className="text-green-100 mt-1">
            {data.patient.email}
            {data.patient.phone && ` • ${data.patient.phone}`}
          </p>
          {data.patient.cpf && (
            <p className="text-green-200 text-sm mt-0.5">CPF: {data.patient.cpf}</p>
          )}
          {data.pathologies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.pathologies.map((p) => (
                <span key={p.id} className="bg-white/20 px-2 py-0.5 rounded text-sm">
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-8">
          {/* Timeline: Consultas + Evoluções */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-green-600" />
              Histórico (consultas e evoluções)
            </h2>
            <ul className="space-y-4">
              {data.consultations.map((c) => (
                <li key={c.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          Consulta – {formatDateTime(c.scheduledAt)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                          {c.status}
                        </span>
                        {c.doctor && (
                          <span className="text-sm text-gray-600">Dr(a). {c.doctor.name}</span>
                        )}
                      </div>
                      {c.nextReturnDate && (
                        <p className="text-sm text-green-700 mt-1">
                          Retorno previsto: {formatDate(c.nextReturnDate)}
                        </p>
                      )}
                      {c.notes && (
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{c.notes}</p>
                      )}
                      {parseAnamnesis(c.anamnesis) && (
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          {Object.entries(parseAnamnesis(c.anamnesis) as Record<string, string>).map(
                            ([k, v]) => v && <div key={k}>{k}: {String(v).slice(0, 200)}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.prescription && (
                        <Link
                          href={`/medico/receitas`}
                          className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline"
                        >
                          <FileText size={14} />
                          Receita
                        </Link>
                      )}
                      <Link
                        href={`/medico/consultas/${c.id}`}
                        className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline"
                      >
                        <ExternalLink size={14} />
                        Abrir
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
              {(data.clinicalEvolutions || []).map((ev: any) => (
                <li key={ev.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Stethoscope size={16} />
                    Evolução – {formatDate(ev.evolutionDate)}
                    {ev.doctor?.name && ` • ${ev.doctor.name}`}
                  </div>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">{ev.content}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Adicionar evolução */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Stethoscope size={20} className="text-green-600" />
              Evolução clínica
            </h2>
            {!showEvolutionForm ? (
              <Button variant="outline" onClick={() => setShowEvolutionForm(true)}>
                <Plus size={18} className="mr-2" />
                Registrar evolução
              </Button>
            ) : (
              <form onSubmit={handleAddEvolution} className="space-y-3">
                <textarea
                  value={evolutionText}
                  onChange={(e) => setEvolutionText(e.target.value)}
                  placeholder="Registre a evolução do paciente..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingEvolution || !evolutionText.trim()}>
                    {savingEvolution ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowEvolutionForm(false); setEvolutionText(''); }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </section>

          {/* Receitas */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FileText size={20} className="text-green-600" />
              Receitas ({data.prescriptions?.length ?? 0})
            </h2>
            {data.prescriptions?.length ? (
              <ul className="space-y-2">
                {data.prescriptions.slice(0, 10).map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span>{formatDate(p.issuedAt)} – {p.doctor?.name}</span>
                    <Link href="/medico/receitas" className="text-green-700 text-sm hover:underline">
                      Ver
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Nenhuma receita registrada.</p>
            )}
          </section>

          {/* Atestados */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FilePlus size={20} className="text-green-600" />
              Atestados
            </h2>
            {(data.medicalCertificates?.length ?? 0) > 0 ? (
              <ul className="space-y-2">
                {data.medicalCertificates.map((a: any) => (
                  <li key={a.id} className="py-2 border-b border-gray-100 text-sm">
                    {formatDate(a.issuedAt)} – {a.content?.slice(0, 80)}...
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum atestado emitido.</p>
            )}
            {!showAtestadoForm ? (
              <Button variant="outline" className="mt-2" onClick={() => setShowAtestadoForm(true)}>
                <Plus size={18} className="mr-2" />
                Emitir atestado
              </Button>
            ) : (
              <form onSubmit={handleEmitAtestado} className="mt-3 space-y-3 p-4 border rounded-lg bg-gray-50">
                <textarea
                  value={atestadoContent}
                  onChange={(e) => setAtestadoContent(e.target.value)}
                  placeholder="Texto do atestado..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Dias de afastamento (opcional)"
                  value={atestadoDaysOff}
                  onChange={(e) => setAtestadoDaysOff(e.target.value)}
                  className="w-48 border rounded-lg px-3 py-2"
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingAtestado || !atestadoContent.trim()}>
                    Emitir
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAtestadoForm(false); setAtestadoContent(''); setAtestadoDaysOff(''); }}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </section>

          {/* Pedidos de exame */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <ClipboardList size={20} className="text-green-600" />
              Pedidos de exame
            </h2>
            {(data.examRequests?.length ?? 0) > 0 ? (
              <ul className="space-y-2">
                {data.examRequests.map((e: any) => (
                  <li key={e.id} className="py-2 border-b border-gray-100 text-sm">
                    {formatDate(e.requestedAt)} – {e.content?.slice(0, 80)}...
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum pedido de exame.</p>
            )}
            {!showExameForm ? (
              <Button variant="outline" className="mt-2" onClick={() => setShowExameForm(true)}>
                <Plus size={18} className="mr-2" />
                Novo pedido de exame
              </Button>
            ) : (
              <form onSubmit={handlePedidoExame} className="mt-3 space-y-3 p-4 border rounded-lg bg-gray-50">
                <textarea
                  value={exameContent}
                  onChange={(e) => setExameContent(e.target.value)}
                  placeholder="Descreva os exames solicitados..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingExame || !exameContent.trim()}>
                    Registrar
                  </Button>
                  <Button variant="outline" onClick={() => { setShowExameForm(false); setExameContent(''); }}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}
