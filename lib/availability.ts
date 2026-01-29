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
 * Obtém o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
 * Calcula diretamente da string da data para evitar problemas de timezone
 */
function getDayOfWeek(dateString: string): number {
  // Parse da data no formato YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  // month - 1 porque Date usa 0-11 para meses
  const date = new Date(year, month - 1, day);
  return date.getDay();
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
  
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[getAvailableSlots] Buscando slots para ${date}`);
  console.log(`[getAvailableSlots] Dia da semana: ${dayNames[dayOfWeek]} (${dayOfWeek})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Primeiro, buscar todos os médicos ativos para debug
  const allActiveDoctors = await prisma.doctor.findMany({
    where: { active: true },
    include: {
      availabilities: true,
    },
  });
  
  console.log(`[getAvailableSlots] Total de médicos ativos no sistema: ${allActiveDoctors.length}`);
  
  if (allActiveDoctors.length === 0) {
    console.error('[getAvailableSlots] ERRO: Nenhum médico ativo encontrado no sistema!');
    return [];
  }

  // Log de todas as disponibilidades
  allActiveDoctors.forEach(doc => {
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
    
    doctors = doctor ? [doctor] : [];
  } else {
    // Buscar todos os médicos ativos e filtrar manualmente
    // Isso garante que não há problemas com a query do Prisma
    const allDoctors = await prisma.doctor.findMany({
      where: { active: true },
      include: {
        availabilities: true,
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

  for (const doctor of doctors) {
    console.log(`[getAvailableSlots] Processando médico: ${doctor.name} (${doctor.availabilities.length} disponibilidades para este dia)`);
    
    if (doctor.availabilities.length === 0) {
      console.warn(`[getAvailableSlots] AVISO: Médico ${doctor.name} não tem disponibilidades para este dia após filtro!`);
      continue;
    }
    
    for (const availability of doctor.availabilities) {
      console.log(`[getAvailableSlots] Processando disponibilidade: ${availability.startTime} às ${availability.endTime} (duração: ${availability.duration || duration}min)`);
      
      // Gerar slots de horário
      const timeSlots = generateTimeSlots(
        availability.startTime,
        availability.endTime,
        availability.duration || duration
      );

      console.log(`[getAvailableSlots] ✅ ${timeSlots.length} slots gerados: ${timeSlots.slice(0, 5).join(', ')}${timeSlots.length > 5 ? '...' : ''}`);

      // Verificar quais slots estão ocupados
      // Normalizar horários para formato HH:MM (remover segundos se houver)
      const occupiedSlots = new Set(
        doctor.consultations
          .map(c => {
            if (!c.scheduledTime) return null;
            // Normalizar para HH:MM (remover segundos se existirem)
            const time = c.scheduledTime.trim();
            if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
              return time.substring(0, 5); // Remove segundos
            }
            return time.substring(0, 5); // Garante formato HH:MM
          })
          .filter(t => t !== null && t !== '') as string[]
      );

      console.log(`  Slots ocupados: ${Array.from(occupiedSlots).join(', ') || 'nenhum'}`);

      // Verificar se médico está online
      const doctorIsOnline = await isDoctorOnline(doctor.id);
      
      for (const time of timeSlots) {
        // Verificar se o horário não está ocupado
        if (!occupiedSlots.has(time)) {
          // Verificar se não está no passado (apenas se for hoje)
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          // Criar data/hora no timezone local
          const [year, month, day] = date.split('-').map(Number);
          const [hours, minutes] = time.split(':').map(Number);
          const slotDateTime = new Date(year, month - 1, day, hours, minutes);
          const slotDate = new Date(year, month - 1, day);
          
          // Só verificar se está no passado se for o dia de hoje
          const isToday = slotDate.getTime() === today.getTime();
          
          if (isToday) {
            // Se for hoje, verificar antecedência baseada no status do médico
            const minMinutesOnline = await getMinAdvanceBookingMinutesOnline();
            const minMinutesOffline = await getMinAdvanceBookingMinutesOffline();
            const minMinutes = doctorIsOnline ? minMinutesOnline : minMinutesOffline;
            const minTimeFromNow = new Date(now.getTime() + minMinutes * 60 * 1000);
            
            if (slotDateTime >= minTimeFromNow) {
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
              console.log(`  ✅ Slot ${time} adicionado (data: ${date}, médico ${doctorIsOnline ? 'online' : 'offline'}, antecedência: ${minDisplay})`);
            } else {
              const minHours = Math.floor(minMinutes / 60);
              const minMins = minMinutes % 60;
              const minDisplay = minHours > 0 ? `${minHours}h${minMins > 0 ? `${minMins}min` : ''}` : `${minMinutes}min`;
              console.log(`  ❌ Slot ${time} ignorado (insuficiente antecedência - requer ${minDisplay})`);
            }
          } else {
            // Se não é hoje, adicionar normalmente (apenas verificar se não está no passado)
            const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
            if (slotDateTime >= fiveMinutesFromNow) {
              availableSlots.push({
                doctorId: doctor.id,
                doctorName: doctor.name,
                date,
                time,
                available: true,
              });
              console.log(`  ✅ Slot ${time} adicionado (data futura: ${date})`);
            }
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
