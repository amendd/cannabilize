/**
 * Converte um WhatsAppLead em cadastro completo: User (paciente), Consultation, Payment,
 * tokens para concluir cadastro e pagamento. Usado quando o lead atinge CONFIRM no fluxo.
 */
import { prisma } from './prisma';
import crypto from 'crypto';

/** Base URL dos links (pagamento, concluir cadastro). Prioridade: NEXT_PUBLIC_APP_URL / APP_URL para usar o domínio de produção (ex.: https://cannabilize.com.br). */
function getOrigin(): string {
  const u =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (u) return u.startsWith('http') ? u.replace(/\/$/, '') : `https://${u}`;
  return 'http://localhost:3000';
}
import { getAvailableSlots, assignDoctorToConsultation } from './availability';
import { getConsultationDefaultAmount } from './consultation-price';
import { generateSetupToken } from './account-setup';

export type LeadToPatientResult = {
  ok: true;
  setupUrl: string;
  paymentUrl: string;
  scheduledLabel: string;
  consultationId: string;
} | {
  ok: false;
  error: string;
};

/**
 * Retorna o primeiro slot disponível nos próximos N dias.
 */
async function getFirstAvailableSlot(maxDays: number): Promise<{ date: string; time: string; doctorId: string } | null> {
  const start = new Date();
  for (let d = 0; d < maxDays; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const dateStr = day.toISOString().slice(0, 10);
    const slots = await getAvailableSlots(dateStr);
    const first = slots.find(s => s.available);
    if (first) {
      return { date: dateStr, time: first.time, doctorId: first.doctorId };
    }
  }
  return null;
}

/**
 * Cria ou obtém usuário (paciente) a partir do lead. Email único: wa.{phoneDigits}@lead.pendente se novo.
 * Se o mesmo telefone já tiver usuário com nome diferente (ex.: outro paciente no mesmo número), cria novo usuário.
 */
async function createOrGetUserFromLead(lead: {
  phone: string;
  name: string | null;
  cpf: string | null;
  birthDate: Date | string | null;
}): Promise<{ id: string; isNew: boolean }> {
  const phoneDigits = lead.phone.replace(/\D/g, '');
  const leadNameNorm = (lead.name || '').trim().toLowerCase();
  let user = await prisma.user.findFirst({
    where: { phone: lead.phone },
  });
  if (!user && lead.cpf) {
    user = await prisma.user.findFirst({
      where: { cpf: lead.cpf },
    }) ?? undefined;
  }
  const userNameNorm = (user?.name || '').trim().toLowerCase();
  if (user && leadNameNorm && userNameNorm && leadNameNorm === userNameNorm) {
    return { id: user.id, isNew: false };
  }
  if (user && leadNameNorm && userNameNorm && leadNameNorm !== userNameNorm) {
    // Mesmo telefone, nome diferente (ex.: Dandinho vs Ivete) → criar novo paciente para não misturar consultas
    user = undefined;
  }
  // Se temos CPF, evitar P2002: nunca criar outro User com o mesmo CPF (já existe no banco)
  if (lead.cpf) {
    const existingByCpf = await prisma.user.findFirst({
      where: { cpf: lead.cpf },
    });
    if (existingByCpf) {
      return { id: existingByCpf.id, isNew: false };
    }
  }
  // Sempre usar email único ao criar: evita P2002 (unique constraint em email) quando o mesmo telefone já tem usuário
  const placeholderEmail = `wa.${phoneDigits}.${Date.now()}@lead.pendente`;
  const birthDateValue = lead.birthDate
    ? (typeof lead.birthDate === 'string' ? new Date(lead.birthDate) : lead.birthDate)
    : null;
  user = await prisma.user.create({
    data: {
      email: placeholderEmail,
      name: lead.name || 'Paciente',
      phone: lead.phone,
      cpf: lead.cpf || null,
      birthDate: birthDateValue,
      role: 'PATIENT',
    },
  });
  return { id: user.id, isNew: true };
}

