'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock, Save, ArrowUpCircle, Bell, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAdvance, setSavingAdvance] = useState(false);
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [minutes, setMinutes] = useState<number>(20);
  const [minutesOnline, setMinutesOnline] = useState<number>(5);
  const [minutesOffline, setMinutesOffline] = useState<number>(120);
  const [advanceBookingEnabled, setAdvanceBookingEnabled] = useState(true);
  const [rescheduleInvitesEnabled, setRescheduleInvitesEnabled] = useState(true);
  const [rescheduleExpiryHours, setRescheduleExpiryHours] = useState<number>(24);
  const [doctorAlertsSoundEnabled, setDoctorAlertsSoundEnabled] = useState(true);
  const [savingDoctorAlerts, setSavingDoctorAlerts] = useState(false);
  const [defaultWhatsappNumber, setDefaultWhatsappNumber] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user.role === 'ADMIN') {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.role]);

  const load = async () => {
    try {
      setLoading(true);

      const resDuration = await fetch('/api/admin/settings/consultation-duration');
      if (resDuration.ok) {
        const dataDuration = await resDuration.json();
        if (typeof dataDuration?.minutes === 'number') setMinutes(dataDuration.minutes);
      }

      const resAdvance = await fetch('/api/admin/settings/advance-booking');
      if (resAdvance.ok) {
        const dataAdvance = await resAdvance.json();
        if (typeof dataAdvance?.enabled === 'boolean') setAdvanceBookingEnabled(dataAdvance.enabled);
        if (typeof dataAdvance?.minutesOnline === 'number') setMinutesOnline(dataAdvance.minutesOnline);
        if (typeof dataAdvance?.minutesOffline === 'number') setMinutesOffline(dataAdvance.minutesOffline);
      }

      const resReschedule = await fetch('/api/admin/settings/reschedule-invites');
      if (resReschedule.ok) {
        const dataReschedule = await resReschedule.json();
        if (typeof dataReschedule?.enabled === 'boolean') setRescheduleInvitesEnabled(dataReschedule.enabled);
        if (typeof dataReschedule?.expiryHours === 'number') setRescheduleExpiryHours(dataReschedule.expiryHours);
      }

      const resWhatsapp = await fetch('/api/admin/settings/capture-funnel');
      if (resWhatsapp.ok) {
        const dataWhatsapp = await resWhatsapp.json();
        if (typeof dataWhatsapp?.whatsappNumber === 'string') setDefaultWhatsappNumber(dataWhatsapp.whatsappNumber);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/settings/consultation-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Configuração salva com sucesso!');
        if (typeof data?.minutes === 'number') setMinutes(data.minutes);
      } else {
        toast.error(data?.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const saveAdvanceBooking = async () => {
    try {
      setSavingAdvance(true);
      const res = await fetch('/api/admin/settings/advance-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: advanceBookingEnabled,
          minutesOnline,
          minutesOffline,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Antecedência mínima salva com sucesso!');
        if (typeof data?.enabled === 'boolean') setAdvanceBookingEnabled(data.enabled);
        if (typeof data?.minutesOnline === 'number') setMinutesOnline(data.minutesOnline);
        if (typeof data?.minutesOffline === 'number') setMinutesOffline(data.minutesOffline);
      } else {
        toast.error(data?.error || 'Erro ao salvar antecedência');
      }
    } catch (error) {
      console.error('Erro ao salvar antecedência:', error);
      toast.error('Erro ao salvar antecedência');
    } finally {
      setSavingAdvance(false);
    }
  };

  const saveDoctorAlertsSound = async () => {
    try {
      setSavingDoctorAlerts(true);
      const res = await fetch('/api/admin/settings/doctor-alerts-sound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: doctorAlertsSoundEnabled }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Alertas sonoros para médicos atualizados.');
        if (typeof data?.enabled === 'boolean') setDoctorAlertsSoundEnabled(data.enabled);
      } else {
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar alertas sonoros:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSavingDoctorAlerts(false);
    }
  };

  const saveDefaultWhatsapp = async () => {
    const digits = defaultWhatsappNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Informe um número com pelo menos 10 dígitos (ex.: 5521999999999)');
      return;
    }
    try {
      setSavingWhatsapp(true);
      const res = await fetch('/api/admin/settings/capture-funnel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: defaultWhatsappNumber.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Número padrão WhatsApp salvo. Ele será usado com prioridade em links e botões de agendar.');
        if (typeof data?.whatsappNumber === 'string') setDefaultWhatsappNumber(data.whatsappNumber);
      } else {
        toast.error(data?.error || 'Erro ao salvar número');
      }
    } catch (error) {
      console.error('Erro ao salvar número WhatsApp:', error);
      toast.error('Erro ao salvar número');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const saveRescheduleInvites = async () => {
    try {
      setSavingReschedule(true);
      const res = await fetch('/api/admin/settings/reschedule-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: rescheduleInvitesEnabled,
          expiryHours: rescheduleExpiryHours,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Adiantamento de consultas salvo com sucesso!');
        if (typeof data?.enabled === 'boolean') setRescheduleInvitesEnabled(data.enabled);
        if (typeof data?.expiryHours === 'number') setRescheduleExpiryHours(data.expiryHours);
      } else {
        toast.error(data?.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar adiantamento:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSavingReschedule(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Breadcrumbs
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Configurações' },
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900 font-display mt-4">Configurações</h1>
          <p className="text-gray-600 mt-2">Ajustes globais do sistema</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-primary" size={22} />
            <h2 className="text-xl font-bold text-gray-900">Consultas</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Defina a duração padrão (em minutos) usada no agendamento e como sugestão ao criar disponibilidades.
            Apenas administradores podem alterar.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Input
              label="Duração padrão da consulta (minutos)"
              type="number"
              min="10"
              max="120"
              step="5"
              value={String(minutes)}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 20)}
            />

            <div className="flex sm:justify-end">
              <Button onClick={save} loading={saving} className="w-full sm:w-auto">
                <Save size={20} />
                Salvar
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-lg shadow-md p-6 mt-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="text-green-600" size={22} />
            <h2 className="text-xl font-bold text-gray-900">Número padrão de contato (WhatsApp)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Este número tem <strong>prioridade</strong> em todo o sistema: botões &quot;Agendar&quot;, links wa.me e funil de captação.
            Se não for preenchido, será usado o número da integração WhatsApp (Twilio). Formato: com DDI, ex.: 5521999999999.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Input
              label="Número padrão WhatsApp"
              type="tel"
              value={defaultWhatsappNumber}
              onChange={(e) => setDefaultWhatsappNumber(e.target.value)}
              placeholder="Ex: 5521999999999"
              helperText="Usado nos botões Agendar e em todos os links de contato via WhatsApp."
            />
            <div className="flex sm:justify-end">
              <Button onClick={saveDefaultWhatsapp} loading={savingWhatsapp} className="w-full sm:w-auto">
                <Save size={20} />
                Salvar número
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Para configurar o funil (Site vs WhatsApp por dispositivo) e mensagens de boas-vindas, use{' '}
            <Link href="/admin/fluxos-whatsapp" className="text-primary hover:underline">Fluxos WhatsApp</Link>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 mt-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-primary" size={22} />
            <h2 className="text-xl font-bold text-gray-900">Antecedência Mínima para Agendamentos</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Exige um tempo mínimo de antecedência para agendamentos no dia atual (médico online pode ter menos, offline mais).
            Quando desativada, não há restrição de antecedência.
          </p>

          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              role="switch"
              aria-checked={advanceBookingEnabled}
              onClick={() => setAdvanceBookingEnabled((v) => !v)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                advanceBookingEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                  advanceBookingEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {advanceBookingEnabled ? 'Ferramenta ativada' : 'Ferramenta desativada'}
            </span>
          </div>

          {advanceBookingEnabled && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Médico Online (minutos)"
                  type="number"
                  min="0"
                  max="1440"
                  step="1"
                  value={String(minutesOnline)}
                  onChange={(e) => setMinutesOnline(parseInt(e.target.value) || 5)}
                  helperText="Tempo mínimo quando médico está online (padrão: 5 min)"
                />
                <Input
                  label="Médico Offline (minutos)"
                  type="number"
                  min="0"
                  max="10080"
                  step="5"
                  value={String(minutesOffline)}
                  onChange={(e) => setMinutesOffline(parseInt(e.target.value) || 120)}
                  helperText="Tempo mínimo quando médico está offline (padrão: 120 min = 2h)"
                />
              </div>
            </div>
          )}

          <div className="flex sm:justify-end mt-4">
            <Button onClick={saveAdvanceBooking} loading={savingAdvance} className="w-full sm:w-auto">
              <Save size={20} />
              Salvar Antecedência
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-lg shadow-md p-6 mt-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpCircle className="text-green-600" size={22} />
            <h2 className="text-xl font-bold text-gray-900">Adiantamento de Consultas (Convites)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Permite ao médico sugerir ao paciente adiantar a consulta quando há horário disponível mais cedo.
            Quando desativada, o botão &quot;Sugerir Adiantamento&quot; não aparece no dashboard do médico.
          </p>

          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              role="switch"
              aria-checked={rescheduleInvitesEnabled}
              onClick={() => setRescheduleInvitesEnabled((v) => !v)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                rescheduleInvitesEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                  rescheduleInvitesEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {rescheduleInvitesEnabled ? 'Ferramenta ativada' : 'Ferramenta desativada'}
            </span>
          </div>

          {rescheduleInvitesEnabled && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <Input
                label="Validade do convite (horas)"
                type="number"
                min="1"
                max="168"
                step="1"
                value={String(rescheduleExpiryHours)}
                onChange={(e) => setRescheduleExpiryHours(parseInt(e.target.value) || 24)}
                helperText="Tempo que o paciente tem para aceitar ou recusar (1 a 168h, padrão: 24h)"
              />
            </div>
          )}

          <div className="flex sm:justify-end mt-4">
            <Button onClick={saveRescheduleInvites} loading={savingReschedule} className="w-full sm:w-auto">
              <Save size={20} />
              Salvar Adiantamento
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6 mt-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Bell className="text-green-600" size={22} />
            <h2 className="text-xl font-bold text-gray-900">Alertas sonoros para médicos</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Quando ativado, os médicos recebem aviso sonoro quando uma nova consulta é agendada e um alerta quando a consulta está próxima do início (5 min e 1 min). Cada médico pode mutar os alertas no próprio dashboard.
          </p>

          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              role="switch"
              aria-checked={doctorAlertsSoundEnabled}
              onClick={() => setDoctorAlertsSoundEnabled((v) => !v)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                doctorAlertsSoundEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                  doctorAlertsSoundEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {doctorAlertsSoundEnabled ? 'Alertas ativados' : 'Alertas desativados'}
            </span>
          </div>

          <div className="flex sm:justify-end">
            <Button onClick={saveDoctorAlertsSound} loading={savingDoctorAlerts} className="w-full sm:w-auto">
              <Save size={20} />
              Salvar
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

