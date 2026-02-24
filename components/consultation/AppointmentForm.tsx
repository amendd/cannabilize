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
import { generateHoneypotFieldName } from '@/lib/security/honeypot';
import { useRecaptcha } from '@/components/security/RecaptchaProvider';

/** Normaliza CPF (só dígitos) e valida: 11 dígitos + dígitos verificadores */
function normalizeAndValidateCPF(value: string): { ok: true; cpf: string } | { ok: false; message: string } {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length !== 11) {
    return { ok: false, message: digits.length < 11 ? 'CPF deve ter 11 dígitos (com ou sem pontuação).' : 'CPF deve ter exatamente 11 dígitos.' };
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    return { ok: false, message: 'CPF inválido (números repetidos).' };
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9], 10)) {
    return { ok: false, message: 'CPF inválido (verifique os números).' };
  }
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[10], 10)) {
    return { ok: false, message: 'CPF inválido (verifique os números).' };
  }
  return { ok: true, cpf: digits };
}

const appointmentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().min(1, 'CPF é obrigatório').refine(
    (v) => normalizeAndValidateCPF(v).ok,
    (v) => { const r = normalizeAndValidateCPF(v); return { message: r.ok ? '' : r.message }; }
  ),
  birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
  pathologies: z.array(z.string()).min(1, 'Selecione pelo menos uma patologia'),
  consentPrivacy: z.boolean().optional(),
  consentTerms: z.boolean().optional(),
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
  // Anamnese removida do agendamento; paciente preenche após o pagamento na área da consulta
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
  const [emptySlotsDayName, setEmptySlotsDayName] = useState<string | null>(null);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string>('');
  const formStartTimeRef = useRef<number>(Date.now());
  const formRef = useRef<HTMLFormElement>(null);
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
    getValues,
    formState: { errors, touchedFields },
    watch,
    setValue,
    trigger,
    clearErrors,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    mode: 'onChange', // Validação em tempo real
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      birthDate: '',
      pathologies: initialPathologies ?? [],
      scheduledDate: '',
      scheduledTime: '',
      consentPrivacy: false,
      consentTerms: false,
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
      setEmptySlotsDayName(null);
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
          setEmptySlotsDayName(null);
        } else {
          setAvailableSlots([]);
          setEmptySlotsDayName(data.dayName || null);
          console.log('Nenhum horário disponível para a data:', date, data.dayName ? `(${data.dayName})` : '');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro ao buscar horários:', errorData);
        setAvailableSlots([]);
        setEmptySlotsDayName(null);
        // Mostrar mensagem de erro apenas se não for um erro de validação esperado
        if (response.status !== 400) {
          toast.error('Erro ao buscar horários disponíveis. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      setAvailableSlots([]);
      setEmptySlotsDayName(null);
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
      // Ler valores do DOM (FormData) como fonte da verdade — evita payload vazio quando o estado do react-hook-form não reflete os inputs
      const form = formRef.current;
      const fromDom: Record<string, string | string[]> = {
        name: '',
        email: '',
        phone: '',
        cpf: '',
        birthDate: '',
        scheduledDate: '',
        scheduledTime: '',
      };
      const honeypotFieldName = generateHoneypotFieldName();
      if (form) {
        const fd = new FormData(form);
        fromDom.name = (fd.get('name') as string) ?? '';
        fromDom.email = (fd.get('email') as string) ?? '';
        fromDom.phone = (fd.get('phone') as string) ?? '';
        fromDom.cpf = (fd.get('cpf') as string) ?? '';
        fromDom.birthDate = (fd.get('birthDate') as string) ?? '';
        fromDom.scheduledDate = (fd.get('scheduledDate') as string) ?? '';
        fromDom.scheduledTime = (fd.get('scheduledTime') as string) ?? '';
      }
      const current = getValues();
      // Priorizar estado atual do formulário (getValues), depois DOM (FormData), depois data do callback — evita enviar undefined (JSON.stringify omite e o backend retorna "Required")
      const pathologies = Array.isArray(data.pathologies) && data.pathologies.length > 0
        ? data.pathologies
        : (Array.isArray(current.pathologies) ? current.pathologies : []);

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

      // CPF normalizado (só dígitos) para a API
      const cpfStr = (current.cpf ?? fromDom.cpf ?? data.cpf ?? '').toString();
      const cpfResult = normalizeAndValidateCPF(cpfStr);
      const cpfNormalized = cpfResult.ok ? cpfResult.cpf : cpfStr.replace(/\D/g, '').slice(0, 11);

      const honeypotValue = form ? (form.elements.namedItem(honeypotFieldName) as HTMLInputElement | null)?.value ?? '' : '';
      // Garantir que nenhum campo obrigatório seja undefined (senão JSON.stringify omite a chave e o backend retorna "Required")
      const submissionData = {
        name: String(current.name ?? fromDom.name ?? data.name ?? ''),
        email: String(current.email ?? fromDom.email ?? data.email ?? ''),
        phone: String(current.phone ?? fromDom.phone ?? data.phone ?? ''),
        cpf: cpfNormalized,
        birthDate: String(current.birthDate ?? fromDom.birthDate ?? data.birthDate ?? ''),
        pathologies: Array.isArray(pathologies) ? pathologies : [],
        scheduledDate: String(current.scheduledDate ?? fromDom.scheduledDate ?? data.scheduledDate ?? ''),
        scheduledTime: String(current.scheduledTime ?? fromDom.scheduledTime ?? data.scheduledTime ?? ''),
        consentPrivacy: true,
        consentTerms: true,
        honeypot: honeypotValue,
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
        
        // Evitar exibir mensagens técnicas ao usuário (ex.: "Cannot read properties of undefined")
        const detailsStr = typeof errorDetails === 'string' ? errorDetails : (errorDetails ? JSON.stringify(errorDetails) : '');
        const isTechnicalError = /Cannot read properties|undefined|is not a function|Unexpected token/i.test(detailsStr);
        
        if (response.status === 400) {
          if (Array.isArray(errorDetails)) {
            const validationErrors = errorDetails.map((e: any) => 
              `${e.path?.join('.') || 'campo'}: ${e.message}`
            ).join(', ');
            toast.error(`Dados inválidos: ${validationErrors}`);
          } else if (errorDetails && !isTechnicalError) {
            toast.error(`${errorMessage}: ${errorDetails}`);
          } else {
            toast.error(errorMessage);
          }
        } else if (response.status === 403) {
          if (Array.isArray(errorDetails) && errorDetails.length > 0) {
            toast.error(`${errorMessage}: ${errorDetails.join(' | ')}`);
          } else if (errorDetails && !isTechnicalError) {
            toast.error(`${errorMessage}: ${String(errorDetails)}`);
          } else {
            toast.error(errorMessage);
          }
        } else {
          // 500 ou outros: mensagem amigável, sem expor detalhes técnicos ao usuário
          const friendlyMessage = isTechnicalError
            ? 'Falha ao processar o agendamento. Tente novamente ou entre em contato se o problema persistir.'
            : (errorMessage || 'Erro ao agendar consulta. Tente novamente.');
          toast.error(friendlyMessage);
        }
        return;
      }

      const result = responseData;
      console.log('Consulta criada com sucesso:', result);
      const token = result.confirmationToken ? `?token=${encodeURIComponent(result.confirmationToken)}` : '';
      window.location.href = `/consultas/${result.id}/pagamento${token}`;
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      const rawMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      // Evitar expor mensagens técnicas (ex.: "Cannot read properties of undefined")
      const isTechnical = /Cannot read properties|undefined|is not a function|Unexpected token/i.test(rawMessage);
      const errorMessage = isTechnical
        ? 'Falha ao processar o agendamento. Tente novamente ou entre em contato se o problema persistir.'
        : rawMessage;
      toast.error(`Erro ao agendar consulta: ${errorMessage}. Verifique sua conexão e tente novamente.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-lg p-8">
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
            <p className="text-xs text-gray-500 mt-1">Digite os 11 dígitos, com ou sem pontuação.</p>
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
                p-4 rounded-lg border-2 transition-all text-left font-medium
                ${selectedPathologies.includes(pathology)
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-md'
                  : 'border-gray-300 bg-gray-50 text-gray-800 hover:border-primary/50 hover:bg-green-50/70 hover:text-gray-900'
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
                  {emptySlotsDayName ? (
                    <p className="text-yellow-700 text-sm mb-1">
                      A data escolhida é um <strong>{emptySlotsDayName}</strong>. Os horários dependem do <strong>dia da semana</strong>: para aparecerem opções, algum médico precisa ter esse dia cadastrado em <strong>Admin → Médicos → [Médico] → Disponibilidade</strong> (ex.: adicionar &quot;Sábado&quot; com início e fim do expediente).
                    </p>
                  ) : (
                    <p className="text-yellow-700 text-sm mb-1">
                      Por favor, selecione outra data ou tente novamente mais tarde.
                    </p>
                  )}
                  {selectedDate === new Date().toISOString().slice(0, 10) && (
                    <p className="text-yellow-700 text-xs mt-2">
                      Para <strong>hoje</strong>: os médicos precisam estar online e com a opção de agendamento com 30 min ativa (não é necessário ter horário configurado para o dia). Tente uma data futura ou outro dia.
                    </p>
                  )}
                  <p className="text-yellow-600 text-xs mt-2">
                    💡 Dica: Tente outro dia da semana ou peça ao admin para cadastrar disponibilidade para {emptySlotsDayName || 'esse dia'}.
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 ${
                    errors.scheduledTime
                      ? 'border-red-500 focus:ring-red-500'
                      : touchedFields.scheduledTime && !errors.scheduledTime
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300'
                  } ${!selectedDate ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                >
                  <option value="">
                    {!selectedDate ? 'Selecione primeiro uma data' : 'Selecione um horário'}
                  </option>
                  {availableSlots.map(slot => (
                    <option key={slot.time} value={slot.time}>
                      {slot.time}
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

      {/* Consentimento LGPD - ao clicar nos links a pessoa concorda */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Consentimento e Termos
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Clique nos links abaixo para ler e concordar. Ao abrir cada documento, seu consentimento é registrado.
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {watch('consentPrivacy') ? (
              <span className="text-green-600 font-medium text-sm shrink-0">✓ Concordado</span>
            ) : null}
            <label className="text-sm text-gray-700">
              Eu concordo com a{' '}
              <a
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  setValue('consentPrivacy', true, { shouldValidate: true });
                  clearErrors('consentPrivacy');
                  window.open('/privacidade', '_blank', 'noopener,noreferrer');
                }}
              >
                Política de Privacidade
              </a>
              {' '}e autorizo o tratamento dos meus dados pessoais conforme a LGPD.
            </label>
          </div>
          {errors.consentPrivacy && (
            <p className="text-sm text-red-600">{errors.consentPrivacy.message}</p>
          )}

          <div className="flex items-start gap-3">
            {watch('consentTerms') ? (
              <span className="text-green-600 font-medium text-sm shrink-0">✓ Concordado</span>
            ) : null}
            <label className="text-sm text-gray-700">
              Eu concordo com os{' '}
              <a
                href="/termos"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  setValue('consentTerms', true, { shouldValidate: true });
                  clearErrors('consentTerms');
                  window.open('/termos', '_blank', 'noopener,noreferrer');
                }}
              >
                Termos de Uso
              </a>
              {' '}dos serviços da Cannabilize.
            </label>
          </div>
          {errors.consentTerms && (
            <p className="text-sm text-red-600">{errors.consentTerms.message}</p>
          )}
        </div>
      </motion.section>

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
