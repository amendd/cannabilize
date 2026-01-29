# 🎯 Sistema de Convites para Adiantar Consultas

**Data:** 28 de Janeiro de 2026

---

## 📋 Visão Geral

Sistema que permite aos médicos enviarem convites aos pacientes para adiantar suas consultas quando novos horários ficam disponíveis. O paciente pode aceitar ou recusar o convite, e o sistema gerencia automaticamente a remarcação.

---

## 🎯 Objetivos

1. **Melhorar utilização de horários**: Preencher slots que ficaram disponíveis
2. **Reduzir tempo de espera**: Pacientes podem ser atendidos mais cedo
3. **Aumentar satisfação**: Pacientes se sentem valorizados com a oportunidade
4. **Otimizar agenda médica**: Melhor distribuição de consultas

---

## 🗄️ Modelo de Dados

### Novo Modelo: `ConsultationRescheduleInvite`

```prisma
model ConsultationRescheduleInvite {
  id                String   @id @default(uuid())
  consultationId    String   @map("consultation_id")
  patientId         String   @map("patient_id")
  doctorId          String   @map("doctor_id")
  
  // Horário atual da consulta
  currentScheduledAt DateTime @map("current_scheduled_at")
  
  // Novo horário proposto
  newScheduledAt     DateTime @map("new_scheduled_at")
  newScheduledDate   String   @map("new_scheduled_date") // YYYY-MM-DD
  newScheduledTime   String   @map("new_scheduled_time") // HH:MM
  
  // Status do convite
  status            String   @default("PENDING") // PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED
  
  // Mensagem opcional do médico
  message           String?  // Mensagem personalizada do médico
  
  // Metadados
  expiresAt         DateTime @map("expires_at") // Expira em 5 minutos por padrão
  respondedAt       DateTime? @map("responded_at")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  // Relações
  consultation      Consultation @relation(fields: [consultationId], references: [id], onDelete: Cascade)
  patient           User          @relation(fields: [patientId], references: [id])
  doctor            Doctor        @relation(fields: [doctorId], references: [id])
  
  @@index([consultationId])
  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@index([expiresAt])
  @@map("consultation_reschedule_invites")
}
```

**Status possíveis:**
- `PENDING`: Convite enviado, aguardando resposta do paciente
- `ACCEPTED`: Paciente aceitou, consulta foi remarcada
- `REJECTED`: Paciente recusou o convite
- `EXPIRED`: Convite expirou (5 minutos sem resposta)
- `CANCELLED`: Médico cancelou o convite (horário foi ocupado)

---

## 🔄 Fluxo de Funcionamento

### Cenário 1: Médico Envia Convite Manualmente

1. **Médico visualiza consultas futuras** no dashboard
2. **Médico identifica horário disponível** mais próximo
3. **Médico clica em "Sugerir Adiantamento"** na consulta
4. **Sistema mostra horários disponíveis** mais próximos que o atual
5. **Médico seleciona novo horário** e opcionalmente adiciona mensagem
6. **Sistema cria convite** com status `PENDING`
7. **Email de notificação** é enviado ao paciente
8. **Paciente recebe notificação** no dashboard e por email
9. **Paciente aceita ou recusa** o convite
10. **Se aceito**: Sistema remarca consulta automaticamente
11. **Se recusado**: Convite fica como `REJECTED`, consulta mantém horário original

### Cenário 2: Detecção Automática de Oportunidades

1. **Sistema monitora** horários que ficam disponíveis (cancelamentos, etc.)
2. **Sistema identifica** consultas que poderiam ser adiantadas
3. **Sistema sugere ao médico** enviar convite (opcional - pode ser automático no futuro)
4. **Médico revisa e envia** ou sistema envia automaticamente

---

## 🛠️ Implementação Técnica

### 1. Atualização do Schema Prisma

**Arquivo:** `prisma/schema.prisma`

Adicionar o novo modelo e atualizar relações:

