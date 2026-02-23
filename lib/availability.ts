/**
 * Sistema de gerenciamento de disponibilidade de médicos
 * e distribuição inteligente de agendamentos
 */

import { prisma } from '@/lib/prisma';
import { 
  getDefaultConsultationDurationMinutes,
  getMinAdvanceBookingMinutesOnline,
  getMinAdvanceBookingMinutesOffline,
} from '@/lib/consultation-config';

/**
 * Verifica se um médico está online (última atividade nos últimos 5 minutos)
 */
export async function isDoctorOnline(doctorId: string): Promise<boolean> {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { lastActiveAt: true, active: true },
    });

    if (!doctor || !doctor.active) {
      return false;
    }

    if (!doctor.lastActiveAt) {
      return false;
    }

    // Considerar online se última atividade foi nos últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(doctor.lastActiveAt) >= fiveMinutesAgo;
  } catch (error) {
    console.error('Erro ao verificar se médico está online:', error);
    return false;
  }
}

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  available: boolean;
  doctorId?: string;
  doctorName?: string;
}

export interface AvailabilitySlot {
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  available: boolean;
}

/** Minutos antes/depois de uma consulta agendada que não podem ser usados para novo agendamento */
const CONSULTATION_BUFFER_MINUTES = 10;

/**
 * Retorna os horários bloqueados: o horário da consulta e ± CONSULTATION_BUFFER_MINUTES.
 * Formato retorno: array de "HH:MM" (sem segundos).
 */
function getBlockedTimesAroundConsultation(scheduledTime: string): string[] {
  const trimmed = scheduledTime.trim();
  const match = trimmed.match(/^(\d{2}):(\d{2})/);
  if (!match) return [trimmed.substring(0, 5)];
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const totalMins = hours * 60 + minutes;
  const format = (m: number): string | null => {
    if (m < 0 || m >= 24 * 60) return null;
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };
  const result: string[] = [];
  [totalMins - CONSULTATION_BUFFER_MINUTES, totalMins, totalMins + CONSULTATION_BUFFER_MINUTES].forEach((m) => {
    const t = format(m);
    if (t && !result.includes(t)) result.push(t);
  });
  return result;
}

/**
 * Gera slots de horário disponíveis para uma data
 */
function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += duration) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  
  return slots;
}

/**
 * Obtém o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado) no fuso do Brasil.
 * Usa America/Sao_Paulo para que a data YYYY-MM-DD seja interpretada no calendário do paciente/clínica,
 * evitando que servidor em UTC devolva o dia errado (ex.: 12/02 à meia-noite UTC = 11/02 à noite no Brasil).
 */
function getDayOfWeek(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  // Meio-dia UTC no dia dado: em qualquer fuso o “dia do calendário” é o mesmo
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: DEFAULT_AVAILABILITY_TIMEZONE,
    weekday: 'short',
  });
  const weekday = formatter.format(date);
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[weekday] ?? date.getDay();
}

/** Timezone padrão para "hoje" (evita servidor em UTC deixar paciente no Brasil sem slots) */
export const DEFAULT_AVAILABILITY_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna hora e minuto de uma data no timezone informado (para gerar slots no horário local correto).
 */
function getHoursMinutesInTimezone(date: Date, timeZone: string = DEFAULT_AVAILABILITY_TIMEZONE): { hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((p) => p.type === 'hour');
  const minutePart = parts.find((p) => p.type === 'minute');
  const hours = parseInt((hourPart && 'value' in hourPart ? hourPart.value : undefined) ?? '0', 10);
  const minutes = parseInt((minutePart && 'value' in minutePart ? minutePart.value : undefined) ?? '0', 10);
  return { hours, minutes };
}

/**
 * Retorna a data "hoje" no formato YYYY-MM-DD no timezone informado.
 * Usado para que a data escolhida pelo paciente ("hoje" no Brasil) seja tratada como hoje
 * mesmo quando o servidor está em UTC e já mudou o dia.
 */
export function getTodayStringInTimezone(timeZone: string = DEFAULT_AVAILABILITY_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const getPart = (type: string) => {
    const part = parts.find((p) => p.type === type);
    return part && 'value' in part ? part.value : '';
  };
  const y = getPart('year');
  const m = getPart('month');
  const d = getPart('day');
  return `${y}-${m}-${d}`;
}

