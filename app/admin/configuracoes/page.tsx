'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock, Save } from 'lucide-react';
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
  const [minutes, setMinutes] = useState<number>(20);
  const [minutesOnline, setMinutesOnline] = useState<number>(5);
  const [minutesOffline, setMinutesOffline] = useState<number>(120);

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
      
      // Carregar duração da consulta
      const resDuration = await fetch('/api/admin/settings/consultation-duration');
      if (resDuration.ok) {
        const dataDuration = await resDuration.json();
        if (typeof dataDuration?.minutes === 'number') setMinutes(dataDuration.minutes);
      }
      
      // Carregar antecedência mínima
      const resAdvance = await fetch('/api/admin/settings/advance-booking');
      if (resAdvance.ok) {
        const dataAdvance = await resAdvance.json();
        if (typeof dataAdvance?.minutesOnline === 'number') setMinutesOnline(dataAdvance.minutesOnline);
        if (typeof dataAdvance?.minutesOffline === 'number') setMinutesOffline(dataAdvance.minutesOffline);
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
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 mt-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-primary" size={22} />
            <h2 className="text-xl font-bold text-gray-900">Antecedência Mínima para Agendamentos</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Defina o tempo mínimo de antecedência necessário para agendamentos no dia atual.
            Quando o médico está online, pode ser menor. Quando offline, deve ser maior.
            Apenas administradores podem alterar.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Médico Online (minutos)"
                type="number"
                min="0"
                max="1440"
                step="1"
                value={String(minutesOnline)}
                onChange={(e) => setMinutesOnline(parseInt(e.target.value) || 5)}
                helperText="Tempo mínimo quando médico está online (padrão: 5 minutos)"
              />
              <Input
                label="Médico Offline (minutos)"
                type="number"
                min="0"
                max="10080"
                step="5"
                value={String(minutesOffline)}
                onChange={(e) => setMinutesOffline(parseInt(e.target.value) || 120)}
                helperText="Tempo mínimo quando médico está offline (padrão: 120 minutos = 2 horas)"
              />
            </div>

            <div className="flex sm:justify-end">
              <Button onClick={saveAdvanceBooking} loading={savingAdvance} className="w-full sm:w-auto">
                <Save size={20} />
                Salvar Antecedência
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