/** Vincula patologias do lead (metadata.pathologies) ao paciente. */
async function linkPathologiesToPatient(patientId: string, metadata: string | null): Promise<void> {
  let pathologies: string[] = [];
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata) as { pathologies?: string[] };
      pathologies = parsed.pathologies || [];
    } catch {
      // ignore
    }
  }
  for (const name of pathologies) {
    if (!name || typeof name !== 'string') continue;
    let pathology = await prisma.pathology.findUnique({ where: { name } });
    if (!pathology) {
      pathology = await prisma.pathology.create({ data: { name, active: true } });
    }
    await prisma.patientPathology.upsert({
      where: {
        patientId_pathologyId: { patientId, pathologyId: pathology.id },
      },
      create: { patientId, pathologyId: pathology.id },
      update: {},
    });
  }
}

/**
 * Converte lead em paciente, cria consulta (primeiro slot disponível), pagamento e tokens.
 * Retorna URLs para concluir cadastro e pagar. Atualiza o lead com userId e consultationId.
 */
export async function createPatientAndConsultationFromLead(
  leadId: string,
  origin?: string
): Promise<LeadToPatientResult> {
  const baseOrigin = origin || getOrigin();
  const lead = await prisma.whatsAppLead.findUnique({
    where: { id: leadId },
  });
  if (!lead) {
    return { ok: false, error: 'Lead não encontrado' };
  }
  // Reutilizar consulta existente só se for do mesmo paciente (mesmo nome); evita mostrar dados de outro paciente no checkout
  if (lead.userId && lead.consultationId) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: lead.consultationId },
      include: { confirmationToken: true, payment: true, patient: true },
    });
    const leadNameNorm = (lead.name || '').trim().toLowerCase();
    const patientNameNorm = (consultation?.patient?.name || consultation?.name || '').trim().toLowerCase();
    const samePatient = leadNameNorm && patientNameNorm && leadNameNorm === patientNameNorm;
    if (consultation?.confirmationToken && consultation?.payment && samePatient) {
      // Sincronizar consulta com os dados atuais do lead (slot, anamnese, nome) para a confirmação bater com o WhatsApp
      let slotFromMeta: { date: string; time: string; doctorId: string } | null = null;
      if (lead.metadata) {
        try {
          const meta = JSON.parse(lead.metadata) as { slot?: { date: string; time: string; doctorId: string } };
          if (meta.slot?.date && meta.slot?.time) slotFromMeta = meta.slot;
        } catch {
          /* ignore */
        }
      }
      if (slotFromMeta) {
        const [y, m, d] = slotFromMeta.date.split('-').map(Number);
        const [hours, mins] = slotFromMeta.time.split(':').map(Number);
        const newScheduledAt = new Date(y, m - 1, d, hours, mins, 0, 0);
        const anamnesisString = lead.anamnesis ? (typeof lead.anamnesis === 'string' ? lead.anamnesis : JSON.stringify(lead.anamnesis)) : null;
        await prisma.consultation.update({
          where: { id: consultation.id },
          data: {
            scheduledAt: newScheduledAt,
            scheduledDate: slotFromMeta.date,
            scheduledTime: slotFromMeta.time,
            ...(slotFromMeta.doctorId && { doctorId: slotFromMeta.doctorId }),
            ...(anamnesisString != null && { anamnesis: anamnesisString }),
            ...(lead.name != null && { name: lead.name }),
            ...(lead.phone != null && { phone: lead.phone }),
          },
        });
        if (lead.name != null && consultation.patientId) {
          await prisma.user.update({
            where: { id: consultation.patientId },
            data: { name: lead.name },
          });
        }
      }
      const updated = await prisma.consultation.findUnique({
        where: { id: consultation.id },
        select: { scheduledAt: true },
      });
      const scheduledAt = updated?.scheduledAt ?? consultation.scheduledAt;
      const scheduledLabel = `${scheduledAt.toLocaleDateString('pt-BR')} às ${scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const setupToken = await prisma.accountSetupToken.findFirst({
        where: { userId: lead.userId, used: false },
        orderBy: { expiresAt: 'desc' },
      });
      const setupUrl = setupToken
        ? `${baseOrigin}/concluir-cadastro?token=${setupToken.token}`
        : `${baseOrigin}/concluir-cadastro`;
      return {
        ok: true,
        setupUrl,
        paymentUrl: `${baseOrigin}/consultas/${consultation.id}/pagamento?token=${consultation.confirmationToken.token}`,
        scheduledLabel,
        consultationId: consultation.id,
      };
    }
    // Nome do lead mudou (ex.: CORRIGIR e outro nome) ou consulta não existe mais → criar nova consulta
  }

  let slot: { date: string; time: string; doctorId: string } | null = null;
  if (lead.metadata) {
    try {
      const meta = JSON.parse(lead.metadata) as { slot?: { date: string; time: string; doctorId: string } };
      if (meta.slot?.date && meta.slot?.time && meta.slot?.doctorId) {
        slot = meta.slot;
      }
    } catch {
      // ignore
    }
  }
  if (!slot) {
    slot = await getFirstAvailableSlot(7);
  }
  if (!slot) {
    return { ok: false, error: 'Nenhum horário disponível nos próximos 7 dias. Nossa equipe entrará em contato.' };
  }

  const assignedDoctorId = slot.doctorId || await assignDoctorToConsultation(slot.date, slot.time);
  if (!assignedDoctorId) {
    return { ok: false, error: 'Nenhum médico disponível para o horário. Tente novamente em instantes.' };
  }

  const [year, month, day] = slot.date.split('-').map(Number);
  const [hours, mins] = slot.time.split(':').map(Number);
  const scheduledAt = new Date(year, month - 1, day, hours, mins, 0, 0);

  const { id: userId, isNew } = await createOrGetUserFromLead({
    phone: lead.phone,
    name: lead.name,
    cpf: lead.cpf,
    birthDate: lead.birthDate,
  });

  if (isNew) {
    await linkPathologiesToPatient(userId, lead.metadata);
  }

  const defaultAmount = await getConsultationDefaultAmount();
  const anamnesisString = lead.anamnesis ? (typeof lead.anamnesis === 'string' ? lead.anamnesis : JSON.stringify(lead.anamnesis)) : null;

  const consultation = await prisma.consultation.create({
    data: {
      patientId: userId,
      doctorId: assignedDoctorId,
      scheduledAt,
      scheduledDate: slot.date,
      scheduledTime: slot.time,
      status: 'SCHEDULED',
      anamnesis: anamnesisString,
      name: lead.name || undefined,
      phone: lead.phone,
    },
  });

  const confirmToken = crypto.randomBytes(32).toString('hex');
  const confirmExpires = new Date();
  confirmExpires.setDate(confirmExpires.getDate() + 7);
  await prisma.consultationConfirmationToken.create({
    data: {
      consultationId: consultation.id,
      token: confirmToken,
      expiresAt: confirmExpires,
    },
  });

  await prisma.payment.create({
    data: {
      patientId: userId,
      consultationId: consultation.id,
      amount: defaultAmount,
      currency: 'BRL',
      status: 'PENDING',
    },
  });

  const setupTokenValue = generateSetupToken();
  const setupExpires = new Date();
  setupExpires.setDate(setupExpires.getDate() + 7);
  await prisma.accountSetupToken.create({
    data: {
      userId,
      token: setupTokenValue,
      expiresAt: setupExpires,
    },
  });

  await prisma.whatsAppLead.update({
    where: { id: leadId },
    data: { userId, consultationId: consultation.id },
  });

  const scheduledLabel = `${scheduledAt.toLocaleDateString('pt-BR')} às ${scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const setupUrl = `${baseOrigin}/concluir-cadastro?token=${setupTokenValue}`;
  const paymentUrl = `${baseOrigin}/consultas/${consultation.id}/pagamento?token=${confirmToken}`;

  return {
    ok: true,
    setupUrl,
    paymentUrl,
    scheduledLabel,
    consultationId: consultation.id,
  };
}