/** Verifica se a data (YYYY-MM-DD) é "hoje" considerando servidor e timezone Brasil */
export function isDateTodayForAvailability(dateStr: string): boolean {
  const now = new Date();
  const todayServer = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayBR = getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE);
  return dateStr === todayServer || dateStr === todayBR;
}

/**
 * Busca horários disponíveis para uma data específica
 */
export async function getAvailableSlots(
  date: string,
  options?: {
    doctorId?: string;
    duration?: number;
  }
): Promise<AvailabilitySlot[]> {
  // Validar formato da data
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Formato de data inválido:', date);
    return [];
  }

  const dayOfWeek = getDayOfWeek(date);
  const duration =
    typeof options?.duration === 'number'
      ? options.duration
      : await getDefaultConsultationDurationMinutes();

  // "Hoje" no servidor e no timezone do Brasil — evita servidor em UTC considerar dia errado
  const nowRef = new Date();
  const todayStrServer = `${nowRef.getFullYear()}-${String(nowRef.getMonth() + 1).padStart(2, '0')}-${String(nowRef.getDate()).padStart(2, '0')}`;
  const todayStrBR = getTodayStringInTimezone(DEFAULT_AVAILABILITY_TIMEZONE);
  const isDateToday = date === todayStrServer || date === todayStrBR;
  if (date === todayStrServer || date === todayStrBR) {
    console.log(`[getAvailableSlots] Data solicitada (${date}) tratada como HOJE (server: ${todayStrServer}, ${DEFAULT_AVAILABILITY_TIMEZONE}: ${todayStrBR})`);
  }
  
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[getAvailableSlots] Buscando slots para ${date}`);
  console.log(`[getAvailableSlots] Dia da semana: ${dayNames[dayOfWeek]} (${dayOfWeek})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Buscar médicos ativos com disponibilidades (incluir acceptsOnlineBooking para regra de 30 min para hoje)
  const allActiveDoctors = await prisma.doctor.findMany({
    where: { active: true },
    include: {
      availabilities: true,
      consultations: {
        where: {
          scheduledDate: date,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
      },
    },
  });
  // Garantir que acceptsOnlineBooking seja lido (pode não existir em bancos antigos)
  const doctorsWithAccepts = allActiveDoctors.map((d) => ({
    ...d,
    acceptsOnlineBooking: (d as { acceptsOnlineBooking?: boolean }).acceptsOnlineBooking === true,
  }));
  
  console.log(`[getAvailableSlots] Total de médicos ativos no sistema: ${doctorsWithAccepts.length}`);
  
  if (doctorsWithAccepts.length === 0) {
    console.error('[getAvailableSlots] ERRO: Nenhum médico ativo encontrado no sistema!');
    return [];
  }

  // Log de todas as disponibilidades
  doctorsWithAccepts.forEach(doc => {
    const availForDay = doc.availabilities.filter(a => a.dayOfWeek === dayOfWeek && a.active);
    console.log(`[getAvailableSlots] Médico "${doc.name}" (ID: ${doc.id}):`);
    console.log(`  - Total de disponibilidades: ${doc.availabilities.length}`);
    console.log(`  - Disponibilidades para ${dayNames[dayOfWeek]} (${dayOfWeek}): ${availForDay.length}`);
    if (availForDay.length > 0) {
      availForDay.forEach(a => {
        console.log(`    * ${a.startTime} às ${a.endTime} (duração: ${a.duration}min, ativo: ${a.active})`);
      });
    }
  });

  // Buscar médicos ativos com disponibilidade para o dia
  // Usar uma abordagem mais explícita para garantir que funciona
  let doctors;
  
  if (options?.doctorId) {
    console.log(`[getAvailableSlots] Filtrando por doctorId: ${options.doctorId}`);
    // Buscar médico específico
    const doctor = await prisma.doctor.findUnique({
      where: { 
        id: options.doctorId,
        active: true,
      },
      include: {
        availabilities: {
          where: {
            dayOfWeek,
            active: true,
          },
        },
        consultations: {
          where: {
            scheduledDate: date,
            status: {
              in: ['SCHEDULED', 'IN_PROGRESS'],
            },
          },
        },
      },
    });
    
    doctors = doctor
      ? [{ ...doctor, acceptsOnlineBooking: (doctor as { acceptsOnlineBooking?: boolean }).acceptsOnlineBooking === true }]
      : [];
  } else {
    // Buscar todos os médicos ativos e filtrar manualmente
    // Isso garante que não há problemas com a query do Prisma
    const allDoctors = doctorsWithAccepts;
    
    // Filtrar médicos que têm disponibilidade para o dia
    // Garantir que a comparação seja feita com números
    doctors = allDoctors.filter(doctor => {
      const hasAvailability = doctor.availabilities.some(
        avail => Number(avail.dayOfWeek) === Number(dayOfWeek) && avail.active === true
      );
      return hasAvailability;
    }).map(doctor => ({
      ...doctor,
      availabilities: doctor.availabilities.filter(
        avail => Number(avail.dayOfWeek) === Number(dayOfWeek) && avail.active === true
      ),
    }));
    
    console.log(`[getAvailableSlots] Após filtro manual: ${doctors.length} médico(s) com disponibilidade para ${dayNames[dayOfWeek]}`);
  }

  // Para HOJE: incluir médicos que estão online e aceitam 30 min mesmo SEM horário em "Meus Horários" (atendimento em momento de folga)
  if (isDateToday && !options?.doctorId) {
    const doctorIdsInList = new Set(doctors.map((d) => d.id));
    for (const doc of doctorsWithAccepts) {
      if (doctorIdsInList.has(doc.id)) continue;
      const hasAvailForToday = doc.availabilities.some((a) => Number(a.dayOfWeek) === Number(dayOfWeek) && a.active);
      if (hasAvailForToday) continue;
      if (!doc.acceptsOnlineBooking) continue;
      const online = await isDoctorOnline(doc.id);
      if (!online) continue;
      doctors.push({
        ...doc,
        availabilities: [], // sem horário fixo; vamos gerar slots sob demanda
      });
      doctorIdsInList.add(doc.id);
      console.log(`[getAvailableSlots] Médico "${doc.name}" incluído para hoje (sem horário no dia): atendimento em momento de folga.`);
    }
  }

  console.log(`[getAvailableSlots] Encontrados ${doctors.length} médico(s) ativo(s) com disponibilidade para ${dayNames[dayOfWeek]} (${dayOfWeek})`);
  
  if (doctors.length === 0) {
    console.error(`[getAvailableSlots] ERRO: Nenhum médico encontrado com disponibilidade ativa para ${dayNames[dayOfWeek]}!`);
    console.error(`[getAvailableSlots] Verifique se há médicos ativos e se eles têm disponibilidade cadastrada para este dia da semana.`);
    
    // Debug adicional: verificar a query diretamente
    const testDoctors = await prisma.doctor.findMany({
      where: { active: true },
      include: {
        availabilities: {
          where: {
            dayOfWeek: dayOfWeek,
          },
        },
      },
    });
    
    console.log(`[getAvailableSlots] DEBUG: Médicos com disponibilidade para dia ${dayOfWeek} (sem filtro de active):`);
    testDoctors.forEach(doc => {
      console.log(`  - ${doc.name}: ${doc.availabilities.length} disponibilidades`);
      doc.availabilities.forEach(avail => {
        console.log(`    * Dia ${avail.dayOfWeek}, ${avail.startTime}-${avail.endTime}, ativo: ${avail.active}`);
      });
    });
    
    return [];
  }

  const availableSlots: AvailabilitySlot[] = [];

  const now = new Date();
  const [year, month, day] = date.split('-').map(Number);
  const isToday = isDateToday;

  for (const doctor of doctors) {
    const doctorIsOnline = await isDoctorOnline(doctor.id);
    const acceptsOnline = (doctor as { acceptsOnlineBooking?: boolean }).acceptsOnlineBooking === true;
    const canUseShortNotice = doctorIsOnline && acceptsOnline;
    console.log(`[getAvailableSlots] Médico ${doctor.name}: online=${doctorIsOnline}, acceptsOnlineBooking=${acceptsOnline}, canUseShortNotice=${canUseShortNotice} (${doctor.availabilities.length} disponibilidades)`);

    // HOJE + online + aceita 30 min: uma única regra — slots de agora+30min até 20h, SEM usar "Meus Horários"
    // Usar horário no timezone Brasil para que servidor em UTC não gere janela vazia (ex.: 23:00–20:00)
    if (isToday && canUseShortNotice) {
      const minMinutesOnline = await getMinAdvanceBookingMinutesOnline();
      const minTimeFromNow = new Date(now.getTime() + minMinutesOnline * 60 * 1000);
      let { hours: startH, minutes: startM } = getHoursMinutesInTimezone(minTimeFromNow, DEFAULT_AVAILABILITY_TIMEZONE);
      startM = Math.ceil(startM / duration) * duration;
      if (startM >= 60) {
        startH += 1;
        startM = 0;
      }
      const startTimeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const endTimeStr = '20:00';
      const onDemandSlots = generateTimeSlots(startTimeStr, endTimeStr, duration);
      const occupiedSlots = new Set<string>();
      (doctor.consultations || []).forEach((c: { scheduledTime?: string | null }) => {
        if (!c.scheduledTime) return;
        getBlockedTimesAroundConsultation(c.scheduledTime).forEach((t) => occupiedSlots.add(t));
      });
      const startMinutesOfDay = startH * 60 + startM;
      for (const time of onDemandSlots) {
        if (occupiedSlots.has(time)) continue;
        const [h, m] = time.split(':').map(Number);
        const slotMinutesOfDay = h * 60 + m;
        if (slotMinutesOfDay >= startMinutesOfDay) {
          availableSlots.push({
            doctorId: doctor.id,
            doctorName: doctor.name,
            date,
            time,
            available: true,
          });
        }
      }
      console.log(`[getAvailableSlots] ✅ Médico ${doctor.name}: hoje+30min — slots sob demanda (${startTimeStr}–${endTimeStr}), ${onDemandSlots.length} gerados`);
      continue;
    }

    // Médico sem horário para o dia e não está no caso "hoje+30min" acima: não mostra slots
    if (doctor.availabilities.length === 0) {
      console.warn(`[getAvailableSlots] AVISO: Médico ${doctor.name} não tem disponibilidades para este dia.`);
      continue;
    }

    // Para "não é hoje" ou "hoje mas médico offline/não aceita 30min": usar janela de "Meus Horários"
    for (const availability of doctor.availabilities) {
      console.log(`[getAvailableSlots] Processando disponibilidade: ${availability.startTime} às ${availability.endTime} (duração: ${availability.duration || duration}min)`);
      
      // Gerar slots de horário
      const timeSlots = generateTimeSlots(
        availability.startTime,
        availability.endTime,
        availability.duration || duration
      );

      console.log(`[getAvailableSlots] ✅ ${timeSlots.length} slots gerados: ${timeSlots.slice(0, 5).join(', ')}${timeSlots.length > 5 ? '...' : ''}`);

      // Verificar quais slots estão ocupados: horário da consulta e ±10 min (não permitir agendar no horário nem 10 min antes/depois)
      const occupiedSlots = new Set<string>();
      doctor.consultations.forEach((c) => {
        if (!c.scheduledTime) return;
        getBlockedTimesAroundConsultation(c.scheduledTime).forEach((t) => occupiedSlots.add(t));
      });

      console.log(`  Slots bloqueados (consulta ±${CONSULTATION_BUFFER_MINUTES}min): ${Array.from(occupiedSlots).join(', ') || 'nenhum'}`);

      for (const time of timeSlots) {
        // Verificar se o horário não está ocupado
        if (!occupiedSlots.has(time)) {
          const [hours, minutes] = time.split(':').map(Number);
          const slotMinutesOfDay = hours * 60 + minutes;

          if (isToday) {
            // Hoje: comparar no timezone da clínica (Brasil). Evita servidor em UTC considerar 09:00–18:00 como "no passado".
            const nowInTz = getHoursMinutesInTimezone(now, DEFAULT_AVAILABILITY_TIMEZONE);
            const nowMinutesOfDay = nowInTz.hours * 60 + nowInTz.minutes;
            const minMinutesOnline = await getMinAdvanceBookingMinutesOnline();
            let minMinutesOffline = await getMinAdvanceBookingMinutesOffline();
            // Para "hoje", limitar antecedência offline a 60 min para não zerar slots (ex.: 15:56 + 2h = 17:56, último slot 17:30 → 0 slots)
            if (minMinutesOffline > 60) minMinutesOffline = 60;
            const minMinutes = canUseShortNotice ? minMinutesOnline : minMinutesOffline;
            const cutoffMinutes = nowMinutesOfDay + minMinutes;

            if (slotMinutesOfDay >= cutoffMinutes) {
              availableSlots.push({
                doctorId: doctor.id,
                doctorName: doctor.name,
                date,
                time,
                available: true,
              });
              const minHours = Math.floor(minMinutes / 60);
              const minMins = minMinutes % 60;
              const minDisplay = minHours > 0 ? `${minHours}h${minMins > 0 ? `${minMins}min` : ''}` : `${minMinutes}min`;
              console.log(`  ✅ Slot ${time} adicionado (data: ${date}, médico ${canUseShortNotice ? 'online+aceita' : doctorIsOnline ? 'online' : 'offline'}, antecedência: ${minDisplay})`);
            } else {
              const minHours = Math.floor(minMinutes / 60);
              const minMins = minMinutes % 60;
              const minDisplay = minHours > 0 ? `${minHours}h${minMins > 0 ? `${minMins}min` : ''}` : `${minMinutes}min`;
              console.log(`  ❌ Slot ${time} ignorado (insuficiente antecedência - requer ${minDisplay})`);
            }
          } else {
            // Não é hoje: a data é futura, todos os slots do dia são elegíveis
            availableSlots.push({
              doctorId: doctor.id,
              doctorName: doctor.name,
              date,
              time,
              available: true,
            });
            console.log(`  ✅ Slot ${time} adicionado (data futura: ${date})`);
          }
        } else {
          console.log(`  ⚠️ Slot ${time} ocupado`);
        }
      }
    }
  }

  console.log(`[getAvailableSlots] ✅ Total de slots disponíveis encontrados: ${availableSlots.length}`);
  
  if (availableSlots.length > 0) {
    console.log(`[getAvailableSlots] Primeiros slots:`, availableSlots.slice(0, 5).map(s => `${s.time} (${s.doctorName})`));
  } else {
    console.error(`[getAvailableSlots] ❌ NENHUM SLOT DISPONÍVEL! Verifique os logs acima para identificar o problema.`);
  }
  
  return availableSlots;
}