```prisma
// No modelo Consultation, adicionar:
rescheduleInvites ConsultationRescheduleInvite[]

// No modelo User, adicionar:
rescheduleInvites ConsultationRescheduleInvite[]

// No modelo Doctor, adicionar:
rescheduleInvites ConsultationRescheduleInvite[]
```

### 2. API: Criar Convite (Médico)

**Endpoint:** `POST /api/consultations/[id]/reschedule-invite`

**Permissões:** Apenas médicos (dono da consulta ou admin)

**Request Body:**
```typescript
{
  newScheduledDate: string; // YYYY-MM-DD
  newScheduledTime: string; // HH:MM
  message?: string; // Mensagem opcional
}
```

**Validações:**
- Novo horário deve ser antes do horário atual
- Novo horário deve estar disponível
- Consulta deve estar com status `SCHEDULED`
- Não pode haver outro convite pendente para a mesma consulta
- Novo horário não pode ser no passado

**Response:**
```typescript
{
  id: string;
  consultationId: string;
  newScheduledAt: string;
  expiresAt: string;
  message: string | null;
}
```

### 3. API: Listar Convites Pendentes (Paciente)

**Endpoint:** `GET /api/patient/reschedule-invites`

**Permissões:** Paciente autenticado

**Response:**
```typescript
{
  invites: Array<{
    id: string;
    consultationId: string;
    currentScheduledAt: string;
    newScheduledAt: string;
    newScheduledDate: string;
    newScheduledTime: string;
    message: string | null;
    expiresAt: string;
    doctor: {
      id: string;
      name: string;
    };
    consultation: {
      id: string;
      status: string;
    };
  }>;
}
```

### 4. API: Responder Convite (Paciente)

**Endpoint:** `POST /api/reschedule-invites/[id]/respond`

**Permissões:** Paciente (dono do convite)

**Request Body:**
```typescript
{
  action: 'ACCEPT' | 'REJECT';
}
```

**Validações:**
- Convite deve estar com status `PENDING`
- Convite não deve ter expirado (expira em 5 minutos)
- Novo horário ainda deve estar disponível (se ACCEPT)

**Ações:**
- **ACCEPT**: 
  - Atualiza `scheduledAt` da consulta
  - Atualiza `scheduledDate` e `scheduledTime`
  - Marca convite como `ACCEPTED`
  - Envia email de confirmação
  - Cancela outros convites pendentes da mesma consulta
  
- **REJECT**:
  - Marca convite como `REJECTED`
  - Envia email de notificação (opcional)

**Response:**
```typescript
{
  success: boolean;
  consultation?: {
    id: string;
    scheduledAt: string;
    scheduledDate: string;
    scheduledTime: string;
  };
}
```

### 5. API: Listar Convites Enviados (Médico)

**Endpoint:** `GET /api/doctor/reschedule-invites`

**Permissões:** Médico autenticado

**Query Params:**
- `status?`: Filtrar por status
- `limit?`: Limite de resultados

**Response:**
```typescript
{
  invites: Array<{
    id: string;
    consultationId: string;
    patient: {
      id: string;
      name: string;
      email: string;
    };
    currentScheduledAt: string;
    newScheduledAt: string;
    status: string;
    expiresAt: string;
    respondedAt: string | null;
  }>;
}
```

### 6. API: Cancelar Convite (Médico)

**Endpoint:** `POST /api/reschedule-invites/[id]/cancel`

**Permissões:** Médico (dono do convite) ou Admin

**Validações:**
- Convite deve estar com status `PENDING`

**Ações:**
- Marca convite como `CANCELLED`
- Envia email ao paciente informando cancelamento (opcional)

### 7. Job Automático: Expirar Convites

**Endpoint:** `POST /api/cron/expire-reschedule-invites` (interno)

**Frequência:** A cada hora

**Ações:**
- Busca convites com status `PENDING` e `expiresAt < now()`
- Marca como `EXPIRED`
- Loga para análise

