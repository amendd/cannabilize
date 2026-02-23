# Guia de integração – Plataforma na Umbler

Este documento descreve como preparar e publicar a plataforma ClickCannabis/CannabiLize na **Umbler** (hospedagem PaaS) e como conectá-la ao **Umbler Talk** (atendente de IA no WhatsApp).

---

## 1. Visão geral

| Componente | Descrição |
|------------|-----------|
| **Umbler (PaaS)** | Hospedagem da aplicação Next.js: deploy via Git, Node.js, banco de dados e variáveis de ambiente. |
| **Umbler Talk (uTalk)** | Atendente de IA no WhatsApp; pode usar webhook e API. O agente (ex.: Lize) segue o fluxo descrito em `UMBLER_TALK_ATENDENTE_IA.md`. |
| **Nossa plataforma** | Next.js com API (consultas, pagamentos, WhatsApp, receitas). Após o deploy na Umbler, a URL base (ex.: `https://seu-app.umbler.io`) será usada para webhooks e links. |

---

## 2. Deploy da aplicação na Umbler

### 2.1 Pré-requisitos

- Conta na [Umbler](https://www.umbler.com)
- Repositório Git com o código da plataforma
- Banco de dados: use o **MySQL** ou **PostgreSQL** oferecido pela Umbler, ou uma connection string externa (ex.: Supabase, Neon)

### 2.2 Criar o projeto na Umbler

1. No painel Umbler, crie um novo **Projeto** e escolha **Node.js**.
2. Conecte o repositório Git (GitHub, GitLab ou URL do repositório).
3. Anote a **URL do Git** fornecida pela Umbler (ex.: `git@git.umbler.com:seu-usuario/seu-app.git`).

### 2.3 Configuração do repositório local

```bash
# Se ainda não tiver o remote da Umbler
git remote add umbler git@git.umbler.com:SEU_USUARIO/SEU_PROJETO.git

# Deploy (a Umbler faz build e start automaticamente)
git push umbler main
# ou: git push umbler master
```

### 2.4 Comportamento do build na Umbler

A Umbler usa o **package.json** para:

1. **Instalar dependências** – `npm install` (ou `yarn` se existir `yarn.lock`)
2. **Build** – o script `build` é executado: `prisma generate && next build`
3. **Start** – o script `start` é executado: `next start -p ${PORT:-3000}`

A variável **PORT** é definida automaticamente pela Umbler; o script `start` já está preparado para usá-la.

### 2.5 Versão do Node

O projeto recomenda **Node 18** ou superior (campo `engines` no `package.json`). No painel da Umbler, confirme que o ambiente está usando Node 18+.

### 2.6 Variáveis de ambiente no painel Umbler

Configure no painel do projeto (Variáveis de ambiente / Environment variables) as mesmas variáveis que você usa em produção:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string do banco (MySQL/PostgreSQL Umbler ou externo). |
| `NEXTAUTH_URL` | Sim | URL pública do app, ex.: `https://seu-app.umbler.io` |
| `NEXTAUTH_SECRET` | Sim | Chave secreta para sessões (gere uma forte). |
| `APP_URL` | Recomendado | Mesma URL do app (ex.: `https://seu-app.umbler.io`) para webhooks e links. |
| `NEXT_PUBLIC_APP_URL` | Opcional | Para uso no front (links em e-mails, etc.). |
| `STRIPE_SECRET_KEY` | Se usar Stripe | Chave secreta da API Stripe. |
| `STRIPE_WEBHOOK_SECRET` | Se usar Stripe | Secret do webhook Stripe (após configurar o endpoint na Umbler). |
| `CRON_SECRET` | Se usar crons | Secret para autorizar chamadas às rotas de lembrete (cron). |
| Configurações de e-mail | Conforme uso | SMTP ou Resend (variáveis já descritas no `.env.example`). |
| WhatsApp (Meta/Twilio) | Conforme uso | Chaves e, se aplicável, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`; webhook URL = `https://seu-app.umbler.io/api/whatsapp/webhook`. |

**Importante:** Após definir `NEXTAUTH_URL` e `APP_URL` com a URL do domínio Umbler, os links de e-mail, concluir cadastro e pagamento usarão esse domínio.

### 2.7 Banco de dados

- **Opção A – Banco na Umbler:** Crie um add-on MySQL ou PostgreSQL no projeto e use a `DATABASE_URL` fornecida.
- **Opção B – Banco externo:** Use Supabase, Neon, PlanetScale, etc., e defina `DATABASE_URL` nas variáveis de ambiente.

Após o primeiro deploy, rode as migrações (via SSH na Umbler ou em um job de release, se disponível):

```bash
npx prisma migrate deploy
# ou, se usar apenas db push:
npx prisma db push
```

### 2.8 Domínio customizado (opcional)

No painel Umbler você pode associar um domínio próprio (ex.: `app.cannabilize.com.br`) ao projeto. Depois, atualize `NEXTAUTH_URL`, `APP_URL` e `NEXT_PUBLIC_APP_URL` com esse domínio.

---

## 3. Integração com Umbler Talk (uTalk)

O **Umbler Talk** é o produto de WhatsApp e atendente de IA. O documento `UMBLER_TALK_ATENDENTE_IA.md` descreve o comportamento do agente (Lize), estágios da conversa e base de conhecimento.

### 3.1 Dois cenários possíveis

| Cenário | Quem conduz o fluxo | Papel da plataforma |
|---------|----------------------|----------------------|
| **A – uTalk só para dúvidas** | Nosso backend (webhook Meta/Twilio) | Webhook em `https://seu-dominio.com/api/whatsapp/webhook` continua recebendo mensagens; o fluxo de captação (nome, CPF, horário, etc.) é o de `lib/whatsapp-capture-flow.ts`. O uTalk pode ser usado em outro número/canal só para FAQ. |
| **B – uTalk conduz a conversa** | Atendente de IA no Umbler Talk | O uTalk envia mensagens e pode chamar nossa API (webhook ou REST) para: listar horários, criar lead/consulta, enviar link de pagamento. Nesse caso, configurar no uTalk a **URL do backend** (veja abaixo). |

### 3.2 URL do backend (para o Umbler Talk)

Quando o atendente de IA precisar de dados da plataforma (horários disponíveis, confirmação de agendamento, envio de link de pagamento), use como **base da API**:

```
https://SEU-DOMINIO-UMBLER.com
```

Exemplos de endpoints que podem ser úteis para o uTalk (se você expuser ou criar rotas específicas):

- **Horários disponíveis:** hoje o fluxo usa `lib/availability.ts` internamente no `whatsapp-capture-flow`. Se o uTalk for quem conduz, pode ser necessária uma rota pública ou interna, ex.: `GET /api/availability/slots?date=YYYY-MM-DD` (criar se ainda não existir).
- **Criar lead / confirmar agendamento:** o fluxo atual cria/atualiza `WhatsAppLead` e chama `createPatientAndConsultationFromLead` no `lib/whatsapp-capture-flow.ts`. Para o uTalk, pode ser necessário um endpoint que receba os dados coletados pela IA (ex.: `POST /api/umbler-talk/confirm-booking`) e devolva links de pagamento e cadastro.

O checklist em `UMBLER_TALK_ATENDENTE_IA.md` (seção 6) já cita a integração com o backend; use a URL do app na Umbler nesse checklist.

### 3.3 Webhook do WhatsApp

- Se você continuar usando **Meta** ou **Twilio** diretamente com a plataforma, configure o webhook para:
  - `https://seu-app.umbler.io/api/whatsapp/webhook`
- Se passar a usar o **uTalk** como canal de mensagens, na documentação do uTalk ([utalk.umbler.com/site/api](https://utalk.umbler.com/site/api), [Configurar Web-Hook](https://utalk.umbler.com/site/api/webhook)) configure o webhook para a URL que receberá os eventos do uTalk (pode ser a mesma rota ou uma rota dedicada, ex.: `/api/umbler-talk/webhook`, a ser implementada conforme a API do uTalk).

---

## 4. Checklist rápido – Deploy na Umbler

- [ ] Projeto Node.js criado na Umbler e repositório Git conectado
- [ ] `git push umbler main` (ou master) executado com sucesso
- [ ] Variáveis de ambiente definidas (mínimo: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `APP_URL`)
- [ ] Banco de dados acessível e migrações aplicadas (`prisma migrate deploy` ou `db push`)
- [ ] Acesso à URL do app (ex.: `https://seu-app.umbler.io`) e login funcionando
- [ ] Webhook WhatsApp (se em uso) apontando para `https://seu-app.umbler.io/api/whatsapp/webhook`
- [ ] Stripe (se em uso): endpoint de webhook na Stripe apontando para `https://seu-app.umbler.io/api/payments/webhook` e `STRIPE_WEBHOOK_SECRET` configurado

---

## 5. Checklist rápido – Umbler Talk

- [ ] Base de conhecimento e estágios do agente configurados conforme `UMBLER_TALK_ATENDENTE_IA.md`
- [ ] URL do backend definida no painel uTalk (quando aplicável): `https://seu-dominio-umbler.com`
- [ ] Decidido se o fluxo de captação é conduzido pelo nosso webhook (Meta/Twilio) ou pelo uTalk; em caso do uTalk, planejados os endpoints (horários, confirmação, links) na nossa API

---

## 6. Referências no projeto

- Fluxo de captação WhatsApp: `lib/whatsapp-capture-flow.ts`
- Webhook WhatsApp: `app/api/whatsapp/webhook/route.ts`
- Configuração do agente de IA: `UMBLER_TALK_ATENDENTE_IA.md`
- Variáveis de ambiente: `.env.example`
