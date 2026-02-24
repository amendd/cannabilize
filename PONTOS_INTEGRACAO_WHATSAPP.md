# 📍 Pontos de Integração WhatsApp - Cannabilize

Este documento mapeia **todos os pontos** onde seria interessante integrar o WhatsApp para notificações e contato no sistema Cannabilize.

---

## 🎯 Índice por Prioridade

### 🔴 **ALTA PRIORIDADE** (Implementar Primeiro)
1. [Confirmação de Agendamento](#1-confirmação-de-agendamento)
2. [Confirmação de Pagamento](#2-confirmação-de-pagamento)
3. [Lembretes de Consulta](#3-lembretes-de-consulta)
4. [Receita Emitida](#4-receita-emitida)

### 🟡 **MÉDIA PRIORIDADE** (Implementar Depois)
5. [Convite para Adiantar Consulta](#5-convite-para-adiantar-consulta)
6. [Autorização ANVISA Aprovada](#6-autorização-anvisa-aprovada)
7. [Notificações para Médicos](#7-notificações-para-médicos)
8. [Notificações para Admin](#8-notificações-para-admin)

### 🟢 **BAIXA PRIORIDADE** (Futuro)
9. [Cancelamento de Consulta](#9-cancelamento-de-consulta)
10. [Pagamento Pendente](#10-pagamento-pendente)
11. [Carteirinha Aprovada](#11-carteirinha-aprovada)
12. [Botão de Contato](#12-botão-de-contato)

---

## 📋 Detalhamento dos Pontos de Integração

### 1. **Confirmação de Agendamento** 🔴

**📍 Localização:** `app/api/consultations/route.ts` (linha ~328-355)

**🔄 Fluxo Atual:**
```typescript
// Após criar consulta (linha 287)
const consultation = await prisma.consultation.create({...});

// Enviar notificações (linha 328)
notifyConsultationScheduled({...});

// Email de confirmação (linha 348)
sendConsultationConfirmationEmail({...});
```

**✅ O que adicionar:**
```typescript
// Adicionar após linha 355
import { notifyPatientByWhatsApp } from '@/lib/notifications';

if (data.phone) {
  notifyPatientByWhatsApp({
    patientName: data.name,
    patientPhone: data.phone,
    type: 'CONSULTATION_CONFIRMED',
    consultationData: {
      patientName: data.name,
      doctorName: doctor?.name || 'Não designado',
      date: scheduledAt,
      time: data.scheduledTime,
      meetingLink: consultation.meetingLink,
      platform: consultation.meetingPlatform,
    },
  }).catch(error => {
    console.error('Erro ao enviar WhatsApp:', error);
  });
}
```

**📱 Mensagem:**
```
📅 Consulta Agendada com Sucesso!

Olá [Nome]! Sua consulta foi confirmada:

👨‍⚕️ Médico: Dr. [Nome]
📅 Data: [Data]
⏰ Horário: [Horário]
🔗 Link: [Link da Telemedicina]

Lembre-se: A consulta será realizada via [Plataforma].

Cannabilize 💚
```

**🎯 Benefício:** Paciente recebe confirmação imediata no WhatsApp, aumentando confiança.

---

### 2. **Confirmação de Pagamento** 🔴

**📍 Localização:** `app/api/payments/webhook/route.ts` (linha ~114-129)

**🔄 Fluxo Atual:**
```typescript
// Após confirmar pagamento (linha 39)
await prisma.payment.updateMany({...});

// Email de confirmação (linha 120)
sendPaymentConfirmationEmail({...});
```

**✅ O que adicionar:**
```typescript
// Adicionar após linha 129
import { notifyPatientByWhatsApp } from '@/lib/notifications';

if (payment?.patient?.phone && payment.amount) {
  notifyPatientByWhatsApp({
    patientName: payment.patient.name,
    patientPhone: payment.patient.phone,
    type: 'PAYMENT_CONFIRMED',
    paymentData: {
      patientName: payment.patient.name,
      amount: payment.amount,
      date: payment.paidAt || new Date(),
      transactionId: payment.transactionId,
    },
  }).catch(error => {
    console.error('Erro ao enviar WhatsApp de pagamento:', error);
  });
}
```

**📱 Mensagem:**
```
✅ Pagamento Confirmado!

Olá [Nome]! Seu pagamento foi processado:

💰 Valor: R$ [Valor]
📅 Data: [Data]
📄 ID: [Transaction ID]

Sua consulta está confirmada!

Cannabilize 💚
```

**🎯 Benefício:** Paciente recebe confirmação instantânea do pagamento, reduzindo ansiedade.

---

### 3. **Lembretes de Consulta** 🔴

**📍 Localização:** Criar novo arquivo `app/api/cron/send-consultation-reminders/route.ts`

**🔄 Fluxo Atual:** Não existe (apenas email)

**✅ O que criar:**
```typescript
// Novo arquivo: app/api/cron/send-consultation-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getConsultationReminder24hMessage, getConsultationReminder1hMessage } from '@/lib/whatsapp-templates';

export async function POST(request: NextRequest) {
  // Verificar autenticação (header secreto)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);

  // Consultas nas próximas 24h
  const consultations24h = await prisma.consultation.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { gte: in1h, lte: in24h },
      patient: { phone: { not: null } },
    },
    include: { patient: true, doctor: true },
  });

  // Consultas nas próximas 1h
  const consultations1h = await prisma.consultation.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { gte: now, lte: in1h },
      patient: { phone: { not: null } },
    },
    include: { patient: true, doctor: true },
  });

  // Enviar lembretes
  for (const consultation of consultations24h) {
    if (consultation.patient.phone) {
      const message = getConsultationReminder24hMessage({
        patientName: consultation.patient.name,
        doctorName: consultation.doctor?.name || 'Não designado',
        date: consultation.scheduledAt,
        time: consultation.scheduledTime || '',
        meetingLink: consultation.meetingLink || undefined,
      });

      await sendWhatsAppMessage({
        to: consultation.patient.phone,
        message,
      }).catch(console.error);
    }
  }

  // Similar para 1h...

  return NextResponse.json({ success: true });
}
```

**📱 Mensagens:**
- **24h antes:** "⏰ Lembrete: Sua consulta está agendada para amanhã..."
- **1h antes:** "⏰ Sua consulta começa em 1 hora!..."

**🎯 Benefício:** Reduz no-shows (pacientes que não aparecem) em até 40%.

**⚙️ Configurar Cron:**
- Vercel Cron: Adicionar em `vercel.json`
- Ou usar serviço externo (cron-job.org) chamando a URL a cada hora

---

### 4. **Receita Emitida** 🔴

**📍 Localização:** `app/api/prescriptions/route.ts` (linha ~300-315)

**🔄 Fluxo Atual:**
```typescript
// Email de follow-up (linha 305)
sendConsultationFollowupEmail({...});
```

**✅ O que adicionar:**
```typescript
// Adicionar após linha 315
import { notifyPatientByWhatsApp } from '@/lib/notifications';

if (consultation.patient.phone) {
  notifyPatientByWhatsApp({
    patientName: consultation.patient.name,
    patientPhone: consultation.patient.phone,
    type: 'PRESCRIPTION_ISSUED',
    prescriptionData: {
      patientName: consultation.patient.name,
      doctorName: doctor?.name || 'Não designado',
      date: new Date(),
      medications: prescriptionData.medications?.map((m: any) => m.medicationName) || [],
    },
  }).catch(error => {
    console.error('Erro ao enviar WhatsApp de receita:', error);
  });
}
```

**📱 Mensagem:**
```
📋 Receita Médica Emitida

Olá [Nome]! Sua receita foi emitida:

👨‍⚕️ Médico: Dr. [Nome]
📅 Data: [Data]
💊 Medicamentos: [Lista]

📄 Acesse sua área do paciente para visualizar e baixar a receita.

Cannabilize 💚
```

**🎯 Benefício:** Paciente é notificado imediatamente quando receita está pronta.

---

### 5. **Convite para Adiantar Consulta** 🟡

**📍 Localização:** `app/api/consultations/[id]/reschedule-invite/route.ts` (linha ~165-180)

**🔄 Fluxo Atual:**
```typescript
// Email ao paciente (linha 170)
sendRescheduleInviteEmail({...});
```

**✅ O que adicionar:**
```typescript
// Adicionar após linha 180
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getRescheduleInviteMessage } from '@/lib/whatsapp-templates';

if (consultation.patient.phone) {
  const message = getRescheduleInviteMessage({
    patientName: consultation.patient.name,
    doctorName: consultation.doctor?.name || 'Médico',
    currentDate: new Date(currentScheduledAt).toLocaleDateString('pt-BR'),
    currentTime: consultation.scheduledTime || '',
    newDate: newScheduledDate,
    newTime: newScheduledTime,
    acceptLink: acceptUrl,
    rejectLink: rejectUrl,
  });

  await sendWhatsAppMessage({
    to: consultation.patient.phone,
    message,
  }).catch(error => {
    console.error('Erro ao enviar WhatsApp de convite:', error);
  });
}
```

**📱 Mensagem:**
```
🎯 Oportunidade de Adiantar Consulta!

Olá [Nome]! O Dr. [Nome] tem disponibilidade para adiantar sua consulta:

📅 Data Atual: [Data] às [Horário]
📅 Nova Data: [Nova Data] às [Novo Horário]

✅ Aceitar: [Link]
❌ Recusar: [Link]

⏱️ Este convite é válido por 24 horas.

Cannabilize 💚
```

**🎯 Benefício:** Aumenta taxa de aceitação de convites (WhatsApp tem maior abertura que email).

---

### 6. **Autorização ANVISA Aprovada** 🟡

**📍 Localização:** `app/api/anvisa/[id]/route.ts` (linha ~32-37)

**🔄 Fluxo Atual:**
```typescript
// Apenas atualiza status no banco
const authorization = await prisma.anvisaAuthorization.update({...});
```

**✅ O que adicionar:**
```typescript
// Adicionar após linha 37
import { sendWhatsAppMessage } from '@/lib/whatsapp';

if (status === 'APPROVED') {
  // Buscar dados do paciente
  const authWithPatient = await prisma.anvisaAuthorization.findUnique({
    where: { id: params.id },
    include: { patient: true },
  });

  if (authWithPatient?.patient?.phone) {
    const message = `✅ *Autorização ANVISA Aprovada!*

Olá ${authWithPatient.patient.name}! Sua autorização foi aprovada:

📄 *Número:* ${anvisaNumber || 'N/A'}
📅 *Aprovada em:* ${new Date().toLocaleDateString('pt-BR')}
⏰ *Válida até:* ${expiresAt ? new Date(expiresAt).toLocaleDateString('pt-BR') : 'N/A'}

📋 Acesse sua área do paciente para ver detalhes.

Cannabilize 💚`;

    await sendWhatsAppMessage({
      to: authWithPatient.patient.phone,
      message,
    }).catch(error => {
      console.error('Erro ao enviar WhatsApp de autorização:', error);
    });
  }
}
```

**📱 Mensagem:**
```
✅ Autorização ANVISA Aprovada!

Olá [Nome]! Sua autorização foi aprovada:

📄 Número: [Número ANVISA]
📅 Aprovada em: [Data]
⏰ Válida até: [Data]

📋 Acesse sua área do paciente para ver detalhes.

Cannabilize 💚
```

**🎯 Benefício:** Paciente é notificado imediatamente da aprovação, importante para importação.

---

### 7. **Notificações para Médicos** 🟡

**📍 Localização:** `app/api/consultations/route.ts` (linha ~328) e `lib/notifications.ts` (linha ~151)

**🔄 Fluxo Atual:**
```typescript
// Função já existe mas apenas faz console.log
notifyDoctorByWhatsApp({...});
```

**✅ O que fazer:**
- Implementar a função `notifyDoctorByWhatsApp()` em `lib/notifications.ts`
- Já está sendo chamada, só precisa implementar o envio real

**📱 Mensagem:**
```
🔔 Nova Consulta Designada

Dr. [Nome]! Você foi designado para uma nova consulta:

👤 Paciente: [Nome]
📧 Email: [Email]
📱 Telefone: [Telefone]
📅 Data: [Data]
⏰ Horário: [Horário]

📋 Ver Detalhes: [Link]

Cannabilize 💚
```

**🎯 Benefício:** Médico é notificado imediatamente quando recebe nova consulta.

---

### 8. **Notificações para Admin** 🟡

**📍 Localização:** `app/api/consultations/route.ts` (linha ~328) e `lib/notifications.ts` (linha ~74)

**🔄 Fluxo Atual:**
```typescript
// Função já existe mas apenas faz console.log
notifyAdminByWhatsApp({...});
```

**✅ O que fazer:**
- Implementar a função `notifyAdminByWhatsApp()` em `lib/notifications.ts`
- Já está sendo chamada, só precisa implementar o envio real

**📱 Mensagem:**
```
🔔 Nova Consulta Agendada

Nova consulta no sistema:

👤 Paciente: [Nome]
👨‍⚕️ Médico: [Nome] (ou "Não designado")
📅 Data: [Data]
⏰ Horário: [Horário]
💰 Valor: R$ [Valor]

📋 Ver: [Link Admin]

Cannabilize 💚
```

**🎯 Benefício:** Admin fica ciente de todas as novas consultas em tempo real.

---

### 9. **Cancelamento de Consulta** 🟢

**📍 Localização:** `app/api/consultations/[id]/status/route.ts` (quando status muda para CANCELLED)

**🔄 Fluxo Atual:** Apenas atualiza status no banco

**✅ O que adicionar:**
```typescript
// Quando status mudar para CANCELLED
if (newStatus === 'CANCELLED') {
  const consultation = await prisma.consultation.findUnique({
    where: { id: params.id },
    include: { patient: true, doctor: true },
  });

  if (consultation?.patient?.phone) {
    const message = `❌ *Consulta Cancelada*

Olá ${consultation.patient.name}! Sua consulta foi cancelada:

📅 Data: ${consultation.scheduledDate}
⏰ Horário: ${consultation.scheduledTime}
👨‍⚕️ Médico: ${consultation.doctor?.name || 'Não designado'}

Para reagendar, acesse sua área do paciente.

Cannabilize 💚`;

    await sendWhatsAppMessage({
      to: consultation.patient.phone,
      message,
    }).catch(console.error);
  }
}
```

**📱 Mensagem:**
```
❌ Consulta Cancelada

Olá [Nome]! Sua consulta foi cancelada:

📅 Data: [Data]
⏰ Horário: [Horário]

Para reagendar, acesse sua área do paciente.

Cannabilize 💚
```

**🎯 Benefício:** Paciente é informado imediatamente sobre cancelamentos.

---

### 10. **Pagamento Pendente** 🟢

**📍 Localização:** Criar novo arquivo `app/api/cron/send-payment-reminders/route.ts`

**🔄 Fluxo Atual:** Não existe

**✅ O que criar:**
```typescript
// Novo arquivo: app/api/cron/send-payment-reminders/route.ts
// Enviar lembrete 48h antes, 24h antes e no vencimento
```

**📱 Mensagem:**
```
💳 Pagamento Pendente

Olá [Nome]! Você possui um pagamento pendente:

💰 Valor: R$ [Valor]
📅 Vencimento: [Data]

⚠️ Sua consulta será confirmada após o pagamento.

🔗 Acesse sua área do paciente para realizar o pagamento.

Cannabilize 💚
```

**🎯 Benefício:** Reduz pagamentos em atraso.

---

### 11. **Carteirinha Aprovada** 🟢

**📍 Localização:** `app/api/admin/patient-cards/[id]/approve/route.ts`

**🔄 Fluxo Atual:** Apenas atualiza status no banco

**✅ O que adicionar:**
```typescript
// Após aprovar carteirinha
const patientCard = await prisma.patientCard.findUnique({
  where: { id: params.id },
  include: { patient: true },
});

if (patientCard?.patient?.phone) {
  const message = `✅ *Carteirinha Digital Aprovada!*

Olá ${patientCard.patient.name}! Sua carteirinha digital foi aprovada:

📄 *Número:* ${patientCard.cardNumber}
📅 *Emitida em:* ${new Date().toLocaleDateString('pt-BR')}
⏰ *Válida até:* ${patientCard.expiresAt ? new Date(patientCard.expiresAt).toLocaleDateString('pt-BR') : 'N/A'}

📱 Acesse sua área do paciente para visualizar sua carteirinha.

Cannabilize 💚`;

  await sendWhatsAppMessage({
    to: patientCard.patient.phone,
    message,
  }).catch(console.error);
}
```

**📱 Mensagem:**
```
✅ Carteirinha Digital Aprovada!

Olá [Nome]! Sua carteirinha digital foi aprovada:

📄 Número: [Número]
📅 Emitida em: [Data]

📱 Acesse sua área do paciente para visualizar.

Cannabilize 💚
```

**🎯 Benefício:** Paciente é notificado quando carteirinha está pronta.

---

### 12. **Botão de Contato** 🟢

**📍 Localização:** Várias páginas (footer, área do paciente, etc.)

**🔄 Fluxo Atual:** Não existe

**✅ O que criar:**
```tsx
// Componente: components/ui/WhatsAppButton.tsx
'use client';

export default function WhatsAppButton({ phone, message }: { phone: string; message?: string }) {
  const defaultMessage = encodeURIComponent('Olá! Gostaria de mais informações sobre a Cannabilize.');
  const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${message || defaultMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg z-50 flex items-center gap-2"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        {/* Ícone WhatsApp */}
      </svg>
      <span className="hidden sm:inline">Fale conosco</span>
    </a>
  );
}
```

**🎯 Benefício:** Facilita contato direto com suporte.

---

## 📊 Resumo de Implementação

### Prioridade Alta (Implementar Primeiro)
- ✅ Confirmação de Agendamento
- ✅ Confirmação de Pagamento
- ✅ Lembretes de Consulta (24h e 1h antes)
- ✅ Receita Emitida

### Prioridade Média (Implementar Depois)
- ✅ Convite para Adiantar Consulta
- ✅ Autorização ANVISA Aprovada
- ✅ Notificações para Médicos
- ✅ Notificações para Admin

### Prioridade Baixa (Futuro)
- ✅ Cancelamento de Consulta
- ✅ Pagamento Pendente
- ✅ Carteirinha Aprovada
- ✅ Botão de Contato

---

## 🗂️ Arquivos que Precisam ser Modificados/Criados

### Modificar:
1. `app/api/consultations/route.ts` - Adicionar WhatsApp após criar consulta
2. `app/api/payments/webhook/route.ts` - Adicionar WhatsApp após pagamento
3. `app/api/prescriptions/route.ts` - Adicionar WhatsApp após emitir receita
4. `app/api/consultations/[id]/reschedule-invite/route.ts` - Adicionar WhatsApp no convite
5. `app/api/anvisa/[id]/route.ts` - Adicionar WhatsApp quando aprovar
6. `lib/notifications.ts` - Implementar funções reais de WhatsApp

### Criar:
1. `app/api/cron/send-consultation-reminders/route.ts` - Job de lembretes
2. `app/api/cron/send-payment-reminders/route.ts` - Job de pagamentos pendentes
3. `lib/whatsapp-templates.ts` - Templates de mensagens
4. `components/ui/WhatsAppButton.tsx` - Botão flutuante de contato

---

## 🎯 Impacto Esperado

### Redução de No-Shows
- **Antes:** ~20-30% de pacientes não aparecem
- **Depois:** ~10-15% (redução de 50% com lembretes WhatsApp)

### Aumento de Engajamento
- **Email:** Taxa de abertura ~20-30%
- **WhatsApp:** Taxa de leitura ~90-95%

### Melhoria na Experiência
- Notificações instantâneas
- Maior confiança do paciente
- Redução de dúvidas e suporte

---

**Documento criado em:** 29/01/2026  
**Última atualização:** 29/01/2026
