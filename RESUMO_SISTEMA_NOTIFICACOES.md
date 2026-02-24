# Resumo do Sistema de Notificações – Cannabilize

Resumo de como está o sistema de notificações hoje: integrações, disparos e conteúdos.

---

## 1. Visão geral

O sistema usa **dois canais**:

- **Email** – Resend (configurável no admin; se não houver config, só log no console).
- **WhatsApp** – Twilio (configurável no admin; se desabilitado, mensagem é simulada).

As notificações **não bloqueiam** as operações principais (agendamento, pagamento, receita etc.): são disparadas em background com `.catch()`.

---

## 2. Integrações

### 2.1 Email (`lib/email.ts`)

- **Provedor:** Resend (único implementado).
- **Configuração:** tabela do banco (provedor, API key, domínio, remetente etc.). Se não houver provedor habilitado, o email é apenas **logado no console**.
- **Redirecionamento:** opção `EMAIL_REDIRECT_TO` para enviar todos os emails para um único endereço (útil em teste).
- **Templates:** editáveis no banco; fallback em `DEFAULT_EMAIL_TEMPLATES` no código.

### 2.2 WhatsApp (`lib/whatsapp.ts`)

- **Provedor:** Twilio (WhatsApp Business API).
- **Configuração:** painel admin em `/admin/whatsapp` (Account SID, Auth Token, número). Se desabilitado ou não configurado, a mensagem é **simulada** (log, retorno `success: true`).
- **Persistência:** cada envio é registrado em `WhatsAppMessage` (status PENDING → SENT ou FAILED).
- **Formato:** números em E.164; helper para números brasileiros em `formatPhoneNumber()`.

### 2.3 Módulo central (`lib/notifications.ts`)

- Orquestra **Email + WhatsApp** para os eventos de consulta (admin e médico).
- **Admin e médico por email:** hoje **não usam** o Resend; apenas **console.log** (comentário “TODO: Integrar com serviço de email”). Ou seja, email para admin e médico **não está integrado** de fato.
- **Admin e médico por WhatsApp:** usam Twilio normalmente (se configurado).
- **Paciente:** WhatsApp via `notifyPatientByWhatsApp`; email é disparado por funções específicas em `lib/email.ts` (ex.: `sendConsultationConfirmationEmail`), que sim usam o Resend quando configurado.

---

## 3. Quando os disparos acontecem

| Evento | Email | WhatsApp | Onde é chamado |
|--------|--------|----------|----------------|
| **Consulta agendada** | | | `POST /api/consultations` |
| → Paciente | ✅ Confirmação (Resend) | ✅ Confirmação (Twilio) | `sendConsultationConfirmationEmail` + `notifyPatientByWhatsApp(CONSULTATION_CONFIRMED)` |
| → Admin | ❌ Só log | ✅ Se tiver telefone | `notifyConsultationScheduled` → `notifyAdminByEmail` (log) + `notifyAdminByWhatsApp` |
| → Médico | ❌ Só log | ✅ Se tiver telefone | `notifyConsultationScheduled` → `notifyDoctorByEmail` (log) + `notifyDoctorByWhatsApp` |
| **Paciente novo** (primeiro agendamento) | ✅ Boas-vindas | — | `sendAccountWelcomeEmail` em consultations/route |
| **Conclusão de cadastro** (definir senha) | ✅ Link de setup | — | `sendAccountSetupEmail` em `lib/account-setup.ts` |
| **Pagamento confirmado** (Stripe webhook) | ✅ Confirmação | ✅ Confirmação (se tiver telefone e consulta não vencida) | `POST /api/payments/webhook` → `sendPaymentConfirmationEmail` + `notifyPatientByWhatsApp(PAYMENT_CONFIRMED)` |
| **Receita emitida** | ✅ Receita + follow-up | ✅ Receita emitida | `POST /api/prescriptions` → `sendPrescriptionIssuedEmail` + `sendConsultationFollowupEmail` + `notifyPatientByWhatsApp(PRESCRIPTION_ISSUED)` |
| **Convite para adiantar consulta** | ✅ Email ao paciente | ✅ WhatsApp ao paciente | `POST /api/consultations/[id]/reschedule-invite` → `sendRescheduleInviteEmail` + `sendWhatsAppMessage(getRescheduleInviteMessage)` |
| **Convite de adiantamento expirado** | ✅ Email ao médico | — | Cron `POST /api/cron/expire-reschedule-invites` → `sendRescheduleInviteExpiredEmail` |
| **Lembretes de consulta** | ✅ 24h / 2h / “agora” | — | Cron `GET /api/admin/email/reminders?type=24H|2H|NOW` → `sendConsultationReminderEmail` |

Resumo rápido:

- **Email para paciente:** integrado (Resend) em confirmação de consulta, pagamento, receita, follow-up, convite de adiantamento, boas-vindas e conclusão de cadastro.
- **Email para admin/médico:** apenas log (não integrado).
- **WhatsApp:** integrado (Twilio) para paciente (confirmação consulta, pagamento, receita, convite adiantamento) e para admin/médico (nova consulta agendada), desde que o número esteja cadastrado e o WhatsApp habilitado.