---

## 📧 Templates de Email

### 1. Convite Enviado ao Paciente

**Template:** `RESCHEDULE_INVITE`

**Variáveis:**
- `{{patientName}}`
- `{{doctorName}}`
- `{{currentDateTime}}`
- `{{newDateTime}}`
- `{{message}}` (opcional)
- `{{acceptUrl}}`
- `{{rejectUrl}}`
- `{{expiresAt}}`

**Assunto:** "Oportunidade: Adiantar sua consulta com {{doctorName}}"

**Conteúdo:**
```
Olá {{patientName}},

O Dr(a). {{doctorName}} identificou um horário disponível mais próximo e gostaria de sugerir adiantar sua consulta.

📅 **Horário Atual:** {{currentDateTime}}
📅 **Novo Horário Proposto:** {{newDateTime}}

{{#if message}}
💬 **Mensagem do médico:**
{{message}}
{{/if}}

Você tem até {{expiresAt}} para responder.

[Botão: Aceitar Convite] [Botão: Recusar]
```

### 2. Convite Aceito

**Template:** `RESCHEDULE_INVITE_ACCEPTED`

**Variáveis:**
- `{{patientName}}`
- `{{doctorName}}`
- `{{newDateTime}}`
- `{{meetingLink}}` (se disponível)

**Assunto:** "Consulta remarcada com sucesso"

### 3. Convite Recusado (Notificação ao Médico)

**Template:** `RESCHEDULE_INVITE_REJECTED` (para médico)

**Variáveis:**
- `{{doctorName}}`
- `{{patientName}}`
- `{{currentDateTime}}`
- `{{newDateTime}}`

**Assunto:** "Paciente manteve horário original"

### 4. Convite Expirado (Notificação ao Médico)

**Template:** `RESCHEDULE_INVITE_EXPIRED` (para médico)

**Variáveis:**
- `{{doctorName}}`
- `{{patientName}}`
- `{{newDateTime}}`

---

## 🎨 Interface do Usuário

### Dashboard do Médico

**Localização:** `app/medico/page.tsx` e `app/medico/consultas/page.tsx`

**Funcionalidades:**
1. **Botão "Sugerir Adiantamento"** em cada consulta futura
2. **Modal de seleção de horário** com:
   - Lista de horários disponíveis antes do atual
   - Campo opcional para mensagem
   - Preview do novo horário
3. **Lista de convites enviados** com status
4. **Notificação** quando paciente responde

**Componente:** `components/medico/RescheduleInviteModal.tsx`

### Dashboard do Paciente

**Localização:** `app/paciente/consultas/page.tsx` e `app/paciente/page.tsx`

**Funcionalidades:**
1. **Card de convites pendentes** no topo da página
2. **Lista de convites** com:
   - Horário atual vs novo horário
   - Mensagem do médico (se houver)
   - Botões Aceitar/Recusar
   - Contador de tempo restante
3. **Notificação visual** (badge) quando há convites pendentes

**Componente:** `components/patient/RescheduleInviteCard.tsx`

---

## 🔍 Detecção Automática de Oportunidades (Futuro)

### Lógica de Sugestão

1. **Monitorar cancelamentos** de consultas
2. **Identificar consultas** que poderiam ser adiantadas:
   - Consultas agendadas para > 24h no futuro
   - Horário cancelado está antes do horário atual da consulta
   - Paciente não tem outros convites pendentes
3. **Sugerir ao médico** ou enviar automaticamente (configurável)

**Endpoint Futuro:** `GET /api/doctor/reschedule-opportunities`

---

## 📊 Métricas e Analytics

### KPIs para Acompanhar

1. **Taxa de aceitação**: % de convites aceitos
2. **Tempo médio de resposta**: Tempo entre envio e resposta
3. **Horários recuperados**: Quantos slots foram preenchidos
4. **Satisfação**: Feedback dos pacientes sobre a funcionalidade

