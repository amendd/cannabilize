'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, User, Mail, Phone, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import HoneypotField from '@/components/security/HoneypotField';
import { useRecaptcha } from '@/components/security/RecaptchaProvider';

const appointmentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
  pathologies: z.array(z.string()).min(1, 'Selecione pelo menos uma patologia'),
  scheduledDate: z.string().min(1, 'Data obrigatória').refine((date) => {
    // Criar data a partir da string no formato YYYY-MM-DD usando timezone local
    const [year, month, day] = date.split('-').map(Number);
    const selectedDay = new Date(year, month - 1, day);
    
    // Criar data de hoje no timezone local (sem horas/minutos/segundos)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Comparar apenas as datas (sem considerar horário)
    const selectedDayOnly = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Permitir agendar para hoje ou datas futuras
    return selectedDayOnly.getTime() >= todayOnly.getTime();
  }, 'Não é possível agendar para datas passadas'),
  scheduledTime: z.string().min(1, 'Horário obrigatório'),
  anamnesis: z.object({
    previousTreatments: z.string().optional(),
    currentMedications: z.string().optional(),
    allergies: z.string().optional(),
    additionalInfo: z.string().optional(),
  }),
}).refine((data) => {
  // Validação da relação entre data e horário
  if (!data.scheduledDate || !data.scheduledTime) return true;
  
  // Criar data a partir da string no formato YYYY-MM-DD usando timezone local
  const [year, month, day] = data.scheduledDate.split('-').map(Number);
  const selectedDay = new Date(year, month - 1, day);
  
  // Criar data de hoje no timezone local (sem horas/minutos/segundos)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Comparar apenas as datas (sem considerar horário)
  const selectedDayOnly = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Se for hoje, verificar se o horário é no futuro (com margem de 5 minutos)
  if (selectedDayOnly.getTime() === todayOnly.getTime()) {
    const [hours, minutes] = data.scheduledTime.split(':').map(Number);
    const consultationDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (consultationDateTime < fiveMinutesFromNow) {
      return false;
    }
  }
  
  return true;
}, {
  message: 'O horário selecionado já passou. Por favor, selecione um horário futuro.',
  path: ['scheduledTime'], // Define que o erro deve aparecer no campo scheduledTime
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  initialPathologies?: string[];
}

export default function AppointmentForm({ initialPathologies = [] }: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Array<{time: string, doctorName: string}>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string>('');
  const formStartTimeRef = useRef<number>(Date.now());
  const { executeRecaptcha } = useRecaptcha(recaptchaSiteKey);

  // Buscar site key do servidor
  useEffect(() => {
    // Endpoint público (não exige login) para páginas como /agendamento
    fetch('/api/security/recaptcha')
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.siteKey) {
          setRecaptchaSiteKey(data.siteKey);
        } else {
          // Fallback para variável de ambiente
          setRecaptchaSiteKey(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '');
        }
      })
      .catch(() => {
        // Fallback para variável de ambiente em caso de erro
        setRecaptchaSiteKey(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '');
      });
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
    setValue,
    trigger,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    mode: 'onChange', // Validação em tempo real
    defaultValues: {
      pathologies: initialPathologies,
      anamnesis: {},
    },
  });

  // Registrar tempo de início quando componente monta
  useEffect(() => {
    formStartTimeRef.current = Date.now();
  }, []);

  const selectedPathologies = watch('pathologies') || [];
  const selectedDate = watch('scheduledDate');

  // Buscar horários disponíveis quando a data mudar
  const fetchAvailableSlots = async (date: string) => {
    if (!date) {
      setAvailableSlots([]);
      setValue('scheduledTime', '');
      return;
    }

    setLoadingSlots(true);
    try {
      const response = await fetch(`/api/availability/slots?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        // Verificar se data.slots existe e é um array
        if (data.slots && Array.isArray(data.slots) && data.slots.length > 0) {
          // Agrupar por horário e mostrar médicos disponíveis
          const slotsByTime = new Map<string, string[]>();
          data.slots.forEach((slot: any) => {
            if (slot && slot.time) {
              if (!slotsByTime.has(slot.time)) {
                slotsByTime.set(slot.time, []);
              }
              if (slot.doctorName) {
                slotsByTime.get(slot.time)!.push(slot.doctorName);
              }
            }
          });

          const slots = Array.from(slotsByTime.entries()).map(([time, doctors]) => ({
            time,
            doctorName: doctors.join(', '),
          }));

          setAvailableSlots(slots);
        } else {
          // Nenhum slot disponível
          setAvailableSlots([]);
          console.log('Nenhum horário disponível para a data:', date);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro ao buscar horários:', errorData);
        setAvailableSlots([]);
        // Mostrar mensagem de erro apenas se não for um erro de validação esperado
        if (response.status !== 400) {
          toast.error('Erro ao buscar horários disponíveis. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      setAvailableSlots([]);
      toast.error('Erro ao conectar com o servidor. Verifique sua conexão.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Observar mudanças na data
  const handleDateChange = async (date: string) => {
    try {
      setValue('scheduledDate', date);
      setValue('scheduledTime', ''); // Limpar horário selecionado
      await trigger('scheduledDate');
      await fetchAvailableSlots(date);
    } catch (error) {
      console.error('Erro ao alterar data:', error);
    }
  };

  const togglePathology = (pathology: string) => {
    const current = selectedPathologies;
    const updated = current.includes(pathology)
      ? current.filter(p => p !== pathology)
      : [...current, pathology];
    setValue('pathologies', updated);
  };

  const PATHOLOGIES = [
    'Alcoolismo', 'Ansiedade', 'Perda de peso', 'Obesidade', 'Depressão',
    'Dores', 'Epilepsia', 'Insônia', 'Tabagismo', 'Autismo', 'Enxaqueca',
    'Fibromialgia', 'Parkinson', 'TDAH', 'Alzheimer', 'Anorexia', 'Crohn',
    'Intestino irritável',
  ];

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      // Executar reCAPTCHA
      let recaptchaToken: string | null = null;
      if (recaptchaSiteKey) {
        recaptchaToken = await executeRecaptcha('submit_appointment');
        if (!recaptchaToken) {
          toast.error('Erro ao validar segurança. Por favor, recarregue a página e tente novamente.');
          setIsSubmitting(false);
          return;
        }
      }

      // Preparar dados com campos de segurança
      const submissionData = {
        ...data,
        recaptchaToken,
        formStartTime: formStartTimeRef.current,
      };

      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const errorMessage = responseData.error || 'Erro ao agendar consulta';
        const errorDetails = responseData.details;
        
        console.error('Erro na resposta:', {
          status: response.status,
          error: errorMessage,
          details: errorDetails,
          fullResponse: responseData
        });
        
        // Mostrar mensagem de erro mais detalhada
        // (inclui erros de segurança como reCAPTCHA ausente/bloqueio)
        if (response.status === 400) {
          // Erro de validação
          if (Array.isArray(errorDetails)) {
            const validationErrors = errorDetails.map((e: any) => 
              `${e.path?.join('.') || 'campo'}: ${e.message}`
            ).join(', ');
            toast.error(`Dados inválidos: ${validationErrors}`);
          } else if (errorDetails) {
            toast.error(`${errorMessage}: ${errorDetails}`);
          } else {
            toast.error(errorMessage);
          }
        } else if (response.status === 403) {
          if (Array.isArray(errorDetails) && errorDetails.length > 0) {
            toast.error(`${errorMessage}: ${errorDetails.join(' | ')}`);
          } else if (errorDetails) {
            toast.error(`${errorMessage}: ${String(errorDetails)}`);
          } else {
            toast.error(errorMessage);
          }
        } else {
          // Outros erros
          // Em desenvolvimento, mostrar details (se vier do servidor) pra facilitar debug.
          if (process.env.NODE_ENV === 'development' && errorDetails) {
            const detailsText =
              typeof errorDetails === 'string'
                ? errorDetails
                : JSON.stringify(errorDetails);
            toast.error(`${errorMessage}: ${detailsText}`);
          } else {
            toast.error(errorMessage || 'Erro ao agendar consulta. Tente novamente.');
          }
        }
        return;
      }

      const result = responseData;
      console.log('Consulta criada com sucesso:', result);
      
      // Redirecionar para página de pagamento (sem mensagem de sucesso ainda)
      // A mensagem de sucesso só aparecerá após o pagamento ser confirmado
      window.location.href = `/consultas/${result.id}/pagamento`;
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao agendar consulta: ${errorMessage}. Verifique sua conexão e tente novamente.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-8">
      {/* Campo Honeypot (invisível) */}
      <HoneypotField />
      
      {/* Dados Pessoais */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User size={24} className="text-primary" />
          Dados Pessoais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              {...register('name', {
                onChange: () => trigger('name'),
              })}
              label="Nome Completo *"
              type="text"
              error={errors.name?.message}
              validateOnChange
              showValidationIcon
              isValid={!errors.name && touchedFields.name}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Input
              {...register('email', {
                onChange: () => trigger('email'),
              })}
              label="Email *"
              type="email"
              error={errors.email?.message}
              validateOnChange
              showValidationIcon
              isValid={!errors.email && touchedFields.email}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Input
              {...register('phone', {
                onChange: () => trigger('phone'),
              })}
              label="Telefone *"
              type="tel"
              placeholder="(00) 00000-0000"
              error={errors.phone?.message}
              validateOnChange
              showValidationIcon
              isValid={!errors.phone && touchedFields.phone}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Input
              {...register('cpf', {
                onChange: () => trigger('cpf'),
              })}
              label="CPF *"
              type="text"
              placeholder="000.000.000-00"
              error={errors.cpf?.message}
              validateOnChange
              showValidationIcon
              isValid={!errors.cpf && touchedFields.cpf}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Input
              {...register('birthDate', {
                onChange: () => trigger('birthDate'),
              })}
              label="Data de Nascimento *"
              type="date"
              error={errors.birthDate?.message}
              validateOnChange
              showValidationIcon
              isValid={!errors.birthDate && touchedFields.birthDate}
            />
          </motion.div>
        </div>
      </section>

      {/* Patologias */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText size={24} className="text-primary" />
          Patologias
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PATHOLOGIES.map((pathology, index) => (
            <motion.button
              key={pathology}
              type="button"
              onClick={() => togglePathology(pathology)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + index * 0.02 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${selectedPathologies.includes(pathology)
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-md'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }
              `}
            >
              {pathology}
            </motion.button>
          ))}
        </div>
        {errors.pathologies && (
          <p className="text-red-500 text-sm mt-2">{errors.pathologies.message}</p>
        )}
      </section>

      {/* Agendamento */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar size={24} className="text-primary" />
          Data e Horário
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                {...register('scheduledDate')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  errors.scheduledDate
                    ? 'border-red-500 focus:ring-red-500'
                    : touchedFields.scheduledDate && !errors.scheduledDate
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-300'
                }`}
              />
              {errors.scheduledDate && (
                <p className="text-red-500 text-sm mt-1">{errors.scheduledDate.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Você pode agendar para hoje, desde que o horário seja no futuro e esteja disponível
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário Disponível *
              </label>
              {loadingSlots ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span className="ml-2 text-gray-600">Buscando horários disponíveis...</span>
                </div>
              ) : availableSlots.length === 0 && selectedDate ? (
                <div className="w-full px-4 py-2 border border-yellow-300 rounded-lg bg-yellow-50">
                  <p className="text-yellow-800 font-medium mb-1">
                    Nenhum horário disponível para esta data
                  </p>
                  <p className="text-yellow-700 text-sm">
                    Por favor, selecione outra data ou tente novamente mais tarde.
                  </p>
                  <p className="text-yellow-600 text-xs mt-2">
                    💡 Dica: Tente selecionar uma data futura ou outro dia da semana.
                  </p>
                </div>
              ) : (
                <select
                  {...register('scheduledTime', {
                    onChange: async (e) => {
                      try {
                        await trigger('scheduledTime');
                        await trigger('scheduledDate');
                      } catch (error) {
                        console.error('Erro na validação:', error);
                      }
                    },
                  })}
                  disabled={!selectedDate || availableSlots.length === 0}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                    errors.scheduledTime
                      ? 'border-red-500 focus:ring-red-500'
                      : touchedFields.scheduledTime && !errors.scheduledTime
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300'
                  } ${!selectedDate ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {!selectedDate ? 'Selecione primeiro uma data' : 'Selecione um horário'}
                  </option>
                  {availableSlots.map(slot => (
                    <option key={slot.time} value={slot.time}>
                      {slot.time} {slot.doctorName && `(${slot.doctorName})`}
                    </option>
                  ))}
                </select>
              )}
              {errors.scheduledTime && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>{errors.scheduledTime.message}</span>
                </p>
              )}
              {selectedDate && availableSlots.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {availableSlots.length} horário(s) disponível(is) para esta data
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Anamnese */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText size={24} className="text-primary" />
          Anamnese (Pré-consulta)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tratamentos Anteriores
            </label>
            <textarea
              {...register('anamnesis.previousTreatments')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Descreva tratamentos anteriores relacionados à sua condição..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicamentos Atuais
            </label>
            <textarea
              {...register('anamnesis.currentMedications')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Liste os medicamentos que você está tomando atualmente..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alergias
            </label>
            <textarea
              {...register('anamnesis.allergies')}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Informe se você tem alguma alergia..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Informações Adicionais
            </label>
            <textarea
              {...register('anamnesis.additionalInfo')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Qualquer informação adicional que considere relevante..."
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end"
      >
        <Button
          type="submit"
          loading={isSubmitting}
          size="lg"
          className="px-8 py-4"
        >
          Confirmar Agendamento
        </Button>
      </motion.div>
    </form>
  );
}
