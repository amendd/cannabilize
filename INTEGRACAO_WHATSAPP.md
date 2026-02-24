# 📱 Integração WhatsApp - Cannabilize

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Tipos de Integração](#tipos-de-integração)
3. [Casos de Uso no Cannabilize](#casos-de-uso-no-cannalize)
4. [Comparação de Soluções](#comparação-de-soluções)
5. [Etapas de Implementação](#etapas-de-implementação)
6. [Arquitetura Técnica](#arquitetura-técnica)
7. [Segurança e Compliance](#segurança-e-compliance)
8. [Custos Estimados](#custos-estimados)

---

## 🎯 Visão Geral

A integração do WhatsApp no Cannabilize permitirá:
- **Notificações automáticas** para pacientes, médicos e administradores
- **Lembretes de consultas** com links de telemedicina
- **Confirmações de pagamento** e atualizações de status
- **Notificações de receitas** e autorizações ANVISA
- **Suporte ao cliente** via chat automatizado
- **Campanhas de marketing** (com consentimento)

---

## 🔌 Tipos de Integração

### 1. **WhatsApp Business API (Oficial)**
**Fornecedor:** Meta/Facebook

**Características:**
- ✅ API oficial e estável
- ✅ Suporte a templates aprovados
- ✅ Alta confiabilidade
- ✅ Compliance com políticas do WhatsApp
- ❌ Processo de aprovação complexo
- ❌ Custo mais alto
- ❌ Requer verificação de negócio

**Ideal para:** Produção em larga escala, empresas estabelecidas

**Custos:** ~$0.005-0.09 por mensagem (varia por país)

---

### 2. **Twilio WhatsApp API**
**Fornecedor:** Twilio

**Características:**
- ✅ Fácil integração
- ✅ Documentação excelente
- ✅ Suporte a templates
- ✅ Webhooks confiáveis
- ✅ SDK em múltiplas linguagens
- ⚠️ Custo médio
- ⚠️ Requer aprovação de templates

**Ideal para:** Startups, empresas que já usam Twilio

**Custos:** ~$0.005-0.09 por mensagem + custo base

---

### 3. **Evolution API**
**Fornecedor:** Open Source / Serviços hospedados

**Características:**
- ✅ Open source (gratuito)
- ✅ Flexibilidade total
- ✅ Sem limitações de templates
- ✅ Pode usar número pessoal
- ❌ Não oficial (risco de banimento)
- ❌ Requer servidor próprio
- ❌ Manutenção necessária
- ❌ Pode violar ToS do WhatsApp

**Ideal para:** Desenvolvimento, testes, pequenos volumes

**Custos:** Gratuito (mas requer infraestrutura)

---

### 4. **Z-API / Baileys**
**Fornecedor:** Comunidade Open Source

**Características:**
- ✅ Gratuito
- ✅ Flexível
- ❌ Não oficial
- ❌ Alto risco de banimento
- ❌ Instável
- ❌ Requer manutenção constante

**Ideal para:** Apenas desenvolvimento/testes

**Custos:** Gratuito (mas arriscado)

---

### 5. **ChatAPI / Wati / Outras Plataformas**
**Fornecedor:** Terceiros especializados

**Características:**
- ✅ Interface amigável
- ✅ Funcionalidades extras (chatbot, CRM)
- ✅ Suporte especializado
- ⚠️ Custo variável
- ⚠️ Dependência de terceiros

**Ideal para:** Empresas que precisam de solução completa

**Custos:** Variam (geralmente $50-500/mês + mensagens)

---

## 🎯 Casos de Uso no Cannabilize

### **1. Notificações de Consultas**

#### 1.1 Confirmação de Agendamento
```
📅 Consulta Agendada com Sucesso!

Olá [Nome]! Sua consulta foi confirmada:

👨‍⚕️ Médico: Dr. [Nome]
📅 Data: [Data]
⏰ Horário: [Horário]
🔗 Link: [Link da Telemedicina]

Lembre-se: A consulta será realizada via [Plataforma].
```

**Quando:** Imediatamente após agendamento

---

#### 1.2 Lembrete de Consulta
```
⏰ Lembrete de Consulta

Olá [Nome]! Sua consulta está agendada para:

📅 [Data] às [Horário]
👨‍⚕️ Dr. [Nome]
🔗 Link: [Link]

⚠️ A consulta começa em 1 hora!
```

**Quando:** 24h antes e 1h antes da consulta

---

#### 1.3 Convite para Adiantar Consulta
```
🎯 Oportunidade de Adiantar Consulta!

Olá [Nome]! O Dr. [Nome] tem disponibilidade para adiantar sua consulta:

📅 Data Atual: [Data Atual]
📅 Nova Data: [Nova Data]
⏰ Novo Horário: [Novo Horário]

✅ Aceitar: [Link]
❌ Recusar: [Link]

⏱️ Válido por 24 horas
```

**Quando:** Quando médico propõe adiantamento

---

### **2. Notificações de Pagamento**

#### 2.1 Confirmação de Pagamento
```
✅ Pagamento Confirmado!

Olá [Nome]! Seu pagamento foi processado:

💰 Valor: R$ [Valor]
📅 Data: [Data]
📄 ID: [Transaction ID]

Sua consulta está confirmada!
```

**Quando:** Após confirmação do webhook do Stripe

---

#### 2.2 Lembrete de Pagamento Pendente
```
💳 Pagamento Pendente

Olá [Nome]! Você possui um pagamento pendente:

💰 Valor: R$ [Valor]
📅 Vencimento: [Data]
🔗 Pagar: [Link]

⚠️ Sua consulta será confirmada após o pagamento.
```

**Quando:** 48h antes do vencimento, 24h antes, no vencimento

---

### **3. Notificações de Receitas**

#### 3.1 Receita Emitida
```
📋 Receita Médica Emitida

Olá [Nome]! Sua receita foi emitida:

👨‍⚕️ Médico: Dr. [Nome]
📅 Data: [Data]
💊 Medicamentos: [Lista]

📄 Ver Receita: [Link]
📱 Baixar PDF: [Link]
```

**Quando:** Após médico emitir receita

---

#### 3.2 Autorização ANVISA Aprovada
```
✅ Autorização ANVISA Aprovada!

Olá [Nome]! Sua autorização foi aprovada:

📄 Número: [Número ANVISA]
📅 Aprovada em: [Data]
⏰ Válida até: [Data]

📋 Ver Detalhes: [Link]
```

**Quando:** Quando status muda para "APPROVED"

---

### **4. Notificações para Médicos**

#### 4.1 Nova Consulta Designada
```
🔔 Nova Consulta Designada

Dr. [Nome]! Você foi designado para uma nova consulta:

👤 Paciente: [Nome]
📧 Email: [Email]
📱 Telefone: [Telefone]
📅 Data: [Data]
⏰ Horário: [Horário]

📋 Ver Detalhes: [Link]
```

**Quando:** Quando admin designa médico para consulta

---

#### 4.2 Consulta Cancelada pelo Paciente
```
❌ Consulta Cancelada

Dr. [Nome]! A consulta foi cancelada:

👤 Paciente: [Nome]
📅 Data: [Data]
⏰ Horário: [Horário]

Motivo: [Motivo]
```

**Quando:** Quando paciente cancela consulta

---

### **5. Notificações para Administradores**

#### 5.1 Nova Consulta Agendada
```
🔔 Nova Consulta Agendada

Nova consulta no sistema:

👤 Paciente: [Nome]
👨‍⚕️ Médico: [Nome] (ou "Não designado")
📅 Data: [Data]
⏰ Horário: [Horário]
💰 Valor: R$ [Valor]

📋 Ver: [Link Admin]
```

**Quando:** Toda vez que consulta é criada

---

### **6. Chatbot de Suporte (Futuro)**

#### 6.1 Atendimento Automatizado
```
🤖 Olá! Sou o assistente virtual da Cannabilize.

Como posso ajudar?
1️⃣ Agendar consulta
2️⃣ Ver status de pagamento
3️⃣ Ver receitas
4️⃣ Falar com atendente
```

**Quando:** Quando usuário inicia conversa

---

## 📊 Comparação de Soluções

| Critério | WhatsApp Business API | Twilio | Evolution API | ChatAPI/Wati |
|----------|----------------------|--------|--------------|--------------|
| **Custo Inicial** | Médio | Baixo | Baixo | Médio |
| **Custo por Mensagem** | $0.005-0.09 | $0.005-0.09 | Gratuito | Variável |
| **Facilidade Setup** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Confiabilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Compliance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ |
| **Templates** | ✅ | ✅ | ❌ | ✅ |
| **Webhooks** | ✅ | ✅ | ✅ | ✅ |
| **Suporte** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Risco de Ban** | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 🚀 Etapas de Implementação

### **FASE 1: Planejamento e Preparação** (Semana 1)

#### 1.1 Escolher Provedor
- [ ] Analisar volume estimado de mensagens
- [ ] Comparar custos vs. orçamento
- [ ] Avaliar necessidade de templates
- [ ] Decidir: Twilio ou WhatsApp Business API

**Recomendação:** Começar com **Twilio** (mais fácil) e migrar para **WhatsApp Business API** quando escalar

---

#### 1.2 Configurar Conta
- [ ] Criar conta no provedor escolhido
- [ ] Verificar número de telefone
- [ ] Configurar webhook URL
- [ ] Obter API keys/tokens
- [ ] Configurar variáveis de ambiente

---

#### 1.3 Criar Templates (se necessário)
- [ ] Template: Confirmação de Consulta
- [ ] Template: Lembrete de Consulta
- [ ] Template: Confirmação de Pagamento
- [ ] Template: Receita Emitida
- [ ] Submeter templates para aprovação (pode levar 24-48h)

---

### **FASE 2: Desenvolvimento Backend** (Semana 2-3)

#### 2.1 Atualizar Schema do Banco
```prisma
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
  id              String    @id @default(uuid())
  to              String    // Número do destinatário
  message         String    // Conteúdo da mensagem
  template        String?   // Nome do template (se aplicável)
  status          String    @default("PENDING") // PENDING, SENT, DELIVERED, FAILED
  provider        String?   // Provedor usado
  providerMessageId String? @map("provider_message_id")
  error           String?   // Mensagem de erro (se falhou)
  sentAt          DateTime? @map("sent_at")
  deliveredAt     DateTime? @map("delivered_at")
  readAt          DateTime? @map("read_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@index([to])
  @@index([status])
  @@index([createdAt])
  @@map("whatsapp_messages")
}
```

---

#### 2.2 Implementar Serviço WhatsApp
**Arquivo:** `lib/whatsapp.ts`

```typescript
// Estrutura básica (implementar com Twilio ou outro)
export interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
  parameters?: string[];
}

export async function sendWhatsAppMessage(data: WhatsAppMessage): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  // Implementação com Twilio/WhatsApp Business API
}
```

---

#### 2.3 Criar Templates de Mensagens
**Arquivo:** `lib/whatsapp-templates.ts`

```typescript
export const whatsappTemplates = {
  consultationConfirmed: (data: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    meetingLink: string;
  }) => `...`,
  
  consultationReminder: (data: {...}) => `...`,
  
  paymentConfirmed: (data: {...}) => `...`,
  
  // ... outros templates
};
```

---

#### 2.4 Integrar com Sistema de Notificações
**Arquivo:** `lib/notifications.ts`

Atualizar funções existentes:
- `notifyAdminByWhatsApp()` → Implementar envio real
- `notifyDoctorByWhatsApp()` → Implementar envio real
- Criar `notifyPatientByWhatsApp()` → Nova função

---

#### 2.5 Criar API Routes
**Arquivo:** `app/api/whatsapp/send/route.ts`
- Endpoint para enviar mensagens manualmente (admin)

**Arquivo:** `app/api/whatsapp/webhook/route.ts`
- Webhook para receber status de entrega
- Webhook para receber mensagens (futuro chatbot)

---

### **FASE 3: Integração com Fluxos Existentes** (Semana 3-4)

#### 3.1 Agendamento de Consultas
**Arquivo:** `app/api/consultations/route.ts`
- Adicionar envio de WhatsApp após criar consulta
- Enviar para paciente, médico e admin

---

#### 3.2 Pagamentos
**Arquivo:** `app/api/payments/webhook/route.ts`
- Enviar WhatsApp quando pagamento é confirmado
- Enviar lembrete quando pagamento está pendente

---

#### 3.3 Receitas
**Arquivo:** `app/api/prescriptions/route.ts`
- Enviar WhatsApp quando receita é emitida
- Enviar quando autorização ANVISA é aprovada

---

#### 3.4 Convites de Adiantamento
**Arquivo:** `app/api/consultations/reschedule-invite/route.ts`
- Enviar WhatsApp com link do convite

---

### **FASE 4: Sistema de Lembretes** (Semana 4-5)

#### 4.1 Criar Job de Lembretes
**Arquivo:** `app/api/cron/send-consultation-reminders/route.ts`
- Verificar consultas nas próximas 24h
- Verificar consultas nas próximas 1h
- Enviar WhatsApp para pacientes

---

#### 4.2 Configurar Cron Jobs
**Arquivo:** `vercel.json` ou serviço externo (Cron-job.org, etc.)
- Executar job de lembretes a cada hora
- Executar job de pagamentos pendentes diariamente

---

### **FASE 5: Interface Administrativa** (Semana 5-6)

#### 5.1 Página de Configuração
**Arquivo:** `app/admin/whatsapp/page.tsx`
- Configurar credenciais
- Testar envio
- Ver histórico de mensagens
- Ver estatísticas

---

#### 5.2 Dashboard de Mensagens
- Listar todas as mensagens enviadas
- Filtrar por status, destinatário, data
- Ver detalhes de cada mensagem
- Reenviar mensagens falhadas

---

### **FASE 6: Testes e Validação** (Semana 6-7)

#### 6.1 Testes Unitários
- Testar templates de mensagens
- Testar formatação de números
- Testar tratamento de erros

---

#### 6.2 Testes de Integração
- Testar envio em cada fluxo
- Testar webhooks
- Testar lembretes automáticos

---

#### 6.3 Testes com Usuários Reais
- Enviar para números de teste
- Validar formatação e conteúdo
- Coletar feedback

---

### **FASE 7: Deploy e Monitoramento** (Semana 7-8)

#### 7.1 Deploy
- Configurar variáveis de ambiente em produção
- Testar em ambiente de produção
- Monitorar primeiras mensagens

---

#### 7.2 Monitoramento
- Configurar logs estruturados
- Alertas para falhas
- Dashboard de métricas

---

## 🏗️ Arquitetura Técnica

### **Fluxo de Envio de Mensagem**

```
1. Evento no Sistema (ex: consulta agendada)
   ↓
2. Sistema de Notificações (lib/notifications.ts)
   ↓
3. Serviço WhatsApp (lib/whatsapp.ts)
   ↓
4. Salvar no Banco (WhatsAppMessage)
   ↓
5. Enviar via API (Twilio/WhatsApp Business)
   ↓
6. Webhook recebe status
   ↓
7. Atualizar status no banco
```

### **Estrutura de Arquivos**

```
lib/
  ├── whatsapp.ts              # Serviço principal
  ├── whatsapp-templates.ts    # Templates de mensagens
  └── whatsapp-utils.ts        # Utilitários (formatação, validação)

app/api/whatsapp/
  ├── send/route.ts            # Endpoint para envio manual
  ├── webhook/route.ts         # Webhook do provedor
  └── templates/route.ts       # Gerenciar templates

app/admin/whatsapp/
  ├── page.tsx                 # Configuração e dashboard
  └── messages/page.tsx        # Histórico de mensagens

app/api/cron/
  ├── send-consultation-reminders/route.ts
  └── send-payment-reminders/route.ts
```

---

## 🔒 Segurança e Compliance

### **1. Proteção de Dados**
- ✅ Nunca armazenar mensagens completas com dados sensíveis
- ✅ Criptografar tokens/credenciais
- ✅ Validar números de telefone
- ✅ Rate limiting para evitar spam

### **2. LGPD Compliance**
- ✅ Obter consentimento explícito para WhatsApp
- ✅ Permitir opt-out fácil
- ✅ Armazenar histórico de consentimentos
- ✅ Permitir exclusão de dados

### **3. Validações**
- ✅ Validar formato de número (E.164)
- ✅ Verificar se número está no WhatsApp
- ✅ Validar templates antes de enviar
- ✅ Tratar erros graciosamente

---

## 💰 Custos Estimados

### **Cenário: 100 consultas/mês, 500 mensagens/mês**

#### **Twilio:**
- Custo base: $0
- Mensagens: 500 × $0.005 = **$2.50/mês**
- **Total: ~$2.50/mês**

#### **WhatsApp Business API:**
- Custo base: $0
- Mensagens: 500 × $0.005 = **$2.50/mês**
- **Total: ~$2.50/mês**

#### **Evolution API:**
- Custo base: $0 (mas requer servidor)
- Servidor: ~$10-20/mês
- **Total: ~$10-20/mês**

### **Cenário: 1000 consultas/mês, 5000 mensagens/mês**

#### **Twilio/WhatsApp Business:**
- Mensagens: 5000 × $0.005 = **$25/mês**

#### **Evolution API:**
- Servidor: ~$20-40/mês
- **Total: ~$20-40/mês**

---

## 📝 Próximos Passos

1. **Decidir provedor** (recomendação: Twilio para começar)
2. **Criar conta e configurar** número de teste
3. **Implementar FASE 2** (desenvolvimento backend)
4. **Testar com números reais**
5. **Integrar com fluxos existentes** (FASE 3)
6. **Implementar lembretes automáticos** (FASE 4)
7. **Criar interface admin** (FASE 5)
8. **Deploy e monitoramento** (FASE 7)

---

## 🎯 Recomendações Finais

### **Para Começar:**
1. Use **Twilio** - mais fácil de integrar, boa documentação
2. Comece com **notificações simples** (confirmação de consulta)
3. **Teste extensivamente** antes de produção
4. **Monitore custos** nos primeiros meses

### **Para Escalar:**
1. Migre para **WhatsApp Business API** quando volume aumentar
2. Implemente **chatbot** para suporte
3. Use **templates aprovados** para melhor deliverability
4. Configure **webhooks** para rastreamento completo

### **Boas Práticas:**
- ✅ Sempre obtenha consentimento
- ✅ Personalize mensagens com nome do usuário
- ✅ Inclua links relevantes
- ✅ Use emojis com moderação
- ✅ Teste em diferentes dispositivos
- ✅ Monitore taxa de entrega
- ✅ Respeite horários comerciais

---

**Documento criado em:** 29/01/2026  
**Última atualização:** 29/01/2026
