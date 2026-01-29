# ✅ Configuração de Antecedência Mínima para Agendamentos

**Data:** 28 de Janeiro de 2026

---

## 🎯 Objetivo

Permitir que o administrador configure o tempo mínimo de antecedência necessário para agendamentos no dia atual, diferenciando entre médicos online e offline.

**Padrão alterado:** De 30 minutos para **5 minutos** quando médico está online.

---

## 📋 Mudanças Implementadas

### 1. **Novas Configurações no Sistema**

Adicionadas duas novas configurações em `lib/consultation-config.ts`:

- `MIN_ADVANCE_BOOKING_MINUTES_ONLINE` - Padrão: **5 minutos**
- `MIN_ADVANCE_BOOKING_MINUTES_OFFLINE` - Padrão: **120 minutos** (2 horas)

### 2. **Funções Criadas**

```typescript
// Retorna antecedência mínima quando médico está online
getMinAdvanceBookingMinutesOnline(): Promise<number>

// Retorna antecedência mínima quando médico está offline
getMinAdvanceBookingMinutesOffline(): Promise<number>
```

### 3. **Arquivos Atualizados**

#### ✅ `lib/consultation-config.ts`
- Adicionadas constantes de chaves de configuração
- Criadas funções para buscar valores configuráveis
- Validação e guard rails (0-1440min online, 0-10080min offline)

#### ✅ `lib/reschedule-invites.ts`
- Substituído valor hardcoded (30min/120min) por configuração
- Usa `getMinAdvanceBookingMinutesOnline()` e `getMinAdvanceBookingMinutesOffline()`

#### ✅ `lib/availability.ts`
- Substituído valor hardcoded (30min/120min) por configuração
- Logs atualizados para mostrar valores configuráveis

#### ✅ `app/api/consultations/route.ts`
- Substituído valor hardcoded (30min/120min) por configuração
- Mensagens de erro dinâmicas baseadas na configuração

### 4. **Nova API Endpoint**

**`/api/admin/settings/advance-booking`**

- **GET**: Retorna valores atuais de antecedência mínima
- **POST**: Salva novos valores (requer autenticação ADMIN)

### 5. **Interface do Admin**

**`/admin/configuracoes`**

Adicionada nova seção com dois campos:

- **Médico Online (minutos)**: Configura antecedência quando médico está online
  - Padrão: 5 minutos
  - Range: 0-1440 minutos (0-24 horas)
  
- **Médico Offline (minutos)**: Configura antecedência quando médico está offline
  - Padrão: 120 minutos (2 horas)
  - Range: 0-10080 minutos (0-7 dias)

---

## 🔧 Como Usar

### Para Administradores:

1. Acesse `/admin/configuracoes`
2. Role até a seção **"Antecedência Mínima para Agendamentos"**
3. Ajuste os valores conforme necessário:
   - **Médico Online**: Tempo mínimo quando médico está logado e ativo
   - **Médico Offline**: Tempo mínimo quando médico não está online
4. Clique em **"Salvar Antecedência"**

### Exemplos de Configuração:

**Configuração Agressiva (Máxima Flexibilidade):**
- Online: 5 minutos
- Offline: 60 minutos (1 hora)

**Configuração Conservadora:**
- Online: 30 minutos
- Offline: 240 minutos (4 horas)

**Configuração Padrão (Recomendada):**
- Online: 5 minutos ✅
- Offline: 120 minutos (2 horas)

---

## 🎯 Comportamento

### Quando Médico Está Online:
- Sistema verifica se há pelo menos **X minutos** (configurável, padrão: 5) entre agora e o horário agendado
- Permite agendamentos mais próximos do horário atual

### Quando Médico Está Offline:
- Sistema verifica se há pelo menos **Y minutos** (configurável, padrão: 120) entre agora e o horário agendado
- Requer mais antecedência para garantir disponibilidade

### Validação em Múltiplos Pontos:

1. **Busca de Slots Disponíveis** (`lib/availability.ts`)
   - Filtra slots que não atendem à antecedência mínima

2. **Criação de Consulta** (`app/api/consultations/route.ts`)
   - Valida antes de criar a consulta

3. **Convites de Remarcação** (`lib/reschedule-invites.ts`)
   - Valida ao sugerir novo horário

---

## 📊 Valores Padrão

| Situação | Valor Anterior | Valor Novo (Padrão) |
|----------|---------------|---------------------|
| Médico Online | 30 minutos | **5 minutos** ✅ |
| Médico Offline | 120 minutos | 120 minutos (sem mudança) |

---

## 🔒 Segurança

- Apenas usuários com role `ADMIN` podem alterar essas configurações
- Validação de valores (ranges permitidos)
- Guard rails para prevenir valores inválidos
- Validação no backend e frontend

---

## 🚀 Próximos Passos (Opcional)

1. **Configuração por Médico**: Permitir que cada médico tenha sua própria antecedência mínima
2. **Histórico de Mudanças**: Registrar quando e quem alterou as configurações
3. **Notificações**: Avisar médicos quando agendamento for feito com antecedência reduzida
4. **Dashboard**: Mostrar estatísticas de agendamentos por antecedência

---

**Implementação concluída!** 🎉

Agora o administrador pode configurar facilmente a antecedência mínima através do dashboard.
