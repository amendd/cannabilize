'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { Camera, Save, AlertCircle, Download, FileJson, ClipboardList } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonPatientList } from '@/components/ui/Skeleton';
import { getCurrentTreatmentPhase, TREATMENT_PHASES } from '@/lib/patient-treatment-status';

interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    cpf: string | null;
    birthDate: string | null;
    address: string | null;
    image: string | null;
  };
}

export default function PacientePerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [me, setMe] = useState<MeResponse['user'] | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clinicalSummary, setClinicalSummary] = useState<{
    nextConsultation: { date: string; doctorName: string } | null;
    lastEvaluation: string | null;
    phaseLabel: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchMe();
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/patient/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        const consultations = data.consultations ?? [];
        const now = new Date();
        const upcoming = consultations
          .filter((c: any) => new Date(c.scheduledAt) > now && c.status === 'SCHEDULED')
          .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        const next = upcoming[0];
        const completed = consultations
          .filter((c: any) => c.status === 'COMPLETED')
          .sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        const last = completed[0];
        const phase = getCurrentTreatmentPhase(consultations, next);
        const phaseLabel = TREATMENT_PHASES.find((p) => p.id === phase)?.label ?? 'Acompanhamento';
        setClinicalSummary({
          nextConsultation: next
            ? {
                date: new Date(next.scheduledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                doctorName: next.doctor?.name ?? '—',
              }
            : null,
          lastEvaluation: last ? new Date(last.scheduledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : null,
          phaseLabel,
        });
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const fetchMe = async () => {
    try {
      setError(null);
      const res = await fetch('/api/me');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao carregar perfil');
      }
      const data: MeResponse = await res.json();
      setMe(data.user);
      setPreviewImage(data.user.image);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar perfil');
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Formato inválido. Envie uma foto JPG ou PNG.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Imagem muito grande. Tamanho máximo: 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!me) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: previewImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar perfil');
      }

      setSuccess('Foto atualizada com sucesso! Ela será usada na sua Carteirinha Digital.');
      setMe(data.user);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setError(null);
      const res = await fetch('/api/user/export', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao exportar');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-lgpd-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Download dos seus dados iniciado. Verifique a pasta de downloads.');
    } catch (err: any) {
      setError(err.message || 'Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  if (status === 'loading' || !session || !me) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs baseHref="/paciente" items={[{ label: 'Meu Perfil' }]} />
        <SkeletonPatientList count={4} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs baseHref="/paciente" items={[{ label: 'Meu Perfil' }]} />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

        {/* Resumo clínico leve */}
        {clinicalSummary && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="text-purple-600" size={22} />
              Resumo do tratamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Status atual</p>
                <p className="font-medium text-gray-900">{clinicalSummary.phaseLabel}</p>
              </div>
              {clinicalSummary.nextConsultation && (
                <div>
                  <p className="text-gray-500 mb-1">Próxima consulta</p>
                  <p className="font-medium text-gray-900">{clinicalSummary.nextConsultation.date}</p>
                  <p className="text-gray-600">Dr(a). {clinicalSummary.nextConsultation.doctorName}</p>
                </div>
              )}
              {clinicalSummary.lastEvaluation && (
                <div>
                  <p className="text-gray-500 mb-1">Última avaliação</p>
                  <p className="font-medium text-gray-900">{clinicalSummary.lastEvaluation}</p>
                </div>
              )}
            </div>
            <Link href="/paciente" className="mt-4 inline-block text-purple-600 hover:text-purple-700 font-medium text-sm">
              Ver centro de tratamento →
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Foto para Carteirinha</h2>
          <p className="text-sm text-gray-600 mb-4">
            Essa foto será exibida na sua <strong>Carteirinha Digital</strong> e nos documentos
            gerados. Use uma foto nítida de rosto, em fundo neutro.
          </p>

          <div className="flex items-center gap-6">
            <Avatar
              src={previewImage || undefined}
              name={me.name}
              size="xl"
              className="border-4 border-emerald-500 shadow-lg"
            />

            <div className="flex flex-col gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
                <Camera size={18} />
                <span>Escolher foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              <p className="text-xs text-gray-500">
                Formatos aceitos: JPG ou PNG. Tamanho máximo: 10MB.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar foto'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dados básicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Nome</p>
              <p className="font-medium text-gray-900">{me.name}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-900">{me.email}</p>
            </div>
            {me.cpf && (
              <div>
                <p className="text-gray-500 mb-1">CPF</p>
                <p className="font-medium text-gray-900">{me.cpf}</p>
              </div>
            )}
            {me.phone && (
              <div>
                <p className="text-gray-500 mb-1">Telefone</p>
                <p className="font-medium text-gray-900">{me.phone}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mt-6 border border-purple-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileJson size={22} className="text-purple-600" />
            Exportar meus dados (LGPD)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Conforme a Lei Geral de Proteção de Dados, você pode baixar uma cópia dos seus dados pessoais e de saúde que temos em nosso sistema (consultas, receitas, pagamentos, etc.) em formato JSON.
          </p>
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-60"
          >
            <Download size={18} />
            {exporting ? 'Preparando download...' : 'Baixar meus dados'}
          </button>
        </div>
    </div>
  );
}

