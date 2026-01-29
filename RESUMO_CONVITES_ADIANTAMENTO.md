# 📋 Resumo: Sistema de Convites para Adiantar Consultas

## 🎯 O Problema

Paciente agendou consulta para daqui 12h ou alguns dias porque não havia horários mais próximos. Depois, mais médicos ficaram disponíveis ou horários foram liberados. Como aproveitar esses horários?

## ✅ A Solução

Sistema de **convites** onde o médico pode sugerir ao paciente adiantar sua consulta quando um horário melhor fica disponível.

---

## 🔄 Fluxo Simplificado

```
1. Médico identifica horário disponível mais próximo
   ↓
2. Médico envia convite ao paciente
   ↓
3. Paciente recebe notificação (email + dashboard)
   ↓
4. Paciente aceita ou recusa
   ↓
5. Se aceito: Consulta é remarcada automaticamente
   Se recusado: Consulta mantém horário original
```

---

## 📊 Modelo de Dados

**Tabela:** `consultation_reschedule_invites`

**Campos principais:**
- `consultationId`: Consulta original
- `currentScheduledAt`: Horário atual
- `newScheduledAt`: Novo horário proposto
- `status`: PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED
- `message`: Mensagem opcional do médico
- `expiresAt`: Expira em 24h

---

## 🛠️ APIs Principais

### 1. Criar Convite (Médico)
`POST /api/consultations/[id]/reschedule-invite`

### 2. Listar Convites (Paciente)
`GET /api/patient/reschedule-invites`

### 3. Responder Convite (Paciente)
`POST /api/reschedule-invites/[id]/respond`

### 4. Listar Convites Enviados (Médico)
`GET /api/doctor/reschedule-invites`

### 5. Cancelar Convite (Médico)
`POST /api/reschedule-invites/[id]/cancel`

---

## 📧 Notificações

### Email ao Paciente
- **Assunto:** "Oportunidade: Adiantar sua consulta"
- **Conteúdo:** Horário atual vs novo horário + mensagem do médico
- **Ações:** Botões Aceitar/Recusar

### Email de Confirmação
- Quando paciente aceita: Confirmação da remarcação
- Quando paciente recusa: Notificação ao médico

---

## 🎨 Interface

### Dashboard do Médico
- Botão **"Sugerir Adiantamento"** em cada consulta futura
- Modal para selecionar novo horário
- Lista de convites enviados com status

### Dashboard do Paciente
- **Card destacado** com convites pendentes
- Lista de convites com botões Aceitar/Recusar
- Contador de tempo restante

---

## ✅ Status da Implementação

### ✅ Concluído
- [x] Documentação completa da proposta
- [x] Modelo de dados no schema Prisma
- [x] Relações atualizadas

### 🔄 Próximos Passos
- [ ] Migração do banco de dados
- [ ] APIs de backend
- [ ] Templates de email
- [ ] Interface do médico
- [ ] Interface do paciente
- [ ] Testes

---

## 📈 Benefícios Esperados

1. **Melhor aproveitamento** de horários disponíveis
2. **Redução de tempo de espera** para pacientes
3. **Maior satisfação** dos usuários
4. **Diferencial competitivo** no mercado

---

## 📚 Documentação Completa

Ver arquivo: `IMPLEMENTACAO_CONVITES_ADIANTAMENTO.md`