/**
 * Distribui um agendamento para o médico mais disponível
 */
export async function assignDoctorToConsultation(
  date: string,
  time: string,
  preferredDoctorId?: string
): Promise<string | null> {
  // Se há médico preferido, verificar disponibilidade
  if (preferredDoctorId) {
    const slots = await getAvailableSlots(date, { doctorId: preferredDoctorId });
    const isAvailable = slots.some(slot => slot.time === time && slot.doctorId === preferredDoctorId);
    
    if (isAvailable) {
      return preferredDoctorId;
    }
  }

  // Buscar todos os médicos disponíveis para esse horário
  const slots = await getAvailableSlots(date);
  const availableDoctors = slots.filter(slot => slot.time === time && slot.available);

  if (availableDoctors.length === 0) {
    return null;
  }

  // Estratégia de distribuição: escolher o médico com menos consultas agendadas
  const doctorWorkload: Record<string, number> = {};

  for (const slot of availableDoctors) {
    if (!doctorWorkload[slot.doctorId]) {
      const consultationCount = await prisma.consultation.count({
        where: {
          doctorId: slot.doctorId,
          scheduledDate: date,
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS'],
          },
        },
      });
      doctorWorkload[slot.doctorId] = consultationCount;
    }
  }

  // Ordenar por carga de trabalho (menos consultas primeiro)
  const sortedDoctors = availableDoctors.sort((a, b) => {
    const workloadA = doctorWorkload[a.doctorId] || 0;
    const workloadB = doctorWorkload[b.doctorId] || 0;
    return workloadA - workloadB;
  });

  return sortedDoctors[0]?.doctorId || null;
}

/**
 * Verifica se um horário está disponível
 */
export async function isSlotAvailable(
  date: string,
  time: string,
  doctorId?: string
): Promise<boolean> {
  const slots = await getAvailableSlots(date, { doctorId });
  return slots.some(slot => slot.time === time && slot.available);
}
