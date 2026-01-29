# ✅ Implementação: Agendamento com 30 minutos para Médicos Online

**Data:** 28 de Janeiro de 2026

---

## 🎯 Funcionalidade Implementada

Sistema que permite agendamentos com apenas **30 minutos de antecedência** (em vez de 2 horas) quando o médico está **logado e com sessão ativa** na plataforma.

---

## 📋 Mudanças Realizadas

### **1. Schema do Banco de Dados** ✅

**Arquivo:** `prisma/schema.prisma`

Adicionado campo `lastActiveAt` no modelo `Doctor`:
```prisma
model Doctor {
  // ... outros campos
  lastActiveAt  DateTime? @map("last_active_at") // Rastreia última atividade do médico
  // ...
}
```

**Próximo passo:** Executar migration:
```bash
npx prisma migrate dev --name add_doctor_last_active_at
```

---

### **2. API de Atividade do Médico** ✅

**Arquivo:** `app/api/doctors/activity/route.ts`

#### **POST /api/doctors/activity**
- Atualiza `lastActiveAt` do médico logado
- Usado como "heartbeat" para rastrear atividade
- Requer autenticação como DOCTOR

#### **GET /api/doctors/activity?doctorId=xxx**
- Verifica se um médico está online
- Considera online se última atividade foi nos últimos 5 minutos
- Retorna: `{ isOnline, lastActiveAt, active }`

---

### **3. Função de Verificação de Status Online** ✅

**Arquivo:** `lib/availability.ts`

Função `isDoctorOnline(doctorId: string)`:
- Verifica se médico está ativo
- Verifica se `lastActiveAt` existe
- Considera online se atividade foi nos últimos 5 minutos

---

### **4. Lógica de Disponibilidade Atualizada** ✅

**Arquivo:** `lib/availability.ts`

A função `getAvailableSlots()` agora:
- Verifica se cada médico está online antes de gerar slots
- Para agendamentos **hoje**:
  - **Médico online:** Slots disponíveis com 30 minutos de antecedência
  - **Médico offline:** Slots disponíveis com 2 horas de antecedência
- Para agendamentos **futuros:** Sempre disponível (sem restrição de antecedência)

**Exemplo:**
- Agora: 14:00
- Médico online: Pode agendar a partir de 14:30 (hoje)
- Médico offline: Pode agendar a partir de 16:00 (hoje)

---

### **5. Validação na API de Consultas** ✅

**Arquivo:** `app/api/consultations/route.ts`

Validação atualizada:
- Verifica se é agendamento para hoje
- Se for hoje:
  - Verifica se médico atribuído está online
  - **Online:** Requer 30 minutos de antecedência
  - **Offline:** Requer 2 horas de antecedência
- Mensagens de erro específicas para cada caso

---

### **6. Heartbeat no Dashboard do Médico** ✅

**Arquivo:** `app/medico/page.tsx`

Adicionado sistema de heartbeat:
- Atualiza atividade do médico automaticamente
- Envia requisição a cada 2 minutos
- Atualiza imediatamente ao carregar a página
- Limpa intervalo ao desmontar componente

---

## 🔄 Como Funciona

### **Fluxo Completo:**

1. **Médico faz login** → Dashboard carrega
2. **Heartbeat inicia** → Atualiza `lastActiveAt` a cada 2 minutos
3. **Paciente seleciona data** → Sistema busca horários disponíveis
4. **Sistema verifica médicos online** → Para cada médico, verifica `lastActiveAt`
5. **Slots gerados com antecedência correta:**
   - Médico online: 30 minutos
   - Médico offline: 2 horas
6. **Paciente seleciona horário** → Sistema valida novamente na API
7. **Consulta criada** → Médico atribuído automaticamente

---

## 📊 Exemplos de Uso

### **Cenário 1: Médico Online**

- **Agora:** 14:00
- **Médico:** Dr. Silva (online - última atividade: 13:58)
- **Slots disponíveis hoje:**
  - ✅ 14:30
  - ✅ 15:00
  - ✅ 15:30
  - ❌ 14:15 (menos de 30 minutos)

### **Cenário 2: Médico Offline**

- **Agora:** 14:00
- **Médico:** Dr. Santos (offline - última atividade: 12:00)
- **Slots disponíveis hoje:**
  - ❌ 14:30 (menos de 2 horas)
  - ❌ 15:00 (menos de 2 horas)
  - ❌ 15:30 (menos de 2 horas)
  - ✅ 16:00 (2 horas de antecedência)

### **Cenário 3: Data Futura**

- **Agora:** 14:00
- **Data selecionada:** Amanhã
- **Médico:** Qualquer (online ou offline)
- **Slots disponíveis:** Todos os horários configurados (sem restrição de antecedência)

---

## 🔧 Configuração

### **Tempo de Heartbeat**

Atualmente configurado para **2 minutos**. Para alterar:

**Arquivo:** `app/medico/page.tsx`
```typescript
const interval = setInterval(updateActivity, 2 * 60 * 1000); // 2 minutos
```

### **Tempo de Consideração "Online"**

Atualmente configurado para **5 minutos**. Para alterar:

**Arquivo:** `lib/availability.ts` e `app/api/doctors/activity/route.ts`
```typescript
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos
```

### **Antecedência para Médicos Online**

Atualmente configurado para **30 minutos**. Para alterar:

**Arquivos:** `lib/availability.ts` e `app/api/consultations/route.ts`
```typescript
minTimeFromNow = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos
```

---

## 📝 Notas Importantes

1. **Médico precisa estar logado:** O heartbeat só funciona quando o médico está com a página do dashboard aberta
2. **Timeout de 5 minutos:** Se o médico não atualizar atividade por 5 minutos, é considerado offline
3. **Validação dupla:** A validação acontece tanto na busca de slots quanto na criação da consulta
4. **Distribuição automática:** O sistema ainda escolhe o médico com menor carga de trabalho
5. **Prioridade para médicos online:** Médicos online podem ter mais agendamentos no mesmo dia

---

## 🚀 Próximos Passos (Opcional)

1. **Indicador visual:** Mostrar no formulário quais médicos estão online
2. **Notificação:** Avisar médico quando paciente agendar com 30 minutos
3. **Estatísticas:** Dashboard mostrando quantos agendamentos foram com antecedência reduzida
4. **Configuração por médico:** Permitir que cada médico configure seu tempo mínimo

---

## ✅ Checklist de Implementação

- [x] Campo `lastActiveAt` adicionado ao schema
- [x] API de atividade criada
- [x] Função `isDoctorOnline()` implementada
- [x] Lógica de disponibilidade atualizada
- [x] Validação na API de consultas atualizada
- [x] Heartbeat no dashboard do médico
- [ ] Migration do Prisma executada
- [ ] Testes realizados

---

## 🧪 Como Testar

1. **Fazer login como médico**
2. **Abrir dashboard do médico** (`/medico`)
3. **Aguardar 2 minutos** (ou verificar no banco que `lastActiveAt` foi atualizado)
4. **Abrir formulário de agendamento** (`/agendamento`)
5. **Selecionar data de hoje**
6. **Verificar horários disponíveis:**
   - Deve aparecer slots com 30 minutos de antecedência
   - Se médico estiver offline, apenas slots com 2 horas

---

**Status:** ✅ Implementação completa, aguardando migration do Prisma
