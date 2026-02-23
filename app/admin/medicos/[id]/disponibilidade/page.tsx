'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Skeleton';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export default function DoctorAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<any>(null);
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
  const isAdmin = session?.user.role === 'ADMIN';

  useEffect(() => {
    if (session?.user.role === 'ADMIN' || session?.user.role === 'DOCTOR') {
      loadData();
    }
  }, [session, doctorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar médico
      const doctorRes = await fetch(`/api/admin/doctors/${doctorId}`);
      if (doctorRes.ok) {
        const doctorData = await doctorRes.json();
        setDoctor(doctorData);
      }

      // Carregar disponibilidades
      const availRes = await fetch(`/api/admin/doctors/${doctorId}/availability`);
      if (availRes.ok) {
        const availData = await availRes.json();
        setAvailabilities(availData.availabilities || []);
      }

      // Carregar duração padrão (somente admin precisa disso para criar)
      if (session?.user.role === 'ADMIN') {
        const settingsRes = await fetch('/api/admin/settings/consultation-duration');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          const minutes = typeof settings?.minutes === 'number' ? settings.minutes : 20;
          setFormData((prev) => ({ ...prev, duration: minutes }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar disponibilidade');
      }
    } catch (error) {
      console.error('Erro ao adicionar disponibilidade:', error);
      toast.error('Erro ao adicionar disponibilidade');
    }
  };

  const handleDelete = async (availabilityId: string) => {
    if (!confirm('Tem certeza que deseja remover esta disponibilidade?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/doctors/${doctorId}/availability?availabilityId=${availabilityId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Disponibilidade removida');
        loadData();
      } else {
        toast.error('Erro ao remover disponibilidade');
      }
    } catch (error) {
      console.error('Erro ao remover disponibilidade:', error);
      toast.error('Erro ao remover disponibilidade');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <SkeletonTable />
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
          <Link
            href="/admin/medicos"
            className="text-gray-600 hover:text-gray-900 font-medium mb-4 inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Voltar para Médicos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Disponibilidade - {doctor?.name}
          </h1>
          <p className="text-gray-600 mt-2">Configure os horários disponíveis para agendamento</p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>Como funciona:</strong> a disponibilidade é por <strong>dia da semana</strong> (ex.: Segunda, Sábado). Para uma data aparecer com horários na página de agendamento, o médico precisa ter esse dia cadastrado aqui (ex.: para pacientes agendarem em um sábado, adicione uma faixa com dia &quot;Sábado&quot;).
          </div>
        </motion.div>

        {/* Formulário de adicionar */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Adicionar Disponibilidade</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia da Semana *
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  >
                    {DAYS_OF_WEEK.map(day => (
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
                    min="10"
                    max="120"
                    step="5"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Padrão sugerido: 20 minutos. Apenas o Admin deve alterar este valor.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário Início *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit">Adicionar</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Botão para mostrar formulário */}
        {!showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            {isAdmin && (
              <Button onClick={() => setShowForm(true)}>
                <Plus size={20} />
                Adicionar Disponibilidade
              </Button>
            )}
          </motion.div>
        )}

        {/* Lista de disponibilidades */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Horários Configurados</h2>
          </div>
          
          {availabilities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Nenhuma disponibilidade configurada</p>
              <p className="text-sm mt-2">Clique em "Adicionar Disponibilidade" para começar</p>
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
                  {availabilities.map((avail, index) => (
                    <motion.tr
                      key={avail.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {DAYS_OF_WEEK.find(d => d.value === avail.dayOfWeek)?.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          {avail.startTime} - {avail.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {avail.duration} minutos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          avail.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {avail.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(avail.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
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
