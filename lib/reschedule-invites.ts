/**
 * Funções auxiliares para o sistema de convites de remarcação
 */

import { prisma } from '@/lib/prisma';
import { getAvailableSlots, isDoctorOnline } from './availability';
import { 
  getMinAdvanceBookingMinutesOnline,
  getMinAdvanceBookingMinutesOffline,
  getRescheduleInviteExpiryMinutes,
} from './consultation-config';

/**
 * Verifica se um horário está disponível para remarcação
 * Agora verifica se está dentro do período de disponibilidade, não apenas se está na lista exata de slots
 * @param options.skipAdvanceBookingCheck - Quando true (ex.: médico sugerindo o horário), não exige antecedência mínima para "hoje"
 */
export async function isTimeSlotAvailable(
  date: string,
  time: string,
  doctorId: string,
  excludeConsultationId?: string,
  options?: { skipAdvanceBookingCheck?: boolean }
): Promise<{ available: boolean; reason?: string }> {
  try {
    // Buscar médico e suas disponibilidades
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        availabilities: true,
      },
    });

    if (!doctor || !doctor.active) {
      return { available: false, reason: 'Médico não está ativo' };
    }

    // Obter dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // Buscar disponibilidade para este dia da semana
    const dayAvailability = doctor.availabilities.find(
      av => av.dayOfWeek === dayOfWeek && av.active
    );

    if (!dayAvailability) {
      return { available: false, reason: 'Médico não tem disponibilidade neste dia' };
    }

    // Verificar se o horário está dentro do período de disponibilidade
    const [timeHour, timeMin] = time.split(':').map(Number);
    const [startHour, startMin] = dayAvailability.startTime.split(':').map(Number);

    const timeMinutes = timeHour * 60 + timeMin;
    const startMinutes = startHour * 60 + startMin;

    // Verificar se o horário está dentro do período (início da disponibilidade)
    if (timeMinutes < startMinutes) {
      return { 
        available: false, 
        reason: `Horário antes do início da disponibilidade (${dayAvailability.startTime})` 
      };
    }

    // Verificar se não há outra consulta agendada no mesmo horário
    // Reutilizar year, month, day já declarados acima
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledAt = new Date(year, month - 1, day, hours, minutes);
    
    // Buscar consultas do médico na mesma data
    const consultationDate = date;
    const consultations = await prisma.consultation.findMany({
      where: {
        doctorId,
        scheduledDate: consultationDate,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
        ...(excludeConsultationId && { id: { not: excludeConsultationId } }),
      },
    });

    // Verificar se alguma consulta está no mesmo horário
    const existingConsultation = consultations.find(c => {
      if (c.scheduledTime) {
        const [cHour, cMin] = c.scheduledTime.split(':').map(Number);
        return cHour === hours && cMin === minutes;
      }
      // Se não tem scheduledTime, comparar scheduledAt
      const cDate = new Date(c.scheduledAt);
      return cDate.getHours() === hours && cDate.getMinutes() === minutes;
    });
    
    if (existingConsultation) {
      return { available: false, reason: 'Já existe uma consulta agendada neste horário' };
    }
    
    // Verificar se não há convite pendente para o mesmo horário
    const existingInvite = await prisma.consultationRescheduleInvite.findFirst({
      where: {
        doctorId,
        newScheduledDate: date,
        newScheduledTime: time,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
        ...(excludeConsultationId && { consultationId: { not: excludeConsultationId } }),
      },
    });
    
    if (existingInvite) {
      return { available: false, reason: 'Já existe um convite pendente para este horário' };
    }

    // Verificar antecedência mínima para "hoje" (não se aplica quando o médico está sugerindo o horário)
    if (!options?.skipAdvanceBookingCheck) {
      const now = new Date();
      const isToday = date === now.toISOString().split('T')[0];
      if (isToday) {
        const doctorIsOnline = await isDoctorOnline(doctorId);
        const minMinutesOnline = await getMinAdvanceBookingMinutesOnline();
        const minMinutesOffline = await getMinAdvanceBookingMinutesOffline();
        const minMinutes = doctorIsOnline ? minMinutesOnline : minMinutesOffline;
        const minTime = new Date(now.getTime() + minMinutes * 60 * 1000);
        if (scheduledAt < minTime) {
          return {
            available: false,
            reason: `É necessário pelo menos ${minMinutes} minutos de antecedência para agendamentos hoje`,
          };
        }
      }
    }

    return { available: true };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do horário:', error);
    return { available: false, reason: 'Erro ao verificar disponibilidade' };
  }
}

