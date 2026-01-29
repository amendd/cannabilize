# ✅ Checklist para Produção

Use este arquivo como lista única de verificação antes e depois do deploy.  
Para detalhes, consulte **ANALISE_PRODUCAO.md** e **PREPARACAO_PRODUCAO.md**.

---

## 🔴 Fase 1: Crítico (fazer antes de qualquer deploy)

### Banco de dados
- [ ] Criar banco **PostgreSQL** (Supabase, Neon, Railway ou outro)
- [ ] Alterar `prisma/schema.prisma`: `provider = "postgresql"`
- [ ] Definir `DATABASE_URL` de produção (com `sslmode=require` se aplicável)
- [ ] Rodar `npx prisma generate`
- [ ] Rodar migrações em produção: `npx prisma migrate deploy` ou `npx prisma db push`
- [ ] Confirmar que não há dados de teste sensíveis no banco de produção

### Autenticação e ambiente
- [ ] Gerar **NEXTAUTH_SECRET** (ex: `openssl rand -base64 32`)
- [ ] Definir **NEXTAUTH_URL** com a URL final (ex: `https://seudominio.com.br`)
- [ ] Definir **NEXT_PUBLIC_APP_URL** com a mesma URL
- [ ] Definir **NODE_ENV=production** no ambiente de deploy

### Pagamentos (Stripe)
- [ ] Usar chaves de **produção**: `pk_live_` e `sk_live_`
- [ ] Configurar **STRIPE_WEBHOOK_SECRET** do webhook de produção
- [ ] Apontar o webhook do Stripe para `https://seudominio.com.br/api/...` (rota correta do projeto)

### Email
- [ ] Configurar SMTP ou Resend em produção (variáveis usadas em `lib/email.ts`)
- [ ] Testar envio de email (ex: agendamento ou lembrete)

---

## 🟡 Fase 2: Alta prioridade (recomendado antes do deploy)

### Limpeza do projeto
- [ ] Remover arquivos **.bat** (ou movê-los para pasta de dev)
- [ ] Remover arquivos com **credenciais** (LOGINS_SENHAS.txt, etc.)
- [ ] Remover ou reduzir **console.log** de debug no código
- [ ] Revisar e remover **código comentado** desnecessário
- [ ] Consolidar documentação (manter README, PREPARACAO_PRODUCAO, MIGRACAO_POSTGRESQL, DEPLOY_VERCEL, LIMPEZA_PROJETO)

### Build e teste local
- [ ] Executar `npm run build` sem erros
- [ ] Executar `npm start` e testar localmente
- [ ] Testar login (paciente, médico, admin)
- [ ] Testar fluxo principal (agendamento, consulta, receita)

### Segurança e configuração
- [ ] Confirmar que **.env** e **.env.production** não são commitados
- [ ] (Opcional) Configurar **reCAPTCHA** em produção (RECAPTCHA_* no .env)
- [ ] Verificar se rotas de **cron** (ex: `/api/admin/email/reminders`) estão protegidas (secret ou auth)

---

## 🟢 Fase 3: Deploy e domínio

### Hospedagem (ex: Vercel)
- [ ] Conectar repositório (GitHub/GitLab) à Vercel
- [ ] Adicionar **todas** as variáveis de ambiente no painel da Vercel
- [ ] Configurar **Build Command**: `prisma generate && next build` (ou usar script `npm run build`)
- [ ] Fazer primeiro deploy e verificar build sem erros

### Domínio e SSL
- [ ] Configurar domínio (CNAME para Vercel ou A/CNAME conforme provedor)
- [ ] Atualizar **NEXTAUTH_URL** e **NEXT_PUBLIC_APP_URL** com o domínio real
- [ ] Confirmar que HTTPS está ativo (Vercel faz isso automaticamente)

---

## 🔵 Fase 4: Após o deploy

### Funcionalidade
- [ ] Site acessível pela URL final
- [ ] Login (paciente, médico, admin) funcionando
- [ ] APIs respondendo (ex: consultas, receitas)
- [ ] Pagamento (Stripe) em modo live testado com cuidado
- [ ] Emails sendo enviados (confirmação, lembrete)
- [ ] Crons (lembretes em `vercel.json`) executando conforme esperado

### Monitoramento e backup
- [ ] Configurar **monitoramento de uptime** (ex: UptimeRobot)
- [ ] Confirmar **backup** do PostgreSQL (Supabase/Neon costumam ter automático)
- [ ] (Opcional) Configurar **Sentry** para erros
- [ ] (Opcional) Configurar **Google Analytics** ou similar

### Documentação e time
- [ ] Documentar URL final, painéis (Vercel, Stripe, banco) e contatos de emergência
- [ ] Definir quem faz rollback e onde estão os segredos (gerenciador de senhas ou vault)

---

## 📁 Referência rápida de documentos

| Tarefa | Documento |
|--------|-----------|
| Visão geral e riscos | **ANALISE_PRODUCAO.md** |
| Detalhes técnicos (env, segurança, CI/CD) | **PREPARACAO_PRODUCAO.md** |
| Migrar SQLite → PostgreSQL | **MIGRACAO_POSTGRESQL.md** |
| Deploy na Vercel | **DEPLOY_VERCEL.md** |
| O que limpar no projeto | **LIMPEZA_PROJETO.md** |
| Template de variáveis | **.env.production.example** |

---

**Última atualização**: Janeiro 2026
