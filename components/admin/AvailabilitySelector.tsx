'use client';

import { useState } from 'react';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  active: boolean;
}

interface AvailabilitySelectorProps {
  value: AvailabilitySlot[];
  onChange: (availabilities: AvailabilitySlot[]) => void;
  error?: string;
}

export default function AvailabilitySelector({ value, onChange, error }: AvailabilitySelectorProps) {
  const [availabilities, setAvailabilities] = useState<AvailabilitySlot[]>(value || []);

  const addAvailability = () => {
    const newAvail: AvailabilitySlot = {
      dayOfWeek: 1, // Segunda-feira por padrão
      startTime: '08:00',
      endTime: '18:00',
      duration: 20,
      active: true,
    };
    const updated = [...availabilities, newAvail];
    setAvailabilities(updated);
    onChange(updated);
  };

  const removeAvailability = (index: number) => {
    const updated = availabilities.filter((_, i) => i !== index);
    setAvailabilities(updated);
    onChange(updated);
  };

  const updateAvailability = (index: number, field: keyof AvailabilitySlot, newValue: any) => {
    const updated = availabilities.map((avail, i) => {
      if (i === index) {
        const updatedAvail = { ...avail, [field]: newValue };
        
        // Validar horários
        if (field === 'startTime' || field === 'endTime') {
          if (updatedAvail.startTime >= updatedAvail.endTime) {
            // Se horário inválido, ajustar automaticamente
            if (field === 'startTime') {
              updatedAvail.endTime = addMinutes(updatedAvail.startTime, updatedAvail.duration);
            } else {
              updatedAvail.startTime = subtractMinutes(updatedAvail.endTime, updatedAvail.duration);
            }
          }
        }
        
        return updatedAvail;
      }
      return avail;
    });
    setAvailabilities(updated);
    onChange(updated);
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  const subtractMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins - minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Disponibilidade
        <span className="text-xs text-gray-500 ml-2">(opcional - pode ser configurada depois)</span>
      </label>

      <div className="space-y-4">
        <AnimatePresence>
          {availabilities.map((avail, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar size={16} />
                  <span>Disponibilidade {index + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAvailability(index)}
                  className="text-red-600 hover:text-red-800 transition-colors p-1"
                  aria-label="Remover disponibilidade"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dia da Semana *
                  </label>
                  <select
                    value={avail.dayOfWeek}
                    onChange={(e) => updateAvailability(index, 'dayOfWeek', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Horário Início *
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      value={avail.startTime}
                      onChange={(e) => updateAvailability(index, 'startTime', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Horário Fim *
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      value={avail.endTime}
                      onChange={(e) => updateAvailability(index, 'endTime', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Duração (min) *
                  </label>
                  <select
                    value={avail.duration}
                    onChange={(e) => updateAvailability(index, 'duration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={25}>25 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h 30min</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
              </div>

              {avail.startTime >= avail.endTime && (
                <p className="text-red-500 text-xs mt-2">
                  ⚠️ Horário de início deve ser anterior ao horário de fim
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={addAvailability}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
        >
          <Plus size={20} />
          Adicionar Horário de Disponibilidade
        </button>
      </div>

      {availabilities.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {availabilities.length} horário(s) de disponibilidade configurado(s)
        </p>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
