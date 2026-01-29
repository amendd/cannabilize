# 📊 Análise para Produção - Click Cannabis / CannaLize

**Data**: Janeiro 2026  
**Objetivo**: Identificar tudo que é necessário para colocar o sistema em produção e organizar a execução.

---

## 1. Estado Atual do Projeto

### ✅ O que já está pronto para produção

| Item | Status | Observação |
|------|--------|------------|
| **Stack** | ✅ | Next.js 14, TypeScript, Prisma, NextAuth, Stripe, Tailwind |
| **Rate limiting** | ✅ | Implementado no `middleware.ts` (apenas em produção) |
| **Headers de segurança** | ✅ | CSP, HSTS, X-Frame-Options, etc. em `middleware` e `next.config.js` |
| **Build** | ✅ | `npm run build` inclui `prisma generate` |
| **Segurança (reCAPTCHA, honeypot)** | ✅ | Lib em `lib/security/` |
| **.gitignore** | ✅ | Env, .db, logs, *.bat, credenciais |
| **Template de env produção** | ✅ | `.env.production.example` existe |
| **Documentação de produção** | ✅ | PREPARACAO_PRODUCAO.md, MIGRACAO_POSTGRESQL.md, DEPLOY_VERCEL.md, LIMPEZA_PROJETO.md |
| **Vercel** | ✅ | `vercel.json` com crons (lembretes de email) |

### ⚠️ O que precisa ser feito

| Item | Prioridade | Descrição |
|------|------------|-----------|
| **Banco de dados** | 🔴 Crítico | Schema usa **SQLite**; produção exige **PostgreSQL** |
| **Variáveis de ambiente** | 🔴 Crítico | NEXTAUTH_SECRET, DATABASE_URL, domínio, Stripe live, SMTP |
| **Domínio e SSL** | 🔴 Crítico | NEXTAUTH_URL e NEXT_PUBLIC_APP_URL com URL real; SSL (automático na Vercel) |
| **Limpeza do projeto** | 🟡 Alta | Remover .bat, docs temporários, console.log, arquivos com credenciais |
| **Teste de build** | 🟡 Alta | Rodar `npm run build` e `npm start` antes do deploy |
| **Backups** | 🟡 Alta | Garantir backup do PostgreSQL (Supabase/Neon já oferecem) |
| **Monitoramento** | 🟢 Média | Sentry/GA opcionais; UptimeRobot para uptime |
| **Crons (Vercel)** | 🟢 Média | Lembretes de email já configurados em `vercel.json`; conferir se a rota existe e está protegida |

---

## 2. Dependências de Produção

### 2.1 Infraestrutura mínima

1. **Hospedagem da aplicação**  
   - Recomendado: **Vercel** (Next.js, deploy automático, SSL, crons).  
   - Alternativas: Railway, Render, DigitalOcean App Platform.

2. **Banco de dados**  
   - **PostgreSQL** obrigatório (não usar SQLite em produção).  
   - Opções: Supabase, Neon, Railway, Render, AWS RDS.

3. **Domínio**  
   - Registro.br, GoDaddy, Namecheap, etc.  
   - DNS: CNAME `www` → projeto Vercel (ou equivalente).

### 2.2 Serviços externos (já integrados no código)

| Serviço | Uso | Obrigatório para MVP? |
|--------|-----|------------------------|
| **NextAuth** | Login/sessão | ✅ Sim |
| **Stripe** | Pagamentos | ✅ Sim (ou desativar fluxo de pagamento) |
| **SMTP (Resend/Gmail)** | Emails transacionais | ✅ Sim (agendamento, lembrete) |
| **reCAPTCHA** | Anti-bot em formulários | 🟡 Recomendado |
| **Google Meet** | Telemedicina | 🟡 Se usar vídeo-consulta |
| **WhatsApp** | Notificações | Opcional |
| **S3** | Upload de arquivos | Opcional |
| **Sentry** | Erros | Opcional |
| **Google Analytics** | Métricas | Opcional |

### 2.3 Variáveis de ambiente obrigatórias

