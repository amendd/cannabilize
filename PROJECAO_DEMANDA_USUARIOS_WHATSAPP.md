# Projeção de demanda – Estrutura do projeto

Documento com base na estrutura atual: usuários, consultas, fluxo WhatsApp, crons e carga no VPS (1 processo Node + SQLite).

---

## 1. Estrutura considerada

| Entidade | Uso na projeção |
|----------|------------------|
| **User** | Pacientes (role PATIENT), médicos (Doctor + User), admins |
| **Consultation** | Agendamentos; lembretes por e-mail e WhatsApp (24h, 2h, 1h, 10min, NOW) |
| **WhatsAppLead** | 1 por número; fluxo WELCOME → … → CONFIRM; follow-up agendado (~10s após IA/FAQ) |
| **WhatsAppMessage** | Histórico de mensagens enviadas |
| **WhatsAppWebhookLog** | Cada mensagem recebida (webhook Z-API/Twilio) |
| **Payment** | Pagamentos/Stripe; webhook recebido |
| **Prescription** | Receitas pós-consulta |
| **Crons** | 7 rotas (lembretes 24H/2H/1H/10MIN/NOW, payment reminders, whatsapp-follow-up a cada 1 min) |

**Rate limit (produção):** 200 requisições / 15 min por IP (exceto auth e webhooks).

---

## 2. Cenários de demanda

Três cenários: **pequena**, **média** e **alta** operação, com números redondos para planejamento.

### 2.1 Cenário A – Pequena operação

| Métrica | Valor | Observação |
|--------|--------|------------|
| Pacientes cadastrados | 200–500 | Base ativa no sistema |
| Médicos ativos | 2–5 | Consultas distribuídas entre eles |
| Consultas agendadas/dia | 5–15 | ~2–5 por médico/dia |
| Consultas/mês | 150–400 | |
| Novos leads WhatsApp/dia | 3–10 | Pessoas que iniciam conversa no WhatsApp |
| Mensagens WhatsApp recebidas/dia | 20–60 | Webhook chamado por mensagem |
| Mensagens WhatsApp enviadas/dia | 30–80 | Lembretes + follow-up + fluxo |
| Admins logados ao mesmo tempo | 1–2 | Painel admin |
| Pacientes no site ao mesmo tempo (pico) | 5–15 | Agendamento, área logada, pagamento |

**Carga típica:** Um VPS **1 vCPU, 1 GB RAM** atende com folga.

---

### 2.2 Cenário B – Média operação

| Métrica | Valor | Observação |
|--------|--------|------------|
| Pacientes cadastrados | 1 000–3 000 | |
| Médicos ativos | 5–15 | |
| Consultas agendadas/dia | 30–80 | |
| Consultas/mês | 900–2 400 | |
| Novos leads WhatsApp/dia | 15–50 | |
| Mensagens WhatsApp recebidas/dia | 100–300 | Webhook mais chamado |
| Mensagens WhatsApp enviadas/dia | 150–400 | |
| Admins logados ao mesmo tempo | 2–5 | |
| Pacientes no site ao mesmo tempo (pico) | 20–50 | |

**Carga típica:** VPS **2 vCPU, 2 GB RAM** recomendado. 1 GB ainda pode rodar, mas com menos margem em picos.

---

### 2.3 Cenário C – Alta operação

| Métrica | Valor | Observação |
|--------|--------|------------|
| Pacientes cadastrados | 5 000–15 000 | |
| Médicos ativos | 15–40 | |
| Consultas agendadas/dia | 100–250 | |
| Consultas/mês | 3 000–7 500 | |
| Novos leads WhatsApp/dia | 80–200 | |
| Mensagens WhatsApp recebidas/dia | 400–1 000+ | Webhook sob carga |
| Mensagens WhatsApp enviadas/dia | 500–1 200+ | |
| Admins + médicos logados ao mesmo tempo | 10–25 | |
| Pacientes no site ao mesmo tempo (pico) | 50–150 | |

**Carga típica:** VPS **2–4 vCPU, 4 GB RAM**. Avaliar migração para **PostgreSQL** e **Redis** (rate limit) se muitas escritas simultâneas no banco ou muitos acessos anônimos.

---

## 3. Fluxo WhatsApp e impacto em demanda

### 3.1 Entrada (webhook)

- Cada mensagem recebida (Z-API/Twilio) chama **1 requisição** ao seu servidor (`/api/whatsapp/...`).
- Por mensagem: leitura/escrita em **WhatsAppLead** e/ou **WhatsAppWebhookLog**, possível chamada a IA (OpenAI) e resposta enviada.
- **Conclusão:** O volume de **mensagens recebidas/dia** define a maior parte da carga do webhook. Nos cenários A/B isso é leve; no C é o ponto a monitorar.