---

## 🚀 Fases de Implementação

### Fase 1: MVP (Semana 1-2)
- ✅ Modelo de dados
- ✅ API de criar convite (manual)
- ✅ API de responder convite
- ✅ Email de convite
- ✅ Interface básica no dashboard do paciente

### Fase 2: Melhorias (Semana 3)
- ✅ Interface completa no dashboard do médico
- ✅ Lista de convites enviados
- ✅ Cancelamento de convites
- ✅ Job de expiração automática

### Fase 3: Otimizações (Semana 4)
- ✅ Detecção automática de oportunidades
- ✅ Notificações push (se implementado)
- ✅ Analytics e métricas
- ✅ Melhorias de UX

---

## 🔐 Segurança e Validações

### Validações Críticas

1. **Horário disponível**: Verificar se novo horário realmente está livre
2. **Antecedência mínima**: Respeitar regras de antecedência (30min/2h)
3. **Conflitos**: Não permitir múltiplos convites simultâneos
4. **Permissões**: Médico só pode convidar suas próprias consultas
5. **Expiração**: Convites expiram em 24h

### Prevenção de Abusos

1. **Rate limiting**: Limitar número de convites por médico/dia
2. **Validação de horário**: Sempre verificar disponibilidade antes de aceitar
3. **Logs**: Registrar todas as ações para auditoria

---

## 📝 Exemplo de Uso

### Médico Envia Convite

```typescript
// POST /api/consultations/abc123/reschedule-invite
{
  "newScheduledDate": "2026-01-29",
  "newScheduledTime": "14:00",
  "message": "Identifiquei um horário disponível mais cedo. Gostaria de adiantar sua consulta?"
}
```

### Paciente Aceita

```typescript
// POST /api/reschedule-invites/xyz789/respond
{
  "action": "ACCEPT"
}
```

**Resultado:**
- Consulta `abc123` é atualizada:
  - `scheduledAt`: `2026-01-29T14:00:00Z`
  - `scheduledDate`: `2026-01-29`
  - `scheduledTime`: `14:00`
- Convite `xyz789` marcado como `ACCEPTED`
- Email de confirmação enviado

---

## 🎯 Benefícios Esperados

1. **Para Pacientes:**
   - Atendimento mais rápido
   - Sensação de ser valorizado
   - Flexibilidade na agenda

2. **Para Médicos:**
   - Melhor aproveitamento de horários
   - Redução de gaps na agenda
   - Maior produtividade

3. **Para a Plataforma:**
   - Maior satisfação dos usuários
   - Melhor utilização de recursos
   - Diferencial competitivo

---

## 📚 Arquivos a Criar/Modificar

### Novos Arquivos
1. `app/api/consultations/[id]/reschedule-invite/route.ts`
2. `app/api/reschedule-invites/[id]/respond/route.ts`
3. `app/api/patient/reschedule-invites/route.ts`
4. `app/api/doctor/reschedule-invites/route.ts`
5. `app/api/reschedule-invites/[id]/cancel/route.ts`
6. `app/api/cron/expire-reschedule-invites/route.ts`
7. `components/medico/RescheduleInviteModal.tsx`
8. `components/patient/RescheduleInviteCard.tsx`
9. `lib/reschedule-invites.ts` (funções auxiliares)

### Arquivos a Modificar
1. `prisma/schema.prisma` - Adicionar modelo
2. `app/medico/page.tsx` - Adicionar botão e modal
3. `app/medico/consultas/page.tsx` - Adicionar botão
4. `app/paciente/consultas/page.tsx` - Adicionar card de convites
5. `app/paciente/page.tsx` - Adicionar notificação
6. `lib/email.ts` - Adicionar templates
7. `lib/availability.ts` - Função para verificar disponibilidade

---

**Próximos Passos:**
1. Revisar proposta com equipe
2. Aprovar modelo de dados
3. Iniciar implementação da Fase 1
