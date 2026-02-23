'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, CalendarClock, Clock, Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import LoadingPage from '@/components/ui/Loading';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const IMPERSONATION_KEY = 'admin_impersonated_doctor_id';

export default function MedicoDisponibilidadePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '18:00',
    duration: 20,
    active: true,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user.role !== 'DOCTOR' && session.user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }
    loadMe();
  }, [session, status, router]);

  const loadMe = async () => {
    if (!session) return;
    try {
      let url = '/api/doctors/me';
      if (session.user.role === 'ADMIN' && typeof window !== 'undefined') {
        const impersonatedId = sessionStorage.getItem(IMPERSONATION_KEY);
        if (impersonatedId) url = `/api/doctors/me?doctorId=${impersonatedId}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        if (session.user.role === 'ADMIN') {
          toast.error('Selecione um médico para ver a disponibilidade.');
          router.push('/admin/medicos');
        } else {
          toast.error('Médico não encontrado.');
        }
        return;
      }
      const data = await res.json();
      setDoctorId(data.id);
      setDoctorName(data.name || 'Médico');
      await loadAvailabilities(data.id);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailabilities = async (id: string) => {
    try {
      const availRes = await fetch(`/api/admin/doctors/${id}/availability`);
      if (availRes.ok) {
        const availData = await availRes.json();
        setAvailabilities(availData.availabilities || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Disponibilidade adicionada com sucesso');
        setShowForm(false);
        setFormData({
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '18:00',
          duration: formData.duration,
          active: true,
        });
        await loadAvailabilities(doctorId);
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erro ao adicionar disponibilidade');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao adicionar disponibilidade');
    }
  };

  const handleDelete = async (availabilityId: string) => {
    if (!doctorId) return;
    if (!confirm('Tem certeza que deseja remover esta disponibilidade?')) return;
    try {
      const response = await fetch(
        `/api/admin/doctors/${doctorId}/availability?availabilityId=${availabilityId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        toast.success('Disponibilidade removida');
        await loadAvailabilities(doctorId);
      } else {
        const err = await response.json();
        toast.error(err.error || 'Erro ao remover');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover disponibilidade');
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingPage />;
  }

  if (!doctorId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/medico"
            className="text-gray-600 hover:text-primary font-medium mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 flex items-center gap-2">
            <CalendarClock size={32} className="text-primary" />
            Meus horários de atendimento
          </h1>
          <p className="text-gray-600 mt-2">
            Configure os dias e horários em que você está disponível para consultas
          </p>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Adicionar horário</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia da Semana *
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (minutos) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    step={5}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário Início *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário Fim *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit">Adicionar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </motion.div>
        )}

          {!showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Button type="button" onClick={() => setShowForm(true)} variant="primary">
              <Plus size={20} />
              Adicionar horário
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock size={22} className="text-primary" />
              Horários configurados
            </h2>
          </div>
          {availabilities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-primary/40 mb-4" />
              <p>Nenhum horário configurado</p>
              <p className="text-sm mt-2">Clique em &quot;Adicionar horário&quot; para definir quando você atende</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {availabilities.map((avail) => (
                    <tr key={avail.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {DAYS_OF_WEEK.find((d) => d.value === avail.dayOfWeek)?.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          {avail.startTime} - {avail.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{avail.duration} minutos</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            avail.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {avail.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(avail.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          aria-label="Remover"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
