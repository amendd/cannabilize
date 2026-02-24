# 💻 Exemplo Prático de Implementação - WhatsApp

Este documento contém exemplos de código práticos para implementar a integração do WhatsApp no Cannabilize.

---

## 📦 1. Instalação de Dependências

```bash
npm install twilio
# ou
npm install @whatsapp-business/api  # Para WhatsApp Business API oficial
```

---

## 🔧 2. Configuração de Variáveis de Ambiente

Adicionar ao `.env`:

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# WhatsApp Business API (alternativa)
WHATSAPP_BUSINESS_API_KEY=your_api_key
WHATSAPP_BUSINESS_API_SECRET=your_api_secret
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCESS_TOKEN=your_access_token

# Configurações
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=TWILIO  # ou WHATSAPP_BUSINESS
```

---

## 📝 3. Atualizar Schema do Prisma

```prisma
// Adicionar ao schema.prisma

model WhatsAppConfig {
  id              String    @id @default(uuid())
  provider        String    // "TWILIO", "WHATSAPP_BUSINESS", "EVOLUTION"
  enabled         Boolean   @default(false)
  accountSid      String?   @map("account_sid")
  authToken       String?   @map("auth_token")
  phoneNumber     String?   @map("phone_number")
  apiKey          String?   @map("api_key")
  apiSecret       String?   @map("api_secret")
  webhookUrl      String?   @map("webhook_url")
  webhookSecret   String?   @map("webhook_secret")
  config          String?   // JSON com configurações extras
  testPhone       String?   @map("test_phone")
  lastTestAt      DateTime? @map("last_test_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@unique([provider])
  @@map("whatsapp_configs")
}

model WhatsAppMessage {
  id                String    @id @default(uuid())
  to                String    // Número do destinatário (E.164)
  message           String    // Conteúdo da mensagem
  template          String?   // Nome do template (se aplicável)
  status            String    @default("PENDING") // PENDING, SENT, DELIVERED, FAILED, READ
  provider          String?   // Provedor usado
  providerMessageId String?   @map("provider_message_id")
  error             String?   // Mensagem de erro (se falhou)
  sentAt            DateTime? @map("sent_at")
  deliveredAt      DateTime? @map("delivered_at")
  readAt            DateTime? @map("read_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  @@index([to])
  @@index([status])
  @@index([createdAt])
  @@map("whatsapp_messages")
}
```

Depois executar:
```bash
npx prisma db push
```

---

## 🛠️ 4. Implementação com Twilio

### 4.1 Serviço Principal (`lib/whatsapp.ts`)

```typescript
import twilio from 'twilio';
import { prisma } from './prisma';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

export interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  parameters?: string[];
}

/**
 * Formata número de telefone para E.164
 */
export function formatPhoneNumber(phone: string): string {
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se começa com 0, remove
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Se não começa com código do país, adiciona 55 (Brasil)
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Adiciona o +
  return `+${cleaned}`;
}

/**
 * Valida se o número está no formato correto
 */
export function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Envia mensagem via WhatsApp usando Twilio
 */
export async function sendWhatsAppMessage(
  data: WhatsAppMessage
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Verificar se WhatsApp está habilitado
    if (process.env.WHATSAPP_ENABLED !== 'true') {
      console.log('WhatsApp desabilitado. Mensagem simulada:', data);
      return { success: true, messageId: 'simulated' };
    }

    // Validar número
    const formattedPhone = formatPhoneNumber(data.to);
    if (!isValidPhoneNumber(formattedPhone)) {
      throw new Error(`Número de telefone inválido: ${data.to}`);
    }

    // Salvar mensagem no banco (status PENDING)
    const dbMessage = await prisma.whatsAppMessage.create({
      data: {
        to: formattedPhone,
        message: data.message,
        template: data.template,
        status: 'PENDING',
        provider: 'TWILIO',
      },
    });

    // Enviar via Twilio
    const twilioMessage = await client.messages.create({
      from: fromNumber!,
      to: `whatsapp:${formattedPhone}`,
      body: data.message,
    });

    // Atualizar no banco com status SENT
    await prisma.whatsAppMessage.update({
      where: { id: dbMessage.id },
      data: {
        status: 'SENT',
        providerMessageId: twilioMessage.sid,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      messageId: twilioMessage.sid,
    };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    
    // Salvar erro no banco se a mensagem foi criada
    if (data.to) {
      try {
        const dbMessage = await prisma.whatsAppMessage.findFirst({
          where: { to: formatPhoneNumber(data.to) },
          orderBy: { createdAt: 'desc' },
        });
        
        if (dbMessage) {
          await prisma.whatsAppMessage.update({
            where: { id: dbMessage.id },
            data: {
              status: 'FAILED',
              error: error instanceof Error ? error.message : 'Erro desconhecido',
            },
          });
        }
      } catch (dbError) {
        console.error('Erro ao salvar erro no banco:', dbError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Envia mensagem usando template (requer template aprovado)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(to);
    
    const twilioMessage = await client.messages.create({
      from: fromNumber!,
      to: `whatsapp:${formattedPhone}`,
      contentSid: templateName, // ID do template no Twilio
      contentVariables: JSON.stringify({
        '1': parameters[0],
        '2': parameters[1],
        // ... mais parâmetros
      }),
    });

    return {
      success: true,
      messageId: twilioMessage.sid,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
```

---

### 4.2 Templates de Mensagens (`lib/whatsapp-templates.ts`)

```typescript
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ConsultationData {
  patientName: string;
  doctorName: string;
  date: Date | string;
  time: string;
  meetingLink?: string;
  platform?: string;
}

export interface PaymentData {
  patientName: string;
  amount: number;
  date: Date | string;
  transactionId?: string;
}

export interface PrescriptionData {
  patientName: string;
  doctorName: string;
  date: Date | string;
  medications?: string[];
}

/**
 * Template: Confirmação de Consulta Agendada
 */
export function getConsultationConfirmedMessage(data: ConsultationData): string {
  const dateStr = typeof data.date === 'string' 
    ? new Date(data.date).toLocaleDateString('pt-BR')
    : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  return `📅 *Consulta Agendada com Sucesso!*

Olá ${data.patientName}! Sua consulta foi confirmada:

👨‍⚕️ *Médico:* Dr. ${data.doctorName}
📅 *Data:* ${dateStr}
⏰ *Horário:* ${data.time}
${data.meetingLink ? `🔗 *Link:* ${data.meetingLink}` : ''}

${data.platform ? `💻 A consulta será realizada via ${data.platform}.` : ''}

Em caso de dúvidas, estamos à disposição.

Cannabilize 💚`;
}

/**
 * Template: Lembrete de Consulta (24h antes)
 */
export function getConsultationReminder24hMessage(data: ConsultationData): string {
  const dateStr = typeof data.date === 'string' 
    ? new Date(data.date).toLocaleDateString('pt-BR')
    : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  return `⏰ *Lembrete de Consulta*

Olá ${data.patientName}! Sua consulta está agendada para:

📅 *Data:* ${dateStr}
⏰ *Horário:* ${data.time}
👨‍⚕️ *Médico:* Dr. ${data.doctorName}
${data.meetingLink ? `🔗 *Link:* ${data.meetingLink}` : ''}

⚠️ A consulta começa em 24 horas!

Não esqueça de estar em um local tranquilo e com boa conexão de internet.

Cannabilize 💚`;
}

/**
 * Template: Lembrete de Consulta (1h antes)
 */
export function getConsultationReminder1hMessage(data: ConsultationData): string {
  return `⏰ *Lembrete de Consulta*

Olá ${data.patientName}! Sua consulta começa em 1 hora!

👨‍⚕️ *Médico:* Dr. ${data.doctorName}
⏰ *Horário:* ${data.time}
${data.meetingLink ? `🔗 *Link:* ${data.meetingLink}` : ''}

Por favor, esteja pronto para a consulta.

Cannabilize 💚`;
}

/**
 * Template: Confirmação de Pagamento
 */
export function getPaymentConfirmedMessage(data: PaymentData): string {
  const dateStr = typeof data.date === 'string' 
    ? new Date(data.date).toLocaleDateString('pt-BR')
    : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  return `✅ *Pagamento Confirmado!*

Olá ${data.patientName}! Seu pagamento foi processado:

💰 *Valor:* R$ ${data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📅 *Data:* ${dateStr}
${data.transactionId ? `📄 *ID:* ${data.transactionId}` : ''}

Sua consulta está confirmada!

Cannabilize 💚`;
}

/**
 * Template: Lembrete de Pagamento Pendente
 */
export function getPaymentReminderMessage(data: PaymentData & { dueDate: Date | string }): string {
  const dueDateStr = typeof data.dueDate === 'string' 
    ? new Date(data.dueDate).toLocaleDateString('pt-BR')
    : format(data.dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  return `💳 *Pagamento Pendente*

Olá ${data.patientName}! Você possui um pagamento pendente:

💰 *Valor:* R$ ${data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📅 *Vencimento:* ${dueDateStr}

⚠️ Sua consulta será confirmada após o pagamento.

🔗 Acesse sua área do paciente para realizar o pagamento.

Cannabilize 💚`;
}

/**
 * Template: Receita Emitida
 */
export function getPrescriptionIssuedMessage(data: PrescriptionData): string {
  const dateStr = typeof data.date === 'string' 
    ? new Date(data.date).toLocaleDateString('pt-BR')
    : format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  return `📋 *Receita Médica Emitida*

Olá ${data.patientName}! Sua receita foi emitida:

👨‍⚕️ *Médico:* Dr. ${data.doctorName}
📅 *Data:* ${dateStr}
${data.medications && data.medications.length > 0 
  ? `💊 *Medicamentos:* ${data.medications.join(', ')}` 
  : ''}

📄 Acesse sua área do paciente para visualizar e baixar a receita.

Cannabilize 💚`;
}

/**
 * Template: Convite para Adiantar Consulta
 */
export function getRescheduleInviteMessage(data: {
  patientName: string;
  doctorName: string;
  currentDate: string;
  currentTime: string;
  newDate: string;
  newTime: string;
  acceptLink: string;
  rejectLink: string;
}): string {
  return `🎯 *Oportunidade de Adiantar Consulta!*

Olá ${data.patientName}! O Dr. ${data.doctorName} tem disponibilidade para adiantar sua consulta:

📅 *Data Atual:* ${data.currentDate} às ${data.currentTime}
📅 *Nova Data:* ${data.newDate} às ${data.newTime}

✅ *Aceitar:* ${data.acceptLink}
❌ *Recusar:* ${data.rejectLink}

⏱️ Este convite é válido por 24 horas.

Cannabilize 💚`;
}
```

---

### 4.3 Atualizar Sistema de Notificações (`lib/notifications.ts`)

```typescript
import { sendWhatsAppMessage } from './whatsapp';
import {
  getConsultationConfirmedMessage,
  getPaymentConfirmedMessage,
  getPrescriptionIssuedMessage,
} from './whatsapp-templates';

// ... código existente ...

/**
 * Envia notificação por WhatsApp para Paciente
 */
export async function notifyPatientByWhatsApp(data: {
  patientName: string;
  patientPhone?: string;
  type: 'CONSULTATION_CONFIRMED' | 'PAYMENT_CONFIRMED' | 'PRESCRIPTION_ISSUED';
  consultationData?: any;
  paymentData?: any;
  prescriptionData?: any;
}) {
  try {
    if (!data.patientPhone) {
      console.log('Telefone do paciente não informado, pulando WhatsApp');
      return { success: false, error: 'Telefone não informado' };
    }

    let message = '';

    switch (data.type) {
      case 'CONSULTATION_CONFIRMED':
        message = getConsultationConfirmedMessage(data.consultationData);
        break;
      case 'PAYMENT_CONFIRMED':
        message = getPaymentConfirmedMessage(data.paymentData);
        break;
      case 'PRESCRIPTION_ISSUED':
        message = getPrescriptionIssuedMessage(data.prescriptionData);
        break;
      default:
        return { success: false, error: 'Tipo de notificação inválido' };
    }

    const result = await sendWhatsAppMessage({
      to: data.patientPhone,
      message,
    });

    return result;
  } catch (error) {
    console.error('Erro ao enviar WhatsApp para paciente:', error);
    return { success: false, error };
  }
}

// Atualizar função existente
export async function notifyAdminByWhatsApp(data: ConsultationNotificationData) {
  try {
    if (!data.adminPhone) {
      return { success: false, error: 'Telefone do admin não informado' };
    }

    const message = `🔔 *Nova Consulta Agendada*

👤 *Paciente:* ${data.patientName}
📧 Email: ${data.patientEmail}
📱 Telefone: ${data.patientPhone || 'Não informado'}

👨‍⚕️ *Médico:* ${data.doctorName}

📅 *Data:* ${new Date(data.scheduledDate).toLocaleDateString('pt-BR')}
⏰ *Horário:* ${data.scheduledTime}

ID: ${data.consultationId}`;

    const result = await sendWhatsAppMessage({
      to: data.adminPhone,
      message,
    });

    return result;
  } catch (error) {
    console.error('Erro ao enviar WhatsApp para admin:', error);
    return { success: false, error };
  }
}

// Similar para notifyDoctorByWhatsApp
```

---

### 4.4 Webhook para Status (`app/api/whatsapp/webhook/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const messageSid = body.get('MessageSid') as string;
    const messageStatus = body.get('MessageStatus') as string;
    const to = body.get('To') as string;

    // Validar assinatura do Twilio (recomendado em produção)
    // const signature = request.headers.get('x-twilio-signature');
    // const isValid = twilio.validateRequest(
    //   process.env.TWILIO_AUTH_TOKEN!,
    //   signature!,
    //   request.url,
    //   body
    // );

    // Atualizar status no banco
    const dbMessage = await prisma.whatsAppMessage.findFirst({
      where: { providerMessageId: messageSid },
    });

    if (dbMessage) {
      const updateData: any = {
        status: messageStatus.toUpperCase(),
      };

      if (messageStatus === 'delivered') {
        updateData.deliveredAt = new Date();
      } else if (messageStatus === 'read') {
        updateData.readAt = new Date();
      } else if (messageStatus === 'failed') {
        updateData.error = 'Falha na entrega';
      }

      await prisma.whatsAppMessage.update({
        where: { id: dbMessage.id },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no webhook do WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}
```

---

### 4.5 Integrar no Fluxo de Consultas (`app/api/consultations/route.ts`)

```typescript
// Adicionar após criar a consulta:

import { notifyPatientByWhatsApp } from '@/lib/notifications';
import { getConsultationConfirmedMessage } from '@/lib/whatsapp-templates';

// ... código existente ...

// Após criar a consulta, enviar WhatsApp para o paciente
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
    console.error('Erro ao enviar WhatsApp para paciente:', error);
  });
}
```

---

### 4.6 Job de Lembretes (`app/api/cron/send-consultation-reminders/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import {
  getConsultationReminder24hMessage,
  getConsultationReminder1hMessage,
} from '@/lib/whatsapp-templates';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (header secreto)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);

    // Consultas nas próximas 24h (mas não nas próximas 1h)
    const consultations24h = await prisma.consultation.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          gte: in1h,
          lte: in24h,
        },
        patient: {
          phone: { not: null },
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Consultas nas próximas 1h
    const consultations1h = await prisma.consultation.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          gte: now,
          lte: in1h,
        },
        patient: {
          phone: { not: null },
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Enviar lembretes de 24h
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
        }).catch(error => {
          console.error(`Erro ao enviar lembrete 24h para ${consultation.patient.phone}:`, error);
        });
      }
    }

    // Enviar lembretes de 1h
    for (const consultation of consultations1h) {
      if (consultation.patient.phone) {
        const message = getConsultationReminder1hMessage({
          patientName: consultation.patient.name,
          doctorName: consultation.doctor?.name || 'Não designado',
          date: consultation.scheduledAt,
          time: consultation.scheduledTime || '',
          meetingLink: consultation.meetingLink || undefined,
        });

        await sendWhatsAppMessage({
          to: consultation.patient.phone,
          message,
        }).catch(error => {
          console.error(`Erro ao enviar lembrete 1h para ${consultation.patient.phone}:`, error);
        });
      }
    }

    return NextResponse.json({
      success: true,
      reminders24h: consultations24h.length,
      reminders1h: consultations1h.length,
    });
  } catch (error) {
    console.error('Erro no job de lembretes:', error);
    return NextResponse.json(
      { error: 'Erro ao processar lembretes' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 5. Testes

### 5.1 Teste Manual

```typescript
// scripts/test-whatsapp.ts
import { sendWhatsAppMessage } from '../lib/whatsapp';

async function test() {
  const result = await sendWhatsAppMessage({
    to: '+5511999999999', // Seu número de teste
    message: 'Teste de integração WhatsApp Cannabilize! 🚀',
  });

  console.log('Resultado:', result);
}

test();
```

Executar:
```bash
npx tsx scripts/test-whatsapp.ts
```

---

## 📋 6. Checklist de Implementação

- [ ] Instalar dependências (`twilio`)
- [ ] Adicionar variáveis de ambiente
- [ ] Atualizar schema do Prisma
- [ ] Executar `npx prisma db push`
- [ ] Implementar `lib/whatsapp.ts`
- [ ] Criar templates em `lib/whatsapp-templates.ts`
- [ ] Atualizar `lib/notifications.ts`
- [ ] Criar webhook em `app/api/whatsapp/webhook/route.ts`
- [ ] Integrar no fluxo de consultas
- [ ] Criar job de lembretes
- [ ] Configurar cron job (Vercel Cron ou externo)
- [ ] Testar com número real
- [ ] Configurar webhook URL no Twilio
- [ ] Monitorar primeiras mensagens

---

**Pronto para começar!** 🚀