- **DATABASE_URL** – PostgreSQL (com `?sslmode=require` em cloud).
- **NEXTAUTH_URL** – URL pública do site (ex: `https://seudominio.com.br`).
- **NEXTAUTH_SECRET** – Secret forte (ex: `openssl rand -base64 32`).
- **NODE_ENV** – `production`.
- **NEXT_PUBLIC_APP_URL** – Mesma URL do site.
- **Stripe (produção)** – `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- **Email** – SMTP ou Resend (variáveis usadas em `lib/email.ts`).

Opcionais: reCAPTCHA, Google Meet, WhatsApp, S3, Sentry, GA (conforme uso).

---

## 3. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Esquecer de migrar para PostgreSQL | Checklist obrigatório: alterar `schema.prisma` e usar `DATABASE_URL` PostgreSQL antes do primeiro deploy. |
| NEXTAUTH_SECRET fraco ou vazado | Gerar novo secret por ambiente; nunca commitar; usar 32+ caracteres. |
| Stripe em modo teste em produção | Usar chaves `pk_live_` e `sk_live_` e webhook de produção. |
| Crons chamando rotas sem proteção | Garantir que `/api/admin/email/reminders` exija auth ou secret no header. |
| Dados de teste no banco | Não rodar seed de desenvolvimento em produção; ou ter seed específico para prod. |
| Arquivos .bat ou credenciais no repositório | Limpeza pré-deploy; .gitignore já cobre *.bat e arquivos de credenciais. |

---

## 4. Ordem sugerida de execução

1. **Migração para PostgreSQL**  
   - Alterar `prisma/schema.prisma` para `provider = "postgresql"`.  
   - Criar banco (ex: Supabase/Neon), preencher `DATABASE_URL`.  
   - Rodar `npx prisma migrate dev` (ou `db push`) e, em produção, `prisma migrate deploy` (ou equivalente no pipeline).

2. **Variáveis de ambiente**  
   - Gerar `NEXTAUTH_SECRET`.  
   - Preencher `.env.production` (local, sem commit) e/ou variáveis no painel da Vercel.  
   - Incluir Stripe live, SMTP, e opcionalmente reCAPTCHA.

3. **Limpeza**  
   - Seguir `LIMPEZA_PROJETO.md`: remover .bat, docs temporários, credenciais, `console.log` de debug.

4. **Build e teste local**  
   - `npm run build` e `npm start`; testar login, agendamento e fluxo principal.

5. **Deploy**  
   - Conectar repositório à Vercel, configurar env, domínio e deploy.  
   - Seguir `DEPLOY_VERCEL.md`.

6. **Pós-deploy**  
   - Testar site, login, APIs, pagamento (Stripe), emails e crons.  
   - Configurar monitoramento (ex: UptimeRobot) e opcionalmente Sentry/GA.

---

## 5. Documentação existente (referência)

| Documento | Conteúdo |
|-----------|----------|
| **PREPARACAO_PRODUCAO.md** | Guia completo: checklist, env, banco, segurança, performance, hospedagem, CI/CD, limpeza. |
| **RESUMO_PRODUCAO.md** | Resumo rápido e checklist. |
| **MIGRACAO_POSTGRESQL.md** | Passo a passo SQLite → PostgreSQL. |
| **DEPLOY_VERCEL.md** | Deploy na Vercel. |
| **LIMPEZA_PROJETO.md** | O que remover/ajustar antes de produção. |
| **HOSPEDAGEM_TRADICIONAL.md** | Por que cPanel/HostGator não são adequados. |
| **.env.production.example** | Template de variáveis de produção. |

---

## 6. Resumo executivo

- **Pronto**: aplicação Next.js com auth, segurança, rate limit, headers, build e docs de produção.  
- **Faltando**:  
  - Trocar SQLite por PostgreSQL e configurar banco em produção.  
  - Preencher variáveis de ambiente de produção (auth, Stripe, SMTP, domínio).  
  - Fazer limpeza do repositório e teste de build.  
  - Fazer deploy (recomendado: Vercel) e validar fluxos principais e crons.

Com isso, o sistema fica em condições de ir para produção. O **CHECKLIST_PRODUCAO.md** consolida essas tarefas em um único lugar para acompanhamento.