/**
 * Busca horários disponíveis antes do horário atual da consulta
 */
export async function getEarlierAvailableSlots(
  consultationId: string,
  doctorId: string,
  currentScheduledAt: Date
): Promise<Array<{ date: string; time: string; scheduledAt: Date }>> {
  try {
    const now = new Date();
    const currentDate = currentScheduledAt.toISOString().split('T')[0];
    const currentTime = currentScheduledAt.toTimeString().slice(0, 5);
    
    // Buscar slots disponíveis para hoje e próximos dias (até a data atual da consulta)
    const slots: Array<{ date: string; time: string; scheduledAt: Date }> = [];
    
    // Verificar hoje
    if (now.toISOString().split('T')[0] === currentDate || 
        new Date(currentDate) > now) {
      const todaySlots = await getAvailableSlots(now.toISOString().split('T')[0], { doctorId });
      
      for (const slot of todaySlots) {
        if (!slot.available) continue;
        
        const slotDateTime = new Date(`${slot.date}T${slot.time}`);
        // Usar configuração de antecedência mínima
        const minMinutesOnline = await getMinAdvanceBookingMinutesOnline();
        const minMinutesOffline = await getMinAdvanceBookingMinutesOffline();
        const doctorIsOnline = await isDoctorOnline(doctorId);
        const minMinutes = doctorIsOnline ? minMinutesOnline : minMinutesOffline;
        const minTime = new Date(now.getTime() + minMinutes * 60 * 1000);
        
        if (slotDateTime >= minTime && slotDateTime < currentScheduledAt) {
          slots.push({
            date: slot.date,
            time: slot.time,
            scheduledAt: slotDateTime,
          });
        }
      }
    }
    
    // Verificar dias futuros até a data da consulta
    const currentDateObj = new Date(currentDate);
    const today = new Date(now.toISOString().split('T')[0]);
    
    for (let d = new Date(today); d < currentDateObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const daySlots = await getAvailableSlots(dateStr, { doctorId });
      
      for (const slot of daySlots) {
        if (!slot.available) continue;
        
        const slotDateTime = new Date(`${slot.date}T${slot.time}`);
        
        if (slotDateTime < currentScheduledAt) {
          slots.push({
            date: slot.date,
            time: slot.time,
            scheduledAt: slotDateTime,
          });
        }
      }
    }
    
    // Remover duplicatas baseado em date + time
    const uniqueSlots = slots.filter((slot, index, self) => 
      index === self.findIndex((s) => s.date === slot.date && s.time === slot.time)
    );
    
    // Ordenar por data/hora (mais próximo primeiro)
    return uniqueSlots.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  } catch (error) {
    console.error('Erro ao buscar slots anteriores:', error);
    return [];
  }
}

/**
 * Cria um convite de remarcação
 */
export async function createRescheduleInvite(data: {
  consultationId: string;
  patientId: string;
  doctorId: string;
  currentScheduledAt: Date;
  newScheduledAt: Date;
  newScheduledDate: string;
  newScheduledTime: string;
  message?: string;
}) {
  const expiryMinutes = await getRescheduleInviteExpiryMinutes();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return await prisma.consultationRescheduleInvite.create({
    data: {
      consultationId: data.consultationId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      currentScheduledAt: data.currentScheduledAt,
      newScheduledAt: data.newScheduledAt,
      newScheduledDate: data.newScheduledDate,
      newScheduledTime: data.newScheduledTime,
      message: data.message || null,
      expiresAt,
      status: 'PENDING',
    },
  });
}

/**
 * Expira convites pendentes que passaram do tempo limite
 */
export async function expirePendingInvites() {
  try {
    const now = new Date();
    
    const expiredInvites = await prisma.consultationRescheduleInvite.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
    
    return expiredInvites.count;
  } catch (error) {
    console.error('Erro ao expirar convites:', error);
    return 0;
  }
}