### 3.2 Saída (envios)

- **Lembretes de consulta:** 24H, 2H, 1H, 10MIN, NOW. Cada consulta na janela gera até 1 e-mail + 1 WhatsApp (quando aplicável).
- **Follow-up:** Cron **a cada 1 minuto** busca leads com `pendingFollowUpSendAt <= now` e envia 1 WhatsApp por lead; atualiza o lead (clear pending).
- **Lembretes de pagamento:** 1x/dia (cron 9h); impacto baixo.

A carga de **saída** acompanha o número de consultas agendadas e de leads em follow-up; no cenário A e B é baixa; no C cresce junto com os crons.

### 3.3 Resumo por cenário (WhatsApp)

| Cenário | Webhook (req/dia) | Follow-up (req/hora) | Lembretes consulta (envios/dia) |
|---------|-------------------|----------------------|----------------------------------|
| A | 20–60 | 60 (cron 1x/min) | 5–30 (conforme consultas na janela) |
| B | 100–300 | 60 | 30–120 |
| C | 400–1 000+ | 60 | 100–400+ |

O cron de follow-up roda **60 vezes/hora** independente do volume de leads; a carga extra vem do número de leads com `pendingFollowUpMessage` em cada execução.

---

## 4. Crons – Chamadas por hora

| Cron | Frequência | Chamadas/hora |
|------|------------|----------------|
| `/api/admin/email/reminders?type=24H` | A cada 6 h | ~0,17 |
| `/api/admin/email/reminders?type=2H` | A cada 30 min | 2 |
| `/api/admin/email/reminders?type=1H` | A cada 20 min | 3 |
| `/api/admin/email/reminders?type=10MIN` | A cada 5 min | 12 |
| `/api/admin/email/reminders?type=NOW` | A cada 15 min | 4 |
| `/api/cron/whatsapp-follow-up` | A cada 1 min | 60 |
| `/api/cron/send-payment-reminders` | 1x/dia 9h | 0 (desprezível por hora) |

**Total aproximado:** ~81 chamadas/hora só de crons. O que mais pesa é o **whatsapp-follow-up** (60/hora), que faz 1 query + N envios quando há leads pendentes.

---

## 5. Requisições HTTP (estimativa por dia)

Inclui: páginas (admin, paciente, médico, landing), APIs (agendamento, pagamento, receitas, etc.), webhooks (WhatsApp, Stripe), crons.

| Cenário | Requisições/dia (ordem de grandeza) |
|---------|--------------------------------------|
| A | 2 000 – 8 000 |
| B | 15 000 – 50 000 |
| C | 80 000 – 250 000+ |

Picos concentrados em horário de consulta e campanhas WhatsApp aumentam requisições simultâneas; o rate limit (200/15 min por IP) protege contra um único IP, mas não limita o total de usuários.

---

## 6. Banco (SQLite) – Leituras vs escritas

- **Leituras:** Muitas (listagens, dashboards, consultas por status, leads, etc.). SQLite lida bem com leitura concorrente.
- **Escritas:** Consultations (agendar, atualizar status), Payment (webhook Stripe), WhatsAppLead (webhook + follow-up), Prescription, etc. Em picos com **muitas escritas simultâneas** (ex.: muitas confirmações de pagamento + muitos webhooks no mesmo minuto), SQLite pode ter contenção (locks).
- **Conclusão:** Cenários A e B: SQLite ok. Cenário C: monitorar; se surgirem locks ou lentidão, planejar migração para PostgreSQL.

---

## 7. Recomendação de VPS por cenário

| Cenário | Usuários/consultas/WhatsApp | VPS sugerido | Observação |
|---------|------------------------------|--------------|------------|
| **A** | Pequena operação | 1 vCPU, 1 GB RAM, 20–40 GB SSD | Atende folgado. |
| **B** | Média operação | 2 vCPU, 2 GB RAM, 40–60 GB SSD | Boa margem para picos. |
| **C** | Alta operação | 2–4 vCPU, 4 GB RAM, 60–100 GB SSD | Considerar PostgreSQL + Redis ao crescer. |

---

## 8. Resumo

- **Demanda** está ligada a: número de **consultas/dia**, volume de **mensagens WhatsApp** (entrada + follow-up + lembretes) e **usuários simultâneos** no site/painel.
- **Crons** somam ~81 chamadas/hora; o mais frequente é o **whatsapp-follow-up** (1/min).
- **Escalabilidade atual (1 VPS + SQLite):** adequada para A e B; no C vale monitorar e planejar banco + rate limit distribuído (Redis) se necessário.
- Esta projeção replica a **estrutura atual** do projeto (modelos Prisma, rotas de API, vercel.json de crons, middleware de rate limit) sem alterar código.
