# 📱 Mensagens WhatsApp do Sistema Cannabilize

## 📋 Resumo das Mensagens Enviadas

Este documento lista **todas as mensagens WhatsApp** que são enviadas automaticamente pelo sistema para **pacientes**, **médicos** e **administradores**.

---

## 👤 MENSAGENS PARA PACIENTES

### 1. 📅 Confirmação de Consulta Agendada

**Quando é enviada:**
- Quando uma consulta é criada/agendada
- Quando uma consulta é atualizada/confirmada

**Conteúdo da mensagem:**
```
📅 Consulta Agendada com Sucesso!

Olá [Nome do Paciente]! Sua consulta foi confirmada:

👨‍⚕️ Médico: Dr. [Nome do Médico]
📅 Data: [Data formatada]
⏰ Horário: [Horário]
🔗 Link: [Link da reunião] (se houver)
💻 A consulta será realizada via [Plataforma]. (se houver)

Em caso de dúvidas, estamos à disposição.

Cannabilize 💚
```

**Onde é enviada:**
- `app/api/consultations/route.ts` (POST - criar consulta)
- `app/api/consultations/route.ts` (PUT - atualizar consulta)

---

### 2. ⏰ Lembrete de Consulta (24h antes)

**Quando é enviada:**
- 24 horas antes da consulta agendada
- (Requer job/cron configurado)

**Conteúdo da mensagem:**
```
⏰ Lembrete de Consulta

Olá [Nome do Paciente]! Sua consulta está agendada para:

📅 Data: [Data formatada]
⏰ Horário: [Horário]
👨‍⚕️ Médico: Dr. [Nome do Médico]
🔗 Link: [Link da reunião] (se houver)

⚠️ A consulta começa em 24 horas!

Não esqueça de estar em um local tranquilo e com boa conexão de internet.

Cannabilize 💚
```

**Status:** Template criado, mas precisa de job/cron para envio automático

---

### 3. ⏰ Lembrete de Consulta (1h antes)

**Quando é enviada:**
- 1 hora antes da consulta agendada
- (Requer job/cron configurado)

**Conteúdo da mensagem:**
```
⏰ Lembrete de Consulta

Olá [Nome do Paciente]! Sua consulta começa em 1 hora!

👨‍⚕️ Médico: Dr. [Nome do Médico]
⏰ Horário: [Horário]
🔗 Link: [Link da reunião] (se houver)

Por favor, esteja pronto para a consulta.

Cannabilize 💚
```

**Status:** Template criado, mas precisa de job/cron para envio automático

---

### 4. ✅ Confirmação de Pagamento

**Quando é enviada:**
- Após confirmação do pagamento via webhook do Stripe
- Quando o pagamento é confirmado manualmente

**Conteúdo da mensagem:**
```
✅ Pagamento Confirmado!

Olá [Nome do Paciente]! Seu pagamento foi processado:

💰 Valor: R$ [Valor formatado]
📅 Data: [Data formatada]
📄 ID: [Transaction ID] (se houver)

Sua consulta está confirmada!

Cannabilize 💚
```

**Onde é enviada:**
- `app/api/payments/webhook/route.ts` (webhook do Stripe)

---

### 5. 💳 Lembrete de Pagamento Pendente

**Quando é enviada:**
- Quando há pagamento pendente
- (Requer job/cron configurado)

**Conteúdo da mensagem:**
```
💳 Pagamento Pendente

Olá [Nome do Paciente]! Você possui um pagamento pendente:

💰 Valor: R$ [Valor formatado]
📅 Vencimento: [Data de vencimento]

⚠️ Sua consulta será confirmada após o pagamento.

🔗 Acesse sua área do paciente para realizar o pagamento.

Cannabilize 💚
```

**Status:** Template criado, mas precisa de job/cron para envio automático

---

### 6. 📋 Receita Médica Emitida

**Quando é enviada:**
- Após o médico emitir uma receita
- Quando uma receita é criada/confirmada

**Conteúdo da mensagem:**
```
📋 Receita Médica Emitida

Olá [Nome do Paciente]! Sua receita foi emitida:

👨‍⚕️ Médico: Dr. [Nome do Médico]
📅 Data: [Data formatada]
💊 Medicamentos: [Lista de medicamentos] (se houver)

📄 Acesse sua área do paciente para visualizar e baixar a receita.

Cannabilize 💚
```

**Onde é enviada:**
- `app/api/prescriptions/route.ts` (POST - criar receita)

---

### 7. 🎯 Convite para Adiantar Consulta

**Quando é enviada:**
- Quando o médico cria um convite para adiantar a consulta
- Quando há disponibilidade para adiantar

**Conteúdo da mensagem:**
```
🎯 Oportunidade de Adiantar Consulta!

Olá [Nome do Paciente]! O Dr. [Nome do Médico] tem disponibilidade para adiantar sua consulta:

📅 Data Atual: [Data atual] às [Horário atual]
📅 Nova Data: [Nova data] às [Novo horário]

✅ Aceitar: [Link para aceitar]
❌ Recusar: [Link para recusar]

⏱️ Este convite é válido por 24 horas.

Cannabilize 💚
```

**Onde é enviada:**
- `app/api/consultations/[id]/reschedule-invite/route.ts` (POST - criar convite)

---

### 8. ✅ Autorização ANVISA Aprovada

