'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, MessageSquare, X, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import toast from 'react-hot-toast';

interface RescheduleInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  currentScheduledAt: Date;
  onInviteSent?: () => void;
}

interface TimeSlot {
  date: string;
  time: string;
  scheduledAt: string;
  formatted: string;
}

export default function RescheduleInviteModal({
  isOpen,
  onClose,
  consultationId,
  currentScheduledAt,
  onInviteSent,
}: RescheduleInviteModalProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [useManualInput, setUseManualInput] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [validatingTime, setValidatingTime] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);
  const [hasValidatedOnce, setHasValidatedOnce] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailableSlots();
    } else {
      // Reset ao fechar
      setSlots([]);
      setSelectedSlot(null);
      setMessage('');
      setUseManualInput(false);
      setManualDate('');
      setManualTime('');
      setHasValidatedOnce(false);
      setTimeValidationError(null);
    }
  }, [isOpen, consultationId]);

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await fetch(`/api/consultations/${consultationId}/reschedule-invite`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar horários disponíveis');
      }

      const data = await response.json();
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Erro ao carregar slots:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setLoadingSlots(false);
    }
  };

  const validateManualTime = async (date: string, time: string) => {
    if (!date || !time) {
      setTimeValidationError(null);
      return false;
    }

    try {
      setValidatingTime(true);
      setTimeValidationError(null);
      setHasValidatedOnce(true);

      // Criar data/hora do novo horário (usar timezone local)
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const newDateTime = new Date(year, month - 1, day, hours, minutes);
      
      // Criar data/hora atual da consulta (usar timezone local)
      const currentYear = currentScheduledAt.getFullYear();
      const currentMonth = currentScheduledAt.getMonth();
      const currentDay = currentScheduledAt.getDate();
      const currentHours = currentScheduledAt.getHours();
      const currentMinutes = currentScheduledAt.getMinutes();
      const currentDateTime = new Date(currentYear, currentMonth, currentDay, currentHours, currentMinutes);

      // Verificar se o horário é anterior ao atual
      if (newDateTime >= currentDateTime) {
        setTimeValidationError('O novo horário deve ser anterior ao horário atual da consulta');
        setValidatingTime(false);
        return false;
      }

      // Verificar se não é no passado (com margem de 5 minutos); comparar ao início do minuto para aceitar ex.: 20:20 quando são 20:15
      const now = new Date();
      const fiveMinutesFromNowMs = now.getTime() + 5 * 60 * 1000;
      const fiveMinutesFromNow = new Date(Math.floor(fiveMinutesFromNowMs / 60000) * 60000);
      if (newDateTime < fiveMinutesFromNow) {
        setTimeValidationError('O horário deve ser pelo menos 5 minutos no futuro');
        setValidatingTime(false);
        return false;
      }

      // Validação básica passou, agora verificar disponibilidade na API
      try {
        const response = await fetch(`/api/consultations/${consultationId}/reschedule-invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newScheduledDate: date,
            newScheduledTime: time,
            validateOnly: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          setTimeValidationError(error.error || 'Este horário não está disponível');
          setValidatingTime(false);
          return false;
        }

        // Se chegou aqui, horário está disponível
        const result = await response.json();
        if (!result.valid) {
          setTimeValidationError(result.error || 'Este horário não está disponível');
          setValidatingTime(false);
          return false;
        }
      } catch (apiError) {
        // Se a API não suportar validateOnly ou der erro, apenas validar localmente
        console.log('Validação via API não disponível, usando validação local');
        // Não definir erro aqui, deixar passar se validação local passou
      }

      // Validação passou
      setTimeValidationError(null);
      return true;
    } catch (error) {
      console.error('Erro ao validar horário:', error);
      setTimeValidationError('Erro ao validar horário');
      return false;
    } finally {
      setValidatingTime(false);
    }
  };

  const handleSendInvite = async () => {
    let dateToSend: string;
    let timeToSend: string;

    if (useManualInput) {
      if (!manualDate || !manualTime) {
        toast.error('Preencha data e horário');
        return;
      }

      // Validar antes de enviar usando timezone local
      const [year, month, day] = manualDate.split('-').map(Number);
      const [hours, minutes] = manualTime.split(':').map(Number);
      const newDateTime = new Date(year, month - 1, day, hours, minutes);
      
      const currentYear = currentScheduledAt.getFullYear();
      const currentMonth = currentScheduledAt.getMonth();
      const currentDay = currentScheduledAt.getDate();
      const currentHours = currentScheduledAt.getHours();
      const currentMinutes = currentScheduledAt.getMinutes();
      const currentDateTime = new Date(currentYear, currentMonth, currentDay, currentHours, currentMinutes);

      if (newDateTime >= currentDateTime) {
        toast.error('O novo horário deve ser anterior ao horário atual');
        return;
      }

      const now = new Date();
      const fiveMinutesFromNowMs = now.getTime() + 5 * 60 * 1000;
      const fiveMinutesFromNow = new Date(Math.floor(fiveMinutesFromNowMs / 60000) * 60000);
      if (newDateTime < fiveMinutesFromNow) {
        toast.error('O horário deve ser pelo menos 5 minutos no futuro');
        return;
      }

      dateToSend = manualDate;
      timeToSend = manualTime;
    } else {
      if (!selectedSlot) {
        toast.error('Selecione um horário ou insira manualmente');
        return;
      }
      dateToSend = selectedSlot.date;
      timeToSend = selectedSlot.time;
    }

    try {
      setSending(true);
      const response = await fetch(`/api/consultations/${consultationId}/reschedule-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newScheduledDate: dateToSend,
          newScheduledTime: timeToSend,
          message: message.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar convite');
      }

      toast.success('Convite enviado com sucesso!');
      onInviteSent?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  };

  const formatCurrentDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sugerir Adiantamento de Consulta"
      size="lg"
    >
      <div className="space-y-6">
        {/* Horário Atual */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar size={18} />
            <span className="text-sm font-medium">Horário Atual</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrentDate(currentScheduledAt)}
          </p>
        </div>

        {/* Seleção de Novo Horário */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Novo horário:
            </h3>
            <button
              type="button"
              onClick={() => {
                setUseManualInput(!useManualInput);
                if (!useManualInput) {
                  setSelectedSlot(null);
                }
              }}
              className="text-sm text-primary hover:underline"
            >
              {useManualInput ? 'Ver horários sugeridos' : 'Inserir manualmente'}
            </button>
          </div>

          {useManualInput ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={manualDate}
                    onChange={async (e) => {
                      const newDate = e.target.value;
                      setManualDate(newDate);
                      if (manualTime) {
                        await validateManualTime(newDate, manualTime);
                      }
                    }}
                    min={(() => {
                      // Permitir selecionar hoje (usar data local, não UTC)
                      const today = new Date();
                      const y = today.getFullYear();
                      const m = String(today.getMonth() + 1).padStart(2, '0');
                      const d = String(today.getDate()).padStart(2, '0');
                      return `${y}-${m}-${d}`;
                    })()}
                    max={(() => {
                      // Máximo: data atual da consulta (usar data local)
                      const maxDate = new Date(currentScheduledAt);
                      const y = maxDate.getFullYear();
                      const m = String(maxDate.getMonth() + 1).padStart(2, '0');
                      const d = String(maxDate.getDate()).padStart(2, '0');
                      return `${y}-${m}-${d}`;
                    })()}
                    required
                    className="cursor-text"
                    placeholder="Selecione a data"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário
                  </label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={manualTime}
                      onChange={async (e) => {
                        const newTime = e.target.value;
                        setManualTime(newTime);
                        if (manualDate) {
                          await validateManualTime(manualDate, newTime);
                        }
                      }}
                      required
                      className="cursor-text"
                      placeholder="Selecione o horário"
                      error={timeValidationError || undefined}
                    />
                    {validatingTime && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-primary" size={16} />
                      </div>
                    )}
                  </div>
                  {timeValidationError && (
                    <p className="text-red-500 text-xs mt-1">{timeValidationError}</p>
                  )}
                </div>
              </div>
              {(() => {
                // Mostrar mensagem de sucesso apenas se validado e válido
                if (!manualDate || !manualTime || validatingTime || !hasValidatedOnce) {
                  return null;
                }

                if (timeValidationError) {
                  return null; // Não mostrar sucesso se há erro
                }

                try {
                  const [year, month, day] = manualDate.split('-').map(Number);
                  const [hours, minutes] = manualTime.split(':').map(Number);
                  const newDateTime = new Date(year, month - 1, day, hours, minutes);
                  
                  const currentYear = currentScheduledAt.getFullYear();
                  const currentMonth = currentScheduledAt.getMonth();
                  const currentDay = currentScheduledAt.getDate();
                  const currentHours = currentScheduledAt.getHours();
                  const currentMinutes = currentScheduledAt.getMinutes();
                  const currentDateTime = new Date(currentYear, currentMonth, currentDay, currentHours, currentMinutes);
                  
                  const now = new Date();
                  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
                  const isValid = newDateTime < currentDateTime && newDateTime >= fiveMinutesFromNow;
                  
                  if (isValid) {
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          ✓ Horário válido: {newDateTime.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    );
                  }
                } catch {
                  // Ignorar erros de parsing
                }
                return null;
              })()}
            </div>
          ) : (
            <>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="ml-2 text-gray-600">Carregando horários disponíveis...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Não há horários disponíveis antes do horário atual.</p>
                  <button
                    type="button"
                    onClick={() => setUseManualInput(true)}
                    className="mt-4 text-primary hover:underline text-sm"
                  >
                    Inserir horário manualmente
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {slots.map((slot, index) => (
                    <button
                      key={`${slot.date}-${slot.time}-${index}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${
                          selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <Clock
                          size={18}
                          className={
                            selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                              ? 'text-primary'
                              : 'text-gray-400'
                          }
                        />
                        <span className="font-semibold text-gray-900">{slot.formatted}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Mensagem Opcional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare size={16} className="inline mr-1" />
            Mensagem ao paciente (opcional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: Identifiquei um horário disponível mais cedo. Gostaria de adiantar sua consulta?"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length}/500 caracteres
          </p>
        </div>

        {/* Informação sobre Expiração */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>⏰ Importante:</strong> O paciente terá 5 minutos para responder ao convite.
            Se não responder, o convite expirará automaticamente.
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSendInvite}
            loading={sending}
            disabled={(!selectedSlot && !useManualInput) || (useManualInput && (!manualDate || !manualTime)) || sending}
          >
            Enviar Convite
          </Button>
        </div>
      </div>
    </Modal>
  );
}