---

## 4. Conteúdos (templates)

### 4.1 Email (`lib/email.ts`)

Templates padrão (podem ser sobrescritos no banco):

- **ACCOUNT_WELCOME** – Boas-vindas ao Cannabilize.
- **ACCOUNT_SETUP** – Conclusão de cadastro, link para definir senha (expira 7 dias).
- **CONSULTATION_CONFIRMED** – Data/hora e link da consulta.
- **CONSULTATION_REMINDER_24H / 2H / NOW** – Lembretes 24h, 2h e “agora”.
- **CONSULTATION_FOLLOWUP** – Pós-consulta (com link da receita se houver).
- **PAYMENT_CONFIRMED** – Valor e confirmação.
- **PRESCRIPTION_ISSUED** – Receita emitida e link.
- **RESCHEDULE_INVITE** – Convite para adiantar (datas, links aceitar/recusar, validade).
- **RESCHEDULE_INVITE_ACCEPTED** – Confirmação de aceite e nova data.
- **RESCHEDULE_INVITE_REJECTED** – Paciente recusou o adiantamento.
- **RESCHEDULE_INVITE_EXPIRED** – Convite expirado (para o médico).

Variáveis comuns: `{{patientName}}`, `{{consultationDateTime}}`, `{{meetingLink}}`, `{{setupUrl}}`, etc.

### 4.2 WhatsApp (`lib/whatsapp-templates.ts` + `whatsapp-templates-service.ts`)

Templates podem vir do banco (por código) ou do fallback no código:

- **CONSULTATION_CONFIRMED** – Confirmação de consulta (médico, data, horário, link, plataforma).
- **CONSULTATION_REMINDER_24H / 1h** – Lembretes (hoje só usados por template; **não há cron** disparando WhatsApp de lembrete).
- **PAYMENT_CONFIRMED** – Valor, data, ID da transação.
- **PRESCRIPTION_ISSUED** – Médico, data, medicamentos, orientação para acessar a área do paciente.
- **RESCHEDULE_INVITE** – Oportunidade de adiantar; data atual vs nova; links aceitar/recusar; validade 24h.
- **DOCTOR_CONSULTATION_ASSIGNED** – Para médico: paciente, email, telefone, data, horário.
- **ADMIN_CONSULTATION_SCHEDULED** – Para admin: paciente, médico, data, horário, valor.

Formato das mensagens: texto com markdown simples (ex.: `*negrito*`), emojis e variáveis `{{var}}` / `{{#var}}...{{/var}}`.

---

## 5. Agendamento (crons)

Definido em `vercel.json`:

| Rota | Schedule | Uso |
|------|----------|-----|
| `/api/admin/email/reminders?type=24H` | `0 */6 * * *` (a cada 6h) | Lembretes 24h antes da consulta |
| `/api/admin/email/reminders?type=2H` | `*/30 * * * *` (a cada 30 min) | Lembretes 2h antes |
| `/api/admin/email/reminders?type=NOW` | `*/15 * * * *` (a cada 15 min) | Lembretes “agora” |

O endpoint de lembretes usa **sessão** (ou poderia usar API key); em produção é comum proteger com `CRON_SECRET` ou equivalente.

**Expirar convites de adiantamento:** a rota `POST /api/cron/expire-reschedule-invites` envia email ao médico quando o convite expira; **não** está no `vercel.json` – precisa ser chamada por outro cron externo ou job se quiser expirar automaticamente.

---

## 6. Pontos de atenção

1. **Email para admin e médico** em `lib/notifications.ts` não está integrado: só `console.log`. Para passar a enviar de verdade, é preciso usar `sendEmail()` (ex.: Resend) com os mesmos dados que já estão no log.
2. **Lembretes por WhatsApp** (24h, 2h, 1h) não são disparados por nenhum cron; só existem os templates e o endpoint de lembretes **por email**.
3. **Duplicidade em consultas:** em `app/api/consultations/route.ts` o bloco que chama `notifyPatientByWhatsApp` para `CONSULTATION_CONFIRMED` aparece **duas vezes** (trechos idênticos); vale remover uma das chamadas para evitar dois WhatsApp para o mesmo agendamento.
4. **Cron de expirar convites** não está no `vercel.json`; se ninguém chamar essa rota, convites expirados não serão marcados nem o médico receberá o email de “convite expirado”.
5. **Configuração:** Email ativo depende de registro na tabela de config com provedor RESEND e API key. WhatsApp depende de config Twilio habilitada em `/admin/whatsapp`.

---

## 7. Resumo em uma frase

**Email (Resend)** está integrado para **paciente** (confirmação, pagamento, receita, follow-up, convites, boas-vindas e conclusão de cadastro) e para **médico** apenas no fluxo de convite expirado; **admin e médico não recebem email** quando uma consulta é agendada (só log). **WhatsApp (Twilio)** está integrado para **paciente** (confirmação, pagamento, receita, convite de adiantamento) e para **admin e médico** (nova consulta agendada). Lembretes de consulta existem só por **email**, via crons de 24h, 2h e “agora”; o cron que expira convites de adiantamento e notifica o médico **não** está no `vercel.json`.