**Quando é enviada:**
- Quando uma autorização ANVISA é aprovada
- Quando o status muda para "APPROVED"

**Conteúdo da mensagem:**
```
✅ Autorização ANVISA Aprovada!

Olá [Nome do Paciente]! Sua autorização foi aprovada:

📄 Número: [Número ANVISA]
📅 Aprovada em: [Data de aprovação]
⏰ Válida até: [Data de expiração]

📋 Acesse sua área do paciente para ver detalhes.

Cannabilize 💚
```

**Status:** Template criado, mas precisa ser integrado no fluxo de aprovação ANVISA

---

## 👨‍⚕️ MENSAGENS PARA MÉDICOS

### 1. 🔔 Nova Consulta Designada

**Quando é enviada:**
- Quando o admin designa um médico para uma consulta
- Quando uma consulta é atribuída a um médico

**Conteúdo da mensagem:**
```
🔔 Nova Consulta Designada

Dr. [Nome do Médico]! Você foi designado para uma nova consulta:

👤 Paciente: [Nome do Paciente]
📧 Email: [Email do Paciente]
📱 Telefone: [Telefone do Paciente] (se houver)
📅 Data: [Data formatada]
⏰ Horário: [Horário]

📋 Ver Detalhes: [Link Admin]

Cannabilize 💚
```

**Onde é enviada:**
- `lib/notifications.ts` → `notifyDoctorByWhatsApp()`
- Chamado quando consulta é agendada/atribuída

---

## 👨‍💼 MENSAGENS PARA ADMINISTRADORES

### 1. 🔔 Nova Consulta Agendada

**Quando é enviada:**
- Quando uma nova consulta é agendada no sistema
- Quando um paciente cria uma consulta

**Conteúdo da mensagem:**
```
🔔 Nova Consulta Agendada

Nova consulta no sistema:

👤 Paciente: [Nome do Paciente]
👨‍⚕️ Médico: [Nome do Médico]
📅 Data: [Data formatada]
⏰ Horário: [Horário]
💰 Valor: R$ [Valor formatado]

📋 Ver: [Link Admin]

Cannabilize 💚
```

**Onde é enviada:**
- `lib/notifications.ts` → `notifyAdminByWhatsApp()`
- Chamado quando consulta é agendada

---

## 📊 Resumo por Tipo de Usuário

### 👤 Pacientes (8 tipos de mensagens)
1. ✅ Confirmação de Consulta Agendada
2. ⏰ Lembrete 24h antes (template criado, precisa cron)
3. ⏰ Lembrete 1h antes (template criado, precisa cron)
4. ✅ Confirmação de Pagamento
5. 💳 Lembrete de Pagamento Pendente (template criado, precisa cron)
6. 📋 Receita Médica Emitida
7. 🎯 Convite para Adiantar Consulta
8. ✅ Autorização ANVISA Aprovada (template criado, precisa integrar)

### 👨‍⚕️ Médicos (1 tipo de mensagem)
1. 🔔 Nova Consulta Designada

### 👨‍💼 Administradores (1 tipo de mensagem)
1. 🔔 Nova Consulta Agendada

---

## ⚙️ Status de Implementação

### ✅ Totalmente Implementadas e Funcionais:
- ✅ Confirmação de Consulta (Paciente)
- ✅ Confirmação de Pagamento (Paciente)
- ✅ Receita Emitida (Paciente)
- ✅ Convite para Adiantar (Paciente)
- ✅ Nova Consulta Designada (Médico)
- ✅ Nova Consulta Agendada (Admin)

### 📝 Templates Criados, Mas Precisam de Integração:
- ⏰ Lembrete 24h antes (precisa job/cron)
- ⏰ Lembrete 1h antes (precisa job/cron)
- 💳 Lembrete de Pagamento (precisa job/cron)
- ✅ Autorização ANVISA (precisa integrar no fluxo)

---

## 🔧 Como Funciona

### Fluxo de Envio:

1. **Evento ocorre** (ex: consulta agendada, pagamento confirmado)
2. **Sistema busca** o telefone do destinatário no banco
3. **Template é gerado** com os dados específicos
4. **Mensagem é enviada** via Twilio
5. **Status é salvo** no banco (`WhatsAppMessage`)
6. **Webhook atualiza** o status (entregue, lido, etc.)

### Requisitos para Envio:

- ✅ WhatsApp habilitado no sistema
- ✅ Credenciais Twilio configuradas
- ✅ Número do destinatário cadastrado
- ✅ Número registrado no sandbox (para testes)

---

## 📝 Notas Importantes

1. **Sandbox vs Produção:**
   - No sandbox, apenas números registrados recebem mensagens
   - Em produção, qualquer número pode receber (com templates aprovados)

2. **Templates Aprovados:**
   - Para produção, templates precisam ser aprovados pelo WhatsApp
   - Sandbox permite mensagens livres (apenas para números registrados)

3. **Histórico:**
   - Todas as mensagens são salvas no banco (`WhatsAppMessage`)
   - Status é atualizado via webhook do Twilio

4. **Falhas:**
   - Se o envio falhar, o erro é salvo no banco
   - Sistema continua funcionando mesmo se WhatsApp falhar

---

**Total: 10 tipos de mensagens diferentes enviadas automaticamente pelo sistema!** 📱
